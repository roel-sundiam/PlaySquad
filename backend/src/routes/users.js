const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const Club = require('../models/Club');
const Event = require('../models/Event');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/search', optionalAuth, [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('club').optional().isMongoId().withMessage('Invalid club ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.q;
    const clubId = req.query.club;

    let query = {
      $or: [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    if (clubId) {
      query['clubs.club'] = clubId;
      query['clubs.isActive'] = true;
    }

    const users = await User.find(query)
      .select('firstName lastName avatar skillLevel preferredFormat stats lastActive')
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('clubs.club', 'name avatar sport location')
      .select('-email -phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let responseData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      avatar: user.avatar,
      skillLevel: user.skillLevel,
      preferredFormat: user.preferredFormat,
      stats: user.stats,
      winRate: user.winRate,
      clubs: user.clubs
    };

    if (req.user && req.user.id.toString() === req.params.id.toString()) {
      responseData.email = user.email;
      responseData.phone = user.phone;
      responseData.lastActive = user.lastActive;
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
});

router.get('/:id/clubs', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const activeClubIds = user.clubs
      .filter(club => club.isActive)
      .map(club => club.club);

    const clubs = await Club.find({
      _id: { $in: activeClubIds },
      isActive: true
    })
    .populate('owner', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const clubsWithRole = clubs.map(club => {
      const membership = user.clubs.find(
        userClub => userClub.club.toString() === club._id.toString()
      );
      return {
        ...club.toJSON(),
        userRole: membership ? membership.role : null,
        joinedAt: membership ? membership.joinedAt : null
      };
    });

    const total = activeClubIds.length;

    res.status(200).json({
      success: true,
      data: clubsWithRole,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user clubs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user clubs'
    });
  }
});

router.get('/:id/events', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['attending', 'maybe', 'declined']),
  query('upcoming').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    if (req.user.id.toString() !== req.params.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own events.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let matchQuery = {
      'rsvps.user': req.user.id
    };

    if (req.query.status) {
      matchQuery['rsvps.status'] = req.query.status;
    }

    if (req.query.upcoming === 'true') {
      matchQuery.dateTime = { $gte: new Date() };
    }

    const events = await Event.find(matchQuery)
      .populate('club', 'name avatar location sport')
      .populate('organizer', 'firstName lastName avatar')
      .sort({ dateTime: req.query.upcoming === 'true' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const eventsWithUserRsvp = events.map(event => {
      const userRsvp = event.rsvps.find(
        rsvp => rsvp.user.toString() === req.user.id.toString()
      );
      return {
        ...event.toJSON(),
        userRsvp: userRsvp || null
      };
    });

    const total = await Event.countDocuments(matchQuery);

    res.status(200).json({
      success: true,
      data: eventsWithUserRsvp,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user events'
    });
  }
});

router.get('/:id/matches', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']),
  query('upcoming').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    if (req.user.id.toString() !== req.params.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own matches.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let matchQuery = {
      $or: [
        { 'matches.players.team1': req.user.id },
        { 'matches.players.team2': req.user.id }
      ]
    };

    if (req.query.upcoming === 'true') {
      matchQuery.dateTime = { $gte: new Date() };
    }

    const events = await Event.find(matchQuery)
      .populate('club', 'name avatar location sport')
      .populate('organizer', 'firstName lastName avatar')
      .populate('matches.players.team1', 'firstName lastName avatar skillLevel')
      .populate('matches.players.team2', 'firstName lastName avatar skillLevel')
      .sort({ dateTime: req.query.upcoming === 'true' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const userMatches = [];

    events.forEach(event => {
      event.matches.forEach((match, index) => {
        const isPlayerInMatch =
          match.players.team1.some(p => p._id.toString() === req.user.id.toString()) ||
          match.players.team2.some(p => p._id.toString() === req.user.id.toString());

        if (isPlayerInMatch) {
          if (!req.query.status || match.status === req.query.status) {
            userMatches.push({
              ...match.toJSON(),
              event: {
                id: event._id,
                title: event.title,
                dateTime: event.dateTime,
                club: event.club
              },
              matchIndex: index
            });
          }
        }
      });
    });

    userMatches.sort((a, b) => {
      if (req.query.upcoming === 'true') {
        return new Date(a.startTime) - new Date(b.startTime);
      }
      return new Date(b.startTime) - new Date(a.startTime);
    });

    const paginatedMatches = userMatches.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedMatches,
      pagination: {
        page,
        limit,
        total: userMatches.length,
        pages: Math.ceil(userMatches.length / limit)
      }
    });
  } catch (error) {
    console.error('Get user matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user matches'
    });
  }
});

router.get('/:id/stats', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userClubIds = user.clubs.map(club => club.club);

    const totalEvents = await Event.countDocuments({
      'rsvps.user': user._id,
      'rsvps.status': 'attending'
    });

    const completedMatches = await Event.aggregate([
      { $match: { club: { $in: userClubIds } } },
      { $unwind: '$matches' },
      {
        $match: {
          'matches.status': 'completed',
          $or: [
            { 'matches.players.team1': user._id },
            { 'matches.players.team2': user._id }
          ]
        }
      },
      { $count: 'total' }
    ]);

    const wonMatches = await Event.aggregate([
      { $match: { club: { $in: userClubIds } } },
      { $unwind: '$matches' },
      {
        $match: {
          'matches.status': 'completed',
          $or: [
            {
              'matches.players.team1': user._id,
              'matches.winner': 'team1'
            },
            {
              'matches.players.team2': user._id,
              'matches.winner': 'team2'
            }
          ]
        }
      },
      { $count: 'total' }
    ]);

    const recentMatches = await Event.aggregate([
      { $match: { club: { $in: userClubIds } } },
      { $unwind: '$matches' },
      {
        $match: {
          'matches.status': 'completed',
          $or: [
            { 'matches.players.team1': user._id },
            { 'matches.players.team2': user._id }
          ]
        }
      },
      { $sort: { 'matches.endTime': -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'matches.players.team1',
          foreignField: '_id',
          as: 'team1Players'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'matches.players.team2',
          foreignField: '_id',
          as: 'team2Players'
        }
      },
      {
        $project: {
          match: '$matches',
          eventTitle: '$title',
          eventDate: '$dateTime'
        }
      }
    ]);

    const stats = {
      basic: user.stats,
      computed: {
        totalEventsAttended: totalEvents,
        totalMatchesPlayed: completedMatches[0]?.total || 0,
        matchesWon: wonMatches[0]?.total || 0,
        matchesLost: (completedMatches[0]?.total || 0) - (wonMatches[0]?.total || 0),
        winRate: user.winRate,
        clubsJoined: user.clubs.length
      },
      recentMatches: recentMatches
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user stats'
    });
  }
});

module.exports = router;