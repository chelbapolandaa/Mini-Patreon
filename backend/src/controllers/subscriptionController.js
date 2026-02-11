const { Subscription, SubscriptionPlan, User, Transaction } = require('../models');
const snap = require('../config/midtrans');
const { Op } = require('sequelize');
const db = require('../models');


const getAllCreators = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {
      role: 'creator',
      is_banned: false
    };
    
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    
    const { count, rows: creators } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', ['avatar_url', 'avatarUrl'], 'bio', ['created_at', 'createdAt']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Get stats for each creator
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const stats = {
          subscribers: await Subscription.count({
            where: { creatorId: creator.id, status: 'active' }
          }),
          posts: await require('../models/Post').count({
            where: { creatorId: creator.id, isPublished: true }
          }),
          hasActivePlan: await SubscriptionPlan.count({
            where: { creatorId: creator.id, isActive: true }
          }) > 0
        };
        
        return {
          ...creator.toJSON(),
          stats
        };
      })
    );
    
    res.json({
      success: true,
      creators: creatorsWithStats,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting creators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creators'
    });
  }
};

const getCreatorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const creator = await User.findOne({
      where: { 
        id, 
        role: 'creator',
        is_banned: false 
      },
      attributes: ['id', 'name', 'email', ['avatar_url', 'avatarUrl'], 'bio', ['created_at', 'createdAt']]
    });
    
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }
    
    // Get creator's active plans
    const plans = await SubscriptionPlan.findAll({
      where: { 
        creatorId: id, 
        isActive: true 
      },
      order: [['price', 'ASC']]
    });
    
    // Get creator stats
    const stats = {
      subscribers: await Subscription.count({
        where: { creatorId: id, status: 'active' }
      }),
      totalPosts: await require('../models/Post').count({
        where: { creatorId: id, isPublished: true }
      }),
      publicPosts: await require('../models/Post').count({
        where: { 
          creatorId: id, 
          isPublished: true,
          visibility: 'public'
        }
      })
    };
    
    // Check if user is subscribed (if authenticated)
    let isSubscribed = false;
    if (req.user) {
      const subscription = await Subscription.findOne({
        where: {
          userId: req.user.id,
          creatorId: id,
          status: 'active'
        }
      });
      isSubscribed = !!subscription;
    }
    
    res.json({
      success: true,
      creator: {
        ...creator.toJSON(),
        stats
      },
      plans,
      isSubscribed
    });
  } catch (error) {
    console.error('Error getting creator profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get creator profile'
    });
  }
};

const initializeSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    // Get the plan
    const plan = await SubscriptionPlan.findByPk(planId, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        creatorId: plan.creator.id,
        status: 'active'
      }
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You are already subscribed to this creator'
      });
    }
    
    // Create transaction record
    const orderId = `SUBS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create pending transaction record FIRST
    const transaction = await Transaction.create({
      userId,
      creatorId: plan.creator.id,
      planId: plan.id,
      amount: plan.price,
      status: 'pending',
      midtransOrderId: orderId
    });
    
    console.log('Midtrans config check:');
    console.log('- Server Key:', process.env.MIDTRANS_SERVER_KEY ? 'Set' : 'Not set');
    console.log('- Client Key:', process.env.MIDTRANS_CLIENT_KEY ? 'Set' : 'Not set');
    
    // Check if Midtrans is configured
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      console.log('⚠️ Midtrans not configured, using mock payment');
      
      // Mock payment for development
      return res.json({
        success: true,
        message: 'Mock payment initialized (Midtrans not configured)',
        data: {
          transactionId: transaction.id,
          orderId,
          amount: plan.price,
          planName: plan.name,
          creatorName: plan.creator.name,
          redirectUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/mock?order_id=${orderId}&amount=${plan.price}&plan=${encodeURIComponent(plan.name)}&creator=${encodeURIComponent(plan.creator.name)}`
        }
      });
    }
    
    // Real Midtrans integration
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: parseFloat(plan.price)
      },
      customer_details: {
        first_name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
      },
      item_details: [
        {
          id: plan.id,
          price: parseFloat(plan.price),
          quantity: 1,
          name: `${plan.creator.name} - ${plan.name}`,
          category: 'Subscription',
          merchant_name: 'CreatorHub'
        }
      ],
      callbacks: {
        finish: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription/status`,
        error: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription/status`,
        pending: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription/status`
      },
      expiry: {
        unit: 'hours',
        duration: 24
      }
    };
    
    console.log('Creating Midtrans transaction with params:', JSON.stringify(parameter, null, 2));
    
    // Get Midtrans payment token
    let paymentData;
    try {
      paymentData = await snap.createTransaction(parameter);
      console.log('✅ Midtrans response received');
      console.log('- Token:', paymentData.token ? 'Yes' : 'No');
      console.log('- Redirect URL:', paymentData.redirect_url);
    } catch (midtransError) {
      console.error('❌ Midtrans error:', midtransError.message);
      console.error('Full error:', midtransError);
      
      // Update transaction as failed
      await transaction.update({ status: 'failed', errorMessage: midtransError.message });
      
      // Check error type
      if (midtransError.message && midtransError.message.includes('invalid server key')) {
        return res.status(500).json({
          success: false,
          message: 'Invalid Midtrans server key. Please check your configuration.',
          error: 'INVALID_CREDENTIALS'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Payment service error: ' + (midtransError.message || 'Unknown error'),
        error: midtransError.ApiResponse || midtransError.message
      });
    }
    
    res.json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        transactionId: transaction.id,
        orderId,
        amount: plan.price,
        planName: plan.name,
        creatorName: plan.creator.name,
        paymentToken: paymentData.token,
        redirectUrl: paymentData.redirect_url
      }
    });
  } catch (error) {
    console.error('Error initializing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize subscription: ' + error.message,
      error: error.stack
    });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔍 Checking payment status for order:', orderId);
    
    const transaction = await Transaction.findOne({
      where: { midtransOrderId: orderId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['id', 'name', 'price', 'interval', 'creatorId']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!transaction) {
      console.error('❌ Transaction not found:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    console.log('📊 Transaction found:', {
      id: transaction.id,
      status: transaction.status,
      userId: transaction.userId,
      creatorId: transaction.creatorId
    });
    
    // Check with Midtrans API
    let midtransData = null;
    if (process.env.MIDTRANS_SERVER_KEY && snap && snap.transaction) {
      try {
        midtransData = await snap.transaction.status(orderId);
        console.log('✅ Midtrans API response:', {
          status: midtransData.transaction_status,
          fraud: midtransData.fraud_status,
          payment: midtransData.payment_type
        });
        
        // Update transaction based on Midtrans
        if (midtransData.transaction_status && midtransData.transaction_status !== transaction.status) {
          console.log(`🔄 Updating transaction status: ${transaction.status} → ${midtransData.transaction_status}`);
          
          transaction.status = midtransData.transaction_status;
          transaction.paymentMethod = midtransData.payment_type;
          transaction.paymentDate = midtransData.settlement_time || midtransData.transaction_time;
          transaction.rawResponse = JSON.stringify(midtransData);
          
          await transaction.save();
          
          // CREATE SUBSCRIPTION if payment successful
          if (midtransData.transaction_status === 'capture' || midtransData.transaction_status === 'settlement') {
            if (midtransData.fraud_status === 'accept') {
              await createSubscriptionFromTransaction(transaction);
            } else {
              console.warn('⚠️ Fraud status not accepted:', midtransData.fraud_status);
            }
          }
        }
      } catch (midtransError) {
        console.warn('⚠️ Midtrans status check failed:', midtransError.message);
      }
    }
    
    // Check if subscription exists
    const subscription = await Subscription.findOne({
      where: {
        transactionId: transaction.id
      }
    });
    
    if (!subscription && (transaction.status === 'capture' || transaction.status === 'settlement')) {
      console.log('⚡ Creating subscription for transaction:', transaction.id);
      await createSubscriptionFromTransaction(transaction);
    }
    
    // Get updated subscription info
    const currentSubscription = await Subscription.findOne({
      where: { transactionId: transaction.id },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'avatarUrl']
      }]
    });
    
    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        orderId: transaction.midtransOrderId,
        amount: transaction.amount,
        status: transaction.status,
        creatorId: transaction.plan?.creatorId,
        creatorName: transaction.creator?.name,
        planName: transaction.plan?.name,
        planInterval: transaction.plan?.interval,
        userId: transaction.userId,
        subscriptionCreated: !!currentSubscription,
        subscriptionId: currentSubscription?.id,
        createdAt: transaction.createdAt,
        paymentDate: transaction.paymentDate
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to create subscription
const createSubscriptionFromTransaction = async (transaction) => {
  try {
    console.log('🎯 Creating subscription for transaction:', transaction.id);
    
    // Check if subscription already exists for this user+creator
    const existingSubscription = await Subscription.findOne({
      where: {
        userId: transaction.userId,
        creatorId: transaction.plan.creatorId,
        status: 'active'
      }
    });
    
    if (existingSubscription) {
      console.log('ℹ️ Subscription already exists for user:', transaction.userId);
      return existingSubscription;
    }
    
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    if (transaction.plan.interval === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (transaction.plan.interval === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setDate(endDate.getDate() + 30); // default 30 days
    }
    
    // Create subscription
    const subscription = await Subscription.create({
      userId: transaction.userId,
      creatorId: transaction.plan.creatorId,
      planId: transaction.planId,
      transactionId: transaction.id,
      amount: transaction.amount,
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      isAutoRenew: true
    });
    
    console.log('✅ Subscription created successfully:', subscription.id);
    
    // Update user stats
    await updateCreatorSubscriberCount(transaction.plan.creatorId);
    
    return subscription;
  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    throw error;
  }
};

// Update creator's subscriber count
const updateCreatorSubscriberCount = async (creatorId) => {
  try {
    const count = await Subscription.count({
      where: {
        creatorId,
        status: 'active'
      }
    });
    
    // You can update creator's stats here if needed
    console.log(`📊 Creator ${creatorId} now has ${count} subscribers`);
  } catch (error) {
    console.error('Error updating subscriber count:', error);
  }
};

const getCreatorPlans = async (req, res) => {
  try {
    const { creatorId } = req.params;
    
    const plans = await SubscriptionPlan.findAll({
      where: { 
        creatorId, 
        isActive: true 
      },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name', ['avatar_url', 'avatarUrl']]
      }]
    });
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error getting creator plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plans'
    });
  }
};




const getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 Getting subscriptions for user:', userId);
    
    const subscriptions = await db.Subscription.findAll({
      where: { 
        userId: userId,
        status: 'active'
      },
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: [
            'id', 
            'name', 
            ['avatar_url', 'avatarUrl'], 
            'bio'
          ]
        },
        {
          model: db.SubscriptionPlan,
          as: 'plan',
          attributes: ['id', 'name', 'price', 'interval']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log(`📊 Found ${subscriptions.length} subscriptions`);
    
    // Transform data untuk response
    const transformedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      amount: sub.amount,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      creator: {
        id: sub.creator?.id,
        name: sub.creator?.name,
        avatarUrl: sub.creator?.avatarUrl,
        bio: sub.creator?.bio
      },
      plan: {
        id: sub.plan?.id,
        name: sub.plan?.name,
        price: sub.plan?.price,
        interval: sub.plan?.interval
      }
    }));
    
    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions: transformedSubscriptions
    });
  } catch (error) {
    console.error('❌ Error in getMySubscriptions:', error);
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Cari subscription
    const subscription = await Subscription.findOne({
      where: {
        id: id,
        userId: userId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel subscription with status: ${subscription.status}`
      });
    }

    // Update status menjadi cancelled
    subscription.status = 'cancelled';
    subscription.isAutoRenew = false;
    subscription.updatedAt = new Date();
    await subscription.save();

    // Log activity
    console.log(`📝 Subscription ${id} cancelled by user ${userId}`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          endDate: subscription.endDate,
          creator: subscription.creator
        }
      }
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
};

const subscribeToCreator = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    const plan = await SubscriptionPlan.findByPk(planId, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }
    
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        creatorId: plan.creator.id,
        status: 'active'
      }
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You are already subscribed to this creator'
      });
    }
    
    // Redirect to new endpoint
    res.json({
      success: true,
      message: 'Please use POST /api/subscriptions/initialize endpoint',
      redirect: '/api/subscriptions/initialize'
    });
  } catch (error) {
    console.error('Error in legacy subscribe endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process subscription'
    });
  }
};

module.exports = {
  getCreatorPlans,
  subscribeToCreator,
  getMySubscriptions,
  cancelSubscription,
  getCreators: getAllCreators,
  getCreatorProfile,
  initializeSubscription,
  checkPaymentStatus
};