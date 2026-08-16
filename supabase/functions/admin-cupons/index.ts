import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'super-secret-key-carapita-2024');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized');
    await jwtVerify(auth.slice(7), JWT_SECRET);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[1];

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('Cupom')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ status: 'success', data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const { codigo, tipo_desconto, valor_desconto, limite_usos, data_validade, data_limite_estadia } = await req.json();
      const novoCupom = {
        codigo: codigo.toUpperCase(),
        tipo_desconto: tipo_desconto || 'PERCENTUAL',
        valor_desconto,
        limite_usos: limite_usos ? parseInt(limite_usos) : null,
        // data_validade       = prazo para RESERVAR
        // data_limite_estadia = ultima data de CHECK-IN abrangida (NULL = usa data_validade)
        data_validade: data_validade || null,
        data_limite_estadia: data_limite_estadia || null,
        ativo: true
      };
      const { data, error } = await supabase.from('Cupom').insert([novoCupom]).select('*').single();
      if (error) {
        if (error.code === '23505') {
          return new Response(JSON.stringify({ status: 'error', error: 'Codigo de cupom ja existe.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }
      return new Response(JSON.stringify({ status: 'success', data }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE' && id) {
      const { error } = await supabase.from('Cupom').delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ status: 'success' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Rota nao encontrada' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    const status = e.message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ error: e.message || 'Erro interno' }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
