const express = require('express');
const router = express.Router();
const PageView = require('../models/PageView');
const VisitorSession = require('../models/VisitorSession');
const VisitorAnalytics = require('../models/VisitorAnalytics');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// Helper function to detect device type from user agent
function detectDevice(userAgent) {
  if (!userAgent) return 'desktop';
  
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) {
    return 'mobile';
  } else if (/tablet|ipad/.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

// Helper function to extract browser info
function getBrowserInfo(userAgent) {
  if (!userAgent) return { browser: '', os: '' };
  
  const ua = userAgent.toLowerCase();
  let browser = 'unknown';
  let os = 'unknown';
  
  // Detect browser
  if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // Detect OS
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { browser, os };
}

// Helper function to get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
}

// Track page view (no auth required for basic tracking)
router.post('/track/pageview', async (req, res) => {
  try {
    const { 
      page, 
      pageTitle, 
      referrer, 
      sessionId: clientSessionId,
      viewDuration = 0
    } = req.body;
    
    if (!page) {
      return res.status(400).json({
        success: false,
        message: 'Page is required'
      });
    }
    
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = getClientIP(req);
    const deviceType = detectDevice(userAgent);
    const { browser, os } = getBrowserInfo(userAgent);
    
    // Generate session ID if not provided
    const sessionId = clientSessionId || crypto.randomUUID();
    
    // Find or create visitor session
    let session = await VisitorSession.findOne({ sessionId });
    
    if (!session) {
      session = new VisitorSession({
        sessionId,
        user: req.user ? req.user.id : null,
        isAnonymous: !req.user,
        userAgent,
        deviceType,
        browser,
        os,
        ipAddress,
        landingPage: page,
        referrer: referrer || ''
      });
      await session.save();
    } else {
      // Update existing session
      await session.updateActivity(page);
    }
    
    // Create page view record
    const pageView = new PageView({
      user: req.user ? req.user.id : null,
      sessionId,
      page,
      pageTitle: pageTitle || '',
      referrer: referrer || '',
      userAgent,
      deviceType,
      browser,
      os,
      ipAddress,
      viewDuration: Math.max(0, viewDuration)
    });
    
    await pageView.save();
    
    res.json({
      success: true,
      data: {
        sessionId,
        pageView: pageView._id,
        tracked: true
      }
    });
    
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track page view'
    });
  }
});

// End visitor session
router.post('/track/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    const session = await VisitorSession.findOne({ sessionId });
    if (session && session.isActive) {
      await session.endSession();
    }
    
    res.json({
      success: true,
      message: 'Session ended'
    });
    
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
});

// Get current active visitors (real-time)
router.get('/realtime/visitors', async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeVisitors = await VisitorSession.countDocuments({
      lastActivity: { $gte: fiveMinutesAgo },
      isActive: true
    });
    
    res.json({
      success: true,
      data: {
        activeVisitors,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Error getting active visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active visitors'
    });
  }
});

