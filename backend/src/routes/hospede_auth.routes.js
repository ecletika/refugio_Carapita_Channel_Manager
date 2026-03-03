const express = require('express');
const router = express.Router();
const HospedeAuthController = require('../controllers/hospede_auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', HospedeAuthController.register);
router.post('/login', HospedeAuthController.login);

router.get('/me', authMiddleware, HospedeAuthController.getMe);
router.put('/me', authMiddleware, HospedeAuthController.updateMe);

module.exports = router;
