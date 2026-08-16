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

async function sendEmail(to: string, subject: string, html: string) {
  if (!BREVO_KEY || !to) return;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM }, to: [{ email: to }], subject, htmlContent: html }),
    });
  } catch (e) { console.error('Brevo email falhou:', e); }
}

function emailPago(reserva: any, tipo: 'inicial' | 'final'): string {
  const nome = reserva?.Hospede?.nome || 'Hóspede';
  const quarto = reserva?.Quarto?.nome || 'Alojamento';
  const titulo = tipo === 'final' ? 'Reserva 100% Confirmada 🎊' : 'Pagamento Recebido ✅';
  const msg = tipo === 'final'
    ? 'A sua reserva está totalmente paga. Estamos à sua espera no Refúgio Carapita!'
    : 'Recebemos o seu pagamento inicial (50%). A sua reserva está confirmada!';
  return `<div style="font-family:Georgia,serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;">
    <div style="background:#1E3932;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;text-transform:uppercase;">Refúgio Carapita</h1>
    </div>
    <div style="padding:32px 40px;">
      <h2 style="color:#1E3932;font-size:18px;">${titulo}</h2>
      <p style="font-size:15px;">Olá, <strong>${nome}</strong>,</p>
      <p style="color:#444;line-height:1.8;">${msg}</p>
      <p style="color:#444;"><strong>Alojamento:</strong> ${quarto}</p>
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
            if (reserva?.Hospede?.email) await sendEmail(reserva.Hospede.email, 'Pagamento confirmado — Refúgio Carapita', emailPago(reserva, 'inicial'));
            console.log(`Pagamento inicial confirmado: reserva ${reservaId}`);
          } else if (tipo === 'final') {
            const { data: reserva } = await sb.from('Reserva')
              .update({ pagamento_total_em: agora, atualizado_em: agora })
              .eq('id', reservaId).select('*, Hospede(*), Quarto(*)').single();
            if (reserva?.Hospede?.email) await sendEmail(reserva.Hospede.email, 'Reserva 100% paga — Refúgio Carapita', emailPago(reserva, 'final'));
            console.log(`Pagamento final confirmado: reserva ${reservaId}`);
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
