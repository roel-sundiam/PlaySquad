const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'purchase',           // User purchased coins
      'admin_approved_purchase', // Admin approved purchase request
      'referral_bonus',     // Earned through referrals
      'participation_reward', // Earned through participation
      'admin_grant',        // Admin granted coins
      'club_transfer',      // User transferred coins to club
      'transfer_received',  // Club received coins from user
      'club_feature',       // Spent on club features
      'event_premium',      // Spent on premium event features
      'promotion',          // Spent on club promotion
      'coaching',           // Spent on coaching services
      'equipment',          // Spent on equipment marketplace
      'refund'             // Refunded coins
    ]
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  metadata: {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club'
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    paymentId: String,
    promotionCode: String,
    referralUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    featureType: String,
    originalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoinTransaction'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
coinTransactionSchema.index({ user: 1, createdAt: -1 });
coinTransactionSchema.index({ type: 1, createdAt: -1 });
coinTransactionSchema.index({ 'metadata.clubId': 1, createdAt: -1 });

// Virtual for transaction direction
coinTransactionSchema.virtual('isEarning').get(function() {
  return this.amount > 0;
});

coinTransactionSchema.virtual('isSpending').get(function() {
  return this.amount < 0;
});

// Static methods for analytics
coinTransactionSchema.statics.getUserTransactionHistory = function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('metadata.clubId', 'name')
    .populate('metadata.eventId', 'title')
    .populate('metadata.referralUserId', 'firstName lastName');
};

coinTransactionSchema.statics.getClubSpending = function(clubId, startDate, endDate) {
  const query = {
    'metadata.clubId': clubId,
    amount: { $lt: 0 },
    createdAt: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  };
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        totalSpent: { $sum: { $abs: '$amount' } },
        transactionCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);
};

coinTransactionSchema.statics.getPlatformRevenue = function(startDate, endDate) {
  const query = {
    type: 'purchase',
    status: 'completed',
    createdAt: {
      $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: endDate || new Date()
    }
  };
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalCoinsRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgTransactionSize: { $avg: '$amount' }
      }
    }
  ]);
};

// Pre-save validation
coinTransactionSchema.pre('save', function(next) {
  // Ensure metadata consistency
  if (this.type === 'club_feature' || this.type === 'event_premium' || this.type === 'promotion') {
    if (!this.metadata.clubId && !this.metadata.eventId) {
      return next(new Error('Club or event ID required for club-related transactions'));
    }
  }
  
  if (this.type === 'referral_bonus' && !this.metadata.referralUserId) {
    return next(new Error('Referral user ID required for referral bonus transactions'));
  }
  
  next();
});

coinTransactionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);