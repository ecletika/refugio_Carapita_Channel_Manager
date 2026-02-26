const express = require('express');
const router = express.Router();
const TarifasController = require('../controllers/tarifas.controller');

router.get('/', TarifasController.listar);
router.get('/calendario', TarifasController.obterCalendarioPrecos);
router.post('/', TarifasController.upsert);
router.delete('/:id', TarifasController.deletar);

module.exports = router;
