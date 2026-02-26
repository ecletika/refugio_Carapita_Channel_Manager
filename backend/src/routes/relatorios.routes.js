const express = require('express');
const router = express.Router();
const RelatoriosController = require('../controllers/relatorios.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/geral', authMiddleware, RelatoriosController.getGeneralStats);

module.exports = router;
