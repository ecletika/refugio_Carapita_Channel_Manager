// ============================================================================
// sync-ical — importacao de reservas dos canais (Booking, Airbnb, outros iCal)
// ----------------------------------------------------------------------------
// REESCRITA a 19/09/2026 depois do incidente descrito em
// supabase/migrations/20260919_ical_integridade.sql.
//
// Regras de seguranca que esta versao passa a garantir:
//   1. FEED VAZIO NUNCA CANCELA NADA. Um feed com zero eventos e tratado como
//      falha do canal, nao como "cancelaram tudo". Foi o que apagou a reserva
//      de um hospede que estava dentro de casa.
//   2. NUNCA CANCELA UMA ESTADIA JA COMECADA. Se o check-in ja passou, a reserva
//      e mantida e sinalizada para revisao humana.
//   3. TODOS OS ERROS SAO VERIFICADOS. A versao anterior fazia created++ e
//      escrevia "Nova reserva" no log sem olhar para o erro do insert — o log
//      dizia que tinha corrido bem quando nao tinha.
//   4. TUDO FICA REGISTADO na tabela SyncLog: o que veio, o que foi criado,
//      cancelado, ignorado, e o erro quando existe.
//   5. Alerta por email quando um canal comeca a falhar (uma vez por transicao,
//      nao a cada hora).
// ============================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'super-secret-key-carapita-2024');
const CRON_SECRET = Deno.env.get('CRON_SECRET') || 'cron-carapita-2024';
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') || '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'contacto@refugiocarapita.pt';

const FETCH_TIMEOUT_MS = 20000;

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// ─── Auth ───────────────────────────────────────────────────────────
async function authorize(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  const token = auth.slice(7);
  if (token === CRON_SECRET) return 'CRON';
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.role || !['ADMIN', 'RECEPCAO'].includes(payload.role as string)) {
      throw new Error('Forbidden');
    }
    return 'MANUAL';
  } catch {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }
}

// ─── iCal Parser ────────────────────────────────────────────────────
interface IcalEvent { uid: string; summary: string; description: string; dtstart: string; dtend: string }

function parseIcal(text: string): IcalEvent[] {
  const events: IcalEvent[] = [];
  // Desdobra linhas continuadas (RFC 5545: continuacao comeca por espaco/tab)
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  let cur: Record<string, string> | null = null;

  const parseDate = (raw: string): string => {
    if (!raw) return '';
    const clean = raw.includes(':') ? raw.split(':').pop()! : raw;
    if (/^\d{8}$/.test(clean)) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
    }
    if (/^\d{8}T\d{6}/.test(clean)) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
    }
    const d = new Date(clean);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
    if (line === 'END:VEVENT') {
      if (cur) {
        const dtstart = parseDate(cur['DTSTART'] || '');
        const dtend = parseDate(cur['DTEND'] || '');
        const summary = cur['SUMMARY'] || 'Reserva Externa';
        // Um evento sem UID nao pode ser deitado fora em silencio: gera-se um UID
        // estavel a partir do conteudo, para o evento continuar a ser seguido
        // entre sincronizacoes.
        const uid = cur['UID'] || `sem-uid-${dtstart}-${dtend}-${summary}`.replace(/\s+/g, '_');
        if (dtstart && dtend) {
          events.push({ uid, summary, description: cur['DESCRIPTION'] || '', dtstart, dtend });
        }
      }
      cur = null; continue;
    }
    if (cur !== null && line.includes(':')) {
      const idx = line.indexOf(':');
      const key = line.slice(0, idx).split(';')[0];   // DTSTART;VALUE=DATE -> DTSTART
      cur[key] = line.slice(idx + 1);
    }
  }
  return events;
}

function extrairCodigoReserva(summary: string, description: string): string {
  const match = summary.match(/\(([A-Z0-9]+)\)/) || description.match(/([A-Z0-9]{8,10})/);
  return match ? match[1] : summary.substring(0, 20);
}

