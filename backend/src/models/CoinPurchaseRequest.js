const mongoose = require('mongoose');

const coinPurchaseRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    default: null // null for personal purchases
  },
  packageId: {
    type: String,
    required: true,
    enum: ['starter', 'basic', 'popular', 'premium', 'enterprise']
  },
  packageDetails: {
    name: String,
    coins: Number,
    bonusCoins: Number,
    totalCoins: Number,
    price: Number
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['gcash', 'bank_transfer', 'cash']
  },
  paymentDetails: {
    // For GCash
    gcashNumber: String,
    gcashName: String,
    
    // For Bank Transfer
    bankName: String,
    accountNumber: String,
    accountName: String,
    
    // Common fields
    referenceNumber: String,
    amount: Number,
    proofOfPayment: String, // URL to uploaded proof
    notes: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing'],
    default: 'pending'
  },
  adminNotes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  coinsGranted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for request type
coinPurchaseRequestSchema.virtual('requestType').get(function() {
  return this.club ? 'club' : 'personal';
});

// Method to approve request
coinPurchaseRequestSchema.methods.approve = async function(adminId, adminNotes = '') {
  const User = require('./User');
  const Club = require('./Club');
  
  this.status = 'approved';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.adminNotes = adminNotes;
  this.coinsGranted = this.packageDetails.totalCoins;
  
  // Grant coins to user or club
  if (this.club) {
    // Club purchase
    const club = await Club.findById(this.club);
    if (club) {
      await club.addCoins(
        this.packageDetails.totalCoins,
        'admin_approved_purchase',
        `Admin approved purchase: ${this.packageDetails.name} package`,
        {
          requestId: this._id,
          packageId: this.packageId,
          price: this.packageDetails.price,
          paymentMethod: this.paymentMethod,
          approvedBy: adminId
        }
      );
    }
  } else {
    // Personal purchase
    const user = await User.findById(this.requester);
    if (user) {
      await user.addCoins(
        this.packageDetails.totalCoins,
        'admin_approved_purchase',
        `Admin approved purchase: ${this.packageDetails.name} package`,
        {
          requestId: this._id,
          packageId: this.packageId,
          price: this.packageDetails.price,
          paymentMethod: this.paymentMethod,
          approvedBy: adminId
        }
      );
    }
  }
  
  await this.save();
  return this;
};

// Method to reject request
coinPurchaseRequestSchema.methods.reject = async function(adminId, adminNotes = '') {
  this.status = 'rejected';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.adminNotes = adminNotes;
  
  await this.save();
  return this;
};

// Static method to get pending requests for admin
coinPurchaseRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .populate('requester', 'firstName lastName email')
    .populate('club', 'name')
    .sort({ createdAt: -1 });
};

coinPurchaseRequestSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Don't expose sensitive payment details to non-admins
    return ret;
  }
});

module.exports = mongoose.model('CoinPurchaseRequest', coinPurchaseRequestSchema);