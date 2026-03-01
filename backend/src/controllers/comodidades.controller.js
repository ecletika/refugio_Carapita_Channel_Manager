const supabase = require('../config/supabase');
const crypto = require('crypto');

class ComodidadesController {
    static async listar(req, res) {
        try {
            const { data: comodidades, error } = await supabase.supabaseAdmin
                .from('Comodidade')
                .select('*')
                .order('categoria', { ascending: true })
                .order('nome', { ascending: true });

            if (error) throw error;
            return res.json({ status: 'success', data: comodidades });
        } catch (error) {
            console.error('Erro ao listar comodidades:', error.message);
            return res.status(500).json({ error: 'Erro ao listar comodidades' });
        }
    }

    static async criar(req, res) {
        try {
            const { nome, categoria, icone } = req.body;
            console.log('--- REQUISIÇÃO CRIAR COMODIDADE ---');
            console.log('Body:', req.body);

            if (!nome || !categoria) {
                return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
            }

            if (!supabase.supabaseAdmin) {
                console.error('CRÍTICO: supabase.supabaseAdmin não está definido!');
                return res.status(500).json({ error: 'Serviço de banco de dados administrativo não disponível (Reinicie o servidor)' });
            }

            console.log('Executando insert via supabaseAdmin...');
            const { data: novaComodidade, error } = await supabase.supabaseAdmin
                .from('Comodidade')
                .insert([{
                    id: crypto.randomUUID(),
                    nome,
                    categoria,
                    icone: icone || null
                }])
                .select()
                .single();

            if (error) {
                console.error('Database Error from Supabase:', JSON.stringify(error, null, 2));
                return res.status(500).json({
                    error: 'Database Error',
                    details: error.message || error,
                    code: error.code
                });
            }

            console.log('Inserção concluída com sucesso!');
            return res.status(201).json({ status: 'success', data: novaComodidade });
        } catch (error) {
            console.error('EXCEÇÃO ao criar comodidade:', error);
            return res.status(500).json({
                error: 'Erro interno ao criar comodidade',
                details: error.message || String(error)
            });
        }
    }

    static async deletar(req, res) {
        try {
            const { id } = req.params;
            const { error } = await supabase.supabaseAdmin.from('Comodidade').delete().eq('id', id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'Comodidade removida' });
        } catch (error) {
            console.error('Erro ao deletar comodidade:', error.message);
            return res.status(500).json({ error: 'Erro ao remover comodidade' });
        }
    }
}

module.exports = ComodidadesController;
