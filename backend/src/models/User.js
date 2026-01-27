const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  skillLevel: {
    type: Number,
    min: [1, 'Skill level must be between 1 and 10'],
    max: [10, 'Skill level must be between 1 and 10'],
    default: 5
  },
  preferredFormat: {
    type: String,
    enum: ['singles', 'doubles', 'mixed', 'any'],
    default: 'any'
  },
  clubs: [{
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club'
    },
    role: {
      type: String,
      enum: ['member', 'organizer', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastActive: {
    type: Date,
    default: Date.now
  },
  coinWallet: {
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Coin balance cannot be negative']
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
  },
  // Tennis Club RT2 Integration
  tennisClubUserId: {
    type: String,
    index: true
  },
  tennisClubUsername: {
    type: String
  },
  tennisClubRole: {
    type: String,
    enum: ['member', 'admin', 'superadmin', 'treasurer']
  }
}, {
  timestamps: true
});

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('winRate').get(function() {
  if (this.stats.gamesPlayed === 0) return 0;
  return ((this.stats.wins / this.stats.gamesPlayed) * 100).toFixed(1);
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.addCoins = async function(amount, transactionType = 'purchase', description = '') {
  if (amount <= 0) throw new Error('Coin amount must be positive');
  
  // Initialize coinWallet if it doesn't exist (for existing users)
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
  
  await this.save();
  
  // Create transaction record
  const CoinTransaction = require('./CoinTransaction');
  await CoinTransaction.create({
    user: this._id,
    type: transactionType,
    amount: amount,
    balanceAfter: this.coinWallet.balance,
    description: description || `Added ${amount} coins via ${transactionType}`
  });
  
  return this.coinWallet.balance;
};

userSchema.methods.spendCoins = async function(amount, transactionType = 'club_feature', description = '', metadata = {}) {
  if (amount <= 0) throw new Error('Coin amount must be positive');
  
  // Initialize coinWallet if it doesn't exist (for existing users)
  if (!this.coinWallet) {
    this.coinWallet = {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastTransactionAt: null
    };
  }
  
  if (this.coinWallet.balance < amount) throw new Error('Insufficient coin balance');
  
  this.coinWallet.balance -= amount;
  this.coinWallet.totalSpent += amount;
  this.coinWallet.lastTransactionAt = new Date();
  
  await this.save();
  
  // Create transaction record
  const CoinTransaction = require('./CoinTransaction');
  await CoinTransaction.create({
    user: this._id,
    type: transactionType,
    amount: -amount,
    balanceAfter: this.coinWallet.balance,
    description: description || `Spent ${amount} coins on ${transactionType}`,
    metadata: metadata
  });
  
  return this.coinWallet.balance;
};

userSchema.methods.canAfford = function(amount) {
  // Initialize coinWallet if it doesn't exist (for existing users)
  if (!this.coinWallet) {
    this.coinWallet = {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastTransactionAt: null
    };
  }
  return this.coinWallet.balance >= amount;
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);