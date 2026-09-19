// ============================================================================
// ical-export — o NOSSO calendario, lido pelo Booking.com e pelo Airbnb.
// ----------------------------------------------------------------------------
// E o que impede as OTAs de venderem datas que ja estao ocupadas por reservas
// directas. Confirmado nos logs: o Booking e o Airbnb pedem este ficheiro
// varias vezes por dia.
//
// CORRECAO 19/09/2026 — off-by-one nos bloqueios manuais:
//   Em iCal, o DTEND de um evento de dia inteiro e EXCLUSIVO. A versao anterior
//   exportava DTEND = data_fim, pelo que um bloqueio de 01 a 05 chegava as OTAs
//   como 01 a 04 e o dia 5 ficava a venda. Nas reservas o comportamento estava
//   certo (o hospede sai na manha do check-out), nos bloqueios nao: o data_fim
//   de um bloqueio e inclusivo — e assim que o tarifas-calendario o interpreta.
// ============================================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

function pad(n: number) { return String(n).padStart(2, '0'); }

function toIcalDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

/** DTEND de dia inteiro e exclusivo: uma data final inclusiva precisa de +1 dia. */
function toIcalDateExclusivo(iso: string) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + 1);
  return toIcalDate(d.toISOString());
}

function escapeText(s: string) {
  return s.replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
}

function buildIcal(events: Array<{ uid: string; start: string; end: string; summary: string; description: string }>) {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Refúgio Carapita//Channel Manager//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Refúgio Carapita',
    'X-WR-TIMEZONE:Europe/Lisbon',
  ];

  for (const ev of events) {
    const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${ev.start}`,
      `DTEND;VALUE=DATE:${ev.end}`,
      `SUMMARY:${escapeText(ev.summary)}`,
      `DESCRIPTION:${escapeText(ev.description)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

Deno.serve(async (req) => {
  // /ical-export/{quartoId}
  const url = new URL(req.url);
  const quartoId = url.pathname.split('/').filter(Boolean)[1];

  if (!quartoId) {
    return new Response('quartoId em falta. Use /ical-export/{quartoId}', { status: 400 });
  }

  try {
    const { data: quarto, error: errQ } = await supabase
      .from('Quarto').select('id, nome').eq('id', quartoId).maybeSingle();

    if (errQ || !quarto) {
      return new Response('Quarto não encontrado', { status: 404 });
    }

    const [{ data: reservas, error: errR }, { data: bloqueios, error: errB }] = await Promise.all([
      supabase.from('Reserva')
        .select('id, data_check_in, data_check_out, status')
        .eq('quarto_id', quartoId)
        .not('status', 'in', '("CANCELADA","EXPIRADA")'),
      supabase.from('Bloqueio')
        .select('id, data_inicio, data_fim, motivo')
        .eq('quarto_id', quartoId),
    ]);

    // Um erro de leitura aqui devolveria um calendario VAZIO as OTAs — ou seja,
    // "esta tudo livre". E exactamente o tipo de falha silenciosa que provocou o
    // incidente de 18/09: melhor devolver erro do que mentir com um calendario
    // vazio e arriscar overbooking.
    if (errR || errB) {
      console.error('ical-export: falha ao ler ocupacao:', errR?.message || errB?.message);
      return new Response('Erro ao ler a ocupação', { status: 503 });
    }

    const events: Array<{ uid: string; start: string; end: string; summary: string; description: string }> = [];

    for (const r of (reservas || [])) {
      // Reserva: o check-out e ja o dia de saida, corresponde ao DTEND exclusivo.
      events.push({
        uid: `reserva-${r.id}@refugiocarapita.com`,
        start: toIcalDate(r.data_check_in),
        end: toIcalDate(r.data_check_out),
        summary: 'Ocupado (Refúgio Carapita)',
        description: `Reserva #${r.id.slice(0, 8)} - ${r.status}`,
      });
    }

    for (const b of (bloqueios || [])) {
      // Bloqueio: data_fim e inclusiva (o tarifas-calendario bloqueia ate esse
      // dia), por isso o DTEND tem de ser o dia seguinte.
      events.push({
        uid: `bloqueio-${b.id}@refugiocarapita.com`,
        start: toIcalDate(b.data_inicio),
        end: toIcalDateExclusivo(b.data_fim),
        summary: `Indisponível: ${b.motivo || 'Manutenção'}`,
        description: 'Bloqueio manual pelo administrador',
      });
    }

    const icsContent = buildIcal(events);
    const fileName = `carapita-${quarto.nome.toLowerCase().replace(/\s+/g, '-')}.ics`;

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (e) {
    console.error('ical-export error:', (e as Error).message);
    return new Response('Erro interno ao gerar calendário', { status: 500 });
  }
});
