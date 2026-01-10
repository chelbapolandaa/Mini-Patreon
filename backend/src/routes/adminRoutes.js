const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getAllUsers, banUser, getAllTransactions } = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/ban', banUser);
router.get('/transactions', getAllTransactions);

module.exports = router;