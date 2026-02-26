const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rotas. Verifica se o usuário enviou um token JWT válido.
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso Negado: Token não fornecido.' });
    }

    // Esperado formato "Bearer <token>"
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
        req.usuarioId = decoded.id;      // Injeta ID no request para próximos métodos
        req.usuarioRole = decoded.role;  // Injeta a Permissão (ADMIN, RECEPCAO)

        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

module.exports = authMiddleware;
