const supabase = require('../config/supabase');

exports.listar = async (req, res) => {
    try {
        const { data: extras, error } = await supabase
            .from('Extra')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;
        res.json({ status: 'success', data: extras });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
};

exports.listarAtivos = async (req, res) => {
    try {
        const { data: extras, error } = await supabase
            .from('Extra')
            .select('*')
            .eq('ativo', true)
            .order('nome', { ascending: true });

        if (error) throw error;
        res.json({ status: 'success', data: extras });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
};

exports.criar = async (req, res) => {
    try {
        const { nome, descricao, preco, icone } = req.body;
        if (!nome) return res.status(400).json({ status: 'error', error: 'Nome é obrigatório' });

        const { data, error } = await supabase
            .from('Extra')
            .insert([{
                nome,
                descricao: descricao || null,
                preco: parseFloat(preco) || 0,
                icone: icone || null,
                ativo: true
            }])
            .select()
            .single();

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, icone, ativo } = req.body;

        const { data, error } = await supabase
            .from('Extra')
            .update({
                nome: nome || undefined,
                descricao: descricao !== undefined ? descricao : undefined,
                preco: preco !== undefined ? parseFloat(preco) : undefined,
                icone: icone !== undefined ? icone : undefined,
                ativo: ativo !== undefined ? Boolean(ativo) : undefined,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
};

exports.remover = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('Extra').delete().eq('id', id);
        if (error) throw error;
        res.json({ status: 'success' });
    } catch (e) {
        res.status(500).json({ status: 'error', error: e.message });
    }
};
