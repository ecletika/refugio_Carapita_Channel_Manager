const supabase = require('../config/supabase');

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
            const { nome, dist, img, desc, historia } = req.body;
            const { data, error } = await supabase.from('Passeio').insert([{ nome, dist, img, desc, historia }]).select().single();
            if (error) throw error;
            return res.json({ status: 'success', data });
        } catch (error) { return res.status(500).json({ error: 'Erro ao criar passeio' }); }
    }

    static async atualizarPasseio(req, res) {
        try {
            const { id } = req.params;
            const { nome, dist, img, desc, historia } = req.body;
            const { data, error } = await supabase.from('Passeio').update({ nome, dist, img, desc, historia }).eq('id', id).select().single();
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
            const { data, error } = await supabase.from('Configuracao').select('*');
            if (error) throw error;

            // Format to a simple object { chave: valor }
            const configMap = {};
            (data || []).forEach(c => configMap[c.chave] = c.valor);

            return res.json({ status: 'success', data: configMap });
        } catch (error) { return res.status(500).json({ error: 'Erro ao obter configs' }); }
    }

    static async salvarConfiguracoes(req, res) {
        try {
            const updates = req.body; // Expects object { chave: valor, chave2: valor2 }
            const promises = Object.keys(updates).map(async (chave) => {
                const valor = updates[chave];
                const { data: existente } = await supabase.from('Configuracao').select('id').eq('chave', chave).single();
                if (existente) {
                    return supabase.from('Configuracao').update({ valor }).eq('id', existente.id);
                } else {
                    return supabase.from('Configuracao').insert([{ chave, valor }]);
                }
            });
            await Promise.all(promises);
            return res.json({ status: 'success' });
        } catch (error) { return res.status(500).json({ error: 'Erro ao salvar configs' }); }
    }
}

module.exports = SiteController;
