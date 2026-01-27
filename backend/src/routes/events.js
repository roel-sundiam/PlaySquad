const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Event = require('../models/Event');
const Club = require('../models/Club');
const { protect, clubMember, clubOrganizer } = require('../middleware/auth');
const { requireCoins, requireClubCoinAccess, spendCoins, COIN_COSTS } = require('../middleware/coinAuth');
const NotificationService = require('../services/notificationService');
const socketService = require('../services/socketService');

const router = express.Router();

// Log all requests to events routes
router.use((req, res, next) => {
  console.log(`\n=== EVENTS ROUTE HIT ===`);
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('Body preview:', req.body?.title ? `Title: ${req.body.title}` : 'No title');
  console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('========================\n');
  next();
});

// Simple test endpoint - NO AUTH to eliminate variables
router.post('/test-create', (req, res) => {
  console.log('=== NO-AUTH EVENT TEST ENDPOINT REACHED ===');
  console.log('req.method:', req.method);
  console.log('req.url:', req.url);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('req.body exists:', !!req.body);
  console.log('req.body keys:', Object.keys(req.body || {}));
  console.log('req.body.club:', req.body?.club);
  console.log('req.body.title:', req.body?.title);
  console.log('req.body full:', JSON.stringify(req.body, null, 2));
  
  res.json({
    success: true,
    message: 'Event test endpoint reached successfully - no auth required',
    receivedData: {
      title: req.body?.title || 'MISSING',
      clubId: req.body?.club || 'MISSING',
      location: req.body?.location || 'MISSING'
    },
    bodyKeys: Object.keys(req.body || {}),
    fullBody: req.body
  });
});

// Simple test endpoint - NO AUTH to eliminate variables
router.post('/test-body', (req, res) => {
  console.log('=== SIMPLE TEST ENDPOINT REACHED ===');
  console.log('req.method:', req.method);
  console.log('req.url:', req.url);
  console.log('req.route.path:', req.route?.path);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('req.body exists:', !!req.body);
  console.log('req.body keys:', Object.keys(req.body || {}));
  console.log('req.body.club:', req.body?.club);
  console.log('req.body full:', JSON.stringify(req.body, null, 2));
  
  res.json({
    success: true,
    message: 'Simple test endpoint reached - no auth required',
    receivedClubId: req.body?.club || 'MISSING',
    bodyKeys: Object.keys(req.body || {}),
    fullBody: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Present' : 'Missing'
    }
  });
});

router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('club').optional().isMongoId().withMessage('Invalid club ID'),
  query('status').optional().isIn(['draft', 'published', 'ongoing', 'completed', 'cancelled']),
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.query.club) {
      query.club = req.query.club;
    }

    if (req.query.status) {
      query.status = req.query.status;
    } else {
      query.status = { $ne: 'draft' };
    }

    if (req.query.upcoming === 'true') {
      query.dateTime = { $gte: new Date() };
    }

    // Filter by user's own events if requested
    if (req.query.myEvents === 'true') {
      query.organizer = req.user.id;
    }

    // Only show events from clubs the user is a member of
    const userClubs = req.user.clubs.map(club => club.club);
    console.log(`User ${req.user.email} has clubs:`, userClubs);
    
    if (!req.query.club) {
      if (userClubs.length === 0) {
        console.log(`User ${req.user.email} has no clubs, returning no events`);
        // User is not a member of any clubs, return no events
        query._id = { $in: [] };
      } else {
        console.log(`User ${req.user.email} filtering events for clubs:`, userClubs);
        query.club = { $in: userClubs };
      }
    } else {
      // If specific club is requested, verify user is a member
      if (!userClubs.some(clubId => clubId.toString() === req.query.club.toString())) {
        console.log(`User ${req.user.email} not authorized for club ${req.query.club}`);
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view events from this club'
        });
      }
    }

    const events = await Event.find(query)
      .populate('club', 'name avatar location sport')
      .populate('organizer', 'firstName lastName avatar')
      .populate('rsvps.user', 'firstName lastName avatar skillLevel')
      .sort({ dateTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching events'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club', 'name avatar location sport settings')
      .populate('organizer', 'firstName lastName avatar')
      .populate('rsvps.user', 'firstName lastName avatar skillLevel preferredFormat')
      .populate('matches.players.team1', 'firstName lastName avatar skillLevel')
      .populate('matches.players.team2', 'firstName lastName avatar skillLevel');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event'
    });
  }
});

