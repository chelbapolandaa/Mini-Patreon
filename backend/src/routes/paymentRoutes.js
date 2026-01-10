const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createPayment, handleWebhook } = require('../controllers/paymentController');

router.post('/create', protect, createPayment);
router.post('/webhooks/midtrans', handleWebhook);

module.exports = router;