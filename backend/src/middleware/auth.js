const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is invalid. User not found.'
        });
      }

      req.user = user;
      await user.updateLastActive();
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication middleware'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
          await user.updateLastActive();
        }
      } catch (error) {
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

const clubMember = async (req, res, next) => {
  try {
    console.log('clubMember middleware called with:', {
      params: req.params,
      body: req.body,
      route: req.route?.path,
      url: req.url
    });
    
    let clubId = req.params.clubId || req.params.id || req.body.club;

    // If no clubId found, check if this is an event-based route
    if (!clubId && req.params.id && (req.route?.path?.includes('events') || req.url.includes('events') || req.originalUrl.includes('events'))) {
      console.log('Looking up event for club ID:', req.params.id);
      const Event = require('../models/Event');
      const event = await Event.findById(req.params.id).populate('club');
      
      if (!event) {
        console.log('Event not found:', req.params.id);
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      clubId = event.club._id.toString();
      console.log('Found club ID from event:', clubId);
    }

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required'
      });
    }

    const user = req.user;
    const isMember = user.clubs.some(
      club => club.club.toString() === clubId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this club.'
      });
    }

    req.clubId = clubId;
    next();
  } catch (error) {
    console.error('Error in clubMember middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in club member middleware'
    });
  }
};

const clubOrganizer = async (req, res, next) => {
  try {
    console.log('=== CLUB ORGANIZER MIDDLEWARE ===');
    console.log('req.method:', req.method);
    console.log('req.url:', req.url);
    console.log('req.params:', JSON.stringify(req.params));
    console.log('req.body exists:', !!req.body);
    console.log('req.body keys:', Object.keys(req.body || {}));
    console.log('req.body.club:', req.body?.club);
    console.log('typeof req.body.club:', typeof req.body?.club);
    
    let clubId = req.params.clubId || req.params.id || req.body?.club;

    // Event-based club ID lookup for event routes
    if (!clubId && req.params.id && (req.route?.path?.includes('events') || req.url.includes('events') || req.originalUrl.includes('events'))) {
      const Event = require('../models/Event');
      const event = await Event.findById(req.params.id).populate('club');
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      clubId = event.club._id.toString();
    }

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required'
      });
    }

    const user = req.user;
    const clubMembership = user.clubs.find(
      club => club.club.toString() === clubId.toString()
    );

    if (!clubMembership || !['organizer', 'admin'].includes(clubMembership.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Organizer permissions required.'
      });
    }

    req.clubId = clubId;
    req.userRole = clubMembership.role;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in club organizer middleware'
    });
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  clubMember,
  clubOrganizer
};