// Premium event creation endpoint with coin requirements
router.post('/premium', protect, clubOrganizer, requireClubCoinAccess(Club), (req, res, next) => {
  // Calculate coin cost based on event type and features
  let coinCost = COIN_COSTS.BASIC_EVENT;
  
  if (req.body.eventType === 'tournament') {
    coinCost = COIN_COSTS.TOURNAMENT_EVENT;
  } else if (req.body.premiumFeatures?.includes('auto_match_generation')) {
    coinCost = COIN_COSTS.PREMIUM_EVENT + COIN_COSTS.AUTO_MATCH_GENERATION;
  } else if (req.body.premiumFeatures?.length > 0) {
    coinCost = COIN_COSTS.PREMIUM_EVENT;
  }
  
  // Set the calculated cost for the middleware
  req.calculatedCoinCost = coinCost;
  
  if (coinCost > 0) {
    return requireCoins('PREMIUM_EVENT', coinCost)(req, res, next);
  } else {
    next();
  }
}, [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('club')
    .isMongoId()
    .withMessage('Valid club ID is required'),
  body('dateTime')
    .isISO8601()
    .withMessage('Valid date and time is required'),
  body('duration')
    .isInt({ min: 30, max: 480 })
    .withMessage('Duration must be between 30 and 480 minutes'),
  body('format')
    .isIn(['singles', 'doubles', 'mixed', 'tournament'])
    .withMessage('Invalid event format'),
  body('maxParticipants')
    .isInt({ min: 2, max: 100 })
    .withMessage('Max participants must be between 2 and 100'),
  body('rsvpDeadline')
    .isISO8601()
    .withMessage('Valid RSVP deadline is required'),
  body('location.name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Location name is required'),
  body('location.address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Location address is required'),
  body('premiumFeatures')
    .optional()
    .isArray()
    .withMessage('Premium features must be an array'),
  body('eventType')
    .optional()
    .isIn(['sports', 'social', 'tournament', 'training'])
    .withMessage('Invalid event type')
], async (req, res) => {
  try {
    console.log('=== PREMIUM EVENT CREATION ROUTE HIT ===');
    console.log('Route: POST /api/events/premium');
    console.log('User:', req.user?.email);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Received status:', req.body.status || 'NOT PROVIDED');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const eventDateTime = new Date(req.body.dateTime);
    const rsvpDeadline = new Date(req.body.rsvpDeadline);

    if (eventDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be in the future'
      });
    }

    if (rsvpDeadline >= eventDateTime) {
      return res.status(400).json({
        success: false,
        message: 'RSVP deadline must be before event start time'
      });
    }

    const premiumClub = await Club.findById(req.body.club);
    if (!premiumClub || !premiumClub.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Enhanced event data with premium features
    const eventData = {
      ...req.body,
      organizer: req.user.id,
      isPremium: req.calculatedCoinCost > 0,
      premiumFeatures: req.body.premiumFeatures || [],
      settings: {
        ...req.body.settings,
        autoGenerateMatches: req.body.premiumFeatures?.includes('auto_match_generation') || false,
        allowWaitlist: true,
        requireSkillLevel: req.body.eventType !== 'social'
      }
    };

    const event = await Event.create(eventData);

    // Spend coins if this is a premium event
    if (req.calculatedCoinCost > 0) {
      await spendCoins(
        req,
        'event_premium',
        `Premium event creation: ${req.body.title}`,
        {
          clubId: req.body.club,
          eventId: event._id,
          eventType: req.body.eventType,
          premiumFeatures: req.body.premiumFeatures
        }
      );
    }

    const populatedEvent = await Event.findById(event._id)
      .populate('club', 'name avatar location sport')
      .populate('organizer', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: `${req.calculatedCoinCost > 0 ? 'Premium' : 'Basic'} event created successfully`,
      data: populatedEvent,
      coinCost: req.calculatedCoinCost
    });
  } catch (error) {
    console.error('Create premium event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
});

// Test endpoint to bypass middleware and check req.body
router.post('/test-body', protect, (req, res) => {
  console.log('=== TEST ENDPOINT ===');
  console.log('req.body:', JSON.stringify(req.body, null, 2));
  console.log('req.body.club:', req.body.club);
  console.log('req.method:', req.method);
  console.log('req.url:', req.url);
  
  res.json({
    success: true,
    message: 'Test endpoint reached',
    receivedClubId: req.body.club,
    bodyKeys: Object.keys(req.body || {}),
    fullBody: req.body
  });
});

