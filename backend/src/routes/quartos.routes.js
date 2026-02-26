const express = require('express');
const router = express.Router();
const QuartosController = require('../controllers/quartos.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Listar quartos (Público ou Admin)
router.get('/', QuartosController.listar);

// Operações de Admin (Protegidas)
router.post('/', authMiddleware, QuartosController.criar);
router.put('/:id', authMiddleware, QuartosController.atualizar);
router.delete('/:id', authMiddleware, QuartosController.deletar);
// Exportar iCal (Público p/ OTAs)
router.get('/:id/ical', QuartosController.exportIcal);

module.exports = router;
