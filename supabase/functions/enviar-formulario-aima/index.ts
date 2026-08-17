import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Mesmo fallback usado em reservas-criar para garantir funcionamento
const BREVO_KEY = Deno.env.get('BREVO_API_KEY') || 'xkeysib-bd7927517b06ad3757d0caad2c71611949cb040c941';
// Remetente verificado no Brevo (mesma conta que reservas-criar usa)
const EMAIL_FROM      = Deno.env.get('EMAIL_FROM')      || 'contacto@refugiocarapita.pt';
const EMAIL_FROM_NAME = Deno.env.get('EMAIL_FROM_NAME') || 'Refúgio Carapita';
const EMAIL_CONTATO   = Deno.env.get('EMAIL_CONTATO')   || 'contacto@refugiocarapita.pt';
const FRONTEND_URL    = (Deno.env.get('FRONTEND_URL')   || 'https://refugiocarapita.pt').replace(/\/$/, '');

function gerarAimaFormToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Envia email via Brevo — não lança exceção, apenas loga o erro
async function sendEmail(to: string, toName: string, subject: string, html: string): Promise<boolean> {
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: html,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error(`Brevo error ${resp.status} → ${to}: ${err}`);
      return false;
    }

    console.log(`Email enviado via Brevo → ${to}`);
    return true;
  } catch (e: unknown) {
    console.error(`Brevo exception → ${to}:`, e instanceof Error ? e.message : String(e));
    return false;
  }
}

function buildEmailHospede(
  nomeHospede: string,
  codigoReserva: string,
  checkIn: string,
  checkOut: string,
  quartoNome: string,
  valorTotal: string,
  formularioUrl: string
): string {
  return `
  <div style="font-family:'Georgia',serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;">
    <div style="background:#1E3932;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;font-weight:400;text-transform:uppercase;">Refúgio Carapita</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Formulário de Identificação AIMA</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:15px;margin-top:0;">Olá, <strong>${nomeHospede}</strong>,</p>
      <p style="color:#444;line-height:1.8;">Para cumprir as obrigações legais do Alojamento Local junto da <strong>AIMA</strong>, precisamos que preencha o formulário de identificação de todos os hóspedes da sua reserva.</p>
      <div style="background:#fff;border:1px solid #E8E0D5;padding:20px 24px;margin:20px 0;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
          <tr><td style="color:#888;width:40%;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Alojamento</td><td style="color:#1E3932;font-weight:bold;">${quartoNome}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${checkIn}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-out</td><td style="color:#1E3932;font-weight:bold;">${checkOut}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Valor Total</td><td style="color:#1E3932;font-weight:bold;">&euro;${valorTotal}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">N.º Reserva</td><td style="color:#C4A484;font-weight:bold;font-family:monospace;">${codigoReserva}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${formularioUrl}" style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">Preencher Formulário AIMA</a>
      </div>
      <p style="font-size:12px;color:#777;line-height:1.7;text-align:center;">
        Caso o botão não funcione, copie e cole este link no navegador:<br>
        <a href="${formularioUrl}" style="color:#C4A484;word-break:break-all;">${formularioUrl}</a>
      </p>
    </div>
    <div style="padding:24px 40px;background:#1E3932;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px;text-transform:uppercase;">
        O Refugio Carapita nao envia dados de pagamento por email nem por links externos.
      </p>
    </div>
  </div>`;
}

