const User = require('../models/User');

// Coin costs configuration
const COIN_COSTS = {
  // Core operations
  CLUB_CREATION: 20,  // Personal coins for creating a club
  EVENT_CREATION: 10, // Club coins for creating any event
  MEMBER_APPROVAL: 5, // Club coins for approving member join requests
  
  // Event features
  BASIC_EVENT: 0,
  PREMIUM_EVENT: 3,
  TOURNAMENT_EVENT: 5,
  AUTO_MATCH_GENERATION: 2,
  
  // Club management
  BULK_INVITES: 1, // per 10 invites
  MEMBER_ANALYTICS: 2, // per month
  PREMIUM_COMMUNICATION: 1, // per month
  
  // Club promotion
  FEATURED_LISTING: 5, // per week
  ENHANCED_PROFILE: 3, // per month
  PRIORITY_SEARCH: 2, // per week
  
  // Advanced features
  CUSTOM_ALGORITHMS: 10,
  EXTERNAL_BOOKING: 15,
  TOURNAMENT_HOSTING: 20,
  ADVANCED_STATISTICS: 5
};

// Middleware to check if user can afford a specific coin cost
const requireCoins = (costType, customAmount = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const amount = customAmount || COIN_COSTS[costType];
      if (amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coin cost type'
        });
      }

      // Free features
      if (amount === 0) {
        return next();
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.canAfford(amount)) {
        return res.status(402).json({
          success: false,
          message: 'Insufficient coins',
          data: {
            required: amount,
            available: user.coinWallet.balance,
            shortfall: amount - user.coinWallet.balance
          }
        });
      }

      // Store cost info for later spending
      req.coinCost = {
        amount,
        type: costType,
        user
      };

      next();
    } catch (error) {
      console.error('Coin authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during coin authorization'
      });
    }
  };
};

// Middleware to check club ownership/admin rights for coin spending
const requireClubCoinAccess = (Club) => {
  return async (req, res, next) => {
    try {
      const clubId = req.params.id || req.params.clubId || req.body.club;
      if (!clubId) {
        return res.status(400).json({
          success: false,
          message: 'Club ID required'
        });
      }

      const club = await Club.findById(clubId);
      if (!club) {
        return res.status(404).json({
          success: false,
          message: 'Club not found'
        });
      }

      // Check if user is owner or admin
      const userRole = club.getMemberRole(req.user.id);
      const isOwner = club.owner.toString() === req.user.id;
      const isAdmin = userRole === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only club owners and admins can spend coins on club features'
        });
      }

      req.club = club;
      next();
    } catch (error) {
      console.error('Club coin access error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during club authorization'
      });
    }
  };
};

// Function to spend coins after successful operation
const spendCoins = async (req, transactionType, description, metadata = {}) => {
  if (!req.coinCost || req.coinCost.amount === 0) {
    return true;
  }

  try {
    await req.coinCost.user.spendCoins(
      req.coinCost.amount,
      transactionType,
      description,
      metadata
    );
    return true;
  } catch (error) {
    console.error('Error spending coins:', error);
    throw new Error('Failed to process coin payment');
  }
};

// Helper function to calculate dynamic costs
const calculateDynamicCost = (baseType, multiplier = 1, additionalParams = {}) => {
  const baseCost = COIN_COSTS[baseType];
  if (baseCost === undefined) return 0;
  
  let finalCost = baseCost * multiplier;
  
  // Apply any additional cost modifiers
  if (additionalParams.premiumMultiplier) {
    finalCost *= additionalParams.premiumMultiplier;
  }
  
  return Math.ceil(finalCost);
};

// Middleware for bulk operations with variable costs
const requireVariableCoins = (costCalculator) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const amount = await costCalculator(req);
      if (amount === 0) {
        return next();
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.canAfford(amount)) {
        return res.status(402).json({
          success: false,
          message: 'Insufficient coins',
          data: {
            required: amount,
            available: user.coinWallet.balance,
            shortfall: amount - user.coinWallet.balance
          }
        });
      }

      req.coinCost = {
        amount,
        type: 'variable_cost',
        user
      };

      next();
    } catch (error) {
      console.error('Variable coin authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during coin authorization'
      });
    }
  };
};

module.exports = {
  requireCoins,
  requireClubCoinAccess,
  requireVariableCoins,
  spendCoins,
  calculateDynamicCost,
  COIN_COSTS
};