import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import bcrypt from "npm:bcryptjs";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BREVO_KEY    = Deno.env.get('BREVO_API_KEY') || 'xkeysib-bd7927517b06ad3757d0caad2c71611949cb040c941';
const EMAIL_ADMIN  = Deno.env.get('EMAIL_CONTATO') || 'geral@refugiocarapita.pt';
const BASE_STYLE   = `font-family:'Georgia',serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;`;

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

const reservaBox = (checkIn: string, checkOut: string, valorTotal: number, numeroReserva: string, quartoNome: string) => `
  <div style="background:#fff;border:1px solid #E8E0D5;padding:20px 24px;margin:20px 0;border-radius:2px;">
    <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
      <tr><td style="color:#888;width:40%;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Alojamento</td><td style="color:#1E3932;font-weight:bold;">${quartoNome}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${checkIn}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-out</td><td style="color:#1E3932;font-weight:bold;">${checkOut}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Valor Total</td><td style="color:#1E3932;font-weight:bold;font-size:16px;">&euro;${valorTotal.toFixed(2)}</td></tr>
      <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">N. Reserva</td><td style="color:#C4A484;font-weight:bold;font-family:monospace;font-size:13px;">${numeroReserva}</td></tr>
    </table>
  </div>`;

const ctaButton = (text: string, url: string) => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">${text}</a>
  </div>`;

function gerarAimaFormToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendBrevo(to: string, toName: string, subject: string, html: string): Promise<boolean> {
  console.log(`[BREVO] Tentando enviar para: ${to} | subject: ${subject}`);
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Refugio Carapita', email: 'geral@refugiocarapita.pt' },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });
    const responseText = await resp.text();
    if (!resp.ok) {
      console.error(`[BREVO] ERRO ${resp.status} -> ${to}: ${responseText}`);
      return false;
    }
    console.log(`[BREVO] SUCESSO -> ${to}`);
    return true;
  } catch (e: any) {
    console.error(`[BREVO] EXCEPTION -> ${to}: ${e.message}`);
    return false;
  }
}

/** Offset (minutos) de um fuso numa data concreta — respeita horario de verao. */
function offsetMinutos(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = dtf.formatToParts(date);
  const get = (t: string) => Number(p.find((x) => x.type === t)!.value);
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return (asUTC - date.getTime()) / 60000;
}

/**
 * Instante em que um cupao com validade `YYYY-MM-DD` deixa de ser valido:
 * fim desse dia em hora de Portugal. Ex: validade 29/08 -> valido todo o dia 29,
 * expirado a partir das 00:00 do dia 30 (hora de Lisboa, nao UTC).
 */
function fimDoDiaLisboa(dataISO: string): Date {
  const aprox = new Date(`${dataISO}T23:59:59.999Z`);
  const off = offsetMinutos(aprox, 'Europe/Lisbon');
  return new Date(aprox.getTime() - off * 60000);
}

/** Sexta(5), Sabado(6) ou Domingo(0) contam como fim de semana — igual a tarifas-calendario */
function isFimDeSemana(date: Date): boolean {
  const dow = date.getUTCDay();
  return dow === 0 || dow === 5 || dow === 6;
}

/**
 * Calcula o preco da estadia noite a noite.
 * IMPORTANTE: tem de espelhar exatamente a logica de `tarifas-calendario`, que e o que
 * o hospede ve no site. Antes esta funcao ignorava tarifa_fds/tarifa_semana e
 * preco_noite_fds, pelo que o total gravado (e a base do desconto do cupao) nao batia
 * certo com o valor apresentado ao cliente em estadias que incluiam fins de semana.
 */
function calcularPreco(checkIn: string, checkOut: string, quarto: any, tarifasSazonais: any[]): number {
  let total = 0;
  let d = new Date(`${checkIn}T00:00:00.000Z`);
  const dFim = new Date(`${checkOut}T00:00:00.000Z`);
  let limit = 0;
  while (d < dFim && limit < 1000) {
    limit++;
    const ymd = d.toISOString().split('T')[0];
    const fds = isFimDeSemana(d);

    const aplicaveis = tarifasSazonais.filter((tf: any) => {
      const tIn = tf.data_inicio.split('T')[0];
      const tOut = tf.data_fim.split('T')[0];
      return ymd >= tIn && ymd <= tOut;
    });

    let tarifa: any = null;
    if (aplicaveis.length > 0) {
      tarifa = aplicaveis.reduce((prev: any, curr: any) => {
        const dPrev = new Date(prev.data_fim).getTime() - new Date(prev.data_inicio).getTime();
        const dCurr = new Date(curr.data_fim).getTime() - new Date(curr.data_inicio).getTime();
        if (dCurr === dPrev) return Number(curr.preco_noite) > Number(prev.preco_noite) ? curr : prev;
        return dCurr < dPrev ? curr : prev;
      });
    }

    if (tarifa) {
      total += (fds && tarifa.preco_noite_fds)
        ? Number(tarifa.preco_noite_fds)
        : Number(tarifa.preco_noite);
    } else {
      total += fds
        ? Number(quarto.tarifa_fds ?? quarto.preco_base)
        : Number(quarto.tarifa_semana ?? quarto.preco_base);
    }

    d.setUTCDate(d.getUTCDate() + 1);
  }
  return total;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Metodo nao permitido' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();
    const { quartoId, hospede, checkIn, checkOut, canalNome, metodoPagamento, requerimentosEspeciais, extrasIds, cupomCodigo } = body;

    if (!quartoId || !hospede || !checkIn || !checkOut) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const dataInicio = new Date(`${checkIn}T00:00:00.000Z`).toISOString();
    const dataFim = new Date(`${checkOut}T00:00:00.000Z`).toISOString();
    const now = new Date().toISOString();

    let { data: hospedeDB } = await sb.from('Hospede').select('*').eq('email', hospede.email).single();
    const hospedePayload: any = {
      prefixo: hospede.prefixo, nome: hospede.nome, sobrenome: hospede.sobrenome,
      telefone: hospede.telefone || null, pais: hospede.pais, cidade: hospede.cidade,
      endereco1: hospede.endereco1, endereco2: hospede.endereco2, cep: hospede.cep,
      estrangeiro: hospede.estrangeiro || false,
      data_nascimento: hospede.data_nascimento || null, local_nascimento: hospede.local_nascimento || null,
      nacionalidade: hospede.nacionalidade || null, tipo_documento: hospede.tipo_documento || null,
      numero_documento: hospede.numero_documento || null, pais_emissor_documento: hospede.pais_emissor_documento || null,
      dependentes: hospede.dependentes || [], atualizado_em: now,
    };
    if (hospede.senha) hospedePayload.senha_hash = await bcrypt.hash(hospede.senha, 10);

    if (!hospedeDB) {
      const { data: novoH, error: errH } = await sb.from('Hospede').insert([{ id: crypto.randomUUID(), email: hospede.email, criado_em: now, ...hospedePayload }]).select().single();
      if (errH) throw errH;
      hospedeDB = novoH;
    } else {
      const { data: updH, error: errHU } = await sb.from('Hospede').update(hospedePayload).eq('id', hospedeDB.id).select().single();
      if (errHU) throw errHU;
      hospedeDB = updH;
    }

    const [{ data: canalDB }, { data: quarto }, { data: tarifasSazonais }, { data: extrasPriceData }, { data: cupomDB }] = await Promise.all([
      sb.from('Canal').select('*').eq('nome_canal', canalNome || 'SITE').single(),
      sb.from('Quarto').select('*').eq('id', quartoId).single(),
      sb.from('TarifaSazonal').select('*').eq('quarto_id', quartoId),
      (extrasIds && extrasIds.length > 0) ? sb.from('Extra').select('preco').in('id', extrasIds) : Promise.resolve({ data: [] }),
      cupomCodigo ? sb.from('Cupom').select('*').eq('codigo', cupomCodigo.toUpperCase()).single() : Promise.resolve({ data: null }),
    ]);

    let finalCanal = canalDB;
    if (!finalCanal) {
      const { data: novoC, error: errC } = await sb.from('Canal').insert([{ id: crypto.randomUUID(), nome_canal: canalNome || 'SITE', comissao_percentual: 0 }]).select().single();
      if (errC) throw errC;
      finalCanal = novoC;
    }

    let valorTotal = calcularPreco(checkIn, checkOut, quarto, tarifasSazonais || []);
    if (extrasPriceData && extrasPriceData.length > 0) {
      valorTotal += extrasPriceData.reduce((s: number, e: any) => s + Number(e.preco || 0), 0);
    }

    let cupomValido: any = null;
    if (cupomDB && cupomDB.ativo) {
      // Identico ao check em `cupom-validar`:
      //  1) data_validade       = prazo para RESERVAR (inclusivo, hora de Portugal)
      //  2) data_limite_estadia = ultima data de CHECK-IN abrangida; se nao estiver
      //     definida usa data_validade, para um cupao nao servir para uma estadia
      //     em outubro ou no ano seguinte.
      let validadeOk = true;
      if (cupomDB.data_validade) {
        validadeOk = fimDoDiaLisboa(String(cupomDB.data_validade).split('T')[0]) >= new Date();
      }
      //  3) periodo da estadia: data_inicio_estadia <= check-in <= data_limite_estadia
      if (validadeOk) {
        const cin = String(checkIn).split('T')[0];
        const inicioYMD = cupomDB.data_inicio_estadia ? String(cupomDB.data_inicio_estadia).split('T')[0] : null;
        const limiteRaw = cupomDB.data_limite_estadia || cupomDB.data_validade;
        const limiteYMD = limiteRaw ? String(limiteRaw).split('T')[0] : null;
        if (inicioYMD && cin < inicioYMD) validadeOk = false;
        if (limiteYMD && cin > limiteYMD) validadeOk = false;
      }
      const usosOk = !cupomDB.limite_usos || cupomDB.usos_atuais < cupomDB.limite_usos;
      if (validadeOk && usosOk) {
        cupomValido = cupomDB;
        valorTotal = cupomValido.tipo_desconto === 'PERCENTUAL'
          ? valorTotal - (valorTotal * (Number(cupomValido.valor_desconto) / 100))
          : valorTotal - Number(cupomValido.valor_desconto);
        if (valorTotal < 0) valorTotal = 0;
      }
    }

    // Gerar token AIMA automaticamente para que o admin possa enviar o formulario imediatamente
    const aimaFormToken = gerarAimaFormToken();

    const nowRes = new Date().toISOString();
    const { data: novaReserva, error: errRes } = await sb.from('Reserva').insert([{
      id: crypto.randomUUID(),
      quarto_id: quartoId, hospede_id: hospedeDB.id, canal_id: finalCanal.id,
      data_check_in: dataInicio, data_check_out: dataFim,
      status: (canalNome === 'SITE' || !canalNome) ? 'PENDENTE' : 'CONFIRMADA',
      valor_total: valorTotal, metodo_pagamento: metodoPagamento,
      requerimentos_especiais: requerimentosEspeciais,
      extras_ids: extrasIds && extrasIds.length > 0 ? extrasIds : null,
      cupom_id: cupomValido ? cupomValido.id : null,
      aima_form_token: aimaFormToken,
      aima_dados_completos: false,
      criado_em: nowRes, atualizado_em: nowRes,
    }]).select('*, Quarto(*), Hospede(*)').single();

    if (errRes) throw errRes;

    if (cupomValido) {
      sb.from('Cupom').update({ usos_atuais: cupomValido.usos_atuais + 1 }).eq('id', cupomValido.id).then();
    }

    // Enviar emails apenas para reservas do SITE
    if (canalNome === 'SITE' || !canalNome) {
      const valor50 = (valorTotal * 0.5).toFixed(2);
      const quartoNome = quarto?.nome || 'Refugio Carapita';
      const nomeHospede = `${hospedeDB.prefixo || ''} ${hospedeDB.nome} ${hospedeDB.sobrenome || ''}`.trim();
      const numeroReserva = novaReserva.numero_reserva || novaReserva.id.substring(0, 8).toUpperCase();
      const adminUrl = `https://refugiocarapita.pt/admin/reservas`;

      const htmlCliente = `<div style="${BASE_STYLE}">
        ${header('Confirmacao de Reserva')}
        <div style="padding:32px 40px;">
          <p style="font-size:15px;margin-top:0;">Ola, <strong>${nomeHospede}</strong>!</p>
          <p style="color:#444;line-height:1.8;">A sua reserva foi recebida com sucesso no <strong>Refugio Carapita</strong>. Entraremos em contacto brevemente para confirmar.</p>
          ${reservaBox(checkIn, checkOut, valorTotal, numeroReserva, quartoNome)}
          <div style="background:#FFFBF0;border-left:3px solid #C4A484;padding:16px 20px;margin:24px 0;font-size:13px;line-height:1.9;color:#444;">
            <p style="margin:0 0 8px;"><strong>Proximos Passos - Pagamento:</strong></p>
            <p style="margin:0;">Apos a confirmacao, sera necessario efetuar o pagamento de <strong>50% do valor total (&euro;${valor50})</strong> no prazo de <strong>48 horas</strong>.</p>
            <p style="margin:8px 0 0;">Os restantes 50% deverao ser pagos ate <strong>10 dias antes da data de check-in</strong>.</p>
          </div>
          <p style="font-size:12px;color:#999;text-align:center;margin-top:8px;">
            Guarde o seu numero de reserva: <strong style="color:#1E3932;">${numeroReserva}</strong>
          </p>
        </div>
        ${footer()}
      </div>`;

      const htmlAdmin = `<div style="${BASE_STYLE}">
        ${header('Nova Reserva Recebida')}
        <div style="padding:32px 40px;">
          <p style="font-size:15px;margin-top:0;">Nova reserva recebida pelo site.</p>
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;border:1px solid #E8E0D5;margin-bottom:20px;">
            <tr><td style="color:#888;width:35%;text-transform:uppercase;font-size:11px;">N. Reserva</td><td style="color:#C4A484;font-weight:bold;font-family:monospace;">${numeroReserva}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Hospede</td><td style="color:#1E3932;font-weight:bold;">${nomeHospede}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Email</td><td style="color:#1E3932;">${hospedeDB.email}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Telefone</td><td style="color:#1E3932;">${hospedeDB.telefone || '-'}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Alojamento</td><td style="color:#1E3932;font-weight:bold;">${quartoNome}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${checkIn}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-out</td><td style="color:#1E3932;font-weight:bold;">${checkOut}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Valor Total</td><td style="color:#1E3932;font-weight:bold;">&euro;${valorTotal.toFixed(2)}</td></tr>
            <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Pagamento</td><td style="color:#1E3932;">${metodoPagamento || '-'}</td></tr>
            ${requerimentosEspeciais ? `<tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Notas</td><td style="color:#1E3932;">${requerimentosEspeciais}</td></tr>` : ''}
          </table>
          ${ctaButton('Ver no Painel Admin', adminUrl)}
        </div>
        ${footer()}
      </div>`;

      const [hospedeOk, adminOk] = await Promise.all([
        sendBrevo(hospedeDB.email, nomeHospede, `Reserva ${numeroReserva} recebida - Refugio Carapita`, htmlCliente),
        sendBrevo(EMAIL_ADMIN, 'Refugio Carapita', `Nova reserva ${numeroReserva} - ${nomeHospede}`, htmlAdmin),
      ]);
      console.log(`[EMAIL] hospede=${hospedeOk} | admin=${adminOk}`);
    }

    const resultado = { ...novaReserva, quarto: novaReserva.Quarto, hospede: novaReserva.Hospede };
    return new Response(JSON.stringify({ status: 'success', data: resultado }), {
      status: 201, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('reservas-criar error:', e);
    return new Response(JSON.stringify({ error: 'Erro ao criar reserva: ' + (e?.message || 'Erro interno') }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