async function fetchComTimeout(url: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'text/calendar, text/plain, */*' } });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Email ──────────────────────────────────────────────────────────
async function enviarEmail(to: string, subject: string, html: string): Promise<void> {
  if (!BREVO_KEY) { console.error('[BREVO] BREVO_API_KEY em falta — email nao enviado'); return; }
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Refugio Carapita', email: EMAIL_FROM },
        to: [{ email: to, name: 'Refugio Carapita' }],
        subject, htmlContent: html,
      }),
    });
    if (!resp.ok) console.error(`[BREVO] ERRO ${resp.status}: ${await resp.text()}`);
  } catch (e) {
    console.error('[BREVO] EXCEPTION:', (e as Error).message);
  }
}

const emailShell = (subtitulo: string, corpo: string) => `
  <div style="font-family:'Georgia',serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;">
    <div style="background:#1E3932;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;font-weight:400;text-transform:uppercase;">Refugio Carapita</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">${subtitulo}</p>
    </div>
    <div style="padding:32px 40px;">${corpo}</div>
    <div style="padding:24px 40px;background:#1E3932;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px;text-transform:uppercase;">Sistema automatico de sincronizacao</p>
    </div>
  </div>`;

async function notificarNovaReserva(emailAdmin: string, canal: string, checkIn: string, checkOut: string, codigo: string, aimaUrl: string) {
  await enviarEmail(emailAdmin, `Nova reserva ${canal} detectada — ${checkIn} a ${checkOut}`, emailShell(
    `Nova Reserva — ${canal}`,
    `<p style="font-size:15px;margin-top:0;">Foi detectada uma <strong>nova reserva via ${canal}</strong> na sincronizacao do iCal.</p>
     <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;background:#fff;border:1px solid #E8E0D5;margin:20px 0;">
       <tr><td style="color:#888;width:40%;text-transform:uppercase;font-size:11px;">Canal</td><td style="font-weight:bold;">${canal}</td></tr>
       <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-in</td><td style="font-weight:bold;">${checkIn}</td></tr>
       <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-out</td><td style="font-weight:bold;">${checkOut}</td></tr>
       <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Cod. Reserva</td><td style="font-size:12px;">${codigo}</td></tr>
     </table>
     <p style="color:#444;line-height:1.8;">Faltam os dados para o boletim AIMA. Envie este link ao hospede pelas mensagens do ${canal}:</p>
     <div style="background:#f5f5f5;border:1px solid #ddd;padding:14px 18px;font-family:monospace;font-size:12px;word-break:break-all;">${aimaUrl}</div>`
  ));
}

async function alertarFalhaCanal(emailAdmin: string, canal: string, quartoNome: string, motivo: string) {
  await enviarEmail(emailAdmin, `ATENCAO: sincronizacao ${canal} sem dados — ${quartoNome}`, emailShell(
    `Falha de Sincronizacao — ${canal}`,
    `<p style="font-size:15px;margin-top:0;">A sincronizacao do calendario <strong>${canal}</strong> do alojamento <strong>${quartoNome}</strong> deixou de trazer dados.</p>
     <div style="background:#FFF4F4;border-left:3px solid #C0392B;padding:16px 20px;margin:20px 0;font-size:13px;line-height:1.8;color:#444;">
       <p style="margin:0;"><strong>Motivo:</strong> ${motivo}</p>
     </div>
     <p style="color:#444;line-height:1.8;">
       <strong>Nenhuma reserva foi alterada ou cancelada</strong> — o sistema so age quando o calendario traz dados de confianca.
       Verifique na extranet do ${canal} se a exportacao de calendario continua ligada e se o link aponta para a unidade correcta.
     </p>
     <p style="color:#444;line-height:1.8;">Enquanto isto durar, as reservas novas desse canal <strong>nao entram sozinhas</strong>. Confirme o calendario a mao.</p>`
  ));
}

// ─── Sync de um canal de um alojamento ──────────────────────────────
interface SyncResult {
  ok: boolean;
  eventos: number;
  criadas: number;
  atualizadas: number;
  canceladas: number;
  ignoradas: number;
  avisos: string[];
  erro?: string;
}

