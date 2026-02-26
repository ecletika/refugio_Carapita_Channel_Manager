const express = require('express');
const router = express.Router();
const BloqueiosController = require('../controllers/bloqueios.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, BloqueiosController.listar);
router.post('/', authMiddleware, BloqueiosController.criar);
router.delete('/:id', authMiddleware, BloqueiosController.deletar);

module.exports = router;
