const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();

const Message = require('../models/Message');
const Club = require('../models/Club');
const { protect, clubMember } = require('../middleware/auth');

router.get('/club/:clubId', protect, clubMember, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('before').optional().isMongoId().withMessage('Invalid message ID for before parameter'),
  query('type').optional().isIn(['text', 'system', 'event', 'announcement'])
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

    const { clubId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let query = { club: clubId };

    if (req.query.type) {
      query.type = req.query.type;
    }

    if (req.query.before) {
      const beforeMessage = await Message.findById(req.query.before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const messages = await Message.find(query)
      .populate('user', 'firstName lastName avatar')
      .populate('replies.user', 'firstName lastName avatar')
      .populate('metadata.eventId', 'title dateTime')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalMessages = await Message.countDocuments({ club: clubId });

    messages.forEach(message => {
      message.markAsRead(req.user._id);
    });

    await Promise.all(messages.map(message => message.save()));

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit),
          hasNext: page < Math.ceil(totalMessages / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get club messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
});

router.post('/club/:clubId', protect, clubMember, [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  body('type')
    .optional()
    .isIn(['text', 'announcement'])
    .withMessage('Invalid message type'),
  body('eventId')
    .optional()
    .isMongoId()
    .withMessage('Invalid event ID')
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

    const { clubId } = req.params;
    const { content, type = 'text', eventId } = req.body;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const messageData = {
      club: clubId,
      user: req.user._id,
      content: content.trim(),
      type
    };

    if (eventId) {
      messageData.metadata = { eventId };
    }

    const message = new Message(messageData);
    await message.save();

    await message.populate('user', 'firstName lastName avatar');
    if (eventId) {
      await message.populate('metadata.eventId', 'title dateTime');
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('new-message', {
        message,
        clubId
      });
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

router.put('/:messageId', protect, [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
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

    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this message'
      });
    }

    if (message.type !== 'text') {
      return res.status(400).json({
        success: false,
        message: 'Only text messages can be edited'
      });
    }

    message.content = content.trim();
    message.metadata.edited = true;
    message.metadata.editedAt = new Date();
    await message.save();

    await message.populate('user', 'firstName lastName avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`club-${message.club}`).emit('message-updated', {
        message,
        clubId: message.club
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while editing message'
    });
  }
});

router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const club = await Club.findById(message.club);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }

    const isMessageOwner = message.user.toString() === req.user._id.toString();
    const isClubAdmin = club.members.some(member =>
      member.user.toString() === req.user._id.toString() &&
      ['admin', 'owner'].includes(member.role)
    );

    if (!isMessageOwner && !isClubAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.softDelete(req.user._id);
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`club-${message.club}`).emit('message-deleted', {
        messageId: message._id,
        clubId: message.club
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
});

router.post('/:messageId/reactions', protect, [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
    .matches(/^[\u{1f600}-\u{1f64f}]|[\u{1f300}-\u{1f5ff}]|[\u{1f680}-\u{1f6ff}]|[\u{1f1e0}-\u{1f1ff}]|[\u{2600}-\u{26ff}]|[\u{2700}-\u{27bf}]$/u)
    .withMessage('Invalid emoji')
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

    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const result = message.addReaction(req.user._id, emoji);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`club-${message.club}`).emit('reaction-added', {
        messageId: message._id,
        reaction: { user: req.user._id, emoji },
        clubId: message.club
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: { reactionCounts: message.reactionCounts }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reaction'
    });
  }
});

router.delete('/:messageId/reactions/:emoji', protect, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const result = message.removeReaction(req.user._id, emoji);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`club-${message.club}`).emit('reaction-removed', {
        messageId: message._id,
        reaction: { user: req.user._id, emoji },
        clubId: message.club
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: { reactionCounts: message.reactionCounts }
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing reaction'
    });
  }
});

router.post('/:messageId/replies', protect, [
  body('content')
    .notEmpty()
    .withMessage('Reply content is required')
    .isLength({ max: 200 })
    .withMessage('Reply cannot exceed 200 characters')
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

    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const result = message.addReply(req.user._id, content.trim());
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    await message.save();
    await message.populate('replies.user', 'firstName lastName avatar');

    const newReply = message.replies[message.replies.length - 1];

    const io = req.app.get('io');
    if (io) {
      io.to(`club-${message.club}`).emit('reply-added', {
        messageId: message._id,
        reply: newReply,
        clubId: message.club
      });
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: newReply
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reply'
    });
  }
});

module.exports = router;