async function syncQuarto(
  quartoId: string, quartoNome: string, icalUrl: string, canalNome: string,
  emailAdmin: string, origem: string,
): Promise<SyncResult> {
  const t0 = Date.now();
  const res: SyncResult = { ok: false, eventos: 0, criadas: 0, atualizadas: 0, canceladas: 0, ignoradas: 0, avisos: [] };

  const registar = async (erro?: string) => {
    const { error } = await supabase.from('SyncLog').insert([{
      origem, canal: canalNome, quarto_id: quartoId, ok: res.ok,
      eventos_no_feed: res.eventos, criadas: res.criadas, atualizadas: res.atualizadas,
      canceladas: res.canceladas, ignoradas: res.ignoradas,
      duracao_ms: Date.now() - t0,
      erro: erro || (res.avisos.length ? res.avisos.join(' | ') : null),
    }]);
    if (error) console.error(`[SyncLog] falhou ao registar: ${error.message}`);
  };

  // Ja falhava antes? (para so alertar na transicao, e nao de hora a hora)
  const { data: ultimoLog } = await supabase
    .from('SyncLog').select('ok')
    .eq('quarto_id', quartoId).eq('canal', canalNome)
    .order('executado_em', { ascending: false }).limit(1).maybeSingle();
  const jaEstavaEmFalha = ultimoLog ? ultimoLog.ok === false : false;

  const falhar = async (motivo: string, alertar = true) => {
    res.ok = false;
    res.erro = motivo;
    console.error(`[${canalNome}/${quartoNome}] ${motivo}`);
    await registar(motivo);
    if (alertar && !jaEstavaEmFalha && emailAdmin) {
      await alertarFalhaCanal(emailAdmin, canalNome, quartoNome, motivo);
    }
    return res;
  };

  // 1) Ir buscar o feed --------------------------------------------------
  let texto: string;
  try {
    const resp = await fetchComTimeout(icalUrl);
    if (!resp.ok) return await falhar(`O canal respondeu HTTP ${resp.status} ao pedido do calendario.`);
    texto = await resp.text();
  } catch (e) {
    return await falhar(`Nao foi possivel contactar o calendario: ${(e as Error).message}`);
  }

  if (!texto.includes('BEGIN:VCALENDAR')) {
    return await falhar('A resposta do canal nao e um calendario iCal valido.');
  }

  // 2) Interpretar -------------------------------------------------------
  const eventos = parseIcal(texto);
  res.eventos = eventos.length;

  // REGRA 1: feed vazio nunca cancela nada.
  if (eventos.length === 0) {
    return await falhar(
      'O calendario veio valido mas VAZIO (zero reservas). Nada foi alterado — ' +
      'um feed vazio nunca e tratado como "cancelaram tudo".'
    );
  }

  // 3) Canal e hospede placeholder --------------------------------------
  let { data: canal } = await supabase.from('Canal').select('*').eq('nome_canal', canalNome).maybeSingle();
  if (!canal) {
    const { data: novo, error } = await supabase.from('Canal')
      .insert([{ id: crypto.randomUUID(), nome_canal: canalNome, comissao_percentual: 0 }])
      .select().single();
    if (error || !novo) return await falhar(`Nao foi possivel criar o canal ${canalNome}: ${error?.message}`);
    canal = novo;
  }

  const placeholderEmail = `ical+${canalNome.toLowerCase()}+${quartoId.substring(0, 8)}@placeholder.com`;
  let { data: hospede } = await supabase.from('Hospede').select('id').eq('email', placeholderEmail).maybeSingle();
  if (!hospede) {
    const agora = new Date().toISOString();
    const { data: novo, error } = await supabase.from('Hospede').insert([{
      id: crypto.randomUUID(), nome: `Hospede ${canalNome}`, email: placeholderEmail,
      criado_em: agora, atualizado_em: agora,
    }]).select('id').single();
    if (error || !novo) return await falhar(`Nao foi possivel criar o hospede generico do canal: ${error?.message}`);
    hospede = novo;
  }

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const uidsNoFeed = new Set(eventos.map(e => e.uid));

  // 4) Cancelar o que desapareceu do feed --------------------------------
  //    So chegamos aqui com um feed com pelo menos um evento.
  const { data: existentes, error: errEx } = await supabase
    .from('Reserva')
    .select('id, ical_uid, status, numero_reserva, data_check_in')
    .eq('quarto_id', quartoId).eq('canal_id', canal!.id)
    .not('ical_uid', 'is', null)
    .in('status', ['CONFIRMADA', 'CHECK_IN']);

  if (errEx) {
    res.avisos.push(`Nao foi possivel ler as reservas existentes: ${errEx.message}`);
  } else {
    for (const ex of (existentes || [])) {
      if (uidsNoFeed.has(ex.ical_uid)) continue;

      // REGRA 2: uma estadia que ja comecou nunca e cancelada automaticamente.
      if (new Date(ex.data_check_in) <= hoje) {
        const aviso = `A reserva ${ex.numero_reserva} deixou de aparecer no calendario ${canalNome}, mas a estadia ja comecou — foi MANTIDA para revisao manual.`;
        res.avisos.push(aviso);
        console.warn(`[${canalNome}] ${aviso}`);
        continue;
      }

      const { error } = await supabase.from('Reserva')
        .update({ status: 'CANCELADA', atualizado_em: new Date().toISOString() })
        .eq('id', ex.id);
      if (error) {
        res.avisos.push(`Falha ao cancelar ${ex.numero_reserva}: ${error.message}`);
      } else {
        res.canceladas++;
        console.log(`[${canalNome}] Reserva ${ex.numero_reserva} cancelada (saiu do calendario do canal).`);
      }
    }
  }

  // 5) Processar os eventos do feed --------------------------------------
  for (const ev of eventos) {
    const dataCheckIn = new Date(`${ev.dtstart}T00:00:00.000Z`).toISOString();
    const dataCheckOut = new Date(`${ev.dtend}T00:00:00.000Z`).toISOString();

    if (new Date(dataCheckOut) < hoje) { res.ignoradas++; continue; }

    // Procurar por ical_uid e, para as reservas antigas importadas pelo backend
    // Node (que gravava o UID em codigo_reserva_externo), tambem por esse campo.
    // Duas consultas em vez de um .or(): o UID vem do canal e pode conter
    // virgulas ou parentesis, que partiriam a sintaxe do filtro .or().
    let { data: existente, error: errBusca } = await supabase
      .from('Reserva')
      .select('id, status, ical_uid, numero_reserva')
      .eq('quarto_id', quartoId).eq('ical_uid', ev.uid)
      .limit(1).maybeSingle();

    if (!existente && !errBusca) {
      ({ data: existente, error: errBusca } = await supabase
        .from('Reserva')
        .select('id, status, ical_uid, numero_reserva')
        .eq('quarto_id', quartoId).eq('codigo_reserva_externo', ev.uid)
        .limit(1).maybeSingle());
    }

    if (errBusca) {
      res.avisos.push(`Falha ao procurar a reserva ${ev.uid}: ${errBusca.message}`);
      continue;
    }

    if (existente) {
      const patch: Record<string, unknown> = {
        data_check_in: dataCheckIn, data_check_out: dataCheckOut,
        atualizado_em: new Date().toISOString(),
      };
      if (!existente.ical_uid) patch.ical_uid = ev.uid;           // adopta a reserva antiga
      if (existente.status === 'CANCELADA') patch.status = 'CONFIRMADA'; // reapareceu no canal

      const { error } = await supabase.from('Reserva').update(patch).eq('id', existente.id);
      if (error) {
        res.avisos.push(`Falha ao actualizar ${existente.numero_reserva}: ${error.message}`);
      } else if (existente.status === 'CANCELADA') {
        res.atualizadas++;
      } else {
        res.ignoradas++;
      }
      continue;
    }

    // Nova reserva
    const aimaToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const codigoReserva = extrairCodigoReserva(ev.summary, ev.description);
    const agora = new Date().toISOString();

    // REGRA 3: o erro do insert e sempre verificado. Antes fazia-se created++ e
    // escrevia-se "Nova reserva" no log mesmo quando o insert falhava.
    const { data: criada, error } = await supabase.from('Reserva').insert([{
      id: crypto.randomUUID(),
      quarto_id: quartoId, hospede_id: hospede!.id, canal_id: canal!.id,
      data_check_in: dataCheckIn, data_check_out: dataCheckOut,
      status: 'CONFIRMADA', valor_total: 0,
      ical_uid: ev.uid, aima_form_token: aimaToken, aima_dados_completos: false,
      codigo_reserva_externo: codigoReserva,
      requerimentos_especiais: ev.summary,
      criado_em: agora, atualizado_em: agora,
    }]).select('numero_reserva').single();

    if (error || !criada) {
      const aviso = `FALHOU a importacao de ${ev.dtstart} a ${ev.dtend} (UID ${ev.uid}): ${error?.message || 'sem resposta'}`;
      res.avisos.push(aviso);
      console.error(`[${canalNome}] ${aviso}`);
      continue;
    }

    res.criadas++;
    console.log(`[${canalNome}] Nova reserva ${criada.numero_reserva}: ${ev.dtstart} -> ${ev.dtend}`);

    if (emailAdmin) {
      const aimaUrl = `https://www.refugiocarapita.pt/aima/${aimaToken}`;
      await notificarNovaReserva(emailAdmin, canalNome, ev.dtstart, ev.dtend, codigoReserva, aimaUrl);
    }
  }

  res.ok = res.avisos.length === 0;
  await registar();
  return res;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

  try {
    const origem = await authorize(req);
    const url = new URL(req.url);
    const action = url.pathname.split('/').filter(Boolean)[1];

    // GET /sync-ical/estado — estado da ultima sincronizacao por canal.
    // Leitura pura: nao sincroniza nada.
    if (action === 'estado') {
      const { data, error } = await supabase
        .from('SyncLog').select('*')
        .order('executado_em', { ascending: false }).limit(60);
      if (error) return json({ error: error.message }, 500);

      const porCanal: Record<string, unknown> = {};
      for (const linha of (data || [])) {
        const chave = `${linha.quarto_id}::${linha.canal}`;
        if (!porCanal[chave]) porCanal[chave] = linha;
      }
      return json({ status: 'success', ultimos: Object.values(porCanal), historico: data });
    }

    if (action === 'all' || req.method === 'GET') {
      const { data: quartos, error: errQ } = await supabase
        .from('Quarto').select('id, nome, ical_airbnb, ical_booking, ical_url').eq('ativo', true);
      if (errQ) return json({ error: `Nao foi possivel ler os alojamentos: ${errQ.message}` }, 500);

      const { data: cfg } = await supabase
        .from('Configuracao').select('valor').eq('chave', 'emailContato').maybeSingle();
      const emailAdmin = cfg?.valor || 'contacto@refugiocarapita.pt';

      const resultados: unknown[] = [];
      let falhas = 0;

      for (const q of (quartos || [])) {
        const canais: Array<[string, string | null]> = [
          ['AIRBNB', q.ical_airbnb], ['BOOKING', q.ical_booking], ['ICAL', q.ical_url],
        ];
        for (const [nome, link] of canais) {
          if (!link) continue;
          const r = await syncQuarto(q.id, q.nome, link, nome, emailAdmin, origem);
          if (!r.ok) falhas++;
          resultados.push({ quarto: q.nome, quartoId: q.id, canal: nome, ...r });
        }
      }

      // Estado HTTP reflecte o resultado: um cron que recebe 200 com falhas
      // la dentro e exactamente como este problema passou 19 dias despercebido.
      return json({ status: falhas === 0 ? 'success' : 'partial', falhas, data: resultados }, falhas === 0 ? 200 : 207);
    }

    // POST — sincronizacao manual de um alojamento/canal
    const body = await req.json().catch(() => ({}));
    const { quartoId, url: icalUrl, canalNome } = body as Record<string, string>;
    if (!quartoId || !icalUrl) return json({ error: 'quartoId e url sao obrigatorios' }, 400);

    const { data: quarto } = await supabase.from('Quarto').select('nome').eq('id', quartoId).maybeSingle();
    const { data: cfg } = await supabase
      .from('Configuracao').select('valor').eq('chave', 'emailContato').maybeSingle();

    const r = await syncQuarto(
      quartoId, quarto?.nome || quartoId, icalUrl, canalNome || 'ICAL',
      cfg?.valor || 'contacto@refugiocarapita.pt', origem,
    );
    return json({ status: r.ok ? 'success' : 'error', ...r }, r.ok ? 200 : 207);

  } catch (e) {
    const err = e as Error & { statusCode?: number };
    const status = err.statusCode || (err.message?.includes('Unauthorized') ? 401 : 500);
    console.error('sync-ical:', err.message);
    return json({ error: err.message || 'Erro interno' }, status);
  }
});
