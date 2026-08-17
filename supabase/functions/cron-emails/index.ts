import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BREVO_KEY = Deno.env.get('BREVO_API_KEY') || 'xkeysib-bd7927517b06ad3757d0caad2c71611949cb040c941';
const CRON_SECRET = Deno.env.get('CRON_SECRET') || 'cron-carapita-2024';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Email Helper ───────────────────────────────────────────────────────
async function sendBrevo(to: string, toName: string, subject: string, html: string) {
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Refúgio Carapita', email: 'geral@refugiocarapita.pt' },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });
    if (!resp.ok) console.error(`Brevo error [${to}]:`, await resp.text());
    else console.log(`📧 Email enviado → ${to} | ${subject}`);
  } catch (e: any) { console.error('Brevo exception:', e.message); }
}

// ─── Templates ─────────────────────────────────────────────────────────────
const S = `font-family:'Georgia',serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;`;
const H = (sub='') => `<div style="background:#1E3932;padding:28px 40px;text-align:center;"><h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;font-weight:400;text-transform:uppercase;">Refúgio Carapita</h1>${sub?`<p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">${sub}</p>`:''}</div>`;
const F = () => `<div style="padding:24px 40px;background:#1E3932;text-align:center;"><p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px;text-transform:uppercase;">⚠️ O Refúgio Carapita <strong style="color:#C4A484;">não envia dados de pagamento por email</strong> nem por links.<br>Para pagamentos: <a href="https://refugiocarapita.pt/perfil" style="color:#C4A484;">refugiocarapita.pt/perfil</a></p></div>`;
const BOX = (r: any) => `<div style="background:#fff;border:1px solid #E8E0D5;padding:20px 24px;margin:20px 0;"><table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;"><tr><td style="color:#888;width:40%;text-transform:uppercase;font-size:11px;">Alojamento</td><td style="color:#1E3932;font-weight:bold;">${r.Quarto?.nome||'Refúgio Carapita'}</td></tr><tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${(r.data_check_in||'').split('T')[0]}</td></tr><tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-out</td><td style="color:#1E3932;font-weight:bold;">${(r.data_check_out||'').split('T')[0]}</td></tr><tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Valor Total</td><td style="color:#1E3932;font-weight:bold;font-size:16px;">€${Number(r.valor_total||0).toFixed(2)}</td></tr><tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Código</td><td style="color:#888;font-size:11px;">${(r.id||'').substring(0,8).toUpperCase()}</td></tr></table></div>`;
const BTN = (t: string, u: string) => `<div style="text-align:center;margin:28px 0;"><a href="${u}" style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">${t}</a></div>`;
const PAG_URL = (id: string) => `https://refugiocarapita.pt/perfil?tab=pagamentos&reserva=${id}`;