// Get visitor analytics (admin only)
router.get('/admin/visitor-analytics', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || (!req.user.email.includes('admin') && !req.user.email.includes('superadmin'))) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { period = '30d', startDate, endDate } = req.query;
    
    const now = new Date();
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = now;
      switch (period) {
        case '7d':
          start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case '30d':
          start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case '90d':
          start = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
          break;
        default:
          start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      }
    }
    
    const [
      totalPageViews,
      uniqueVisitors,
      totalSessions,
      anonymousVisitors,
      registeredVisitors,
      deviceBreakdown,
      topPages,
      recentVisitors,
      dailyTrends,
      currentlyActive
    ] = await Promise.all([
      // Total page views in period
      PageView.countDocuments({
        timestamp: { $gte: start, $lte: end }
      }),
      
      // Unique visitors (unique session IDs, exclude localhost IPs)
      PageView.distinct('sessionId', {
        timestamp: { $gte: start, $lte: end },
        ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
      }),
      
      // Total sessions (exclude localhost IPs)
      VisitorSession.countDocuments({
        startTime: { $gte: start, $lte: end },
        ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
      }),
      
      // Anonymous vs registered visitors (exclude localhost IPs)
      VisitorSession.countDocuments({
        startTime: { $gte: start, $lte: end },
        isAnonymous: true,
        ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
      }),
      
      VisitorSession.countDocuments({
        startTime: { $gte: start, $lte: end },
        isAnonymous: false,
        ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
      }),
      
      // Device breakdown (exclude localhost IPs)
      PageView.aggregate([
        { $match: { 
          timestamp: { $gte: start, $lte: end },
          ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
        }},
        { $group: { _id: '$deviceType', count: { $sum: 1 } } }
      ]),
      
      // Top pages (exclude localhost IPs)
      PageView.aggregate([
        { $match: { 
          timestamp: { $gte: start, $lte: end },
          ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
        }},
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
      
      // Recent visitor sessions (exclude localhost/development IPs)
      VisitorSession.find({
        startTime: { $gte: start, $lte: end },
        ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
      })
      .populate('user', 'firstName lastName email')
      .sort({ startTime: -1 })
      .limit(50),
      
      // Daily visitor trends (exclude localhost/development IPs)
      VisitorSession.aggregate([
        { $match: { 
          startTime: { $gte: start, $lte: end },
          ipAddress: { $nin: ['::1', '127.0.0.1', 'localhost'] }
        }},
        { $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            day: { $dayOfMonth: '$startTime' }
          },
          visitors: { $sum: 1 },
          anonymousVisitors: { $sum: { $cond: ['$isAnonymous', 1, 0] } },
          registeredVisitors: { $sum: { $cond: ['$isAnonymous', 0, 1] } }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Currently active visitors (last 5 minutes)
      VisitorSession.countDocuments({
        lastActivity: { $gte: new Date(now.getTime() - 5 * 60 * 1000) },
        isActive: true
      })
    ]);
    
    // Format device breakdown
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    deviceBreakdown.forEach(device => {
      if (devices.hasOwnProperty(device._id)) {
        devices[device._id] = device.count;
      }
    });
    
    // Calculate session statistics
    const sessionStats = await VisitorSession.aggregate([
      { $match: { startTime: { $gte: start, $lte: end } } },
      { $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
        avgPageViews: { $avg: '$pageViews' },
        totalDuration: { $sum: '$duration' }
      }}
    ]);
    
    const stats = sessionStats[0] || {};
    
    res.json({
      success: true,
      data: {
        overview: {
          totalPageViews,
          uniqueVisitors: uniqueVisitors.length,
          totalSessions,
          anonymousVisitors,
          registeredVisitors,
          totalVisitors: uniqueVisitors.length,
          currentlyActive,
          avgSessionDuration: Math.round(stats.avgDuration || 0),
          avgPagesPerSession: Math.round((stats.avgPageViews || 0) * 100) / 100
        },
        deviceBreakdown: devices,
        topPages: topPages,
        recentVisitors: recentVisitors.map(visitor => ({
          sessionId: visitor.sessionId,
          user: visitor.user,
          isAnonymous: visitor.isAnonymous,
          deviceType: visitor.deviceType,
          browser: visitor.browser,
          os: visitor.os,
          ipAddress: visitor.ipAddress,
          pageViews: visitor.pageViews,
          duration: visitor.duration,
          landingPage: visitor.landingPage,
          startTime: visitor.startTime,
          lastActivity: visitor.lastActivity,
          isActive: visitor.isActive
        })),
        dailyTrends: dailyTrends,
        period,
        dateRange: { start, end }
      }
    });
    
  } catch (error) {
    console.error('Error getting visitor analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visitor analytics'
    });
  }
});

// Update daily analytics (can be run via cron job)
router.post('/admin/update-analytics', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.email.includes('admin') && !req.user.email.includes('superadmin')) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { date } = req.body;
    const analyticsDate = date ? new Date(date) : new Date();
    
    const success = await VisitorAnalytics.updateDailyAnalytics(analyticsDate);
    
    res.json({
      success,
      message: success ? 'Analytics updated successfully' : 'Failed to update analytics'
    });
    
  } catch (error) {
    console.error('Error updating analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update analytics'
    });
  }
});

module.exports = router;