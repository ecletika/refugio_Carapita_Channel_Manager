const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class HospedeAuthController {
    // 1. Cadastro de Hóspede
    static async register(req, res) {
        try {
            const { nome, email, senha, telefone } = req.body;

            if (!nome || !email || !senha) {
                return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
            }

            const { data: hospedeExistente } = await supabase
                .from('Hospede')
                .select('id')
                .eq('email', email)
                .single();

            if (hospedeExistente) {
                return res.status(400).json({ error: 'E-mail já cadastrado' });
            }

            const senha_hash = await bcrypt.hash(senha, 10);

            const { data: novoHospede, error } = await supabase
                .from('Hospede')
                .insert([{
                    id: crypto.randomUUID(),
                    nome,
                    email,
                    senha_hash,
                    telefone,
                    criado_em: new Date(),
                    atualizado_em: new Date()
                }])
                .select()
                .single();

            if (error) {
                console.error('Hospede Insert Error:', error);
                throw error;
            }

            return res.status(201).json({
                status: 'success',
                message: 'Cadastro realizado com sucesso',
                hospedeId: novoHospede.id
            });
        } catch (error) {
            console.error('Erro register hospede:', error.message || error);
            return res.status(500).json({ error: 'Erro ao cadastrar hóspede' });
        }
    }

    // 2. Login de Hóspede
    static async login(req, res) {
        try {
            const { email, senha } = req.body;

            const { data: hospede, error } = await supabase
                .from('Hospede')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !hospede || !hospede.senha_hash) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const senhaValida = await bcrypt.compare(senha, hospede.senha_hash);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const token = jwt.sign(
                { id: hospede.id, role: 'GUEST' },
                process.env.JWT_SECRET || 'super-secret-key-carapita-2024',
                { expiresIn: '7d' }
            );

            delete hospede.senha_hash;

            return res.status(200).json({
                status: 'success',
                token,
                hospede: hospede
            });
        } catch (error) {
            console.error('Erro login hospede:', error.message);
            return res.status(500).json({ error: 'Erro ao realizar login' });
        }
    }

    // 3. Obter Perfil
    static async getMe(req, res) {
        try {
            const { data, error } = await supabase
                .from('Hospede')
                .select('*')
                .eq('id', req.usuarioId)
                .single();
            if (error || !data) throw error;
            delete data.senha_hash; // Nunca retornar a senha
            return res.json({ status: 'success', data });
        } catch (e) {
            return res.status(500).json({ error: 'Erro ao buscar perfil' });
        }
    }

    // 4. Edit Perfil
    static async updateMe(req, res) {
        try {
            const { nome, sobrenome, email, telefone, pais, cidade, endereco1, cep, dependentes, nacionalidade, tipo_documento, numero_documento, pais_emissor_documento, data_nascimento, local_nascimento, foto_perfil } = req.body;
            const payload = {
                nome, sobrenome, email, telefone, pais, cidade, endereco1, cep,
                dependentes, nacionalidade, tipo_documento, numero_documento,
                pais_emissor_documento, data_nascimento, local_nascimento, foto_perfil,
                atualizado_em: new Date()
            };

            const { data, error } = await supabase
                .from('Hospede')
                .update(payload)
                .eq('id', req.usuarioId)
                .select()
                .single();
            if (error) throw error;
            delete data.senha_hash;
            return res.json({ status: 'success', data });
        } catch (e) {
            console.error('Erro atualizar perfil', e);
            return res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
    }
}

module.exports = HospedeAuthController;
