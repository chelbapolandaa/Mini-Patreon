const crypto = require('crypto');
const { Transaction, Subscription, SubscriptionPlan, User } = require('../models');
const { sequelize } = require('../config/database');

const verifySignature = (orderId, statusCode, grossAmount, serverKey) => {
  try {
    const signatureKey = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + serverKey)
      .digest('hex');
    
    return signatureKey;
  } catch (error) {
    console.error('Signature verification error:', error);
    return null;
  }
};

const handleMidtransNotification = async (req, res) => {
    console.log('\n' + '='.repeat(50));
  console.log('🔔 MIDTRANS WEBHOOK RECEIVED');
  console.log('='.repeat(50));
  
  let t;
  try {
    console.log('🔍 Checking database models...');
    const models = require('../models');
    console.log('✅ Models loaded successfully');
    console.log('Available models:', Object.keys(models).filter(key => !['sequelize', 'Sequelize'].includes(key)));
    
    console.log('🔍 Transaction model exists?', !!models.Transaction);
    
    t = await sequelize.transaction();
    console.log('✅ Database transaction started');
    
    const notification = req.body;
    
    console.log('📦 Notification body:', JSON.stringify(notification, null, 2));
    console.log('📦 Notification keys:', Object.keys(notification));
    
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      payment_type,
      transaction_time,
      settlement_time,
      status_code,
      signature_key
    } = notification;
    
    // Validation required fields
    if (!order_id || !transaction_status) {
      console.error('❌ Missing required fields in notification');
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }
    
    if (process.env.MIDTRANS_SERVER_KEY && signature_key) {
      const expectedSignature = verifySignature(
        order_id,
        status_code,
        gross_amount,
        process.env.MIDTRANS_SERVER_KEY
      );
      
      if (signature_key !== expectedSignature) {
        console.error('❌ Signature verification failed!');
        console.error('Expected (first 20 chars):', expectedSignature?.substring(0, 20));
        console.error('Received (first 20 chars):', signature_key?.substring(0, 20));
        
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid signature' 
        });
      }
      console.log('✅ Signature verified successfully');
    } else {
      console.warn('⚠️ Skipping signature verification (no server key or signature)');
    }
    
    // === FIND TRANSACTION ===
    const transaction = await Transaction.findOne({
      where: { midtransOrderId: order_id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['id', 'creatorId', 'name', 'price', 'interval']
        }
      ],
      transaction: t
    });
    
    if (!transaction) {
      console.error(`❌ Transaction ${order_id} not found`);
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }
    
    console.log('📊 Transaction found:', {
      id: transaction.id,
      currentStatus: transaction.status,
      newStatus: transaction_status,
      userId: transaction.userId,
      creatorId: transaction.creatorId
    });
    
    // === UPDATE TRANSACTION ===
    transaction.status = transaction_status;
    transaction.paymentMethod = payment_type;
    transaction.paymentDate = settlement_time || transaction_time;
    transaction.rawResponse = JSON.stringify(notification);
    transaction.updatedAt = new Date();
    
    await transaction.save({ transaction: t });
    console.log(`✅ Transaction updated to: ${transaction_status}`);
    
    // === HANDLE SUCCESSFUL PAYMENT ===
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept') {
        try {
          // Cek apakah subscription sudah ada untuk transaksi ini
          const existingSubscription = await Subscription.findOne({
            where: {
              transactionId: transaction.id
            },
            transaction: t
          });
          
          if (existingSubscription) {
            console.log('ℹ️ Subscription already exists for this transaction:', existingSubscription.id);
          } else {
            // Cek apakah user sudah subscribe ke creator yang sama
            const activeSubscription = await Subscription.findOne({
              where: {
                userId: transaction.userId,
                creatorId: transaction.plan.creatorId,
                status: 'active'
              },
              transaction: t
            });
            
            if (activeSubscription) {
              console.log('ℹ️ User already has active subscription to this creator');
            } else {
              // Hitung end date berdasarkan interval
              const startDate = new Date();
              let endDate = new Date(startDate);
              
              if (transaction.plan.interval === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
              } else if (transaction.plan.interval === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
              } else {
                endDate.setDate(endDate.getDate() + 30); // default 30 hari
              }
              
              // Buat subscription
              const subscription = await Subscription.create({
                userId: transaction.userId,
                creatorId: transaction.plan.creatorId,
                planId: transaction.planId,
                transactionId: transaction.id,
                amount: gross_amount,
                status: 'active',
                startDate: startDate,
                endDate: endDate,
                isAutoRenew: true,
                midtransOrderId: order_id
              }, { transaction: t });
              
              console.log(`✅ Subscription created: ${subscription.id}`);
            }
          }
        } catch (subscriptionError) {
          console.error('❌ Error creating subscription:', subscriptionError);
          // Jangan rollback transaction utama, hanya log error
        }
      } else {
        console.warn(`⚠️ Fraud status not accepted: ${fraud_status}`);
      }
    }
    
    // === COMMIT TRANSACTION ===
    await t.commit();
    
    console.log(`🎉 Notification processed successfully for ${order_id}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Notification processed successfully',
      transactionId: transaction.id,
      orderId: order_id,
      status: transaction_status
    });
    
  } catch (error) {
    console.error('\n❌❌❌ CRITICAL ERROR ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Cek error tipe spesifik
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Database Error! Check table/column names');
    }
    if (error.name === 'SequelizeConnectionError') {
      console.error('Database Connection Error!');
    }
    
    // Rollback jika ada error
    if (t && !t.finished) {
      await t.rollback();
      console.log('🔄 Database transaction rolled back');
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Send subscription confirmation email
 */
const sendSubscriptionEmail = async (toEmail, userName, planName) => {
  try {
    console.log(`📧 Email would be sent to: ${toEmail} for plan: ${planName}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = { 
  handleMidtransNotification,
  verifySignature 
};