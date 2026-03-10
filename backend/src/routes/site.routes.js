const express = require('express');
const router = express.Router();
const SiteController = require('../controllers/site.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Passeios (Público / Admin)
router.get('/passeios', SiteController.listarPasseios);
router.post('/passeios', authMiddleware, SiteController.criarPasseio);
router.put('/passeios/:id', authMiddleware, SiteController.atualizarPasseio);
router.delete('/passeios/:id', authMiddleware, SiteController.deletarPasseio);

// Configurações (Contactos, Redes) (Público / Admin)
router.get('/configuracoes', SiteController.obterConfiguracoes);
router.post('/configuracoes', authMiddleware, SiteController.salvarConfiguracoes);

// Mensagens de Contato
router.post('/contato', SiteController.enviarMensagemContato);

module.exports = router;
