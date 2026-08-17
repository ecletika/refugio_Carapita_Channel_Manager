import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'super-secret-key-carapita-2024');
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') || '';
const EMAIL_CONTATO = Deno.env.get('EMAIL_CONTATO') || 'geral@refugiocarapita.pt';
const SITE = 'https://refugiocarapita.pt';

const BASE_STYLE = `font-family:'Georgia',serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;`;

const header = (subtitle = '') => `
  <div style="background:#1E3932;padding:28px 40px;text-align:center;">
    <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;font-weight:400;text-transform:uppercase;">Refugio Carapita</h1>
    ${subtitle ? `<p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">${subtitle}</p>` : ''}
  </div>`;

const footer = () => `
  <div style="padding:24px 40px;background:#1E3932;text-align:center;margin-top:0;">
    <p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px;text-transform:uppercase;">
      O Refugio Carapita nao envia dados de pagamento por email nem por links externos.
    </p>
  </div>`;

const reservaBox = (r: Record<string, unknown>) => {
  const cin = r.data_check_in ? (r.data_check_in as string).split('T')[0] : '-';
  const cout = r.data_check_out ? (r.data_check_out as string).split('T')[0] : '-';
  const quarto = r.Quarto as Record<string, string> | null;
  const nome = quarto?.nome || 'Refugio Carapita';
  const codigo = r.numero_reserva || (r.id as string || '').substring(0, 8).toUpperCase();
  return `<div style="background:#fff;border:1px solid #E8E0D5;padding:20px 24px;margin:20px 0;border-radius:2px;">
    <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
      <tr><td style="color:#888;width:40%;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Alojamento</td><td style="color:#1E3932;font-weight:bold;">${nome}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${cin}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-out</td><td style="color:#1E3932;font-weight:bold;">${cout}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Valor Total</td><td style="color:#1E3932;font-weight:bold;font-size:16px;">&euro;${Number(r.valor_total || 0).toFixed(2)}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">N.o Reserva</td><td style="color:#C4A484;font-weight:bold;font-family:monospace;">${codigo}</td></tr>
    </table>
  </div>`;
};

const ctaButton = (text: string, url: string) => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">${text}</a>
  </div>`;

const pagUrl = (id: string) => `${SITE}/perfil?tab=pagamentos&reserva=${id}`;

async function sendBrevo(to: string, toName: string, subject: string, html: string): Promise<boolean> {
  if (!BREVO_KEY) { console.error(`[BREVO] NAO ENVIADO (BREVO_API_KEY em falta) -> ${to}`); return false; }
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Refugio Carapita', email: 'geral@refugiocarapita.pt' },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });
    if (!resp.ok) { console.error('[BREVO] ERRO', resp.status, await resp.text()); return false; }
    console.log('[BREVO] SUCESSO ->', to);
    return true;
  } catch (e: unknown) {
    console.error('[BREVO] EXCECAO:', e instanceof Error ? e.message : String(e));
    return false;
  }
}

