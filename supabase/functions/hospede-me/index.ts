import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose";

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
};

// Campos do perfil que o hóspede pode editar (nunca id, email, senha_hash, criado_em)
const CAMPOS_EDITAVEIS = [
  'prefixo', 'nome', 'sobrenome', 'telefone', 'pais', 'endereco1', 'endereco2', 'cidade', 'cep',
  'nif', 'passaporte', 'estrangeiro', 'data_nascimento', 'local_nascimento', 'nacionalidade',
  'tipo_documento', 'numero_documento', 'pais_emissor_documento', 'dependentes', 'foto_perfil',
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token não fornecido' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.split(' ')[1];
    const jwtSecret = Deno.env.get('JWT_SECRET') || 'super-secret-key-carapita-2024';
    const secret = new TextEncoder().encode(jwtSecret);

    let payload: any;
    try {
      const result = await jwtVerify(token, secret);
      payload = result.payload;
    } catch {
      return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Validar que é um token de hóspede (tem id) e não um token de admin
    if (!payload.id || payload.role === 'ADMIN' || payload.role === 'RECEPCAO') {
      return new Response(JSON.stringify({ error: 'Acesso negado. Use a área de admin.' }), { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // ── PUT: atualizar o perfil do hóspede ──
    if (req.method === 'PUT') {
      let body: Record<string, unknown> = {};
      try { body = await req.json(); } catch { body = {}; }
      const update: Record<string, unknown> = {};
      for (const c of CAMPOS_EDITAVEIS) {
        if (body[c] !== undefined) update[c] = body[c];
      }
      update.atualizado_em = new Date().toISOString();
      const { data, error } = await sb.from('Hospede').update(update).eq('id', payload.id).select('*').single();
      if (error || !data) {
        return new Response(JSON.stringify({ error: error?.message || 'Erro ao atualizar perfil' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      delete (data as Record<string, unknown>).senha_hash;
      return new Response(JSON.stringify({ status: 'success', data }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // ── GET: obter o perfil do hóspede ──
    const { data, error } = await sb.from('Hospede').select('*').eq('id', payload.id).single();
    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Hóspede não encontrado' }), { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    delete (data as Record<string, unknown>).senha_hash;
    return new Response(JSON.stringify({ status: 'success', data }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('hospede-me error:', e);
    return new Response(JSON.stringify({ error: 'Erro ao processar perfil' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
