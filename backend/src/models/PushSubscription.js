const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true // Prevent duplicate subscriptions for the same endpoint
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  // Device/browser information for analytics and management
  deviceInfo: {
    userAgent: String,
    browser: String,
    os: String,
    device: String
  },
  // Subscription metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  // Notification preferences for this subscription
  preferences: {
    eventNotifications: {
      type: Boolean,
      default: true
    },
    clubNotifications: {
      type: Boolean,
      default: true
    },
    systemNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
pushSubscriptionSchema.index({ user: 1, isActive: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
pushSubscriptionSchema.index({ lastUsed: 1 }); // For cleanup of old subscriptions
pushSubscriptionSchema.index({ createdAt: 1 }); // For analytics

// Virtual for subscription data formatted for web-push library
pushSubscriptionSchema.virtual('webPushSubscription').get(function() {
  return {
    endpoint: this.endpoint,
    keys: {
      p256dh: this.keys.p256dh,
      auth: this.keys.auth
    }
  };
});

// Method to update last used timestamp
pushSubscriptionSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Method to deactivate subscription (soft delete)
pushSubscriptionSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Method to check if subscription should receive notifications of a certain type
pushSubscriptionSchema.methods.shouldReceiveNotification = function(notificationType) {
  if (!this.isActive) return false;

  switch (notificationType) {
    case 'event-published':
    case 'event-updated':
    case 'event-cancelled':
    case 'event-reminder':
      return this.preferences.eventNotifications;

    case 'join-request-approved':
    case 'join-request-rejected':
    case 'new-member-joined':
      return this.preferences.clubNotifications;

    case 'system':
      return this.preferences.systemNotifications;

    default:
      return true;
  }
};

// Static method to find active subscriptions for a user
pushSubscriptionSchema.statics.findActiveForUser = function(userId) {
  return this.find({
    user: userId,
    isActive: true
  });
};

// Static method to find active subscriptions for multiple users
pushSubscriptionSchema.statics.findActiveForUsers = function(userIds) {
  return this.find({
    user: { $in: userIds },
    isActive: true
  });
};

// Static method to cleanup old inactive subscriptions
pushSubscriptionSchema.statics.cleanupOldSubscriptions = async function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  const result = await this.deleteMany({
    isActive: false,
    lastUsed: { $lt: cutoffDate }
  });
  return result.deletedCount;
};

// Static method to get subscription statistics
pushSubscriptionSchema.statics.getStats = async function() {
  const [total, active, inactive, byBrowser] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isActive: true }),
    this.countDocuments({ isActive: false }),
    this.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$deviceInfo.browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    total,
    active,
    inactive,
    byBrowser
  };
};

// Pre-save middleware to extract device info from user agent
pushSubscriptionSchema.pre('save', function(next) {
  if (this.isNew && this.deviceInfo && this.deviceInfo.userAgent) {
    const userAgent = this.deviceInfo.userAgent;

    // Simple user agent parsing - in production you might want to use a library like ua-parser-js
    if (userAgent.includes('Chrome')) {
      this.deviceInfo.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      this.deviceInfo.browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      this.deviceInfo.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      this.deviceInfo.browser = 'Edge';
    } else {
      this.deviceInfo.browser = 'Other';
    }

    if (userAgent.includes('Mobile')) {
      this.deviceInfo.device = 'Mobile';
    } else if (userAgent.includes('Tablet')) {
      this.deviceInfo.device = 'Tablet';
    } else {
      this.deviceInfo.device = 'Desktop';
    }

    if (userAgent.includes('Windows')) {
      this.deviceInfo.os = 'Windows';
    } else if (userAgent.includes('Mac')) {
      this.deviceInfo.os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      this.deviceInfo.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      this.deviceInfo.os = 'Android';
    } else if (userAgent.includes('iOS')) {
      this.deviceInfo.os = 'iOS';
    } else {
      this.deviceInfo.os = 'Other';
    }
  }

  next();
});

// Handle duplicate endpoint errors gracefully
pushSubscriptionSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    // Handle duplicate endpoint - this means the user already has this subscription
    const customError = new Error('Push subscription already exists for this endpoint');
    customError.name = 'DuplicateSubscriptionError';
    customError.code = 'DUPLICATE_SUBSCRIPTION';
    next(customError);
  } else {
    next(error);
  }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);