const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Coin packages configuration (PHP prices)
const COIN_PACKAGES = {
  starter: { coins: 50, price: 249, bonus: 0 },
  basic: { coins: 100, price: 499, bonus: 10 },
  popular: { coins: 250, price: 999, bonus: 50 },
  premium: { coins: 500, price: 1999, bonus: 100 },
  enterprise: { coins: 1000, price: 3499, bonus: 200 }
};

// Get available coin packages
router.get('/packages', (req, res) => {
  const packages = Object.entries(COIN_PACKAGES).map(([key, pkg]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    coins: pkg.coins,
    bonusCoins: pkg.bonus,
    totalCoins: pkg.coins + pkg.bonus,
    price: pkg.price,
    pricePerCoin: (pkg.price / (pkg.coins + pkg.bonus)).toFixed(3)
  }));

  res.json({
    success: true,
    data: packages
  });
});

// Get user's coin wallet info
router.get('/wallet', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize coinWallet if it doesn't exist (for existing users)
    if (!user.coinWallet) {
      user.coinWallet = {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        lastTransactionAt: null
      };
      await user.save();
    }

    // Get recent transactions
    const recentTransactions = await CoinTransaction.getUserTransactionHistory(user._id, 10);

    res.json({
      success: true,
      data: {
        balance: user.coinWallet.balance,
        totalEarned: user.coinWallet.totalEarned,
        totalSpent: user.coinWallet.totalSpent,
        lastTransactionAt: user.coinWallet.lastTransactionAt,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving wallet information'
    });
  }
});

// Get detailed transaction history
router.get('/transactions', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const transactions = await CoinTransaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('metadata.clubId', 'name')
      .populate('metadata.eventId', 'title')
      .populate('metadata.referralUserId', 'firstName lastName');

    const totalTransactions = await CoinTransaction.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalTransactions / limit),
          totalTransactions
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving transaction history'
    });
  }
});

// Purchase coins (mock implementation - integrate with real payment processor)
router.post('/purchase', [
  protect,
  body('packageId').isIn(Object.keys(COIN_PACKAGES)).withMessage('Invalid package ID'),
  body('paymentMethod').isIn(['gcash', 'bank_transfer', 'cash']).withMessage('Invalid payment method'),
  body('paymentDetails').isObject().withMessage('Payment details are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { packageId, paymentMethod, paymentDetails } = req.body;
    const CoinPurchaseRequest = require('../models/CoinPurchaseRequest');
    
    const packageInfo = COIN_PACKAGES[packageId];
    if (!packageInfo) {
      return res.status(400).json({ success: false, message: 'Invalid package ID' });
    }

    // Create purchase request (personal purchase - no club)
    const purchaseRequest = await CoinPurchaseRequest.create({
      requester: req.user.id,
      club: null, // Personal purchase
      packageId,
      packageDetails: {
        name: packageId.charAt(0).toUpperCase() + packageId.slice(1),
        coins: packageInfo.coins,
        bonusCoins: packageInfo.bonus,
        totalCoins: packageInfo.coins + packageInfo.bonus,
        price: packageInfo.price
      },
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        amount: packageInfo.price
      }
    });

    res.json({
      success: true,
      message: 'Coin purchase request submitted successfully. Please wait for admin approval.',
      data: {
        requestId: purchaseRequest._id,
        packageId,
        totalCoins: packageInfo.coins + packageInfo.bonus,
        price: packageInfo.price,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Purchase coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing coin purchase'
    });
  }
});

// Admin: Grant coins to user
router.post('/grant', [
  protect,
  body('userId').isMongoId().withMessage('Valid user ID required'),
  body('amount').isInt({ min: 1, max: 10000 }).withMessage('Amount must be between 1 and 10000'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    // Check if current user is admin (implement admin check based on your system)
    if (!req.user.isAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, amount, reason } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    await targetUser.addCoins(
      amount,
      'admin_grant',
      `Admin grant: ${reason}`,
      { grantedBy: req.user.id, reason }
    );

    res.json({
      success: true,
      message: 'Coins granted successfully',
      data: {
        userId,
        amount,
        newBalance: targetUser.coinWallet.balance,
        reason
      }
    });

  } catch (error) {
    console.error('Grant coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error granting coins'
    });
  }
});

// Admin: Get platform coin analytics
router.get('/admin/analytics', protect, async (req, res) => {
  try {
    // Check if current user is admin (implement admin check based on your system)
    if (!req.user.isAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Platform revenue
    const revenueData = await CoinTransaction.getPlatformRevenue(startDate, endDate);
    
    // Top spending clubs
    const topSpendingClubs = await CoinTransaction.aggregate([
      {
        $match: {
          'metadata.clubId': { $exists: true },
          amount: { $lt: 0 },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$metadata.clubId',
          totalSpent: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'clubs',
          localField: '_id',
          foreignField: '_id',
          as: 'club'
        }
      }
    ]);

    // Feature usage statistics
    const featureUsage = await CoinTransaction.aggregate([
      {
        $match: {
          amount: { $lt: 0 },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalSpent: { $sum: { $abs: '$amount' } },
          usageCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        revenue: revenueData[0] || { totalCoinsRevenue: 0, totalTransactions: 0, avgTransactionSize: 0 },
        topSpendingClubs,
        featureUsage
      }
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin analytics'
    });
  }
});

// Get coin spending analytics for user
router.get('/analytics', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Spending by category
    const spendingByCategory = await CoinTransaction.aggregate([
      {
        $match: {
          user: userId,
          amount: { $lt: 0 },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalSpent: { $sum: { $abs: '$amount' } },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    // Earning by category
    const earningByCategory = await CoinTransaction.aggregate([
      {
        $match: {
          user: userId,
          amount: { $gt: 0 },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalEarned: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalEarned: -1 } }
    ]);

    // Daily activity
    const dailyActivity = await CoinTransaction.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          earned: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
            }
          },
          spent: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        spendingByCategory,
        earningByCategory,
        dailyActivity
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics'
    });
  }
});

module.exports = router;