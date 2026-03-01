const supabase = require('../config/supabase');
const crypto = require('crypto');

class BloqueiosController {
    static async listar(req, res) {
        try {
            const { data: bloqueios, error } = await supabase
                .from('Bloqueio')
                .select('*, quarto:quarto_id(*)')
                .order('data_inicio', { ascending: false });

            if (error) throw error;
            return res.json({ status: 'success', data: bloqueios });
        } catch (error) {
            console.error('Erro listar bloqueios:', error.message);
            return res.status(500).json({ error: 'Erro ao listar bloqueios' });
        }
    }

    static async criar(req, res) {
        try {
            const { quarto_id, data_inicio, data_fim, motivo } = req.body;

            if (!quarto_id || !data_inicio || !data_fim) {
                return res.status(400).json({ error: 'Dados incompletos' });
            }

            const { data: bloqueio, error } = await supabase
                .from('Bloqueio')
                .insert([{
                    id: crypto.randomUUID(),
                    quarto_id,
                    data_inicio: new Date(`${data_inicio}T00:00:00.000Z`).toISOString(),
                    data_fim: new Date(`${data_fim}T00:00:00.000Z`).toISOString(),
                    motivo
                }])
                .select()
                .single();

            if (error) {
                console.error('Supabase Insert Error [Bloqueio]:', error);
                throw error;
            }
            return res.status(201).json({ status: 'success', data: bloqueio });
        } catch (error) {
            console.error('Erro criar bloqueio:', error.message || error);
            return res.status(500).json({ error: 'Erro ao criar bloqueio' });
        }
    }

    static async deletar(req, res) {
        try {
            const { id } = req.params;
            const { error } = await supabase.from('Bloqueio').delete().eq('id', id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'Bloqueio removido' });
        } catch (error) {
            console.error('Erro deletar bloqueio:', error.message);
            return res.status(500).json({ error: 'Erro ao deletar bloqueio' });
        }
    }
}

module.exports = BloqueiosController;
