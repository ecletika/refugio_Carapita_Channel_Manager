const express = require('express');
const router = express.Router();
const controller = require('../controllers/cupons.controller');

router.get('/', controller.listarCupons);
router.post('/', controller.criarCupom);
router.delete('/:id', controller.excluirCupom);
router.get('/validar/:codigo', controller.validarCupom);

module.exports = router;
