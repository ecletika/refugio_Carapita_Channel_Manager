const express = require('express');
const router = express.Router();
const ReservasController = require('../controllers/reservas.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// ============================================
// ROTAS DE SITE E PAINEL (Criação e Consulta)
// ============================================

// 1. Listar disponibilidade (Motor de Busca do Site)
router.get('/disponibilidade', ReservasController.listarDisponibilidade);

// 8. Dashboard KPIs e Calendário (Admin) - DEVE vir antes de '/:id'
router.get('/dashboard', authMiddleware, ReservasController.getDashboardStats);

// 1. Listar todas as reservas (Admin)
router.get('/', authMiddleware, ReservasController.listarTodas);

// 1.1 Listar minhas reservas (Hóspede logado)
router.get('/minhas-reservas', authMiddleware, ReservasController.listarMinhasReservas);

// 2. Criar reserva (Site ou Painel Manualmente)
router.post('/', ReservasController.criarReserva);

// 3. Deletar reserva permanentemente do sistema
router.delete('/:id', authMiddleware, ReservasController.deletarReserva);

// 3.1 Confirmar reserva (Aprovar Pessoalmente)
router.post('/:id/confirmar', authMiddleware, ReservasController.confirmarReserva);

// 3.2 Cancelar reserva (Mudar status para CANCELADA)
router.post('/:id/cancelar', authMiddleware, ReservasController.cancelarReserva);

// 3.3 Check-in
router.post('/:id/checkin', authMiddleware, ReservasController.checkIn);

// 3.4 Check-out
router.post('/:id/checkout', authMiddleware, ReservasController.checkOut);

// ============================================
// ROTAS DE INTEGRAÇÃO (Webhooks de Canais)
// ============================================

// 4. Sincronizar com Booking (Receber Webhook)
router.post('/webhooks/booking', ReservasController.webhookBooking);

// 5. Sincronizar com Airbnb (Receber Webhook)
router.post('/webhooks/airbnb', ReservasController.webhookAirbnb);

// 6. Sincronizar iCal Manual (Fallback)
router.post('/sync', authMiddleware, ReservasController.syncIcal);

// 6.1 Sincronizar todos os iCals
router.post('/sync/all', authMiddleware, ReservasController.syncAll);

module.exports = router;
