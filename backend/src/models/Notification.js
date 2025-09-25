const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // System notifications may not have a sender
  },
  type: {
    type: String,
    enum: [
      'event-published',
      'event-updated', 
      'event-cancelled',
      'event-reminder',
      'join-request-approved',
      'join-request-rejected',
      'new-member-joined',
      'system'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  data: {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club'
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    // Additional context data for different notification types
    additionalData: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: 1 }); // For cleanup of old notifications

// Virtual for formatted creation time
notificationSchema.virtual('formattedCreatedAt').get(function() {
  return this.createdAt.toLocaleString();
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create event publication notifications
notificationSchema.statics.createEventPublishedNotification = async function(event, club, sender) {
  try {
    // Get all active club members except the sender
    await club.populate('members.user');
    const recipients = club.members
      .filter(member => 
        member.isActive && 
        member.user._id.toString() !== sender._id.toString()
      )
      .map(member => member.user._id);

    if (recipients.length === 0) return [];

    // Create notifications for all recipients
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      sender: sender._id,
      type: 'event-published',
      title: `New Event: ${event.title}`,
      message: `${sender.firstName} ${sender.lastName} published a new event "${event.title}" in ${club.name}`,
      data: {
        club: club._id,
        event: event._id,
        additionalData: {
          eventDate: event.date,
          eventLocation: event.location,
          clubName: club.name
        }
      }
    }));

    const createdNotifications = await this.insertMany(notifications);
    return createdNotifications;
  } catch (error) {
    console.error('Error creating event published notifications:', error);
    return [];
  }
};

// Static method to create event status change notifications
notificationSchema.statics.createEventStatusNotification = async function(event, club, sender, oldStatus, newStatus) {
  try {
    // Only notify for significant status changes
    if (newStatus === 'cancelled') {
      await club.populate('members.user');
      
      // Get users who have RSVP'd to this event
      const rsvpUsers = event.rsvps.map(rsvp => rsvp.user.toString());
      
      // Get all active club members who RSVP'd, except the sender
      const recipients = club.members
        .filter(member => 
          member.isActive && 
          rsvpUsers.includes(member.user._id.toString()) &&
          member.user._id.toString() !== sender._id.toString()
        )
        .map(member => member.user._id);

      if (recipients.length === 0) return [];

      const notifications = recipients.map(recipientId => ({
        recipient: recipientId,
        sender: sender._id,
        type: 'event-cancelled',
        title: `Event Cancelled: ${event.title}`,
        message: `The event "${event.title}" has been cancelled by ${sender.firstName} ${sender.lastName}`,
        data: {
          club: club._id,
          event: event._id,
          additionalData: {
            eventDate: event.date,
            clubName: club.name,
            oldStatus,
            newStatus
          }
        }
      }));

      const createdNotifications = await this.insertMany(notifications);
      return createdNotifications;
    }
    
    return [];
  } catch (error) {
    console.error('Error creating event status notifications:', error);
    return [];
  }
};

// Auto-cleanup old notifications (older than 30 days)
notificationSchema.statics.cleanupOldNotifications = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return await this.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
};

module.exports = mongoose.model('Notification', notificationSchema);