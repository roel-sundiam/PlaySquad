const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
    trim: true,
    maxlength: [100, 'Club name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  sport: {
    type: String,
    required: [true, 'Sport type is required'],
    enum: ['tennis', 'badminton', 'squash', 'table-tennis', 'pickleball'],
    lowercase: true
  },
  location: {
    name: {
      type: String,
      required: [true, 'Location name is required']
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'organizer', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  joinRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      maxlength: 200
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  settings: {
    maxMembers: {
      type: Number,
      default: 100
    },
    allowGuestPlayers: {
      type: Boolean,
      default: false
    },
    autoAcceptMembers: {
      type: Boolean,
      default: false
    },
    minSkillLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 1
    },
    maxSkillLevel: {
      type: Number,
      min: 1,
      max: 10,
      default: 10
    }
  },
  avatar: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  stats: {
    totalEvents: {
      type: Number,
      default: 0
    },
    totalMatches: {
      type: Number,
      default: 0
    },
    activeMembersCount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  promotions: {
    featured: {
      active: {
        type: Boolean,
        default: false
      },
      startDate: Date,
      endDate: Date,
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    prioritySearch: {
      active: {
        type: Boolean,
        default: false
      },
      startDate: Date,
      endDate: Date,
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    enhancedProfile: {
      active: {
        type: Boolean,
        default: false
      },
      startDate: Date,
      endDate: Date,
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      features: [{
        type: String,
        enum: ['custom_theme', 'detailed_analytics', 'advanced_member_management', 'premium_support']
      }]
    }
  },
  bulkInvitations: [{
    batchId: {
      type: Number,
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emails: [{
      type: String,
      required: true
    }],
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  }],
  coinWallet: {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Club coin balance cannot be negative']
    },
    totalEarned: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    lastTransactionAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

clubSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.filter(member => member.isActive).length : 0;
});

clubSchema.virtual('organizerCount').get(function() {
  return this.members ? this.members.filter(member =>
    member.isActive && (member.role === 'organizer' || member.role === 'admin')
  ).length : 0;
});

clubSchema.pre('save', function(next) {
  if (this.isPrivate && !this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
  }
  next();
});

clubSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(
    member => member.user.toString() === userId.toString()
  );

  if (existingMember) {
    if (!existingMember.isActive) {
      existingMember.isActive = true;
      existingMember.joinedAt = new Date();
    }
    return this.save();
  }

  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    isActive: true
  });

  return this.save();
};

clubSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(
    member => member.user.toString() === userId.toString()
  );

  if (memberIndex > -1) {
    this.members[memberIndex].isActive = false;
    return this.save();
  }

  return Promise.resolve(this);
};

clubSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(
    member => member.user.toString() === userId.toString() && member.isActive
  );

  if (member) {
    member.role = newRole;
    return this.save();
  }

  return Promise.resolve(this);
};

clubSchema.methods.isMember = function(userId) {
  return this.members.some(
    member => member.user.toString() === userId.toString() && member.isActive
  );
};

clubSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(
    member => member.user.toString() === userId.toString() && member.isActive
  );
  return member ? member.role : null;
};

// Club coin management methods
clubSchema.methods.addCoins = async function(amount, transactionType = 'purchase', description = '', metadata = {}) {
  const CoinTransaction = require('./CoinTransaction');
  
  // Initialize coinWallet if it doesn't exist (for existing clubs)
  if (!this.coinWallet) {
    this.coinWallet = {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastTransactionAt: null
    };
  }

  this.coinWallet.balance += amount;
  this.coinWallet.totalEarned += amount;
  this.coinWallet.lastTransactionAt = new Date();
  
  // Create transaction record
  await CoinTransaction.create({
    user: this.owner, // Owner is responsible for club transactions
    club: this._id,
    amount: amount,
    type: transactionType,
    description: description,
    balanceAfter: this.coinWallet.balance,
    metadata: {
      ...metadata,
      clubId: this._id,
      clubName: this.name
    }
  });
  
  await this.save();
  return this.coinWallet.balance;
};

clubSchema.methods.spendCoins = async function(amount, transactionType = 'club_feature', description = '', metadata = {}) {
  const CoinTransaction = require('./CoinTransaction');
  
  // Initialize coinWallet if it doesn't exist (for existing clubs)
  if (!this.coinWallet) {
    this.coinWallet = {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastTransactionAt: null
    };
  }

  if (this.coinWallet.balance < amount) {
    throw new Error(`Insufficient club coins. Required: ${amount}, Available: ${this.coinWallet.balance}`);
  }
  
  this.coinWallet.balance -= amount;
  this.coinWallet.totalSpent += amount;
  this.coinWallet.lastTransactionAt = new Date();
  
  // Create transaction record (negative amount for spending)
  await CoinTransaction.create({
    user: this.owner, // Owner is responsible for club transactions
    amount: -amount,
    type: transactionType,
    description: description,
    balanceAfter: this.coinWallet.balance,
    metadata: {
      ...metadata,
      clubId: this._id,
      clubName: this.name
    }
  });
  
  await this.save();
  return this.coinWallet.balance;
};

clubSchema.methods.canAfford = function(amount) {
  // Initialize coinWallet if it doesn't exist (for existing clubs)
  if (!this.coinWallet) {
    return amount === 0;
  }
  return this.coinWallet.balance >= amount;
};

clubSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.inviteCode && ret.isPrivate === false) {
      delete ret.inviteCode;
    }
    return ret;
  }
});

module.exports = mongoose.model('Club', clubSchema);