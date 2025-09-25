const User = require('../models/User');

// Update user's last active timestamp on authenticated requests
const updateLastActive = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      // Only update if it's been more than 5 minutes since last update to avoid excessive DB writes
      const user = await User.findById(req.user.id).select('lastActive');
      if (!user.lastActive || (Date.now() - user.lastActive.getTime()) > 5 * 60 * 1000) {
        await user.updateLastActive();
      }
    } catch (error) {
      // Don't fail the request if analytics tracking fails
      console.error('Error updating user last active:', error);
    }
  }
  next();
};

module.exports = {
  updateLastActive
};