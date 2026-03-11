const supabase = require('../config/supabase');
const crypto = require('crypto');

class SiteController {
    // ---- Passeios ----
    static async listarPasseios(req, res) {
        try {
            const { data, error } = await supabase.from('Passeio').select('*').order('criado_em', { ascending: true });
            if (error) throw error;
            return res.json({ status: 'success', data });
        } catch (error) { return res.status(500).json({ error: 'Erro ao listar passeios' }); }
    }

    static async criarPasseio(req, res) {
        try {
            const { nome, dist, img, desc, historia, ativo, dias, mostrar_perfil } = req.body;
            const newId = crypto.randomUUID();
            const { data, error } = await supabase.from('Passeio').insert([{
                id: newId, nome, dist, img, desc, historia,
                ativo: ativo !== undefined ? ativo : true,
                dias: dias || 1,
                mostrar_perfil: mostrar_perfil || false
            }]).select().single();
            if (error) throw error;
            return res.json({ status: 'success', data });
        } catch (error) {
            console.error('Erro criar passeio:', error);
            return res.status(500).json({ error: 'Erro ao criar passeio' });
        }
    }

    static async atualizarPasseio(req, res) {
        try {
            const { id } = req.params;
            const { nome, dist, img, desc, historia, ativo, dias, mostrar_perfil } = req.body;
            const payload = { nome, dist, img, desc, historia };
            if (ativo !== undefined) payload.ativo = ativo;
            if (dias !== undefined) payload.dias = dias;
            if (mostrar_perfil !== undefined) payload.mostrar_perfil = mostrar_perfil;
            const { data, error } = await supabase.from('Passeio').update(payload).eq('id', id).select().single();
            if (error) throw error;
            return res.json({ status: 'success', data });
        } catch (error) { return res.status(500).json({ error: 'Erro ao atualizar passeio' }); }
    }

    static async deletarPasseio(req, res) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from('Passeio').delete().eq('id', id);
            if (error) throw error;
            return res.json({ status: 'success' });
        } catch (error) { return res.status(500).json({ error: 'Erro ao remover passeio' }); }
    }

    // ---- Configuracoes (Contactos / Redes Sociais) ----
    static async obterConfiguracoes(req, res) {
        try {
            const { data, error } = await supabase.supabaseAdmin.from('Configuracao').select('*');
            if (error) {
                console.error('Erro Supabase obterConfiguracoes:', error);
                throw error;
            }

            // Format to a simple object { chave: valor }
            const configMap = {};
            (data || []).forEach(c => configMap[c.chave] = c.valor);

            return res.json({ status: 'success', data: configMap });
        } catch (error) { 
            console.error('Erro ao obter configs:', error);
            return res.status(500).json({ error: 'Erro ao obter configurações do site' }); 
        }
    }

    static async salvarConfiguracoes(req, res) {
        try {
            const updates = req.body; // Expects object { chave: valor, chave2: valor2 }
            if (!updates || Object.keys(updates).length === 0) {
                return res.json({ status: 'success', message: 'Nada para atualizar' });
            }

            const upsertData = Object.keys(updates).map(chave => ({
                id: crypto.randomUUID(), // Provide a new ID for inserts
                chave,
                valor: updates[chave] !== undefined && updates[chave] !== null ? String(updates[chave]) : ''
            }));

            // Using upsert on 'chave' column. Assumes 'chave' is unique or used as conflict target.
            const { error } = await supabase.supabaseAdmin
                .from('Configuracao')
                .upsert(upsertData, { 
                    onConflict: 'chave',
                    ignoreDuplicates: false // We want to update, not ignore
                });

            if (error) {
                console.error('Erro Supabase salvarConfiguracoes:', error);
                throw error;
            }

            return res.json({ status: 'success' });
        } catch (error) { 
            console.error('Erro ao salvar configs:', error);
            return res.status(500).json({ error: 'Erro ao salvar as configurações' }); 
        }
    }

    // ---- Mensagens de Contato ----
    static async enviarMensagemContato(req, res) {
        try {
            const { nome, email, assunto, mensagem } = req.body;
            if (!nome || !email || !mensagem) {
                return res.status(400).json({ error: 'Campos obrigatórios faltando' });
            }

            const newId = crypto.randomUUID();
            const { error } = await supabase.from('MensagemContato').insert([{
                id: newId,
                nome,
                email,
                assunto: assunto || 'Sem Assunto',
                mensagem,
                criado_em: new Date().toISOString()
            }]);

            if (error) throw error;

            return res.json({ status: 'success', message: 'Mensagem enviada com sucesso' });
        } catch (error) {
            console.error('Erro enviar mensagem:', error);
            return res.status(500).json({ error: 'Erro ao processar sua mensagem. Tente novamente mais tarde.' });
        }
    }
}

module.exports = SiteController;
