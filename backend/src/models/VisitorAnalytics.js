const mongoose = require('mongoose');

// Helper model for storing aggregated analytics data
const visitorAnalyticsSchema = new mongoose.Schema({
  // Date for the analytics (daily aggregation)
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Daily metrics
  totalPageViews: {
    type: Number,
    default: 0
  },
  
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  
  anonymousVisitors: {
    type: Number,
    default: 0
  },
  
  registeredVisitors: {
    type: Number,
    default: 0
  },
  
  totalSessions: {
    type: Number,
    default: 0
  },
  
  avgSessionDuration: {
    type: Number,
    default: 0 // in seconds
  },
  
  avgPagesPerSession: {
    type: Number,
    default: 0
  },
  
  bounceRate: {
    type: Number,
    default: 0 // percentage
  },
  
  // Device breakdown
  deviceBreakdown: {
    desktop: {
      type: Number,
      default: 0
    },
    mobile: {
      type: Number,
      default: 0
    },
    tablet: {
      type: Number,
      default: 0
    }
  },
  
  // Popular pages
  topPages: [{
    page: String,
    views: Number,
    uniqueViews: Number
  }],
  
  // Traffic sources
  referrers: [{
    source: String,
    visits: Number
  }],
  
  // Hourly breakdown for the day
  hourlyViews: [{
    hour: Number, // 0-23
    views: Number,
    visitors: Number
  }]
}, {
  timestamps: true
});

// Ensure unique daily records
visitorAnalyticsSchema.index({ date: 1 }, { unique: true });

// Static method to update daily analytics
visitorAnalyticsSchema.statics.updateDailyAnalytics = async function(date) {
  const PageView = require('./PageView');
  const VisitorSession = require('./VisitorSession');
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  try {
    // Get daily metrics
    const [
      totalPageViews,
      uniqueVisitors,
      totalSessions,
      deviceBreakdown,
      topPages,
      hourlyData
    ] = await Promise.all([
      // Total page views
      PageView.countDocuments({
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }),
      
      // Unique visitors (unique session IDs)
      PageView.distinct('sessionId', {
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }),
      
      // Total sessions
      VisitorSession.countDocuments({
        startTime: { $gte: startOfDay, $lte: endOfDay }
      }),
      
      // Device breakdown
      PageView.aggregate([
        { $match: { timestamp: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } }
      ]),
      
      // Top pages
      PageView.aggregate([
        { $match: { timestamp: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { 
          _id: '$page', 
          views: { $sum: 1 },
          uniqueViews: { $addToSet: '$sessionId' }
        }},
        { $project: {
          page: '$_id',
          views: 1,
          uniqueViews: { $size: '$uniqueViews' }
        }},
        { $sort: { views: -1 } },
        { $limit: 10 }
      ]),
      
      // Hourly breakdown
      PageView.aggregate([
        { $match: { timestamp: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: {
          _id: { $hour: '$timestamp' },
          views: { $sum: 1 },
          visitors: { $addToSet: '$sessionId' }
        }},
        { $project: {
          hour: '$_id',
          views: 1,
          visitors: { $size: '$visitors' }
        }},
        { $sort: { hour: 1 } }
      ])
    ]);
    
    // Calculate additional metrics
    const sessionStats = await VisitorSession.aggregate([
      { $match: { startTime: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' },
        anonymousCount: { 
          $sum: { $cond: ['$isAnonymous', 1, 0] } 
        },
        registeredCount: { 
          $sum: { $cond: ['$isAnonymous', 0, 1] } 
        },
        bounces: {
          $sum: { $cond: [{ $lte: ['$pageViews', 1] }, 1, 0] }
        }
      }}
    ]);
    
    const stats = sessionStats[0] || {};
    const bounceRate = totalSessions > 0 ? (stats.bounces || 0) / totalSessions * 100 : 0;
    
    // Format device breakdown
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    deviceBreakdown.forEach(device => {
      if (devices.hasOwnProperty(device._id)) {
        devices[device._id] = device.count;
      }
    });
    
    // Update or create daily analytics record
    await this.findOneAndUpdate(
      { date: startOfDay },
      {
        totalPageViews,
        uniqueVisitors: uniqueVisitors.length,
        anonymousVisitors: stats.anonymousCount || 0,
        registeredVisitors: stats.registeredCount || 0,
        totalSessions,
        avgSessionDuration: Math.round(stats.avgDuration || 0),
        avgPagesPerSession: Math.round((stats.avgPageViews || 0) * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        deviceBreakdown: devices,
        topPages: topPages.map(p => ({
          page: p.page,
          views: p.views,
          uniqueViews: p.uniqueViews
        })),
        hourlyViews: hourlyData.map(h => ({
          hour: h.hour,
          views: h.views,
          visitors: h.visitors
        }))
      },
      { upsert: true, new: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error updating daily analytics:', error);
    return false;
  }
};

module.exports = mongoose.model('VisitorAnalytics', visitorAnalyticsSchema);