// Basic event creation endpoint (simplified for debugging)
router.post('/', protect, async (req, res) => {
  try {
    console.log('=== BASIC EVENT CREATION ROUTE HIT ===');
    console.log('Route: POST /api/events/');
    console.log('User:', req.user?.email);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Club ID:', req.body.club);
    console.log('Received status:', req.body.status || 'NOT PROVIDED');
    
    // Simple validation
    if (!req.body.club) {
      return res.status(400).json({
        success: false,
        message: 'Club ID is required'
      });
    }
    
    if (!req.body.title) {
      return res.status(400).json({
        success: false, 
        message: 'Title is required'
      });
    }

    // Check for required fields
    const requiredFields = ['dateTime', 'duration', 'format', 'maxParticipants', 'rsvpDeadline'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    // Validate location
    if (!req.body.location || !req.body.location.name || !req.body.location.address) {
      return res.status(400).json({
        success: false,
        message: 'Location with name and address is required'
      });
    }

    const eventDateTime = new Date(req.body.dateTime);
    const rsvpDeadline = new Date(req.body.rsvpDeadline);

    if (eventDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Event date must be in the future'
      });
    }

    if (rsvpDeadline >= eventDateTime) {
      return res.status(400).json({
        success: false,
        message: 'RSVP deadline must be before event start time'
      });
    }

    const eventClub = await Club.findById(req.body.club);
    if (!eventClub || !eventClub.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Ensure coinWallet is properly initialized for existing clubs
    if (!eventClub.coinWallet) {
      eventClub.coinWallet = {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        transactions: [],
        lastTransactionAt: null
      };
      await eventClub.save();
    }

    // Check if club has enough coins for event creation
    const currentBalance = eventClub.coinWallet.balance;
    const requiredCoins = COIN_COSTS.EVENT_CREATION;
    
    console.log(`💰 Club "${eventClub.name}" coin check: ${currentBalance}/${requiredCoins} coins`);
    
    if (currentBalance < requiredCoins) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient club coins for event creation',
        data: {
          required: requiredCoins,
          available: currentBalance,
          shortfall: requiredCoins - currentBalance
        }
      });
    }

    // Check if user is a member of this club
    const userClub = req.user.clubs.find(
      userClub => userClub.club.toString() === req.body.club.toString()
    );
    if (!userClub) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this club'
      });
    }

    // Spend club coins BEFORE creating the event to ensure transaction consistency
    if (typeof COIN_COSTS !== 'undefined' && COIN_COSTS.EVENT_CREATION) {
      try {
        await eventClub.spendCoins(
          COIN_COSTS.EVENT_CREATION,
          'club_feature',
          `Event creation: ${req.body.title}`,
          {
            eventTitle: req.body.title,
            performedBy: req.user.id
          }
        );
        console.log(`✅ Deducted ${COIN_COSTS.EVENT_CREATION} coins for event creation`);
      } catch (coinError) {
        console.error('❌ Coin spending failed:', coinError.message);
        // This should not happen as we checked canAfford above, but handle it gracefully
        return res.status(402).json({
          success: false,
          message: 'Failed to process coin payment: ' + coinError.message,
          data: {
            required: COIN_COSTS.EVENT_CREATION,
            available: eventClub.coinWallet?.balance || 0
          }
        });
      }
    }

    // Create event data
    const eventData = {
      ...req.body,
      organizer: req.user.id,
      status: req.body.status || 'draft'  // Default to 'draft' if no status provided
    };

    console.log('Creating event with data keys:', Object.keys(eventData));
    console.log('Event title:', eventData.title);
    console.log('Event club:', eventData.club);

    // Save to database
    console.log('💾 Attempting to create event...');
    const event = await Event.create(eventData);
    console.log('✅ Event created with ID:', event._id);

    console.log('🔄 Starting post-creation steps...');

    // Update coin spending record with the actual event ID
    if (typeof COIN_COSTS !== 'undefined' && COIN_COSTS.EVENT_CREATION) {
      try {
        console.log('🔄 Updating transaction record...');
        // Find the most recent CoinTransaction for this club and update it with the event ID
        const CoinTransaction = require('../models/CoinTransaction');
        await CoinTransaction.findOneAndUpdate(
          { 
            'metadata.clubId': eventClub._id,
            'metadata.eventTitle': req.body.title,
            type: 'club_feature'
          },
          { 
            $set: { 'metadata.eventId': event._id }
          },
          { sort: { createdAt: -1 } }
        );
        console.log('✅ Updated transaction record with event ID');
      } catch (txError) {
        console.warn('⚠️ Failed to update transaction record:', txError.message);
        // Don't fail the whole process if this update fails
      }
    }

    // Simple response without population to avoid serialization issues
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        _id: event._id,
        title: event.title,
        club: event.club,
        organizer: event.organizer,
        dateTime: event.dateTime,
        status: event.status
      },
      coinCost: COIN_COSTS?.EVENT_CREATION || 0
    });
  } catch (error) {
    console.error('❌ Create event error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error type:', error.name);
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating event',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      const club = await Club.findById(event.club);
      const userRole = club.getMemberRole(req.user.id);

      if (!['organizer', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only event organizer or club organizers can edit this event'
        });
      }
    }

    if (event.hasStarted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit event that has already started'
      });
    }

    const allowedFields = [
      'title', 'description', 'dateTime', 'duration', 'format',
      'maxParticipants', 'rsvpDeadline', 'registrationFee', 'settings',
      'location.name', 'location.address' // Use dot notation for location updates
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    console.log('Event update - Updates being applied:', updates);

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: false } // Disable validators to avoid courts issue
    ).populate('club', 'name avatar location sport')
     .populate('organizer', 'firstName lastName avatar')
     .populate('rsvps.user', 'firstName lastName avatar skillLevel');

    console.log('Event after update - Courts count:', updatedEvent.location.courts.length);

    res.status(200).json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  }
});

