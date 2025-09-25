const express = require('express');
const { query, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// Get user notifications
router.get('/', protect, [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be 0 or greater')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const result = await NotificationService.getUserNotifications(req.user.id, limit, skip);

    res.status(200).json({
      success: true,
      data: {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        total: result.total,
        pagination: {
          limit,
          skip,
          hasMore: skip + limit < result.total
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await NotificationService.markNotificationAsRead(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating notification'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    const updatedCount = await NotificationService.markAllNotificationsAsRead(req.user.id);

    res.status(200).json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      data: { updatedCount }
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notifications'
    });
  }
});

// Get unread count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const result = await NotificationService.getUserNotifications(req.user.id, 1, 0);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: result.unreadCount
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unread count'
    });
  }
});

module.exports = router;