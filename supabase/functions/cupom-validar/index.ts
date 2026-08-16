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

    // Validade inclusiva: um cupao com validade 29/08 e valido ate ao FIM do dia 29/08.
    // Tem de ser identico ao check em `reservas-criar`, senao um cupao aceite no site
    // podia ser recusado (ou vice-versa) no momento de gravar a reserva.
    if (cupom.data_validade) {
      const fimDoDia = new Date(`${String(cupom.data_validade).split('T')[0]}T23:59:59.999Z`);
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
