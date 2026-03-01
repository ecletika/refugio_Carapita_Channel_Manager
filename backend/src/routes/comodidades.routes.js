const express = require('express');
const router = express.Router();
const ComodidadesController = require('../controllers/comodidades.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', ComodidadesController.listar);
router.post('/', authMiddleware, ComodidadesController.criar);
router.delete('/:id', authMiddleware, ComodidadesController.deletar);

module.exports = router;
