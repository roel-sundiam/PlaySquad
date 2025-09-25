const mongoose = require('mongoose');

const visitorSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User information (null for anonymous visitors)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Session metadata
  isAnonymous: {
    type: Boolean,
    default: true
  },
  
  // Device and browser information
  userAgent: {
    type: String,
    default: ''
  },
  
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  
  browser: {
    type: String,
    default: ''
  },
  
  os: {
    type: String,
    default: ''
  },
  
  // Location information
  ipAddress: {
    type: String,
    default: '',
    index: true
  },
  
  country: {
    type: String,
    default: ''
  },
  
  city: {
    type: String,
    default: ''
  },
  
  // Session tracking
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  endTime: {
    type: Date,
    default: null
  },
  
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  
  // Activity metrics
  pageViews: {
    type: Number,
    default: 0
  },
  
  pagesVisited: [{
    page: String,
    timestamp: Date,
    duration: Number
  }],
  
  // Entry and exit pages
  landingPage: {
    type: String,
    default: ''
  },
  
  exitPage: {
    type: String,
    default: ''
  },
  
  // Session status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Referrer information
  referrer: {
    type: String,
    default: ''
  },
  
  utmSource: {
    type: String,
    default: ''
  },
  
  utmMedium: {
    type: String,
    default: ''
  },
  
  utmCampaign: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
visitorSessionSchema.index({ startTime: -1 });
visitorSessionSchema.index({ user: 1, startTime: -1 });
visitorSessionSchema.index({ isAnonymous: 1, startTime: -1 });
visitorSessionSchema.index({ deviceType: 1, startTime: -1 });
visitorSessionSchema.index({ isActive: 1, lastActivity: -1 });

// Virtual for session duration in minutes
visitorSessionSchema.virtual('durationMinutes').get(function() {
  return Math.round(this.duration / 60);
});

// Method to end session
visitorSessionSchema.methods.endSession = function() {
  this.endTime = new Date();
  this.isActive = false;
  this.duration = Math.round((this.endTime - this.startTime) / 1000);
  return this.save();
};

// Method to update activity
visitorSessionSchema.methods.updateActivity = function(page) {
  this.lastActivity = new Date();
  this.pageViews += 1;
  
  if (page) {
    this.pagesVisited.push({
      page: page,
      timestamp: new Date(),
      duration: 0
    });
    
    if (!this.landingPage) {
      this.landingPage = page;
    }
    this.exitPage = page;
  }
  
  return this.save();
};

module.exports = mongoose.model('VisitorSession', visitorSessionSchema);