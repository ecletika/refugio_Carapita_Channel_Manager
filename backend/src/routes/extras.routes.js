const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/extras.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', ctrl.listarAtivos);                        // público
router.get('/admin', authMiddleware, ctrl.listar);         // admin
router.post('/', authMiddleware, ctrl.criar);
router.put('/:id', authMiddleware, ctrl.atualizar);
router.delete('/:id', authMiddleware, ctrl.remover);

module.exports = router;
