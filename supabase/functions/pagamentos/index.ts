import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";
import Stripe from "npm:stripe@17.7.0";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// .trim() porque um espaco ou quebra de linha colado junto com o valor faz a
// verificacao de assinatura falhar com "No signatures found matching...".
const STRIPE_KEY = (Deno.env.get('STRIPE_SECRET_KEY') || '').trim();
const WEBHOOK_SECRET = (Deno.env.get('STRIPE_WEBHOOK_SECRET') || '').trim();
const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'super-secret-key-carapita-2024');
const FRONTEND_URL = (Deno.env.get('FRONTEND_URL') || 'https://refugiocarapita.pt').replace(/\/$/, '');
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') || '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'reservas@refugiocarapita.com';
const EMAIL_FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') || 'Refúgio Carapita';
const EMAIL_CONTATO = Deno.env.get('EMAIL_CONTATO') || 'contacto@refugiocarapita.pt';

// Deno: usar cliente fetch e provider de crypto assíncrono (webhooks)
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Nao falhar em silencio: se faltar a chave ou o Brevo recusar, tem de ficar no log,
  // senao um pagamento e confirmado sem o hospede receber aviso e ninguem da conta.
  if (!BREVO_KEY) { console.error(`[EMAIL] NAO ENVIADO (BREVO_API_KEY em falta) -> ${to}`); return false; }
  if (!to) { console.error('[EMAIL] NAO ENVIADO (destinatario vazio)'); return false; }
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM }, to: [{ email: to }], subject, htmlContent: html }),
    });
    if (!resp.ok) {
      console.error(`[EMAIL] ERRO Brevo ${resp.status} -> ${to}: ${await resp.text()}`);
      return false;
    }
    console.log(`[EMAIL] enviado -> ${to} | ${subject}`);
    return true;
  } catch (e) {
    console.error(`[EMAIL] EXCEPTION -> ${to}: ${(e as Error).message}`);
    return false;
  }
}

const fmtData = (d: string | null) => d
  ? new Date(d).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  : '—';