function tpl_lembrete24h(r: any) {
  const v50 = (Number(r.valor_total)*0.5).toFixed(2);
  return `<div style="${S}">${H('Lembrete de Pagamento')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>!</p><p style="color:#444;line-height:1.8;">Lembramos que a sua reserva no <strong>Refúgio Carapita</strong> aguarda o pagamento inicial de <strong>50% (€${v50})</strong> para ser confirmada.</p>${BOX(r)}<p style="color:#666;font-size:13px;line-height:1.8;">Ainda tem <strong>24 horas</strong> para efetuar o pagamento. Não perca a sua reserva! ✨</p>${BTN('Efetuar Pagamento Agora', PAG_URL(r.id))}</div>${F()}</div>`;
}
function tpl_lembrete36h(r: any) {
  const v50 = (Number(r.valor_total)*0.5).toFixed(2);
  return `<div style="${S}">${H('Urgente — Reserva a Expirar')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>!</p><p style="color:#444;line-height:1.8;">A sua reserva ainda não foi confirmada. Faltam apenas <strong>12 horas</strong> para o prazo de pagamento inicial (€${v50}).</p>${BOX(r)}<div style="background:#FFF3CD;border:1px solid #FFEAA7;padding:14px 18px;margin:16px 0;font-size:13px;color:#856404;">⚠️ Após o prazo de 48 horas sem pagamento, a reserva será cancelada automaticamente.</div>${BTN('Confirmar e Pagar Agora', PAG_URL(r.id))}</div>${F()}</div>`;
}
function tpl_lembrete40h(r: any) {
  const v50 = (Number(r.valor_total)*0.5).toFixed(2);
  return `<div style="${S}">${H('Última Hora — Reserva em Risco')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>!</p><p style="color:#c0392b;font-weight:bold;font-size:14px;">A sua reserva está quase a expirar — apenas <strong>8 horas</strong> restantes!</p><p style="color:#444;line-height:1.8;">Para guardar as suas datas, efetue agora o pagamento de 50% do valor total (€${v50}).</p>${BOX(r)}${BTN('🔒 Garantir a Minha Reserva', PAG_URL(r.id))}</div>${F()}</div>`;
}
function tpl_lembrete47h(r: any) {
  const v50 = (Number(r.valor_total)*0.5).toFixed(2);
  return `<div style="${S}">${H('⏱ Última Oportunidade')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>!</p><p style="color:#c0392b;font-weight:bold;font-size:15px;border:2px solid #c0392b;padding:12px;text-align:center;">⏱ FALTA APENAS 1 HORA para a sua reserva ser cancelada automaticamente!</p><p style="color:#444;line-height:1.8;margin-top:16px;">Efetue agora o pagamento de <strong>€${v50}</strong> para garantir a sua estadia no Refúgio Carapita.</p>${BOX(r)}${BTN('🚀 Pagar Agora — Última Oportunidade', PAG_URL(r.id))}</div>${F()}</div>`;
}
function tpl_cancelamentoPagInicial(r: any) {
  return `<div style="${S}">${H('Reserva Cancelada')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>,</p><p style="color:#444;line-height:1.8;">Lamentamos informar que <strong>a sua reserva foi cancelada por falta do pagamento inicial</strong> no prazo de 48 horas.</p>${BOX(r)}<div style="background:#FFF3CD;border:1px solid #FFEAA7;padding:14px 18px;margin:16px 0;font-size:13px;color:#856404;">As datas voltaram a estar disponíveis para reserva. Caso queira voltar a reservar, pode fazê-lo no nosso site.</div>${BTN('Fazer Nova Reserva', 'https://refugiocarapita.pt')}</div>${F()}</div>`;
}
function tpl_boasVindasPagInicial(r: any, passeios: any[]) {
  const noitesAte = Math.ceil((new Date(r.data_check_in).getTime() - Date.now()) / (1000*60*60*24));
  const roteirosHtml = passeios.slice(0,3).map((p: any) => `<div style="border:1px solid #E8E0D5;padding:12px 16px;margin-bottom:10px;background:#fff;"><strong style="color:#1E3932;font-size:13px;">📍 ${p.nome}</strong><p style="margin:4px 0 0;font-size:12px;color:#666;">${p.desc||''}</p></div>`).join('');
  return `<div style="${S}">${H('Reserva Confirmada 🎉')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>! 🌏</p><p style="color:#444;line-height:1.8;">Obrigado por garantir a sua reserva no <strong>Refúgio Carapita</strong>! O seu pagamento inicial foi recebido com sucesso.</p>${BOX(r)}${noitesAte>0?`<p style="color:#1E3932;font-size:15px;text-align:center;font-weight:bold;">🗓 Faltam <span style="color:#C4A484;">${noitesAte} dias</span> para a sua chegada!</p>`:''} ${roteirosHtml?`<div style="margin-top:24px;"><h3 style="color:#1E3932;font-size:14px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #E8E0D5;padding-bottom:10px;">🗺 Sugestões para a sua estadia em Ourém / Fátima</h3>${roteirosHtml}</div>`:''} ${BTN('Ver Todos os Roteiros', 'https://refugiocarapita.pt/perfil?tab=roteiros')}</div>${F()}</div>`;
}
function tpl_pagamentoFinal(r: any, diasAntes: number) {
  const vRest = (Number(r.valor_total)*0.5).toFixed(2);
  let urgencyLine = '';
  if (diasAntes <= 10) urgencyLine = `<p style="color:#c0392b;font-weight:bold;font-size:14px;border:2px solid #c0392b;padding:10px;text-align:center;">🚨 Estamos no limite do prazo — ${diasAntes} dias para o check-in!</p>`;
  else if (diasAntes <= 13) urgencyLine = `<p style="color:#c0392b;font-size:14px;">⚠️ Estamos a aproximar-nos do prazo limite. Faltam <strong>${diasAntes} dias</strong> para o check-in.</p>`;
  else if (diasAntes <= 20) urgencyLine = `<p style="color:#666;font-size:14px;">⏰ Faltam <strong>${diasAntes} dias</strong> para o check-in. Ainda temos tempo!</p>`;
  else urgencyLine = `<p style="color:#444;font-size:14px;">📅 Faltam <strong>${diasAntes} dias</strong> para a sua chegada ao Refúgio Carapita.</p>`;
  return `<div style="${S}">${H('Pagamento Final Pendente')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>!</p>${urgencyLine}<p style="color:#444;line-height:1.8;">O pagamento restante de <strong>€${vRest}</strong> (50% do total) ainda não foi registado. Efetue o pagamento e garanta a sua estadia!</p>${BOX(r)}${BTN('Efetuar Pagamento Final', PAG_URL(r.id))}</div>${F()}</div>`;
}
function tpl_cancelamentoPagFinal(r: any) {
  return `<div style="${S}">${H('Reserva Cancelada')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>,</p><p style="color:#444;line-height:1.8;">Lamentamos informar que <strong>a sua reserva foi cancelada por falta do pagamento final</strong> até 10 dias antes do check-in.</p>${BOX(r)}<div style="background:#FFF3CD;border:1px solid #FFEAA7;padding:14px 18px;margin:16px 0;font-size:13px;color:#856404;">As datas voltaram a estar disponíveis. Caso queira voltar a reservar, pode fazê-lo no nosso site.</div>${BTN('Fazer Nova Reserva', 'https://refugiocarapita.pt')}</div>${F()}</div>`;
}
function tpl_totalPago(r: any, passeios: any[]) {
  const roteirosHtml = passeios.slice(0,3).map((p: any) => `<div style="border:1px solid #E8E0D5;padding:12px 16px;margin-bottom:10px;background:#fff;"><strong style="color:#1E3932;font-size:13px;">📍 ${p.nome}</strong><p style="margin:4px 0 0;font-size:12px;color:#666;">${p.desc||''}</p></div>`).join('');
  return `<div style="${S}">${H('Reserva 100% Confirmada 🎊')}<div style="padding:32px 40px;"><p style="font-size:15px;margin-top:0;">Olá, <strong>${r._nomeH}</strong>! 🎊</p><p style="color:#444;line-height:1.8;font-size:15px;text-align:center;"><strong>A sua reserva está 100% confirmada!</strong><br>Estamos à sua espera no Refúgio Carapita. ✨</p>${BOX(r)}${roteirosHtml?`<div style="margin-top:24px;"><h3 style="color:#1E3932;font-size:14px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #E8E0D5;padding-bottom:10px;">🗺 Conheça a região de Ourém / Fátima</h3>${roteirosHtml}</div>`:''} ${BTN('Ver Roteiros Completos', 'https://refugiocarapita.pt/perfil?tab=roteiros')}</div>${F()}</div>`;
}

