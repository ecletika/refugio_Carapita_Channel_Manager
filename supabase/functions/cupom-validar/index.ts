import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const codigo = pathParts[pathParts.length - 1]?.toUpperCase();

    if (!codigo) {
      return new Response(JSON.stringify({ error: 'Codigo de cupom nao fornecido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: cupom, error } = await supabase
      .from('Cupom')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error || !cupom) {
      return new Response(JSON.stringify({ status: 'error', error: 'Cupom invalido ou nao encontrado.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!cupom.ativo) {
      return new Response(JSON.stringify({ status: 'error', error: 'Este cupom encontra-se inativo.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (cupom.limite_usos && cupom.usos_atuais >= cupom.limite_usos) {
      return new Response(JSON.stringify({ status: 'error', error: 'Este cupom ja atingiu o limite de utilizacoes.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validade inclusiva em hora de Portugal: validade 29/08 = valido todo o dia 29,
    // expirado a partir das 00:00 do dia 30. Tem de ser identico ao check em
    // `reservas-criar`, senao um cupao aceite no site podia ser recusado ao gravar.
    if (cupom.data_validade) {
      const fimDoDia = fimDoDiaLisboa(String(cupom.data_validade).split('T')[0]);
      if (fimDoDia < new Date()) {
        return new Response(JSON.stringify({ status: 'error', error: 'Este cupom ja expirou.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ status: 'success', data: cupom }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('cupom-validar error:', e);
    return new Response(JSON.stringify({ error: 'Erro ao validar cupom' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