router.post('/:id/rsvp', protect, /* clubMember, */ [
  body('status')
    .isIn(['attending', 'maybe', 'declined'])
    .withMessage('Invalid RSVP status'),
  body('skillLevel')
    .isInt({ min: 1, max: 10 })
    .withMessage('Skill level must be between 1 and 10'),
  body('preferredFormat')
    .optional()
    .isIn(['singles', 'doubles', 'mixed', 'any'])
    .withMessage('Invalid preferred format'),
  body('notes')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters')
], async (req, res) => {
  try {
    console.log('RSVP endpoint hit with:', {
      params: req.params,
      body: req.body,
      userId: req.user?.id
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.isRsvpOpen) {
      return res.status(400).json({
        success: false,
        message: 'RSVP is closed for this event'
      });
    }

    if (req.body.status === 'attending' && !event.canUserRsvp(req.user.id)) {
      const existingRsvp = event.getUserRsvp(req.user.id);
      if (!existingRsvp) {
        return res.status(400).json({
          success: false,
          message: 'Event is full. Cannot add new attendees.'
        });
      }
    }

    const userSkill = req.body.skillLevel;
    if (userSkill < event.skillLevelRange.min || userSkill > event.skillLevelRange.max) {
      return res.status(400).json({
        success: false,
        message: `Your skill level (${userSkill}) is outside the event's range (${event.skillLevelRange.min}-${event.skillLevelRange.max})`
      });
    }

    await event.addRsvp(req.user.id, req.body);

    const updatedEvent = await Event.findById(event._id)
      .populate('rsvps.user', 'firstName lastName avatar skillLevel');

    res.status(200).json({
      success: true,
      message: 'RSVP updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating RSVP'
    });
  }
});

router.delete('/:id/rsvp', protect, clubMember, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.hasStarted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel RSVP for event that has already started'
      });
    }

    await event.removeRsvp(req.user.id);

    res.status(200).json({
      success: true,
      message: 'RSVP cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling RSVP'
    });
  }
});

// Premium match generation with enhanced algorithms
router.post('/:id/generate-matches/premium', protect, requireClubCoinAccess(Club), requireCoins('AUTO_MATCH_GENERATION'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club')
      .populate('rsvps.user');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      const club = await Club.findById(event.club._id);
      const userRole = club.getMemberRole(req.user.id);

      if (!['organizer', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only event organizer or club organizers can generate matches'
        });
      }
    }

    if (event.attendingCount < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 attending players required to generate matches'
      });
    }

    if (event.format === 'doubles' && event.attendingCount < 4) {
      return res.status(400).json({
        success: false,
        message: 'At least 4 attending players required for doubles matches'
      });
    }

    // Enhanced match generation with premium algorithms
    await event.generateMatches();
    
    // Mark as premium generation
    event.isPremiumGeneration = true;
    await event.save();

    // Spend coins for premium match generation
    await spendCoins(
      req,
      'event_premium',
      `Premium match generation for event: ${event.title}`,
      {
        clubId: event.club._id,
        eventId: event._id,
        featureType: 'premium_match_generation'
      }
    );

    const updatedEvent = await Event.findById(event._id)
      .populate('matches.players.team1', 'firstName lastName avatar skillLevel')
      .populate('matches.players.team2', 'firstName lastName avatar skillLevel');

    res.status(200).json({
      success: true,
      message: 'Premium matches generated successfully',
      data: updatedEvent,
      coinCost: COIN_COSTS.AUTO_MATCH_GENERATION
    });
  } catch (error) {
    console.error('Generate premium matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating premium matches'
    });
  }
});

