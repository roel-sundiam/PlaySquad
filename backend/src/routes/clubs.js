const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Club = require('../models/Club');
const User = require('../models/User');
const { protect, clubMember, clubOrganizer } = require('../middleware/auth');
const { requireCoins, requireClubCoinAccess, spendCoins, COIN_COSTS } = require('../middleware/coinAuth');

const router = express.Router();

// Route to browse all available clubs (for discovery and joining)
router.get('/browse', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sport').optional().isIn(['tennis', 'badminton', 'squash', 'table-tennis', 'pickleball']),
  query('search').optional().isLength({ min: 1, max: 100 })
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

    let query = { isActive: true, isPrivate: false };

    if (req.query.sport) {
      query.sport = req.query.sport;
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'location.name': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const clubs = await Club.find(query)
      .populate('owner', 'firstName lastName avatar')
      .populate('joinRequests.user', 'firstName lastName email avatar skillLevel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Club.countDocuments(query);

    res.status(200).json({
      success: true,
      data: clubs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Browse clubs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while browsing clubs'
    });
  }
});

// Route to get user's clubs (clubs they are members of)
router.get('/', protect, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sport').optional().isIn(['tennis', 'badminton', 'squash', 'table-tennis', 'pickleball']),
  query('search').optional().isLength({ min: 1, max: 100 })
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

    // Only show clubs the user is a member of
    const userClubs = req.user.clubs.map(club => club.club);
    console.log(`User ${req.user.email} has clubs:`, userClubs);
    
    let query = { 
      isActive: true,
      _id: { $in: userClubs }
    };

    if (req.query.sport) {
      query.sport = req.query.sport;
    }

    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { 'location.name': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // If user has no clubs, return empty result
    if (userClubs.length === 0) {
      console.log(`User ${req.user.email} has no clubs, returning empty result`);
      query._id = { $in: [] };
    }

    const clubs = await Club.find(query)
      .populate('owner', 'firstName lastName avatar')
      .populate('members.user', 'firstName lastName avatar skillLevel')
      .populate('joinRequests.user', 'firstName lastName email avatar skillLevel')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Club.countDocuments(query);

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).json({
      success: true,
      data: clubs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clubs'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('owner', 'firstName lastName avatar email')
      .populate('members.user', 'firstName lastName avatar skillLevel preferredFormat stats');

    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    res.status(200).json({
      success: true,
      data: club
    });
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching club'
    });
  }
});

router.post('/', protect, requireCoins('CLUB_CREATION'), [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Club name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('sport')
    .isIn(['tennis', 'badminton', 'squash', 'table-tennis', 'pickleball'])
    .withMessage('Invalid sport type'),
  body('location.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location name is required'),
  body('location.address')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address is required'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean')
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

    const clubData = {
      ...req.body,
      owner: req.user.id
    };

    const club = await Club.create(clubData);

    await club.addMember(req.user.id, 'admin');

    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        clubs: {
          club: club._id,
          role: 'admin',
          joinedAt: new Date()
        }
      }
    });

    const populatedClub = await Club.findById(club._id)
      .populate('owner', 'firstName lastName avatar')
      .populate('members.user', 'firstName lastName avatar');

    // Spend coins after successful club creation
    await spendCoins(req, 'club_feature', `Club creation: ${club.name}`, {
      clubId: club._id,
      clubName: club.name
    });

    res.status(201).json({
      success: true,
      data: populatedClub
    });
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating club'
    });
  }
});

router.put('/:id', protect, clubOrganizer, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Club name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('location.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location name is required'),
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Address is required')
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

    const allowedFields = ['name', 'description', 'location', 'settings', 'avatar', 'coverImage'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const club = await Club.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName avatar')
     .populate('members.user', 'firstName lastName avatar');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    res.status(200).json({
      success: true,
      data: club
    });
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating club'
    });
  }
});

