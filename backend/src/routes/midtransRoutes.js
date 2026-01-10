const express = require('express');
const router = express.Router();
const { handleMidtransNotification } = require('../controllers/midtransController');

// Midtrans notification endpoint
router.post('/notification', handleMidtransNotification);

module.exports = router;