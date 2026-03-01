const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rotas exclusivas do painel administrativo.
 * Verifica se o usuário tem a permissão (role) de ADMIN ou RECEPCAO.
 */
const adminMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso Negado: Token não fornecido.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Acesso Negado: Token no formato incorreto.' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token malformatado.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-carapita-2024');

        req.usuarioId = decoded.id;
        req.usuarioRole = decoded.role;

        if (decoded.role !== 'ADMIN' && decoded.role !== 'RECEPCAO') {
            return res.status(403).json({ error: 'Acesso Negado: Permissões insuficientes para esta ação.' });
        }

        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = adminMiddleware;