router.post('/:id/join', protect, [
  body('inviteCode')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Invite code is required for private clubs'),
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Message cannot exceed 200 characters')
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

    const club = await Club.findById(req.params.id);

    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    if (club.isPrivate && (!req.body.inviteCode || req.body.inviteCode !== club.inviteCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    if (club.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this club'
      });
    }

    // Check if user already has a pending request
    const existingRequest = club.joinRequests.find(
      request => request.user.toString() === req.user.id && request.status === 'pending'
    );
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending join request for this club'
      });
    }

    if (club.memberCount >= club.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Club has reached maximum member capacity'
      });
    }

    const userSkill = req.user.skillLevel;
    if (userSkill < club.settings.minSkillLevel || userSkill > club.settings.maxSkillLevel) {
      return res.status(400).json({
        success: false,
        message: `Your skill level (${userSkill}) is outside the club's accepted range (${club.settings.minSkillLevel}-${club.settings.maxSkillLevel})`
      });
    }

    // Check if club requires approval
    console.log(`🔧 DEBUG: Club "${club.name}" autoAcceptMembers: ${club.settings.autoAcceptMembers}`);
    if (club.settings.autoAcceptMembers) {
      // Auto-accept: directly add member
      await club.addMember(req.user.id);

      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          clubs: {
            club: club._id,
            role: 'member',
            joinedAt: new Date()
          }
        }
      });

      const updatedClub = await Club.findById(club._id)
        .populate('members.user', 'firstName lastName avatar');

      res.status(200).json({
        success: true,
        message: 'Successfully joined the club',
        data: updatedClub
      });
    } else {
      // Requires approval: create join request
      club.joinRequests.push({
        user: req.user.id,
        message: req.body.message || '',
        status: 'pending',
        requestedAt: new Date()
      });

      await club.save();

      res.status(200).json({
        success: true,
        message: 'Join request submitted. Waiting for club admin approval.',
        data: { 
          status: 'pending',
          requestedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Join club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining club'
    });
  }
});

router.post('/:id/leave', protect, clubMember, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    if (club.owner.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Club owner cannot leave the club. Transfer ownership first.'
      });
    }

    await club.removeMember(req.user.id);

    await User.findByIdAndUpdate(req.user.id, {
      $pull: {
        clubs: { club: club._id }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the club'
    });
  } catch (error) {
    console.error('Leave club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while leaving club'
    });
  }
});

router.put('/:id/members/:userId/role', protect, clubOrganizer, [
  body('role')
    .isIn(['member', 'organizer', 'admin'])
    .withMessage('Invalid role')
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

    const club = await Club.findById(req.params.id);
    const { userId } = req.params;
    const { role } = req.body;

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    if (club.owner.toString() === userId.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change the role of the club owner'
      });
    }

    if (req.userRole !== 'admin' && role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can assign admin role'
      });
    }

    await club.updateMemberRole(userId, role);

    await User.findOneAndUpdate(
      { _id: userId, 'clubs.club': club._id },
      { $set: { 'clubs.$.role': role } }
    );

    const updatedClub = await Club.findById(club._id)
      .populate('members.user', 'firstName lastName avatar');

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: updatedClub
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating member role'
    });
  }
});

router.delete('/:id/members/:userId', protect, clubOrganizer, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const { userId } = req.params;

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    if (club.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the club owner'
      });
    }

    const memberRole = club.getMemberRole(userId);
    if (req.userRole !== 'admin' && memberRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove other admins'
      });
    }

    await club.removeMember(userId);

    await User.findByIdAndUpdate(userId, {
      $pull: {
        clubs: { club: club._id }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
});

// Get pending join requests for a club (admin only)
router.get('/:id/requests', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('joinRequests.user', 'firstName lastName email avatar skillLevel');

    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Check if user is admin or organizer
    const userRole = club.getMemberRole(req.user.id);
    if (!userRole || (userRole !== 'admin' && userRole !== 'organizer')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or organizer role required.'
      });
    }

    const pendingRequests = club.joinRequests.filter(request => request.status === 'pending');

    res.status(200).json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    console.error('Get join requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching join requests'
    });
  }
});

