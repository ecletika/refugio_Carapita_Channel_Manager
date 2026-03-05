const supabase = require('../config/supabase');

exports.listarCupons = async (req, res) => {
    try {
        const { data, error } = await supabase.supabaseAdmin.from('Cupom').select('*').order('criado_em', { ascending: false });
        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (error) {
        console.error("Erro ao listar cupons:", error);
        res.status(500).json({ status: 'error', error: error.message });
    }
};

exports.criarCupom = async (req, res) => {
    try {
        const { codigo, tipo_desconto, valor_desconto, limite_usos, data_validade } = req.body;
        const novoCupom = {
            codigo: codigo.toUpperCase(),
            tipo_desconto: tipo_desconto || 'PERCENTUAL',
            valor_desconto,
            limite_usos: limite_usos ? parseInt(limite_usos) : null,
            data_validade: data_validade || null,
            ativo: true
        };

        const { data, error } = await supabase.supabaseAdmin.from('Cupom').insert([novoCupom]).select('*').single();
        if (error) {
            if (error.code === '23505') return res.status(400).json({ status: 'error', error: 'Código de cupom já existe.' });
            throw error;
        }

        res.status(201).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

exports.excluirCupom = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.supabaseAdmin.from('Cupom').delete().eq('id', id);
        if (error) throw error;
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};

exports.validarCupom = async (req, res) => {
    try {
        const { codigo } = req.params;
        const { data: cupom, error } = await supabase.supabaseAdmin.from('Cupom').select('*').eq('codigo', codigo.toUpperCase()).single();

        if (error || !cupom) {
            return res.status(404).json({ status: 'error', error: 'Cupom inválido ou não encontrado.' });
        }

        if (!cupom.ativo) {
            return res.status(400).json({ status: 'error', error: 'Este cupom encontra-se inativo.' });
        }

        if (cupom.limite_usos && cupom.usos_atuais >= cupom.limite_usos) {
            return res.status(400).json({ status: 'error', error: 'Este cupom já atingiu o limite de utilizações.' });
        }

        if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
            return res.status(400).json({ status: 'error', error: 'Este cupom já expirou.' });
        }

        res.json({ status: 'success', data: cupom });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
};
