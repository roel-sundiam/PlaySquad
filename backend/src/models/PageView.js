const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  // User information (null for anonymous visitors)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Session tracking
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Page information
  page: {
    type: String,
    required: true,
    index: true
  },
  
  pageTitle: {
    type: String,
    default: ''
  },
  
  referrer: {
    type: String,
    default: ''
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
  
  // Timing information
  viewDuration: {
    type: Number,
    default: 0 // in seconds
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for analytics queries
pageViewSchema.index({ timestamp: -1 });
pageViewSchema.index({ sessionId: 1, timestamp: -1 });
pageViewSchema.index({ user: 1, timestamp: -1 });
pageViewSchema.index({ page: 1, timestamp: -1 });
pageViewSchema.index({ deviceType: 1, timestamp: -1 });

module.exports = mongoose.model('PageView', pageViewSchema);