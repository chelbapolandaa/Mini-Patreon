const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'isVerified', 'isBanned', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Admin only)
const banUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Cannot ban yourself or other admins
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban yourself'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban another admin'
      });
    }
    
    user.isBanned = !user.isBanned;
    await user.save();
    
    res.json({
      success: true,
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin only)
const getAllTransactions = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const transactions = await Transaction.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  banUser,
  getAllTransactions
};