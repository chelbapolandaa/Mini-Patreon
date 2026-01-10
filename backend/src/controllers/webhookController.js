const crypto = require('crypto');
const { Transaction, Subscription, WebhookLog } = require('../models');

// @desc    Handle Midtrans webhook
// @route   POST /api/webhooks/midtrans
// @access  Public
const handleMidtransWebhook = async (req, res) => {
  try {
    const payload = req.body;
    
    // Log the webhook
    await WebhookLog.create({
      eventType: 'midtrans.notification',
      payload,
      status: 'received'
    });
    
    // Verify signature (in production, verify with Midtrans signature key)
    // For now, we'll trust the payload
    
    const { order_id, transaction_status, gross_amount } = payload;
    
    // Find the transaction
    const transaction = await Transaction.findOne({
      where: { midtransOrderId: order_id }
    });
    
    if (!transaction) {
      console.error('Transaction not found for order:', order_id);
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    // Update transaction status
    let newStatus;
    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        newStatus = 'success';
        break;
      case 'pending':
        newStatus = 'pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        newStatus = 'failed';
        break;
      default:
        newStatus = transaction_status;
    }
    
    await transaction.update({
      status: newStatus,
      midtransTransactionId: payload.transaction_id || null,
      paymentDate: newStatus === 'success' ? new Date() : null,
      paymentMethod: payload.payment_type || null
    });
    
    // If payment is successful, create subscription
    if (newStatus === 'success') {
      const startDate = new Date();
      const endDate = new Date();
      
      // Set end date based on interval (for now, 30 days for monthly)
      endDate.setDate(endDate.getDate() + 30);
      
      // Create or update subscription
      const [subscription, created] = await Subscription.findOrCreate({
        where: {
          userId: transaction.userId,
          creatorId: transaction.creatorId,
          planId: transaction.planId
        },
        defaults: {
          status: 'active',
          startDate,
          endDate,
          midtransOrderId: order_id
        }
      });
      
      if (!created) {
        // Update existing subscription
        await subscription.update({
          status: 'active',
          startDate,
          endDate,
          midtransOrderId: order_id
        });
      }
    }
    
    // Update webhook log
    await WebhookLog.update(
      { status: 'processed' },
      { where: { payload: { order_id } } }
    );
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Log error
    if (req.body.order_id) {
      await WebhookLog.create({
        eventType: 'midtrans.notification',
        payload: req.body,
        status: 'error',
        errorMessage: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

module.exports = {
  handleMidtransWebhook
};