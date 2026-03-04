const express = require('express');
const router = express.Router();
const PagamentosController = require('../controllers/pagamentos.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// ── Webhook do Stripe (usa raw body — registar ANTES do express.json) ──────────
// NOTA: A rota de webhook precisa de raw body — configurada no index.js
router.post('/webhook', express.raw({ type: 'application/json' }), PagamentosController.webhookStripe);

// ── Rotas do Cliente (autenticação de hóspede) ────────────────────────────────
router.get('/reserva/:reservaId', authMiddleware, PagamentosController.getDetalhesPagamento);
router.post('/checkout', authMiddleware, PagamentosController.criarCheckout);
router.get('/fatura/:reservaId', authMiddleware, PagamentosController.getFatura);

// ── Rotas de Admin ────────────────────────────────────────────────────────────
router.post('/confirmar-manual/:reservaId', authMiddleware, PagamentosController.confirmarPagamentoManual);

module.exports = router;