async function verifyAdmin(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
    if (!payload.role || !['ADMIN', 'RECEPCAO'].includes(payload.role as string)) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 401 });
    }
    return payload;
  } catch { throw Object.assign(new Error('Unauthorized'), { statusCode: 401 }); }
}

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** Codigo de cupao legivel e unico, derivado do numero da reserva. Ex: RC0055-K3TQ */
function gerarCodigoCupao(numeroReserva: string, reservaId: string): string {
  const base = (numeroReserva || reservaId).replace(/[^0-9A-Za-z]/g, '').slice(-6).toUpperCase();
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I/O/0/1, para nao confundir
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map(b => alfabeto[b % alfabeto.length]).join('');
  return `${base}-${rnd}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    await verifyAdmin(req);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[1];
    const action = pathParts[2];

    // GET /admin-reservas
    if (req.method === 'GET' && !id) {
      const { data: reservas, error } = await supabase
        .from('Reserva')
        .select('*, Quarto(*), Hospede(*), Canal(*)')
        .order('criado_em', { ascending: false });
      if (error) throw error;

      const reservaIds = (reservas || []).map((r: Record<string, unknown>) => r.id as string);
      let baEnviadoSet = new Set<string>();
      if (reservaIds.length > 0) {
        const { data: successLogs } = await supabase
          .from('AimaLog').select('reserva_id').in('reserva_id', reservaIds).eq('status', 'SUCESSO');
        baEnviadoSet = new Set((successLogs || []).map((l: { reserva_id: string }) => l.reserva_id));
      }

      // Cupoes emitidos para estas reservas (para o painel mostrar se ja foi enviado um)
      let cupoesPorReserva: Record<string, Record<string, unknown>> = {};
      if (reservaIds.length > 0) {
        const { data: cupoes } = await supabase
          .from('Cupom').select('codigo, valor_desconto, tipo_desconto, usos_atuais, reserva_id')
          .in('reserva_id', reservaIds);
        for (const c of (cupoes || [])) cupoesPorReserva[c.reserva_id as string] = c;
      }

      const normalized = (reservas || []).map((r: Record<string, unknown>) => ({
        ...r,
        quarto: r.Quarto,
        hospede: r.Hospede,
        canal: r.Canal,
        ba_enviado: baEnviadoSet.has(r.id as string),
        cupom_emitido: cupoesPorReserva[r.id as string] || null,
      }));
      return json({ status: 'success', data: normalized });
    }

    // DELETE /admin-reservas/ID
    if (req.method === 'DELETE' && id) {
      await supabase.from('Reserva').delete().eq('id', id);
      return json({ status: 'success', message: 'Reserva removida' });
    }

    if (req.method === 'POST' && id && action) {
      // ── Ler a reserva uma vez para as acoes de pagamento ───────────────────
      const acoesPagamento = ['reenviar-pagamento', 'enviar-cupom', 'estender-prazo', 'registar-pagamento'];
      if (acoesPagamento.includes(action)) {
        const { data: reserva, error: errR } = await supabase
          .from('Reserva').select('*, Hospede(*), Quarto(*)').eq('id', id).single();
        if (errR || !reserva) return json({ error: 'Reserva nao encontrada' }, 404);

        const hospede = reserva.Hospede as Record<string, string> | null;
        const nomeH = `${hospede?.nome || ''} ${hospede?.sobrenome || ''}`.trim() || 'Hospede';
        const numero = (reserva.numero_reserva as string) || String(reserva.id).substring(0, 8).toUpperCase();
        const total = Number(reserva.valor_total || 0);
        const metade = total / 2;
        let body: Record<string, unknown> = {};
        try { body = await req.json(); } catch { body = {}; }

        // ── 1. REENVIAR LINK DE PAGAMENTO ───────────────────────────────────
        if (action === 'reenviar-pagamento') {
          if (!hospede?.email) return json({ error: 'Esta reserva nao tem email de hospede.' }, 400);
          const jaPagouInicial = !!reserva.pagamento_inicial_em;
          const valorEmFalta = jaPagouInicial ? metade : metade;
          const qual = jaPagouInicial ? 'o pagamento final (50% restantes)' : 'o pagamento inicial (50%)';

          const html = `<div style="${BASE_STYLE}">
            ${header('Pagamento Pendente')}
            <div style="padding:32px 40px;">
              <p style="font-size:15px;margin-top:0;">Ola, <strong>${nomeH}</strong>,</p>
              <p style="color:#444;line-height:1.8;">
                A sua reserva no <strong>Refugio Carapita</strong> aguarda ${qual}, no valor de
                <strong>&euro;${valorEmFalta.toFixed(2)}</strong>.
              </p>
              ${reservaBox(reserva as Record<string, unknown>)}
              <p style="color:#444;line-height:1.8;">
                Pode efetuar o pagamento em segurança na sua area reservada, atraves do botao abaixo.
              </p>
              ${ctaButton('Efetuar Pagamento', pagUrl(String(reserva.id)))}
            </div>
            ${footer()}
          </div>`;
          const ok = await sendBrevo(hospede.email, nomeH, `Pagamento pendente - Reserva ${numero}`, html);
          return json({
            status: ok ? 'success' : 'error',
            message: ok ? `Email enviado para ${hospede.email}.` : 'Nao foi possivel enviar o email (ver logs).',
          }, ok ? 200 : 500);
        }

        // ── 2. ENVIAR CUPAO EXCLUSIVO ───────────────────────────────────────
        if (action === 'enviar-cupom') {
          if (!hospede?.email) return json({ error: 'Esta reserva nao tem email de hospede.' }, 400);
          const pct = Number(body.percentagem || 0);
          const diasValidade = Number(body.dias_validade || 7);
          if (!(pct > 0 && pct <= 100)) return json({ error: 'Percentagem invalida (1 a 100).' }, 400);
          if (reserva.pagamento_inicial_em) return json({ error: 'Esta reserva ja tem o pagamento inicial efetuado.' }, 400);

          // Ja existe cupao para esta reserva? Nao emitir outro sem querer.
          const { data: existente } = await supabase
            .from('Cupom').select('codigo, usos_atuais').eq('reserva_id', id).maybeSingle();
          if (existente && Number(existente.usos_atuais) === 0) {
            return json({
              error: `Ja existe um cupao por usar para esta reserva (${existente.codigo}). Use esse ou apague-o primeiro.`,
            }, 400);
          }

          const codigo = gerarCodigoCupao(numero, String(reserva.id));
          const validade = new Date();
          validade.setDate(validade.getDate() + diasValidade);
          const checkInYMD = String(reserva.data_check_in).split('T')[0];

          const { error: errC } = await supabase.from('Cupom').insert([{
            id: crypto.randomUUID(),
            codigo,
            tipo_desconto: 'PERCENTUAL',
            valor_desconto: pct,
            // so pode ser usado 1 vez, so por esta estadia, e expira em breve
            limite_usos: 1,
            usos_atuais: 0,
            ativo: true,
            data_validade: validade.toISOString().split('T')[0],
            data_inicio_estadia: checkInYMD,
            data_limite_estadia: checkInYMD,
            reserva_id: id,
          }]);
          if (errC) throw errC;

          const novoTotal = total * (1 - pct / 100);
          const validadePT = validade.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

          const html = `<div style="${BASE_STYLE}">
            ${header('Oferta Exclusiva')}
            <div style="padding:32px 40px;">
              <p style="font-size:15px;margin-top:0;">Ola, <strong>${nomeH}</strong>,</p>
              <p style="color:#444;line-height:1.8;">
                Reparamos que ainda nao concluiu a sua reserva no <strong>Refugio Carapita</strong>.
                Para o ajudar a decidir, preparamos uma <strong>oferta exclusiva so para si</strong>.
              </p>
              <div style="background:#1E3932;padding:28px 24px;margin:24px 0;text-align:center;">
                <p style="margin:0 0 6px;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Desconto de</p>
                <p style="margin:0;color:#C4A484;font-size:40px;font-family:Georgia,serif;">${pct}%</p>
                <p style="margin:14px 0 6px;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Codigo</p>
                <p style="margin:0;color:#fff;font-size:22px;font-family:monospace;letter-spacing:3px;">${codigo}</p>
              </div>
              <table width="100%" cellpadding="8" cellspacing="0" style="font-size:14px;margin:20px 0;">
                <tr><td style="color:#888;">Valor original</td><td align="right" style="color:#888;text-decoration:line-through;">&euro;${total.toFixed(2)}</td></tr>
                <tr><td style="color:#1E3932;font-weight:bold;">Com o desconto</td><td align="right" style="color:#1E3932;font-weight:bold;font-size:20px;">&euro;${novoTotal.toFixed(2)}</td></tr>
              </table>
              ${reservaBox(reserva as Record<string, unknown>)}
              <div style="background:#FFFBF0;border-left:3px solid #C4A484;padding:16px 20px;margin:24px 0;font-size:13px;line-height:1.9;color:#444;">
                <p style="margin:0;">
                  Este codigo e <strong>exclusivo para esta reserva</strong>, so pode ser usado <strong>uma vez</strong>
                  e e valido ate <strong>${validadePT}</strong>.
                </p>
              </div>
              ${ctaButton('Usar o Desconto', pagUrl(String(reserva.id)))}
            </div>
            ${footer()}
          </div>`;

          const ok = await sendBrevo(hospede.email, nomeH, `Oferta exclusiva de ${pct}% - Reserva ${numero}`, html);
          return json({
            status: 'success',
            message: ok
              ? `Cupao ${codigo} (${pct}%) criado e enviado para ${hospede.email}.`
              : `Cupao ${codigo} criado, mas o email falhou (ver logs). Pode partilhar o codigo manualmente.`,
            data: { codigo, percentagem: pct, novo_total: novoTotal, validade: validade.toISOString().split('T')[0], email_enviado: ok },
          });
        }

        // ── 3. ESTENDER PRAZO DE PAGAMENTO ──────────────────────────────────
        if (action === 'estender-prazo') {
          const horas = Number(body.horas || 24);
          if (!(horas > 0 && horas <= 720)) return json({ error: 'Numero de horas invalido (1 a 720).' }, 400);
          if (reserva.pagamento_inicial_em) return json({ error: 'Esta reserva ja tem o pagamento inicial efetuado.' }, 400);

          // Estender a partir do prazo atual (ou das 48h originais, se ainda nao houver)
          const prazoAtual = reserva.prazo_pagamento_ate
            ? new Date(reserva.prazo_pagamento_ate as string)
            : new Date(new Date(reserva.criado_em as string).getTime() + 48 * 3600000);
          const base = prazoAtual.getTime() > Date.now() ? prazoAtual : new Date();
          const novoPrazo = new Date(base.getTime() + horas * 3600000);

          const { error: errU } = await supabase.from('Reserva')
            .update({ prazo_pagamento_ate: novoPrazo.toISOString(), atualizado_em: new Date().toISOString() })
            .eq('id', id);
          if (errU) throw errU;

          const prazoPT = novoPrazo.toLocaleString('pt-PT', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });

          if (hospede?.email) {
            const html = `<div style="${BASE_STYLE}">
              ${header('Prazo Alargado')}
              <div style="padding:32px 40px;">
                <p style="font-size:15px;margin-top:0;">Ola, <strong>${nomeH}</strong>,</p>
                <p style="color:#444;line-height:1.8;">
                  Alargamos o prazo para efetuar o pagamento da sua reserva.
                  Tem agora ate <strong>${prazoPT}</strong> para garantir a sua estadia.
                </p>
                ${reservaBox(reserva as Record<string, unknown>)}
                ${ctaButton('Efetuar Pagamento', pagUrl(String(reserva.id)))}
              </div>
              ${footer()}
            </div>`;
            await sendBrevo(hospede.email, nomeH, `Prazo alargado - Reserva ${numero}`, html);
          }

          return json({
            status: 'success',
            message: `Prazo alargado ${horas}h. Novo limite: ${prazoPT}.`,
            data: { prazo_pagamento_ate: novoPrazo.toISOString() },
          });
        }

        // ── 4. REGISTAR PAGAMENTO MANUAL ────────────────────────────────────
        if (action === 'registar-pagamento') {
          const tipo = String(body.tipo || 'inicial');
          const metodo = String(body.metodo || 'manual');
          if (!['inicial', 'final'].includes(tipo)) return json({ error: 'Tipo invalido (inicial|final).' }, 400);

          const agora = new Date().toISOString();
          const patch: Record<string, unknown> = { atualizado_em: agora, pagamento_metodo_registo: metodo };

          if (tipo === 'inicial') {
            if (reserva.pagamento_inicial_em) return json({ error: 'O pagamento inicial ja estava registado.' }, 400);
            patch.pagamento_inicial_em = agora;
            patch.status = 'CONFIRMADA';
          } else {
            if (!reserva.pagamento_inicial_em) return json({ error: 'Registe primeiro o pagamento inicial.' }, 400);
            if (reserva.pagamento_total_em) return json({ error: 'A reserva ja estava totalmente paga.' }, 400);
            patch.pagamento_total_em = agora;
          }

          const { error: errU } = await supabase.from('Reserva').update(patch).eq('id', id);
          if (errU) throw errU;

          // Aviso interno: fica registado quem/como, para nao haver duvidas depois
          await sendBrevo(EMAIL_CONTATO, 'Refugio Carapita',
            `Pagamento ${tipo} registado manualmente - Reserva ${numero}`,
            `<div style="${BASE_STYLE}">${header('Registo Manual de Pagamento')}
             <div style="padding:28px 40px;">
               <p>Foi registado manualmente o pagamento <strong>${tipo}</strong> (&euro;${metade.toFixed(2)}) da reserva
               <strong>${numero}</strong>, com o metodo <strong>${metodo}</strong>.</p>
               ${reservaBox(reserva as Record<string, unknown>)}
             </div></div>`);

          return json({
            status: 'success',
            message: `Pagamento ${tipo} registado (${metodo}).`,
          });
        }
      }

      // ── Acoes de estado (confirmar/cancelar/checkin/checkout) ─────────────
      const statusMap: Record<string, string> = {
        'confirmar': 'CONFIRMADA', 'cancelar': 'CANCELADA',
        'checkin': 'CHECK_IN', 'checkout': 'CHECK_OUT'
      };
      const novoStatus = statusMap[action];
      if (!novoStatus) return json({ error: 'Acao invalida' }, 400);

      const { data, error } = await supabase
        .from('Reserva')
        .update({ status: novoStatus, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select('*, Hospede(*), Quarto(*)')
        .single();
      if (error) throw error;

      const normalizedData = { ...data, quarto: data.Quarto, hospede: data.Hospede };
      const hospede = data.Hospede as Record<string, string> | null;

      if (hospede?.email) {
        const nomeH = `${hospede.nome || ''} ${hospede.sobrenome || ''}`.trim() || 'Hospede';
        const reservaData = data as Record<string, unknown>;

        if (action === 'confirmar') {
          const valor50 = (Number(data.valor_total) * 0.5).toFixed(2);
          const html = `<div style="${BASE_STYLE}">
            ${header('Reserva Confirmada')}
            <div style="padding:32px 40px;">
              <p style="font-size:15px;margin-top:0;">Ola, <strong>${nomeH}</strong>!</p>
              <p style="color:#444;line-height:1.8;">Temos o prazer de informar que <strong>a sua reserva no Refugio Carapita foi confirmada!</strong></p>
              ${reservaBox(reservaData)}
              <div style="background:#FFFBF0;border-left:3px solid #C4A484;padding:16px 20px;margin:24px 0;font-size:13px;line-height:1.9;color:#444;">
                <p style="margin:0 0 8px;"><strong>Pagamento:</strong></p>
                <p style="margin:0;">Efetue o pagamento de <strong>50% do valor total (EUR ${valor50})</strong> no prazo de <strong>48 horas</strong> para garantir a sua reserva.</p>
                <p style="margin:8px 0 0;">Os restantes 50% deverao ser pagos ate <strong>10 dias antes do check-in</strong>.</p>
              </div>
              ${ctaButton('Efetuar Pagamento', pagUrl(String(data.id)))}
            </div>
            ${footer()}
          </div>`;
          await sendBrevo(hospede.email, nomeH, 'A sua reserva foi confirmada! - Refugio Carapita', html);
        }

        if (action === 'cancelar') {
          const html = `<div style="${BASE_STYLE}">
            ${header('Reserva Cancelada')}
            <div style="padding:32px 40px;">
              <p style="font-size:15px;margin-top:0;">Ola, <strong>${nomeH}</strong>,</p>
              <p style="color:#444;line-height:1.8;">Lamentamos informar que <strong>a sua reserva no Refugio Carapita foi cancelada</strong>.</p>
              ${reservaBox(reservaData)}
              <div style="background:#FFF3CD;border:1px solid #FFEAA7;padding:14px 18px;margin:16px 0;font-size:13px;color:#856404;">
                As datas voltaram a estar disponiveis para reserva. Caso queira voltar a reservar, pode faze-lo no nosso site.
              </div>
              ${ctaButton('Fazer Nova Reserva', SITE)}
              <p style="font-size:13px;color:#666;line-height:1.8;margin-top:16px;">
                Se pensa que isto foi um erro ou necessita de apoio, entre em contacto connosco respondendo a este email.
              </p>
            </div>
            ${footer()}
          </div>`;
          await sendBrevo(hospede.email, nomeH, 'A sua reserva foi cancelada - Refugio Carapita', html);
        }
      }

      return json({ status: 'success', message: `Status alterado para ${novoStatus}`, data: normalizedData });
    }

    return json({ error: 'Rota nao encontrada' }, 404);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    return json({ error: err.message || 'Erro interno' }, err.statusCode || 500);
  }
});