/** Prazo do 2.º pagamento: 10 dias antes do check-in (regra do alojamento). */
function prazoPagamentoFinal(dataCheckIn: string): string {
  const d = new Date(dataCheckIn);
  d.setDate(d.getDate() - 10);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function emailPago(reserva: any, tipo: 'inicial' | 'final'): string {
  const nome = reserva?.Hospede?.nome || 'Hóspede';
  const quarto = reserva?.Quarto?.nome || 'Alojamento';
  const total = Number(reserva?.valor_total || 0);
  const metade = total / 2;
  const numero = reserva?.numero_reserva || String(reserva?.id || '').substring(0, 8).toUpperCase();

  const titulo = tipo === 'final' ? 'Reserva Totalmente Paga' : 'Pagamento Recebido';
  const subtitulo = tipo === 'final' ? 'Confirmação Final' : 'Confirmação de Pagamento';

  const caixaReserva = `
    <div style="background:#fff;border:1px solid #E8E0D5;padding:20px 24px;margin:24px 0;">
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
        <tr><td style="color:#888;width:42%;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Alojamento</td><td style="color:#1E3932;font-weight:bold;">${quarto}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${fmtData(reserva?.data_check_in)}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-out</td><td style="color:#1E3932;font-weight:bold;">${fmtData(reserva?.data_check_out)}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Valor Total</td><td style="color:#1E3932;font-weight:bold;">&euro;${total.toFixed(2)}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">N.&ordm; Reserva</td><td style="color:#C4A484;font-weight:bold;font-family:monospace;">${numero}</td></tr>
      </table>
    </div>`;

  const corpo = tipo === 'final'
    ? `
      <p style="color:#444;line-height:1.8;">
        Recebemos o pagamento dos restantes <strong>&euro;${metade.toFixed(2)}</strong>.
        A sua reserva está agora <strong>totalmente paga</strong> — não há mais nada a liquidar.
      </p>
      ${caixaReserva}
      <div style="background:#F0F7F2;border-left:3px solid #2E7D57;padding:16px 20px;margin:24px 0;font-size:13px;line-height:1.9;color:#2E5540;">
        Está tudo tratado. Estamos ansiosos por recebê-lo(a) no Refúgio Carapita!
      </div>`
    : `
      <p style="color:#444;line-height:1.8;">
        Recebemos o seu pagamento de <strong>&euro;${metade.toFixed(2)}</strong> (50% do valor total).
        <strong>A sua reserva está confirmada e ativa.</strong>
      </p>
      ${caixaReserva}
      <div style="background:#FFFBF0;border-left:3px solid #C4A484;padding:16px 20px;margin:24px 0;font-size:13px;line-height:1.9;color:#444;">
        <p style="margin:0 0 8px;"><strong>Falta o pagamento final</strong></p>
        <p style="margin:0;">
          Os restantes <strong>50% (&euro;${metade.toFixed(2)})</strong> deverão ser liquidados até
          <strong>${prazoPagamentoFinal(reserva?.data_check_in)}</strong> (10 dias antes do check-in).
        </p>
        <p style="margin:8px 0 0;">
          A sua reserva mantém-se ativa até essa data. Pode efetuar o pagamento a qualquer momento
          na sua área reservada.
        </p>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="https://refugiocarapita.pt/perfil?tab=pagamentos&reserva=${reserva?.id}"
           style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">
          Área de Pagamentos
        </a>
      </div>`;

  return `<div style="font-family:Georgia,serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;">
    <div style="background:#1E3932;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;text-transform:uppercase;">Refúgio Carapita</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">${subtitulo}</p>
    </div>
    <div style="padding:32px 40px;">
      <h2 style="color:#1E3932;font-size:18px;margin-top:0;">${titulo}</h2>
      <p style="font-size:15px;">Olá, <strong>${nome}</strong>,</p>
      ${corpo}
    </div>
    <div style="padding:24px 40px;background:#1E3932;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px;text-transform:uppercase;">
        O Refúgio Carapita não envia dados de pagamento por email nem por links externos.
      </p>
    </div>
  </div>`;
}

/** Aviso interno para o alojamento saber que entrou um pagamento. */
function emailAdminPago(reserva: any, tipo: 'inicial' | 'final'): string {
  const total = Number(reserva?.valor_total || 0);
  const numero = reserva?.numero_reserva || String(reserva?.id || '').substring(0, 8).toUpperCase();
  const nome = `${reserva?.Hospede?.nome || ''} ${reserva?.Hospede?.sobrenome || ''}`.trim();
  return `<div style="font-family:Georgia,serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;">
    <div style="background:#1E3932;padding:24px 40px;text-align:center;">
      <h1 style="margin:0;color:#C4A484;font-size:20px;letter-spacing:5px;text-transform:uppercase;">Refúgio Carapita</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Pagamento Recebido</p>
    </div>
    <div style="padding:28px 40px;">
      <p style="font-size:15px;margin-top:0;">Entrou o pagamento <strong>${tipo === 'final' ? 'final (50% restantes)' : 'inicial (50%)'}</strong>.</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;border:1px solid #E8E0D5;">
        <tr><td style="color:#888;width:38%;text-transform:uppercase;font-size:11px;">N.&ordm; Reserva</td><td style="color:#C4A484;font-weight:bold;font-family:monospace;">${numero}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Hóspede</td><td style="color:#1E3932;font-weight:bold;">${nome}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Valor recebido</td><td style="color:#1E3932;font-weight:bold;">&euro;${(total / 2).toFixed(2)}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Valor total</td><td style="color:#1E3932;">&euro;${total.toFixed(2)}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-in</td><td style="color:#1E3932;">${fmtData(reserva?.data_check_in)}</td></tr>
      </table>
    </div>
  </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const fnIdx = parts.findIndex((p) => p === 'pagamentos');
  const action = fnIdx >= 0 ? parts[fnIdx + 1] : undefined;
  const id = fnIdx >= 0 ? parts[fnIdx + 2] : undefined;

  // ─────────────────────────────────────────────────────────────────────────
  // WEBHOOK do Stripe — sem JWT, valida a assinatura (raw body + SubtleCrypto)
  // ─────────────────────────────────────────────────────────────────────────
  if (action === 'webhook' && req.method === 'POST') {
    const sig = req.headers.get('stripe-signature');
    const body = await req.text();
    // Fail-closed: sem secret configurado ou sem assinatura, NÃO processa (evita
    // que alguém forje um "checkout.session.completed" e marque reservas como pagas).
    if (!WEBHOOK_SECRET || !sig) {
      console.error('Webhook rejeitado: STRIPE_WEBHOOK_SECRET em falta ou sem assinatura.');
      return json({ error: 'Webhook não configurado' }, 400);
    }
    let event: any;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET, undefined, cryptoProvider);
    } catch (err) {
      // Diagnostico: prefixo do secret configurado vs o que o Stripe assinou, para
      // se perceber num relance se o valor no Supabase e o do endpoint certo.
      console.error(
        `Webhook assinatura invalida. secret_configurado_prefixo=${WEBHOOK_SECRET.slice(0, 8)}` +
        ` len=${WEBHOOK_SECRET.length} | erro=${(err as Error).message}`
      );
      return json({ error: `Webhook Error: ${(err as Error).message}` }, 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};
      const reservaId = meta.reservaId;
      const tipo = meta.tipo;
      if (reservaId) {
        const agora = new Date().toISOString();
        try {
          if (tipo === 'inicial') {
            const { data: reserva } = await sb.from('Reserva')
              .update({ pagamento_inicial_em: agora, status: 'CONFIRMADA', atualizado_em: agora })
              .eq('id', reservaId).select('*, Hospede(*), Quarto(*)').single();
            console.log(`Pagamento inicial confirmado: reserva ${reservaId}`);
            const num = reserva?.numero_reserva || reservaId;
            await Promise.all([
              reserva?.Hospede?.email
                ? sendEmail(reserva.Hospede.email, `Pagamento recebido — Reserva ${num} confirmada`, emailPago(reserva, 'inicial'))
                : Promise.resolve(false),
              sendEmail(EMAIL_CONTATO, `Pagamento inicial recebido — Reserva ${num}`, emailAdminPago(reserva, 'inicial')),
            ]);
          } else if (tipo === 'final') {
            const { data: reserva } = await sb.from('Reserva')
              .update({ pagamento_total_em: agora, atualizado_em: agora })
              .eq('id', reservaId).select('*, Hospede(*), Quarto(*)').single();
            console.log(`Pagamento final confirmado: reserva ${reservaId}`);
            const num = reserva?.numero_reserva || reservaId;
            await Promise.all([
              reserva?.Hospede?.email
                ? sendEmail(reserva.Hospede.email, `Reserva ${num} totalmente paga — Refúgio Carapita`, emailPago(reserva, 'final'))
                : Promise.resolve(false),
              sendEmail(EMAIL_CONTATO, `Pagamento final recebido — Reserva ${num}`, emailAdminPago(reserva, 'final')),
            ]);
          }
        } catch (e) {
          console.error('Erro ao processar webhook:', (e as Error).message);
          // 200 na mesma para o Stripe não re-tentar em loop
        }
      }
    }
    return json({ received: true });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rotas autenticadas (token do hóspede)
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Token não fornecido' }, 401);
    let payload: any;
    try { payload = (await jwtVerify(auth.slice(7), JWT_SECRET)).payload; }
    catch { return json({ error: 'Token inválido ou expirado' }, 401); }
    const hospedeId = payload.id;
    if (!hospedeId) return json({ error: 'Token inválido' }, 401);

    // GET /pagamentos/reserva/:id — detalhes de pagamento
    if (action === 'reserva' && id && req.method === 'GET') {
      const { data: reserva, error } = await sb.from('Reserva')
        .select('*, Quarto(*), Hospede(*)').eq('id', id).eq('hospede_id', hospedeId).single();
      if (error || !reserva) return json({ error: 'Reserva não encontrada' }, 404);

      const valorTotal = Number(reserva.valor_total);
      const valor50 = valorTotal * 0.5;
      const pagouInicial = !!reserva.pagamento_inicial_em;
      const pagouTotal = !!reserva.pagamento_total_em;
      let valorPago = 0, valorEmAberto = 0, parcelaPendente: any = null;

      if (pagouTotal) {
        valorPago = valorTotal; valorEmAberto = 0;
      } else if (pagouInicial) {
        valorPago = valor50; valorEmAberto = valor50;
        const prazo = new Date(reserva.data_check_in); prazo.setDate(prazo.getDate() - 10);
        parcelaPendente = { tipo: 'pagamento_final', descricao: '2.ª Prestação — 50% Restantes', valor: valor50, prazo: prazo.toLocaleDateString('pt-PT') };
      } else {
        valorPago = 0; valorEmAberto = valor50;
        const prazo = new Date(reserva.criado_em); prazo.setHours(prazo.getHours() + 48);
        parcelaPendente = { tipo: 'pagamento_inicial', descricao: '1.ª Prestação — 50% Iniciais', valor: valor50, prazo: prazo.toLocaleDateString('pt-PT', { hour: '2-digit', minute: '2-digit' }) };
      }

      return json({
        status: 'success',
        data: {
          reserva: {
            id: reserva.id, status: reserva.status, data_check_in: reserva.data_check_in, data_check_out: reserva.data_check_out,
            valor_total: valorTotal, quarto: reserva.Quarto, criado_em: reserva.criado_em,
            pagamento_inicial_em: reserva.pagamento_inicial_em, pagamento_total_em: reserva.pagamento_total_em,
          },
          resumo: { valor_total: valorTotal, valor_pago: valorPago, valor_em_aberto: valorEmAberto, pagou_inicial: pagouInicial, pagou_total: pagouTotal },
          parcela_pendente: parcelaPendente,
        },
      });
    }

    // POST /pagamentos/checkout — cria sessão Stripe
    if (action === 'checkout' && req.method === 'POST') {
      if (!STRIPE_KEY) return json({ error: 'Stripe não configurado (falta STRIPE_SECRET_KEY).' }, 500);
      const { reservaId, tipo } = await req.json();
      const { data: reserva, error } = await sb.from('Reserva')
        .select('*, Hospede(*), Quarto(*)').eq('id', reservaId).eq('hospede_id', hospedeId).single();
      if (error || !reserva) return json({ error: 'Reserva não encontrada' }, 404);
      if (reserva.status === 'CANCELADA') return json({ error: 'Esta reserva foi cancelada.' }, 400);

      const valor50 = Number(reserva.valor_total) * 0.5;
      const amountCents = Math.round(valor50 * 100);

      if (tipo === 'final') {
        if (!reserva.pagamento_inicial_em) return json({ error: 'É necessário pagar a 1.ª prestação primeiro.' }, 400);
        if (reserva.pagamento_total_em) return json({ error: 'Esta reserva já está totalmente paga.' }, 400);
      } else {
        if (reserva.pagamento_inicial_em) return json({ error: 'O pagamento inicial já foi efetuado.' }, 400);
      }
      if (!amountCents || amountCents <= 0) return json({ error: 'Valor inválido.' }, 400);

      const checkIn = (reserva.data_check_in || '').split('T')[0];
      const descricao = `Refúgio Carapita — ${tipo === 'final' ? '2.ª' : '1.ª'} Prestação (50%) | Check-in: ${checkIn}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'multibanco', 'mb_way'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Refúgio Carapita — ${tipo === 'final' ? '2.ª Prestação' : '1.ª Prestação'}`, description: descricao },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/perfil?tab=pagamentos&pagamento=sucesso&reserva=${reservaId}`,
        cancel_url: `${FRONTEND_URL}/perfil?tab=pagamentos&pagamento=cancelado&reserva=${reservaId}`,
        client_reference_id: reservaId,
        metadata: { reservaId, tipo: tipo === 'final' ? 'final' : 'inicial', hospedeId },
        customer_email: reserva.Hospede?.email,
      });

      return json({ status: 'success', sessionId: session.id, url: session.url });
    }

    // GET /pagamentos/fatura/:id — dados da fatura
    if (action === 'fatura' && id && req.method === 'GET') {
      const { data: reserva, error } = await sb.from('Reserva')
        .select('*, Quarto(*), Hospede(*)').eq('id', id).eq('hospede_id', hospedeId).single();
      if (error || !reserva) return json({ error: 'Reserva não encontrada' }, 404);

      const h = reserva.Hospede;
      const valorTotal = Number(reserva.valor_total);
      const v50 = valorTotal * 0.5;
      const pagoInicial = reserva.pagamento_inicial_em ? v50 : 0;
      const pagoFinal = reserva.pagamento_total_em ? v50 : 0;

      return json({
        status: 'success',
        data: {
          numero: `RC-${String(reserva.id).substring(0, 8).toUpperCase()}`,
          data_emissao: new Date().toLocaleDateString('pt-PT'),
          emitente: { nome: 'Refúgio Carapita', nif: 'NIF: 260876640', morada: 'R. Dom Afonso Quarto Conde de Ourém IV 450, 2490-480 Ourém', email: 'reservas@refugiocarapita.com', telefone: '+351 920 003 608' },
          cliente: { nome: `${h?.nome || ''} ${h?.sobrenome || ''}`.trim(), email: h?.email || '', telefone: h?.telefone || '', morada: [h?.endereco1, h?.cidade, h?.pais].filter(Boolean).join(', '), nif: h?.numero_documento || '' },
          reserva: { id: reserva.id, quarto: reserva.Quarto?.nome || 'Alojamento', check_in: new Date(reserva.data_check_in).toLocaleDateString('pt-PT'), check_out: new Date(reserva.data_check_out).toLocaleDateString('pt-PT'), noites: Math.ceil((new Date(reserva.data_check_out).getTime() - new Date(reserva.data_check_in).getTime()) / 86400000) },
          financeiro: {
            valor_total: valorTotal, valor_inicial_pago: pagoInicial, valor_final_pago: pagoFinal,
            total_pago: pagoInicial + pagoFinal, saldo_devedor: valorTotal - (pagoInicial + pagoFinal),
            pagamento_inicial_em: reserva.pagamento_inicial_em ? new Date(reserva.pagamento_inicial_em).toLocaleDateString('pt-PT') : null,
            pagamento_total_em: reserva.pagamento_total_em ? new Date(reserva.pagamento_total_em).toLocaleDateString('pt-PT') : null,
          },
        },
      });
    }

    return json({ error: 'Rota não encontrada' }, 404);
  } catch (e) {
    console.error('pagamentos error:', (e as Error).message);
    return json({ error: (e as Error).message || 'Erro interno' }, 500);
  }
});