function getNomeH(h: any) {
  return `${h?.prefixo||''} ${h?.nome||''} ${h?.sobrenome||''}`.trim();
}

// ─── Main processor ────────────────────────────────────────────────────
async function processarEmails(sb: any) {
  const log: string[] = [];

  // ── 1. PENDENTE: lembretes de pagamento inicial + cancelamento auto ──────
  const { data: pendentes } = await sb
    .from('Reserva')
    .select('*, Hospede(*), Quarto(*)')
    .eq('status', 'PENDENTE')
    .is('pagamento_inicial_em', null);

  for (const r of (pendentes || [])) {
    const h = r.Hospede;
    if (!h?.email) continue;
    r._nomeH = getNomeH(h);
    const horas = (Date.now() - new Date(r.criado_em).getTime()) / 3600000;

    if (horas >= 48) {
      await sb.from('Reserva').update({ status: 'CANCELADA', atualizado_em: new Date().toISOString() }).eq('id', r.id);
      await sendBrevo(h.email, r._nomeH, 'A sua reserva foi cancelada — Refúgio Carapita', tpl_cancelamentoPagInicial(r));
      log.push(`❌ Cancelou ${r.id.substring(0,8)} (48h sem pagamento)`);
      continue;
    }
    if (horas >= 47 && !r.email_lembrete_47h_enviado) {
      await sendBrevo(h.email, r._nomeH, '🔴 Última oportunidade — garanta a sua reserva AGORA — Refúgio Carapita', tpl_lembrete47h(r));
      await sb.from('Reserva').update({ email_lembrete_47h_enviado: true }).eq('id', r.id);
      log.push(`📧 Lembrete 47h → ${h.email}`);
      continue;
    }
    if (horas >= 40 && !r.email_lembrete_40h_enviado) {
      await sendBrevo(h.email, r._nomeH, '🚨 A sua reserva está quase a expirar — Refúgio Carapita', tpl_lembrete40h(r));
      await sb.from('Reserva').update({ email_lembrete_40h_enviado: true }).eq('id', r.id);
      log.push(`📧 Lembrete 40h → ${h.email}`);
      continue;
    }
    if (horas >= 36 && !r.email_lembrete_36h_enviado) {
      await sendBrevo(h.email, r._nomeH, '⚡ Falta pouco! Garanta a sua reserva agora mesmo — Refúgio Carapita', tpl_lembrete36h(r));
      await sb.from('Reserva').update({ email_lembrete_36h_enviado: true }).eq('id', r.id);
      log.push(`📧 Lembrete 36h → ${h.email}`);
      continue;
    }
    if (horas >= 24 && !r.email_lembrete_24h_enviado) {
      await sendBrevo(h.email, r._nomeH, '⏰ Garanta a sua reserva! — Refúgio Carapita', tpl_lembrete24h(r));
      await sb.from('Reserva').update({ email_lembrete_24h_enviado: true }).eq('id', r.id);
      log.push(`📧 Lembrete 24h → ${h.email}`);
    }
  }

  // ── 2. CONFIRMADA + pagamento inicial feito: email boas-vindas ───────────
  const { data: comPagInicial } = await sb
    .from('Reserva')
    .select('*, Hospede(*), Quarto(*)')
    .eq('status', 'CONFIRMADA')
    .not('pagamento_inicial_em', 'is', null)
    .eq('email_boasvindas_enviado', false);

  if (comPagInicial?.length) {
    const { data: passeios } = await sb.from('Passeio').select('*').eq('ativo', true).limit(3);
    for (const r of comPagInicial) {
      const h = r.Hospede;
      if (!h?.email) continue;
      r._nomeH = getNomeH(h);
      await sendBrevo(h.email, r._nomeH, '🌏 Obrigado! A sua reserva está confirmada — Refúgio Carapita', tpl_boasVindasPagInicial(r, passeios || []));
      const proximaMensal = new Date(Date.now() + 30 * 24 * 3600000).toISOString();
      await sb.from('Reserva').update({ email_boasvindas_enviado: true, proxima_mensagem_mensal_em: proximaMensal }).eq('id', r.id);
      log.push(`📧 Boas-vindas pag.inicial → ${h.email}`);
    }
  }

  // ── 3. CONFIRMADA + pagamento inicial + sem pagamento final: lembretes finais ──
  const { data: semPagFinal } = await sb
    .from('Reserva')
    .select('*, Hospede(*), Quarto(*)')
    .eq('status', 'CONFIRMADA')
    .not('pagamento_inicial_em', 'is', null)
    .is('pagamento_total_em', null)
    .eq('email_boasvindas_enviado', true);

  const diasLembrete = [30, 20, 15, 14, 13, 12, 11, 10];
  const subjectsFinal: Record<number, string> = {
    30: '🏡 Não perca a sua reserva — ainda temos tempo! — Refúgio Carapita',
    20: '⏰ Não perca a sua reserva — efetue o pagamento restante — Refúgio Carapita',
    15: '⚠️ Estamos próximos do prazo limite — Refúgio Carapita',
    14: '⚠️ Prazo se aproxima — Efetue o pagamento restante — Refúgio Carapita',
    13: '⚠️ Prazo urgente — Garanta a sua estadia — Refúgio Carapita',
    12: '⚠️ Ainda podemos garantir a sua reserva — Refúgio Carapita',
    11: '⚠️ Urgente — Pagamento final pendente — Refúgio Carapita',
    10: '🔴 Último dia — Garanta já a sua reserva — Refúgio Carapita',
  };

  for (const r of (semPagFinal || [])) {
    const h = r.Hospede;
    if (!h?.email) continue;
    r._nomeH = getNomeH(h);
    const diasAteCheckin = Math.ceil((new Date(r.data_check_in).getTime() - Date.now()) / 86400000);

    if (diasAteCheckin < 10) {
      await sb.from('Reserva').update({ status: 'CANCELADA', atualizado_em: new Date().toISOString() }).eq('id', r.id);
      await sendBrevo(h.email, r._nomeH, 'A sua reserva foi cancelada por falta do pagamento final — Refúgio Carapita', tpl_cancelamentoPagFinal(r));
      log.push(`❌ Cancelou ${r.id.substring(0,8)} (sem pagamento final)`);
      continue;
    }

    const enviados: number[] = r.emails_pagamento_final_enviados || [];
    for (const dias of diasLembrete) {
      if (diasAteCheckin <= dias && !enviados.includes(dias)) {
        const subj = subjectsFinal[dias] || `⚠️ Pagamento pendente — ${dias} dias para check-in — Refúgio Carapita`;
        await sendBrevo(h.email, r._nomeH, subj, tpl_pagamentoFinal(r, diasAteCheckin));
        await sb.from('Reserva').update({ emails_pagamento_final_enviados: [...enviados, dias] }).eq('id', r.id);
        log.push(`📧 Lembrete pag.final ${dias}d → ${h.email}`);
        break;
      }
    }
  }

  // ── 4. CONFIRMADA + pagamento total feito: email 100% confirmada ─────────
  const { data: totalPagas } = await sb
    .from('Reserva')
    .select('*, Hospede(*), Quarto(*)')
    .eq('status', 'CONFIRMADA')
    .not('pagamento_total_em', 'is', null)
    .eq('email_total_enviado', false);

  if (totalPagas?.length) {
    const { data: passeios } = await sb.from('Passeio').select('*').eq('ativo', true).limit(3);
    for (const r of totalPagas) {
      const h = r.Hospede;
      if (!h?.email) continue;
      r._nomeH = getNomeH(h);
      await sendBrevo(h.email, r._nomeH, '🎊 A sua reserva está 100% confirmada! — Refúgio Carapita', tpl_totalPago(r, passeios || []));
      await sb.from('Reserva').update({ email_total_enviado: true }).eq('id', r.id);
      log.push(`📧 Email 100% confirmada → ${h.email}`);
    }
  }

  // ── 5. Emails mensais (hóspedes confirmados aguardando check-in) ─────────
  const { data: mensais } = await sb
    .from('Reserva')
    .select('*, Hospede(*), Quarto(*)')
    .eq('status', 'CONFIRMADA')
    .not('pagamento_inicial_em', 'is', null)
    .lte('proxima_mensagem_mensal_em', new Date().toISOString())
    .not('proxima_mensagem_mensal_em', 'is', null);

  if (mensais?.length) {
    const { data: passeios } = await sb.from('Passeio').select('*').eq('ativo', true).limit(3);
    for (const r of mensais) {
      const h = r.Hospede;
      if (!h?.email) continue;
      const diasAteCheckin = Math.ceil((new Date(r.data_check_in).getTime() - Date.now()) / 86400000);
      if (diasAteCheckin <= 30) continue;
      r._nomeH = getNomeH(h);
      await sendBrevo(h.email, r._nomeH, '🌏 Até breve no Refúgio Carapita! — Atualização mensal', tpl_boasVindasPagInicial(r, passeios || []));
      const proximaMensal = new Date(Date.now() + 30 * 24 * 3600000).toISOString();
      await sb.from('Reserva').update({ proxima_mensagem_mensal_em: proximaMensal }).eq('id', r.id);
      log.push(`📧 Email mensal → ${h.email}`);
    }
  }

  return log;
}

// ─── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  try {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const inicio = Date.now();
    const detalhes = await processarEmails(sb);
    const duracao = Date.now() - inicio;

    console.log(`✅ cron-emails: ${detalhes.length} ações em ${duracao}ms`, detalhes);

    return new Response(JSON.stringify({
      status: 'ok',
      executado_em: new Date().toISOString(),
      acoes: detalhes.length,
      duracao_ms: duracao,
      detalhes
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('cron-emails error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
