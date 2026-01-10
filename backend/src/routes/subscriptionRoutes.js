// subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getCreatorPlans,
  subscribeToCreator,
  getMySubscriptions,
  cancelSubscription,
  getCreators,           // ← INI YANG BENAR (bukan getAllCreators)
  getCreatorProfile,
  initializeSubscription,
  checkPaymentStatus
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/creators', getCreators); // ← GANTI getAllCreators dengan getCreators
router.get('/creators/:id/profile', getCreatorProfile);
router.get('/plans/:creatorId', getCreatorPlans);

// Protected routes
router.use(protect);
router.post('/initialize', initializeSubscription);
router.get('/status/:orderId', checkPaymentStatus);
router.post('/subscribe', subscribeToCreator);
router.get('/my', getMySubscriptions);
router.put('/:id/cancel', cancelSubscription);

module.exports = router;