// Approve or reject join request
router.put('/:id/requests/:requestId', protect, [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')
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

    const club = await Club.findById(req.params.id);
    
    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Check if user is admin or organizer
    const userRole = club.getMemberRole(req.user.id);
    if (!userRole || (userRole !== 'admin' && userRole !== 'organizer')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or organizer role required.'
      });
    }

    const request = club.joinRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    const { action } = req.body;
    
    if (action === 'approve') {
      // Check if club has enough coins for member approval
      if (!club.canAfford(COIN_COSTS.MEMBER_APPROVAL)) {
        return res.status(402).json({
          success: false,
          message: 'Insufficient club coins for member approval',
          data: {
            required: COIN_COSTS.MEMBER_APPROVAL,
            available: club.coinWallet.balance,
            shortfall: COIN_COSTS.MEMBER_APPROVAL - club.coinWallet.balance
          }
        });
      }

      // Check if club is at capacity
      if (club.memberCount >= club.settings.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Club has reached maximum member capacity'
        });
      }

      // Add user to club
      await club.addMember(request.user);
      
      // Add club to user's clubs
      await User.findByIdAndUpdate(request.user, {
        $push: {
          clubs: {
            club: club._id,
            role: 'member',
            joinedAt: new Date()
          }
        }
      });

      request.status = 'approved';
      request.respondedAt = new Date();
      request.respondedBy = req.user.id;
      
      await club.save();

      // Spend club coins after successful member approval
      const approvedUser = await User.findById(request.user);
      await club.spendCoins(
        COIN_COSTS.MEMBER_APPROVAL,
        'member_approval',
        `Member approval: ${approvedUser.firstName} ${approvedUser.lastName} joined ${club.name}`,
        {
          newMemberId: request.user,
          memberName: `${approvedUser.firstName} ${approvedUser.lastName}`,
          approvedBy: req.user.id
        }
      );

      res.status(200).json({
        success: true,
        message: 'Join request approved successfully'
      });
    } else {
      // Reject request
      request.status = 'rejected';
      request.respondedAt = new Date();
      request.respondedBy = req.user.id;
      
      await club.save();

      res.status(200).json({
        success: true,
        message: 'Join request rejected'
      });
    }
  } catch (error) {
    console.error('Process join request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing join request'
    });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    if (club.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the club owner can delete the club'
      });
    }

    club.isActive = false;
    await club.save();

    await User.updateMany(
      { 'clubs.club': club._id },
      { $pull: { clubs: { club: club._id } } }
    );

    res.status(200).json({
      success: true,
      message: 'Club deleted successfully'
    });
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting club'
    });
  }
});

// Premium club promotion features

// Feature club for enhanced visibility (costs coins)
router.post('/:id/promote/featured', protect, requireClubCoinAccess(Club), requireCoins('FEATURED_LISTING'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const duration = req.body.duration || 7; // default 7 days
    const endDate = new Date(Date.now() + (duration * 24 * 60 * 60 * 1000));

    // Add featured status
    club.promotions = club.promotions || {};
    club.promotions.featured = {
      active: true,
      startDate: new Date(),
      endDate: endDate,
      paidBy: req.user.id
    };

    await club.save();

    // Spend coins for featuring
    await spendCoins(
      req,
      'promotion',
      `Featured club listing for ${duration} days: ${club.name}`,
      {
        clubId: club._id,
        promotionType: 'featured_listing',
        duration: duration
      }
    );

    res.status(200).json({
      success: true,
      message: `Club featured successfully for ${duration} days`,
      data: club,
      coinCost: COIN_COSTS.FEATURED_LISTING
    });
  } catch (error) {
    console.error('Feature club error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while featuring club'
    });
  }
});

// Priority search ranking (costs coins)
router.post('/:id/promote/priority', protect, requireClubCoinAccess(Club), requireCoins('PRIORITY_SEARCH'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const duration = req.body.duration || 7; // default 7 days
    const endDate = new Date(Date.now() + (duration * 24 * 60 * 60 * 1000));

    // Add priority search status
    club.promotions = club.promotions || {};
    club.promotions.prioritySearch = {
      active: true,
      startDate: new Date(),
      endDate: endDate,
      paidBy: req.user.id
    };

    await club.save();

    // Spend coins for priority search
    await spendCoins(
      req,
      'promotion',
      `Priority search ranking for ${duration} days: ${club.name}`,
      {
        clubId: club._id,
        promotionType: 'priority_search',
        duration: duration
      }
    );

    res.status(200).json({
      success: true,
      message: `Club prioritized in search for ${duration} days`,
      data: club,
      coinCost: COIN_COSTS.PRIORITY_SEARCH
    });
  } catch (error) {
    console.error('Priority search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while prioritizing club'
    });
  }
});

