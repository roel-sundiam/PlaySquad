const Notification = require('../models/Notification');
const socketService = require('./socketService');
const PushNotificationService = require('./pushNotificationService');

class NotificationService {
  
  /**
   * Create and emit event published notification
   */
  static async notifyEventPublished(event, club, publisher, io) {
    try {
      console.log(`Creating event published notifications for event: ${event.title}`);
      
      // Create notification records in database
      const notifications = await Notification.createEventPublishedNotification(event, club, publisher);
      
      if (notifications.length === 0) {
        console.log('No recipients found for event publication notification');
        return;
      }

      // Populate notification data for Socket.IO emission
      const populatedNotifications = await Notification.populate(notifications, [
        { path: 'sender', select: 'firstName lastName' },
        { path: 'data.event', select: 'title date location' },
        { path: 'data.club', select: 'name' }
      ]);

      // Emit notifications via Socket.IO to club room
      const clubRoomName = `club-${club._id}`;
      
      // Emit to club room (all online members will receive it)
      io.to(clubRoomName).emit('event-published', {
        type: 'event-published',
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          location: event.location
        },
        club: {
          id: club._id,
          name: club.name
        },
        publisher: {
          id: publisher._id,
          name: `${publisher.firstName} ${publisher.lastName}`
        },
        notification: {
          title: `New Event: ${event.title}`,
          message: `${publisher.firstName} ${publisher.lastName} published a new event "${event.title}" in ${club.name}`,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Emitted event-published notification to room: ${clubRoomName}`);
      console.log(`Created ${notifications.length} notification records`);

      // Send push notifications (runs in background)
      PushNotificationService.sendEventPublishedNotifications(event, club, publisher)
        .then(pushResults => {
          console.log(`Push notifications sent for event publication: ${pushResults.successful}/${pushResults.total}`);
        })
        .catch(error => {
          console.error('Error sending push notifications for event publication:', error);
        });

      return notifications;
    } catch (error) {
      console.error('Error in notifyEventPublished:', error);
      throw error;
    }
  }

  /**
   * Create and emit event status change notification
   */
  static async notifyEventStatusChange(event, club, changer, oldStatus, newStatus, io) {
    try {
      console.log(`Creating event status change notifications: ${oldStatus} -> ${newStatus}`);
      
      // Create notification records in database
      const notifications = await Notification.createEventStatusNotification(
        event, club, changer, oldStatus, newStatus
      );
      
      if (notifications.length === 0) {
        console.log('No recipients found for event status change notification');
        return;
      }

      // Populate notification data for Socket.IO emission
      const populatedNotifications = await Notification.populate(notifications, [
        { path: 'sender', select: 'firstName lastName' },
        { path: 'data.event', select: 'title date location' },
        { path: 'data.club', select: 'name' }
      ]);

      // Emit notifications via Socket.IO to club room
      const clubRoomName = `club-${club._id}`;
      
      // Determine notification type and message based on status change
      let notificationType = 'event-updated';
      let notificationTitle = `Event Updated: ${event.title}`;
      let notificationMessage = `${changer.firstName} ${changer.lastName} updated the event "${event.title}"`;
      
      if (newStatus === 'cancelled') {
        notificationType = 'event-cancelled';
        notificationTitle = `Event Cancelled: ${event.title}`;
        notificationMessage = `The event "${event.title}" has been cancelled by ${changer.firstName} ${changer.lastName}`;
      }

      // Emit to club room
      io.to(clubRoomName).emit(notificationType, {
        type: notificationType,
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          location: event.location,
          status: newStatus,
          oldStatus: oldStatus
        },
        club: {
          id: club._id,
          name: club.name
        },
        changer: {
          id: changer._id,
          name: `${changer.firstName} ${changer.lastName}`
        },
        notification: {
          title: notificationTitle,
          message: notificationMessage,
          timestamp: new Date().toISOString()
        }
      });

      console.log(`Emitted ${notificationType} notification to room: ${clubRoomName}`);
      console.log(`Created ${notifications.length} notification records`);

      // Send push notifications (runs in background)
      PushNotificationService.sendEventStatusChangeNotifications(event, club, changer, oldStatus, newStatus)
        .then(pushResults => {
          console.log(`Push notifications sent for event status change: ${pushResults.successful}/${pushResults.total}`);
        })
        .catch(error => {
          console.error('Error sending push notifications for event status change:', error);
        });

      return notifications;
    } catch (error) {
      console.error('Error in notifyEventStatusChange:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a specific user
   */
  static async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({ recipient: userId })
        .populate('sender', 'firstName lastName')
        .populate('data.event', 'title date location status')
        .populate('data.club', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const unreadCount = await Notification.countDocuments({ 
        recipient: userId, 
        isRead: false 
      });

      return {
        notifications,
        unreadCount,
        total: await Notification.countDocuments({ recipient: userId })
      };
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();
      return notification;
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllNotificationsAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      return result.modifiedCount;
    } catch (error) {
      console.error('Error in markAllNotificationsAsRead:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications (run periodically)
   */
  static async cleanupOldNotifications() {
    try {
      const result = await Notification.cleanupOldNotifications();
      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error in cleanupOldNotifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;