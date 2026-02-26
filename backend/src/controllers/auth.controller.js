const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    static async login(req, res) {
        try {
            const { email, senha } = req.body;

            // Busca o usuário pelo e-mail no Supabase
            const { data: usuario, error } = await supabase
                .from('Usuario')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !usuario) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            // Compara a senha informada com o hash salvo no BD
            const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            // Gera o Token JWT contendo o ID e a Permissão
            const token = jwt.sign(
                { id: usuario.id, role: usuario.role },
                process.env.JWT_SECRET || 'super-secret-key-carapita-2024',
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                status: 'success',
                message: 'Login realizado com sucesso',
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    role: usuario.role
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno no servidor ao realizar login' });
        }
    }
}

module.exports = AuthController;