// Enhanced club profile (costs coins monthly)
router.post('/:id/promote/enhanced-profile', protect, requireClubCoinAccess(Club), requireCoins('ENHANCED_PROFILE'), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const duration = 30; // 30 days for enhanced profile
    const endDate = new Date(Date.now() + (duration * 24 * 60 * 60 * 1000));

    // Add enhanced profile features
    club.promotions = club.promotions || {};
    club.promotions.enhancedProfile = {
      active: true,
      startDate: new Date(),
      endDate: endDate,
      paidBy: req.user.id,
      features: req.body.features || ['custom_theme', 'detailed_analytics', 'advanced_member_management']
    };

    await club.save();

    // Spend coins for enhanced profile
    await spendCoins(
      req,
      'promotion',
      `Enhanced profile features for 30 days: ${club.name}`,
      {
        clubId: club._id,
        promotionType: 'enhanced_profile',
        duration: duration,
        features: club.promotions.enhancedProfile.features
      }
    );

    res.status(200).json({
      success: true,
      message: 'Enhanced profile activated for 30 days',
      data: club,
      coinCost: COIN_COSTS.ENHANCED_PROFILE
    });
  } catch (error) {
    console.error('Enhanced profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating enhanced profile'
    });
  }
});

// Bulk member invitations (costs coins per batch)
router.post('/:id/invite-bulk', protect, requireClubCoinAccess(Club), (req, res, next) => {
  const emailCount = req.body.emails ? req.body.emails.length : 0;
  const coinCost = Math.ceil(emailCount / 10) * COIN_COSTS.BULK_INVITES;
  
  if (coinCost > 0) {
    return requireCoins('BULK_INVITES', coinCost)(req, res, next);
  } else {
    next();
  }
}, [
  body('emails')
    .isArray({ min: 1, max: 100 })
    .withMessage('Emails array required (1-100 emails)'),
  body('emails.*')
    .isEmail()
    .withMessage('Valid email addresses required'),
  body('message')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Message cannot exceed 200 characters')
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

    const club = await Club.findById(req.params.id);
    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const { emails, message } = req.body;
    const emailCount = emails.length;
    const coinCost = Math.ceil(emailCount / 10) * COIN_COSTS.BULK_INVITES;

    // In a real implementation, you would:
    // 1. Send invitation emails
    // 2. Track invitation status
    // 3. Handle responses

    // For demo purposes, we'll simulate the process
    const invitations = emails.map(email => ({
      email,
      invitedBy: req.user.id,
      message: message || `You're invited to join ${club.name}!`,
      status: 'sent',
      invitedAt: new Date()
    }));

    // Add to club's invitation tracking (if you want to track this)
    club.bulkInvitations = club.bulkInvitations || [];
    club.bulkInvitations.push({
      batchId: new Date().getTime(),
      invitedBy: req.user.id,
      emails: emails,
      message: message,
      sentAt: new Date(),
      status: 'completed'
    });

    await club.save();

    // Spend coins for bulk invitations
    if (coinCost > 0) {
      await spendCoins(
        req,
        'club_feature',
        `Bulk invitations sent: ${emailCount} emails to ${club.name}`,
        {
          clubId: club._id,
          featureType: 'bulk_invitations',
          emailCount: emailCount
        }
      );
    }

    res.status(200).json({
      success: true,
      message: `${emailCount} invitations sent successfully`,
      data: {
        invitationsSent: emailCount,
        coinCost: coinCost,
        club: club
      }
    });
  } catch (error) {
    console.error('Bulk invite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending bulk invitations'
    });
  }
});