function buildEmailAdmin(
  nomeHospede: string,
  emailHospede: string,
  codigoReserva: string,
  checkIn: string,
  formularioUrl: string
): string {
  return `
  <div style="font-family:'Georgia',serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;">
    <div style="background:#1E3932;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;font-weight:400;text-transform:uppercase;">Refugio Carapita</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Copia — Formulario AIMA Enviado</p>
    </div>
    <div style="padding:32px 40px;">
      <p>Foi enviado um formulario AIMA ao hospede.</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;border:1px solid #E8E0D5;">
        <tr><td style="color:#888;width:35%;text-transform:uppercase;font-size:11px;">Reserva</td><td style="color:#1E3932;font-weight:bold;">${codigoReserva}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Hospede</td><td style="color:#1E3932;font-weight:bold;">${nomeHospede}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Email</td><td style="color:#1E3932;font-weight:bold;">${emailHospede}</td></tr>
        ${checkIn ? `<tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${checkIn}</td></tr>` : ''}
      </table>
      <div style="text-align:center;margin:28px 0;">
        <a href="${formularioUrl}" style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">Abrir Formulario AIMA</a>
      </div>
    </div>
  </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Metodo nao permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const reservaId = pathParts[pathParts.length - 1];

    if (!reservaId || reservaId === 'enviar-formulario-aima') {
      return new Response(
        JSON.stringify({ error: 'ID da reserva nao fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar reserva com hospede e quarto
    const { data: reserva, error } = await supabase
      .from('Reserva')
      .select('*, Hospede(*), Quarto(*)')
      .eq('id', reservaId)
      .single();

    if (error || !reserva) {
      return new Response(
        JSON.stringify({ error: 'Reserva nao encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hospede = reserva.Hospede;
    if (!hospede?.email) {
      return new Response(
        JSON.stringify({ error: 'Esta reserva nao tem email de hospede.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar token AIMA se ainda nao existir
    let token = reserva.aima_form_token;
    if (!token) {
      token = gerarAimaFormToken();
      await supabase
        .from('Reserva')
        .update({ aima_form_token: token, aima_dados_completos: false, atualizado_em: new Date().toISOString() })
        .eq('id', reservaId);
    }

    const formularioUrl = `${FRONTEND_URL}/aima?token=${token}`;
    const nomeHospede = `${hospede.nome || ''} ${hospede.sobrenome || ''}`.trim() || 'Hospede';
    const codigoReserva = reserva.numero_reserva || (reserva.id as string)?.substring(0, 8).toUpperCase() || '';
    const quartoNome = (reserva.Quarto as Record<string, string>)?.nome || 'Alojamento';
    const valorTotal = Number(reserva.valor_total || 0).toFixed(2);

    const fmt = (d: string | null) => d
      ? new Date(d).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const checkIn  = fmt(reserva.data_check_in);
    const checkOut = fmt(reserva.data_check_out);

    // Enviar email ao hospede (obrigatorio)
    const hospedeOk = await sendEmail(
      hospede.email,
      nomeHospede,
      `Formulario de identificacao AIMA — Reserva ${codigoReserva}`,
      buildEmailHospede(nomeHospede, codigoReserva, checkIn, checkOut, quartoNome, valorTotal, formularioUrl)
    );

    // Enviar copia interna (opcional — nao falha se der erro)
    if (hospedeOk) {
      sendEmail(
        EMAIL_CONTATO,
        'Refugio Carapita',
        `Copia AIMA enviado — Reserva ${codigoReserva}`,
        buildEmailAdmin(nomeHospede, hospede.email, codigoReserva, checkIn, formularioUrl)
      ).catch(e => console.error('Admin email failed (non-fatal):', e));
    }

    // Retorna 200 mesmo que o email falhe — o token foi gerado e guardado
    // O admin pode partilhar o link manualmente
    const mensagem = hospedeOk
      ? `Formulario AIMA enviado com sucesso para ${hospede.email}.`
      : `Link AIMA gerado. Email nao enviado (problema com servidor de email) — partilhe o link manualmente com o hospede.`;

    return new Response(
      JSON.stringify({
        status: 'success',
        email_enviado: hospedeOk,
        message: mensagem,
        data: {
          reservaId: reserva.id,
          numero_reserva: reserva.numero_reserva,
          aima_form_token: token,
          formulario_url: formularioUrl,
          enviado_para: hospede.email,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('enviar-formulario-aima error:', message);
    return new Response(
      JSON.stringify({ error: `Erro interno: ${message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
