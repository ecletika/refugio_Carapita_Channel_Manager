import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function gerarAimaFormToken(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

function siteUrl(): string {
  return (Deno.env.get('FRONTEND_URL') || 'https://refugiocarapita.pt').replace(/\/$/, '');
}

function aimaFormUrl(token: string): string {
  return `${siteUrl()}/aima?token=${token}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const brevoKey = Deno.env.get('BREVO_API_KEY');
  const fromEmail = Deno.env.get('EMAIL_FROM') || 'reservas@refugiocarapita.com';
  const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'Refúgio Carapita';

  if (!brevoKey) {
    throw new Error('BREVO_API_KEY não configurado nas variáveis de ambiente da Edge Function.');
  }

  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Brevo error ${resp.status}: ${err}`);
  }
}

function buildEmailHospede(
  nomeHospede: string,
  codigoReserva: string,
  checkIn: string,
  checkOut: string,
  reserva: Record<string, unknown>,
  formularioUrl: string
): string {
  const quartoNome =
    (reserva.Quarto as Record<string, string>)?.nome ||
    (reserva.quarto as Record<string, string>)?.nome ||
    'Alojamento Selecionado';
  const valorTotal = Number(reserva.valor_total || 0).toFixed(2);
  const reservaIdShort = (reserva.id as string)?.substring(0, 8).toUpperCase() || '';
  const codigo = codigoReserva || reservaIdShort;

  return `
  <div style="font-family:'Georgia',serif;color:#1E3932;max-width:620px;margin:auto;border:1px solid #D4C5A9;background:#FAF8F4;">
    <div style="background:#1E3932;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;font-weight:400;text-transform:uppercase;">Refúgio Carapita</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Formulário de Identificação AIMA</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:15px;margin-top:0;">Olá, <strong>${nomeHospede}</strong>,</p>
      <p style="color:#444;line-height:1.8;">Para cumprirmos as obrigações legais do Alojamento Local junto da <strong>AIMA</strong>, precisamos que preencha o formulário de identificação dos hóspedes da sua reserva.</p>
      <div style="background:#fff;border:1px solid #E8E0D5;padding:20px 24px;margin:20px 0;border-radius:2px;">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;">
          <tr><td style="color:#888;width:40%;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Alojamento</td><td style="color:#1E3932;font-weight:bold;">${quartoNome}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${checkIn}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Check-out</td><td style="color:#1E3932;font-weight:bold;">${checkOut}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Valor Total</td><td style="color:#1E3932;font-weight:bold;font-size:16px;">€${valorTotal}</td></tr>
          <tr><td style="color:#888;text-transform:uppercase;letter-spacing:1px;font-size:11px;">Código Reserva</td><td style="color:#888;font-size:11px;">${codigo}</td></tr>
        </table>
      </div>
      <div style="background:#FFFBF0;border-left:3px solid #C4A484;padding:16px 20px;margin:24px 0;font-size:13px;line-height:1.9;color:#444;">
        <p style="margin:0;"><strong>Reserva:</strong> ${codigo}</p>
        ${checkIn ? `<p style="margin:8px 0 0;"><strong>Check-in:</strong> ${checkIn}</p>` : ''}
        ${checkOut ? `<p style="margin:8px 0 0;"><strong>Check-out:</strong> ${checkOut}</p>` : ''}
      </div>
      <div style="text-align:center;margin:28px 0;">
        <a href="${formularioUrl}" style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">Preencher Formulário AIMA</a>
      </div>
      <p style="font-size:12px;color:#777;line-height:1.7;text-align:center;">
        Caso o botão não funcione, copie e cole este link no navegador:<br>
        <a href="${formularioUrl}" style="color:#C4A484;word-break:break-all;">${formularioUrl}</a>
      </p>
    </div>
    <div style="padding:24px 40px;background:#1E3932;text-align:center;margin-top:0;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px;text-transform:uppercase;">
        ⚠️ O Refúgio Carapita <strong style="color:#C4A484;">não envia dados de pagamento por email</strong> nem por links externos.
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
      <h1 style="margin:0;color:#C4A484;font-size:22px;letter-spacing:6px;font-weight:400;text-transform:uppercase;">Refúgio Carapita</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Cópia do Formulário AIMA</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="font-size:15px;margin-top:0;">Foi enviado um formulário AIMA ao hóspede.</p>
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;margin:20px 0;border:1px solid #E8E0D5;">
        <tr><td style="color:#888;width:35%;text-transform:uppercase;font-size:11px;">Reserva</td><td style="color:#1E3932;font-weight:bold;">${codigoReserva}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Hóspede</td><td style="color:#1E3932;font-weight:bold;">${nomeHospede}</td></tr>
        <tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Email</td><td style="color:#1E3932;font-weight:bold;">${emailHospede}</td></tr>
        ${checkIn ? `<tr><td style="color:#888;text-transform:uppercase;font-size:11px;">Check-in</td><td style="color:#1E3932;font-weight:bold;">${checkIn}</td></tr>` : ''}
      </table>
      <div style="text-align:center;margin:28px 0;">
        <a href="${formularioUrl}" style="display:inline-block;background:#1E3932;color:#C4A484;text-decoration:none;padding:14px 40px;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #C4A484;font-family:sans-serif;">Abrir Formulário AIMA</a>
      </div>
      <p style="font-size:12px;color:#777;line-height:1.7;text-align:center;word-break:break-all;">${formularioUrl}</p>
    </div>
    <div style="padding:24px 40px;background:#1E3932;text-align:center;margin-top:0;">
      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:2px;text-transform:uppercase;">
        ⚠️ O Refúgio Carapita <strong style="color:#C4A484;">não envia dados de pagamento por email</strong> nem por links externos.
      </p>
    </div>
  </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extrair reservaId da URL: /enviar-formulario-aima/{id}
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const reservaId = pathParts[pathParts.length - 1];

    if (!reservaId || reservaId === 'enviar-formulario-aima') {
      return new Response(
        JSON.stringify({ error: 'ID da reserva não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    // Buscar reserva com hóspede e quarto
    const { data: reserva, error } = await supabase
      .from('Reserva')
      .select('*, Hospede(*), Quarto(*)')
      .eq('id', reservaId)
      .single();

    if (error || !reserva) {
      return new Response(
        JSON.stringify({ error: 'Reserva não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hospede = reserva.Hospede;
    if (!hospede?.email) {
      return new Response(
        JSON.stringify({ error: 'Esta reserva não tem email de hóspede.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar token se não existir
    let token = reserva.aima_form_token;
    if (!token) {
      token = gerarAimaFormToken();
      const { error: updateError } = await supabase
        .from('Reserva')
        .update({
          aima_form_token: token,
          aima_dados_completos: false,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', reservaId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Não foi possível gerar o token do formulário AIMA.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const formularioUrl = aimaFormUrl(token);
    const nomeHospede = `${hospede.nome || ''} ${hospede.sobrenome || ''}`.trim() || 'Hóspede';
    const codigoReserva = reserva.numero_reserva || (reserva.id as string)?.substring(0, 8).toUpperCase() || '';
    const emailContato = Deno.env.get('EMAIL_CONTATO') || 'contacto@refugiocarapita.pt';

    const checkIn = reserva.data_check_in
      ? new Date(reserva.data_check_in).toLocaleDateString('pt-PT', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';
    const checkOut = reserva.data_check_out
      ? new Date(reserva.data_check_out).toLocaleDateString('pt-PT', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    // Enviar email ao hóspede
    await sendEmail(
      hospede.email,
      `Formulário de identificação AIMA — Reserva ${codigoReserva}`,
      buildEmailHospede(nomeHospede, codigoReserva, checkIn, checkOut, reserva, formularioUrl)
    );

    // Enviar cópia ao contacto interno
    await sendEmail(
      emailContato,
      `Cópia do formulário AIMA enviado — Reserva ${codigoReserva}`,
      buildEmailAdmin(nomeHospede, hospede.email, codigoReserva, checkIn, formularioUrl)
    );

    console.log(`📧 Formulário AIMA enviado → ${hospede.email} e ${emailContato}`);

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Formulário AIMA enviado com sucesso para o hóspede e para contacto@refugiocarapita.pt.',
        data: {
          reservaId: reserva.id,
          numero_reserva: reserva.numero_reserva,
          aima_form_token: token,
          formulario_url: formularioUrl,
          enviado_para: [hospede.email, emailContato],
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ enviar-formulario-aima:', message);
    return new Response(
      JSON.stringify({ error: `Erro ao enviar formulário AIMA: ${message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