// Get club promotion status and available features
router.get('/:id/promotions', protect, clubMember, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club || !club.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const now = new Date();
    const promotions = club.promotions || {};
    
    // Check and update expired promotions
    Object.keys(promotions).forEach(key => {
      if (promotions[key].active && promotions[key].endDate < now) {
        promotions[key].active = false;
      }
    });

    if (Object.keys(promotions).length > 0) {
      club.promotions = promotions;
      await club.save();
    }

    // Calculate available features and costs
    const availableFeatures = [
      {
        id: 'featured_listing',
        name: 'Featured Listing',
        description: 'Highlight your club at the top of search results',
        cost: COIN_COSTS.FEATURED_LISTING,
        duration: '7 days',
        active: promotions.featured?.active || false,
        expiresAt: promotions.featured?.endDate || null
      },
      {
        id: 'priority_search',
        name: 'Priority Search Ranking',
        description: 'Boost your club in search rankings',
        cost: COIN_COSTS.PRIORITY_SEARCH,
        duration: '7 days',
        active: promotions.prioritySearch?.active || false,
        expiresAt: promotions.prioritySearch?.endDate || null
      },
      {
        id: 'enhanced_profile',
        name: 'Enhanced Profile',
        description: 'Advanced customization and analytics',
        cost: COIN_COSTS.ENHANCED_PROFILE,
        duration: '30 days',
        active: promotions.enhancedProfile?.active || false,
        expiresAt: promotions.enhancedProfile?.endDate || null
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        promotions: availableFeatures,
        bulkInviteCost: COIN_COSTS.BULK_INVITES,
        bulkInviteDescription: '1 coin per 10 email invitations'
      }
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching promotions'
    });
  }
});

// ===== CLUB COIN MANAGEMENT ENDPOINTS =====

// Test route to verify coin endpoints are loading
router.get('/:id/coins/test', (req, res) => {
  res.json({ success: true, message: 'Club coin routes are working!' });
});

