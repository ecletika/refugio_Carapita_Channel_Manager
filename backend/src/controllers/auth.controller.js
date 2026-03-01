const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    static async login(req, res) {
        try {
            const { email, senha } = req.body;
            let usuarioFinal = null;

            // 1. Tenta autenticação nativa do Supabase (GoTrue)
            console.log("Tentando login no Supabase Auth...");
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: senha
            });

            if (!authError && authData?.user) {
                // Sucesso no Supabase Auth. Vamos buscar os dados complementares na tabela Usuario se existirem.
                const { data: dbUser } = await supabase
                    .from('Usuario')
                    .select('*')
                    .eq('email', email)
                    .single();

                usuarioFinal = {
                    id: authData.user.id,
                    nome: dbUser?.nome || authData.user.user_metadata?.name || email.split('@')[0],
                    email: email,
                    role: dbUser?.role || 'ADMIN' // Por omissão, se criado direto no Supabase, darei admin para você não ficar bloqueado
                };
            } else {
                // 2. Se falhar no Supabase Auth, tenta modo antigo via Tabela "Usuario" e bcrypt
                console.log("Falhou no Supabase Auth, tentando via Tabela Usuario...");
                const { data: usuario, error } = await supabase
                    .from('Usuario')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (error || !usuario) {
                    return res.status(401).json({ error: 'Credenciais inválidas' });
                }

                const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
                if (!senhaValida) {
                    return res.status(401).json({ error: 'Credenciais inválidas' });
                }

                usuarioFinal = {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    role: usuario.role
                };
            }

            // Gera o Token JWT do sistema (mantendo a compatibilidade do frontend atual)
            const token = jwt.sign(
                { id: usuarioFinal.id, role: usuarioFinal.role },
                process.env.JWT_SECRET || 'super-secret-key-carapita-2024',
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                status: 'success',
                message: 'Login realizado com sucesso',
                token,
                usuario: usuarioFinal
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno no servidor ao realizar login' });
        }
    }
}

module.exports = AuthController;
