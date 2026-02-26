const express = require('express');
const router = express.Router();
const HospedeAuthController = require('../controllers/hospede_auth.controller');

router.post('/register', HospedeAuthController.register);
router.post('/login', HospedeAuthController.login);

module.exports = router;