// Simplified club wallet endpoint for testing
router.get('/:id/coins/wallet-simple', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }
    
    // Initialize coinWallet if needed
    if (!club.coinWallet) {
      club.coinWallet = { balance: 0, totalEarned: 0, totalSpent: 0, lastTransactionAt: null };
      await club.save();
    }
    
    res.json({
      success: true,
      data: {
        balance: club.coinWallet.balance,
        totalEarned: club.coinWallet.totalEarned,
        totalSpent: club.coinWallet.totalSpent,
        lastTransactionAt: club.coinWallet.lastTransactionAt,
        recentTransactions: [],
        canManageCoins: true // For testing
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit coin purchase request for admin approval
router.post('/:id/coins/purchase-request', [
  protect,
  body('packageId').isIn(['starter', 'basic', 'popular', 'premium', 'enterprise']).withMessage('Invalid package ID'),
  body('paymentMethod').isIn(['gcash', 'bank_transfer', 'cash']).withMessage('Invalid payment method'),
  body('paymentDetails').isObject().withMessage('Payment details are required'),
  body('paymentDetails.amount').isNumeric().withMessage('Amount is required'),
  body('paymentDetails.referenceNumber').optional().isString(),
  body('paymentDetails.notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { packageId, paymentMethod, paymentDetails } = req.body;
    const CoinPurchaseRequest = require('../models/CoinPurchaseRequest');
    
    const COIN_PACKAGES = {
      starter: { coins: 50, price: 249, bonus: 0 },
      basic: { coins: 100, price: 499, bonus: 10 },
      popular: { coins: 250, price: 999, bonus: 50 },
      premium: { coins: 500, price: 1999, bonus: 100 },
      enterprise: { coins: 1000, price: 3499, bonus: 200 }
    };

    const packageInfo = COIN_PACKAGES[packageId];
    if (!packageInfo) {
      return res.status(400).json({ success: false, message: 'Invalid package ID' });
    }

    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    // Check if user is admin/owner of the club
    const userRole = club.getMemberRole(req.user.id);
    const isOwner = club.owner.toString() === req.user.id;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only club owners and admins can request coin purchases'
      });
    }

    // Create purchase request
    const purchaseRequest = await CoinPurchaseRequest.create({
      requester: req.user.id,
      club: club._id,
      packageId,
      packageDetails: {
        name: packageId.charAt(0).toUpperCase() + packageId.slice(1),
        coins: packageInfo.coins,
        bonusCoins: packageInfo.bonus,
        totalCoins: packageInfo.coins + packageInfo.bonus,
        price: packageInfo.price
      },
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        amount: packageInfo.price
      }
    });

    res.json({
      success: true,
      message: 'Coin purchase request submitted successfully. Please wait for admin approval.',
      data: {
        requestId: purchaseRequest._id,
        packageId,
        totalCoins: packageInfo.coins + packageInfo.bonus,
        price: packageInfo.price,
        status: 'pending',
        message: 'Your request has been submitted and is pending approval by our admin team. You will receive coins once approved.'
      }
    });

  } catch (error) {
    console.error('Purchase request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get club's coin wallet information
router.get('/:id/coins/wallet', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    // Initialize coinWallet if it doesn't exist (for existing clubs)
    if (!club.coinWallet) {
      club.coinWallet = {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
        lastTransactionAt: null
      };
      await club.save();
    }

    // Check if user is admin/owner to see full details
    const userRole = club.getMemberRole(req.user.id);
    const isOwner = club.owner.toString() === req.user.id;
    const isAdmin = userRole === 'admin';
    const canManageCoins = isOwner || isAdmin;

    // Get recent club transactions if user has permission
    let recentTransactions = [];
    if (canManageCoins) {
      const CoinTransaction = require('../models/CoinTransaction');
      recentTransactions = await CoinTransaction.find({ 'metadata.clubId': club._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'firstName lastName');
    }

    res.json({
      success: true,
      data: {
        balance: club.coinWallet.balance,
        totalEarned: canManageCoins ? club.coinWallet.totalEarned : undefined,
        totalSpent: canManageCoins ? club.coinWallet.totalSpent : undefined,
        lastTransactionAt: canManageCoins ? club.coinWallet.lastTransactionAt : undefined,
        recentTransactions: canManageCoins ? recentTransactions : [],
        canManageCoins
      }
    });
  } catch (error) {
    console.error('Get club wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving club wallet information'
    });
  }
});

// Purchase coins for club (admin/owner only)
router.post('/:id/coins/purchase', [
  protect,
  requireClubCoinAccess(Club),
  body('packageId').notEmpty().withMessage('Package ID is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('paymentToken').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { packageId, paymentMethod, paymentToken } = req.body;
    
    // Get coin packages from the main coins route
    const COIN_PACKAGES = {
      starter: { coins: 50, price: 249, bonus: 0 },
      basic: { coins: 100, price: 499, bonus: 10 },
      popular: { coins: 250, price: 999, bonus: 50 },
      premium: { coins: 500, price: 1999, bonus: 100 },
      enterprise: { coins: 1000, price: 3499, bonus: 200 }
    };

    const package = COIN_PACKAGES[packageId];
    if (!package) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package ID'
      });
    }

    // Mock payment processing (same as user coin purchase)
    const paymentId = `club_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const paymentSuccessful = true;

    if (!paymentSuccessful) {
      return res.status(402).json({
        success: false,
        message: 'Payment processing failed'
      });
    }

    const club = req.club;

    // Add base coins to club
    await club.addCoins(
      package.coins,
      'purchase',
      `Club purchased ${packageId} package - ${package.coins} coins`,
      { paymentId, packageId, price: package.price, purchasedBy: req.user.id }
    );

    // Add bonus coins if any
    if (package.bonus > 0) {
      await club.addCoins(
        package.bonus,
        'purchase',
        `Bonus coins from ${packageId} package - ${package.bonus} coins`,
        { paymentId, packageId, isBonus: true, purchasedBy: req.user.id }
      );
    }

    res.json({
      success: true,
      message: 'Club coins purchased successfully',
      data: {
        packageId,
        coinsAdded: package.coins + package.bonus,
        baseCoins: package.coins,
        bonusCoins: package.bonus,
        newBalance: club.coinWallet.balance,
        paymentId
      }
    });

  } catch (error) {
    console.error('Club coin purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing club coin purchase'
    });
  }
});

// Transfer coins from user to club (for funding club activities)
router.post('/:id/coins/transfer', [
  protect,
  clubMember,
  body('amount').isInt({ min: 1, max: 1000 }).withMessage('Amount must be between 1 and 1000'),
  body('message').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Coin transfer validation errors:', errors.array());
      console.error('Request body:', req.body);
      console.error('Request params:', req.params);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { amount, message } = req.body;
    const club = await Club.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!club || !user) {
      return res.status(404).json({
        success: false,
        message: 'Club or user not found'
      });
    }

    // Check if user has enough coins
    if (!user.canAfford(amount)) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient personal coins',
        data: {
          required: amount,
          available: user.coinWallet.balance,
          shortfall: amount - user.coinWallet.balance
        }
      });
    }

    // Transfer coins from user to club
    await user.spendCoins(
      amount,
      'club_transfer',
      `Transferred ${amount} coins to ${club.name}`,
      { clubId: club._id, clubName: club.name, message }
    );

    await club.addCoins(
      amount,
      'transfer_received',
      `Received ${amount} coins from ${user.fullName}${message ? ': ' + message : ''}`,
      { transferredBy: user._id, transferrerName: user.fullName, message }
    );

    res.json({
      success: true,
      message: 'Coins transferred to club successfully',
      data: {
        amount,
        userNewBalance: user.coinWallet.balance,
        clubNewBalance: club.coinWallet.balance,
        message
      }
    });

  } catch (error) {
    console.error('Coin transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transferring coins to club'
    });
  }
});

// Get club coin transaction history (admin/owner only)
router.get('/:id/coins/transactions', protect, requireClubCoinAccess(Club), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const CoinTransaction = require('../models/CoinTransaction');
    const transactions = await CoinTransaction.find({ 'metadata.clubId': req.params.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName')
      .populate('metadata.transferredBy', 'firstName lastName');

    const totalTransactions = await CoinTransaction.countDocuments({ 'metadata.clubId': req.params.id });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalTransactions / limit),
          totalTransactions
        }
      }
    });
  } catch (error) {
    console.error('Get club transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving club transaction history'
    });
  }
});

// Get available club features and their coin costs
router.get('/:id/coins/features', protect, clubMember, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const userRole = club.getMemberRole(req.user.id);
    const isOwner = club.owner.toString() === req.user.id;
    const isAdmin = userRole === 'admin';
    const canPurchaseFeatures = isOwner || isAdmin;

    const features = [
      {
        id: 'PREMIUM_EVENT',
        name: 'Premium Event Creation',
        description: 'Create events with advanced features like custom algorithms and premium notifications',
        cost: COIN_COSTS.PREMIUM_EVENT,
        category: 'events'
      },
      {
        id: 'TOURNAMENT_EVENT',
        name: 'Tournament Event',
        description: 'Host tournament-style events with brackets and rankings',
        cost: COIN_COSTS.TOURNAMENT_EVENT,
        category: 'events'
      },
      {
        id: 'FEATURED_LISTING',
        name: 'Featured Club Listing',
        description: 'Get your club featured in search results for one week',
        cost: COIN_COSTS.FEATURED_LISTING,
        duration: '1 week',
        category: 'promotion'
      },
      {
        id: 'ENHANCED_PROFILE',
        name: 'Enhanced Club Profile',
        description: 'Unlock custom themes and detailed analytics',
        cost: COIN_COSTS.ENHANCED_PROFILE,
        duration: '1 month',
        category: 'promotion'
      },
      {
        id: 'BULK_INVITES',
        name: 'Bulk Member Invitations',
        description: 'Send invitations to multiple members at once',
        cost: COIN_COSTS.BULK_INVITES,
        unit: 'per 10 invites',
        category: 'management'
      },
      {
        id: 'MEMBER_ANALYTICS',
        name: 'Advanced Member Analytics',
        description: 'Detailed insights into member activity and engagement',
        cost: COIN_COSTS.MEMBER_ANALYTICS,
        duration: '1 month',
        category: 'analytics'
      }
    ];

    res.json({
      success: true,
      data: {
        features,
        canPurchaseFeatures,
        clubBalance: club.coinWallet?.balance || 0
      }
    });
  } catch (error) {
    console.error('Get club features error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving club features'
    });
  }
});

module.exports = router;