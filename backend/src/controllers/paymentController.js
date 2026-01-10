const snap = require('../config/midtrans');

// @desc    Create payment
// @route   POST /api/payments/create
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    
    if (!snap) {
      return res.status(500).json({
        success: false,
        message: 'Payment service is not configured'
      });
    }
    
    const parameter = {
      transaction_details: {
        order_id: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        gross_amount: amount
      },
      customer_details: {
        first_name: req.user.name,
        email: req.user.email,
      },
      credit_card: {
        secure: true
      }
    };
    
    const transaction = await snap.createTransaction(parameter);
    
    res.json({
      success: true,
      message: 'Payment created',
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Handle Midtrans webhook
// @route   POST /api/webhooks/midtrans
// @access  Public
const handleWebhook = async (req, res) => {
  try {
    const { order_id, transaction_status, gross_amount } = req.body;
    
    console.log('📦 Webhook received:', {
      order_id,
      transaction_status,
      gross_amount
    });
    
    // Here you would update your database
    // For now, just log it
    const Transaction = require('../models/Transaction');
    const WebhookLog = require('../models/WebhookLog');
    
    // Log webhook
    await WebhookLog.create({
      eventType: 'payment.notification',
      payload: req.body,
      status: 'received'
    });
    
    // Update transaction status in your database
    // This is a simplified example
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPayment,
  handleWebhook
};