// Basic (free) match generation
router.post('/:id/generate-matches', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('club')
      .populate('rsvps.user');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      const club = await Club.findById(event.club._id);
      const userRole = club.getMemberRole(req.user.id);

      if (!['organizer', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only event organizer or club organizers can generate matches'
        });
      }
    }

    if (event.attendingCount < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 attending players required to generate matches'
      });
    }

    if (event.format === 'doubles' && event.attendingCount < 4) {
      return res.status(400).json({
        success: false,
        message: 'At least 4 attending players required for doubles matches'
      });
    }

    await event.generateMatches();

    const updatedEvent = await Event.findById(event._id)
      .populate('matches.players.team1', 'firstName lastName avatar skillLevel')
      .populate('matches.players.team2', 'firstName lastName avatar skillLevel');

    res.status(200).json({
      success: true,
      message: 'Matches generated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Generate matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating matches'
    });
  }
});

router.put('/:id/matches/:matchIndex/score', protect, clubMember, [
  body('score.team1').isInt({ min: 0 }).withMessage('Team 1 score must be a positive integer'),
  body('score.team2').isInt({ min: 0 }).withMessage('Team 2 score must be a positive integer'),
  body('sets').optional().isArray().withMessage('Sets must be an array')
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

    const event = await Event.findById(req.params.id);
    const matchIndex = parseInt(req.params.matchIndex);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (matchIndex >= event.matches.length || matchIndex < 0) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const match = event.matches[matchIndex];

    const isPlayerInMatch = match.players.team1.some(p => p.toString() === req.user.id.toString()) ||
                           match.players.team2.some(p => p.toString() === req.user.id.toString());

    if (!isPlayerInMatch && event.organizer.toString() !== req.user.id.toString()) {
      const club = await Club.findById(event.club);
      const userRole = club.getMemberRole(req.user.id);

      if (!['organizer', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only players in the match or organizers can update scores'
        });
      }
    }

    match.score = req.body.score;
    if (req.body.sets) {
      match.score.sets = req.body.sets;
    }

    if (req.body.score.team1 > req.body.score.team2) {
      match.winner = 'team1';
    } else if (req.body.score.team2 > req.body.score.team1) {
      match.winner = 'team2';
    } else {
      match.winner = 'draw';
    }

    match.status = 'completed';

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Match score updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update match score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating match score'
    });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      const club = await Club.findById(event.club);
      const userRole = club.getMemberRole(req.user.id);

      if (!['organizer', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only event organizer or club organizers can change event status'
        });
      }
    }

    const allowedTransitions = {
      'draft': ['published', 'cancelled'],
      'published': ['ongoing', 'cancelled'],
      'ongoing': ['completed'],
      'completed': [],
      'cancelled': []
    };

    if (!allowedTransitions[event.status].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${event.status} to ${req.body.status}`
      });
    }

    const oldStatus = event.status;
    const newStatus = req.body.status;

    console.log('Before status update - Event courts:', event.location.courts);
    console.log('Event type:', event.eventType);
    console.log('Event format:', event.format);

    // If publishing a sports event without courts, add default courts
    if (newStatus === 'published' && (event.eventType === 'sports' || event.eventType === 'tournament')) {
      if (!event.location.courts || event.location.courts.length === 0) {
        console.log('⚠️ No courts found, adding default courts');
        event.location.courts = [
          { name: 'Court 1', isAvailable: true },
          { name: 'Court 2', isAvailable: true }
        ];
      }
    }

    event.status = newStatus;
    await event.save();

    // Get club information for notifications
    const club = await Club.findById(event.club);
    
    // Send notifications for status changes
    try {
      if (newStatus === 'published' && oldStatus === 'draft') {
        // Event published notification
        await NotificationService.notifyEventPublished(event, club, req.user, socketService.getIO());
        console.log(`Event published notification sent for event: ${event.title}`);
      } else if (newStatus === 'cancelled') {
        // Event cancelled notification
        await NotificationService.notifyEventStatusChange(event, club, req.user, oldStatus, newStatus, socketService.getIO());
        console.log(`Event cancelled notification sent for event: ${event.title}`);
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(200).json({
      success: true,
      message: 'Event status updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating event status'
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      const club = await Club.findById(event.club);
      const userRole = club.getMemberRole(req.user.id);

      if (!['organizer', 'admin'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only event organizer or club organizers can delete events'
        });
      }
    }

    if (event.hasStarted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event that has already started'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
});

module.exports = router;