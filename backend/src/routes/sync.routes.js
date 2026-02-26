const express = require('express');
const router = express.Router();
const SyncController = require('../controllers/sync.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/:quartoId', authMiddleware, SyncController.syncAirbnb);

module.exports = router;
