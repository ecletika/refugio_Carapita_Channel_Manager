import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

const supabase = createClient(
  SUPABASE_URL,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET') || 'super-secret-key-carapita-2024');

// Converte o URL cru de um objeto do bucket privado `aima-documentos` num signed URL
// temporário (1h). Sem isto, o <img> do browser recebe HTTP 400 e a imagem não carrega.
// URLs que não pertençam ao bucket privado são devolvidos tal como estão.
async function signedUrl(fullUrl: string | null | undefined): Promise<string | null> {
  if (!fullUrl) return null;
  const base = `${SUPABASE_URL}/storage/v1/object/aima-documentos/`;
  if (!fullUrl.startsWith(base)) return fullUrl;
  const { data } = await supabase.storage
    .from('aima-documentos')
    .createSignedUrl(fullUrl.slice(base.length), 3600);
  return data?.signedUrl || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) throw new Error('Unauthorized');
    await jwtVerify(auth.slice(7), JWT_SECRET);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const fnIdx = pathParts.findIndex(p => p === 'admin-site');
    const resource = fnIdx >= 0 ? pathParts[fnIdx + 1] : undefined;
    const id = fnIdx >= 0 ? pathParts[fnIdx + 2] : undefined;

    console.log(`[ROUTE] method=${req.method} resource=${resource} id=${id}`);

    // ---- PASSEIOS ----
    if (resource === 'passeios') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('Passeio').select('*').order('criado_em', { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify({ status: 'success', data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (req.method === 'POST') {
        const { nome, dist, img, desc, historia, ativo, dias, mostrar_perfil } = await req.json();
        const { data, error } = await supabase.from('Passeio').insert([{
          id: crypto.randomUUID(), nome, dist, img, desc, historia,
          ativo: ativo !== undefined ? ativo : true,
          dias: dias || 1,
          mostrar_perfil: mostrar_perfil || false
        }]).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ status: 'success', data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (req.method === 'PUT' && id) {
        const body = await req.json();
        const payload: Record<string, unknown> = {};
        if (body.nome !== undefined) payload.nome = body.nome;
        if (body.dist !== undefined) payload.dist = body.dist;
        if (body.img !== undefined) payload.img = body.img;
        if (body.desc !== undefined) payload.desc = body.desc;
        if (body.historia !== undefined) payload.historia = body.historia;
        if (body.ativo !== undefined) payload.ativo = body.ativo;
        if (body.dias !== undefined) payload.dias = body.dias;
        if (body.mostrar_perfil !== undefined) payload.mostrar_perfil = body.mostrar_perfil;
        const { data, error } = await supabase.from('Passeio').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ status: 'success', data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (req.method === 'DELETE' && id) {
        const { error } = await supabase.from('Passeio').delete().eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ status: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ---- CONFIGURACOES ----
    if (resource === 'configuracoes') {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('Configuracao').select('*');
        if (error) throw error;
        const configMap: Record<string, string> = {};
        (data || []).forEach((c: { chave: string; valor: string }) => { configMap[c.chave] = c.valor; });
        return new Response(JSON.stringify({ status: 'success', data: configMap }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (req.method === 'POST') {
        const updates = await req.json();
        if (!updates || Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ status: 'success', message: 'Nada para atualizar' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const upsertData = Object.keys(updates).map((chave) => ({
          id: crypto.randomUUID(),
          chave,
          valor: updates[chave] !== undefined && updates[chave] !== null ? String(updates[chave]) : ''
        }));
        const { error } = await supabase.from('Configuracao').upsert(upsertData, { onConflict: 'chave', ignoreDuplicates: false });
        if (error) throw error;
        return new Response(JSON.stringify({ status: 'success', message: 'Configurações guardadas com sucesso' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ---- MENSAGENS ----
    if (resource === 'mensagens') {
      if (req.method === 'GET') {
        const { data, error } = await supabase
          .from('MensagemContato')
          .select('*')
          .order('criado_em', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ status: 'success', data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (req.method === 'DELETE' && id) {
        const { error } = await supabase.from('MensagemContato').delete().eq('id', id);
        if (error) throw error;
        return new Response(JSON.stringify({ status: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ---- HOSPEDES ----
    if (resource === 'hospedes') {

      // GET /hospedes — list with pagination + search
      if (req.method === 'GET' && !id) {
        const page  = parseInt(url.searchParams.get('page')  || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const q     = (url.searchParams.get('q') || '').trim();
        const offset = (page - 1) * limit;

        let query = supabase
          .from('Hospede')
          .select('id, nome, sobrenome, email, telefone, pais, cidade, criado_em', { count: 'exact' })
          .order('criado_em', { ascending: false })
          .range(offset, offset + limit - 1);

        if (q) {
          query = query.or(
            `nome.ilike.%${q}%,sobrenome.ilike.%${q}%,email.ilike.%${q}%,telefone.ilike.%${q}%`
          );
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({
          status: 'success',
          data,
          total: count ?? 0,
          page,
          limit,
          pages: Math.ceil((count ?? 0) / limit),
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // GET /hospedes/:id — full profile + aima docs + reservation history
      if (req.method === 'GET' && id) {
        // Hospede profile
        const { data: hospede, error: hErr } = await supabase
          .from('Hospede')
          .select('id, nome, sobrenome, email, telefone, pais, cidade, endereco1, endereco2, cep, nif, passaporte, estrangeiro, data_nascimento, local_nascimento, nacionalidade, tipo_documento, numero_documento, pais_emissor_documento, dependentes, foto_perfil, documento_imagem_url, criado_em, atualizado_em')
          .eq('id', id)
          .single();
        if (hErr) throw hErr;

        // Reservation history
        const { data: reservas, error: rErr } = await supabase
          .from('Reserva')
          .select('id, numero_reserva, data_check_in, data_check_out, status, valor_total, criado_em, quarto:Quarto(nome), canal:Canal(nome_canal)')
          .eq('hospede_id', id)
          .order('criado_em', { ascending: false });
        if (rErr) throw rErr;

        // AIMA documents linked via reservas
        const reservaIds = (reservas || []).map((r: { id: string }) => r.id);
        let aimaHospedes: Record<string, unknown>[] = [];
        if (reservaIds.length > 0) {
          const { data: aima, error: aErr } = await supabase
            .from('AimaHospede')
            .select('*')
            .in('reserva_id', reservaIds)
            .order('criado_em', { ascending: false });
          if (aErr) throw aErr;
          aimaHospedes = (aima || []) as Record<string, unknown>[];
        }

        // Assinar os URLs de documentos (bucket privado) — sem isto as imagens dão HTTP 400
        if (hospede) {
          hospede.documento_imagem_url = await signedUrl(hospede.documento_imagem_url as string | null);
        }
        aimaHospedes = await Promise.all(
          aimaHospedes.map(async (a) => ({
            ...a,
            documento_imagem_url: await signedUrl(a.documento_imagem_url as string | null),
          }))
        );

        return new Response(JSON.stringify({
          status: 'success',
          data: { hospede, reservas: reservas || [], aimaHospedes },
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // DELETE /hospedes/:id — GDPR: erase all data
      if (req.method === 'DELETE' && id) {
        // 1. Find all reserva IDs for this hospede
        const { data: reservas, error: rListErr } = await supabase
          .from('Reserva')
          .select('id')
          .eq('hospede_id', id);
        if (rListErr) throw rListErr;

        const reservaIds = (reservas || []).map((r: { id: string }) => r.id);

        // 2. Delete AimaHospede records linked to these reservas
        if (reservaIds.length > 0) {
          const { error: aErr } = await supabase
            .from('AimaHospede')
            .delete()
            .in('reserva_id', reservaIds);
          if (aErr) throw aErr;
        }

        // 3. Delete Reserva records
        if (reservaIds.length > 0) {
          const { error: rErr } = await supabase
            .from('Reserva')
            .delete()
            .eq('hospede_id', id);
          if (rErr) throw rErr;
        }

        // 4. Delete Hospede record
        const { error: hErr } = await supabase
          .from('Hospede')
          .delete()
          .eq('id', id);
        if (hErr) throw hErr;

        console.log(`[GDPR] Deleted hospede ${id} and ${reservaIds.length} reservas`);
        return new Response(JSON.stringify({ status: 'success', message: 'Dados do hóspede eliminados (RGPD)' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ---- AIMA-HOSPEDE — editar dados de identificação de um hóspede do boletim ----
    // PUT /aima-hospede/:id  (id = AimaHospede.id)
    if (resource === 'aima-hospede' && req.method === 'PUT' && id) {
      const body = await req.json();
      const campos = [
        'nome', 'sobrenome', 'email', 'telefone', 'tipo_documento', 'numero_documento',
        'data_nascimento', 'nacionalidade', 'pais', 'pais_emissor_documento',
        'local_nascimento', 'cidade', 'endereco1',
      ];
      const payload: Record<string, unknown> = {};
      for (const c of campos) {
        if (body[c] !== undefined) payload[c] = body[c] === '' ? null : body[c];
      }
      if (Object.keys(payload).length === 0) {
        return new Response(JSON.stringify({ error: 'Nada para atualizar' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { data, error } = await supabase
        .from('AimaHospede')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ status: 'success', data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.warn(`[ROUTE] Rota nao encontrada: resource=${resource} method=${req.method}`);
    return new Response(JSON.stringify({ error: 'Rota nao encontrada' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === 'Unauthorized' ? 401 : 500;
    console.error(`[ERROR] status=${status} msg=${msg}`);
    return new Response(JSON.stringify({ error: msg || 'Erro interno' }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
