const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Notification = require('../models/Notification');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class PushNotificationService {

  /**
   * Send push notifications for event published
   */
  static async sendEventPublishedNotifications(event, club, publisher) {
    try {
      console.log(`Sending push notifications for event: ${event.title}`);

      // Get all active club members except the publisher
      await club.populate('members.user');
      const recipientUserIds = club.members
        .filter(member =>
          member.isActive &&
          member.user._id.toString() !== publisher._id.toString()
        )
        .map(member => member.user._id);

      if (recipientUserIds.length === 0) {
        console.log('No recipients found for event publication push notifications');
        return [];
      }

      // Get active push subscriptions for recipients
      const subscriptions = await PushSubscription.findActiveForUsers(recipientUserIds);

      if (subscriptions.length === 0) {
        console.log('No push subscriptions found for recipients');
        return [];
      }

      // Filter subscriptions that want event notifications
      const eventSubscriptions = subscriptions.filter(sub =>
        sub.shouldReceiveNotification('event-published')
      );

      if (eventSubscriptions.length === 0) {
        console.log('No subscriptions want event notifications');
        return [];
      }

      const payload = {
        title: `New Event: ${event.title}`,
        message: `${publisher.firstName} ${publisher.lastName} published a new event "${event.title}" in ${club.name}`,
        type: 'event-published',
        tag: `event-${event._id}`,
        requireInteraction: false,
        data: {
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
          }
        }
      };

      const results = await this.sendToMultipleSubscriptions(eventSubscriptions, payload);
      console.log(`Event publication push notifications sent: ${results.successful}/${results.total}`);

      return results;
    } catch (error) {
      console.error('Error sending event published push notifications:', error);
      throw error;
    }
  }

  /**
   * Send push notifications for event status changes (cancelled, updated)
   */
  static async sendEventStatusChangeNotifications(event, club, changer, oldStatus, newStatus) {
    try {
      if (newStatus !== 'cancelled') {
        // For now, only handle cancelled events
        return [];
      }

      console.log(`Sending event cancelled push notifications for: ${event.title}`);

      // Get users who have RSVP'd to this event
      const rsvpUsers = event.rsvps.map(rsvp => rsvp.user.toString());

      if (rsvpUsers.length === 0) {
        console.log('No RSVP users found for event cancellation notifications');
        return [];
      }

      // Get active push subscriptions for RSVP users (excluding the changer)
      const subscriptions = await PushSubscription.findActiveForUsers(rsvpUsers);
      const filteredSubscriptions = subscriptions.filter(sub =>
        sub.user.toString() !== changer._id.toString() &&
        sub.shouldReceiveNotification('event-cancelled')
      );

      if (filteredSubscriptions.length === 0) {
        console.log('No push subscriptions found for event cancellation notifications');
        return [];
      }

      const payload = {
        title: `Event Cancelled: ${event.title}`,
        message: `The event "${event.title}" has been cancelled by ${changer.firstName} ${changer.lastName}`,
        type: 'event-cancelled',
        tag: `event-cancelled-${event._id}`,
        requireInteraction: true, // Important notification
        data: {
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
          }
        }
      };

      const results = await this.sendToMultipleSubscriptions(filteredSubscriptions, payload);
      console.log(`Event cancellation push notifications sent: ${results.successful}/${results.total}`);

      return results;
    } catch (error) {
      console.error('Error sending event status change push notifications:', error);
      throw error;
    }
  }

  /**
   * Send push notifications for join request approved
   */
  static async sendJoinRequestApprovedNotification(club, newMember, approver) {
    try {
      console.log(`Sending join request approved notification to: ${newMember.email}`);

      // Get active push subscriptions for the new member
      const subscriptions = await PushSubscription.findActiveForUser(newMember._id);

      if (subscriptions.length === 0) {
        console.log('No push subscriptions found for new member');
        return [];
      }

      // Filter subscriptions that want club notifications
      const clubSubscriptions = subscriptions.filter(sub =>
        sub.shouldReceiveNotification('join-request-approved')
      );

      if (clubSubscriptions.length === 0) {
        console.log('No subscriptions want join request notifications');
        return [];
      }

      const payload = {
        title: `Welcome to ${club.name}!`,
        message: `Your request to join ${club.name} has been approved. Welcome to the club!`,
        type: 'join-request-approved',
        tag: `join-approved-${club._id}`,
        requireInteraction: false,
        data: {
          club: {
            id: club._id,
            name: club.name
          },
          approver: approver ? {
            id: approver._id,
            name: `${approver.firstName} ${approver.lastName}`
          } : null
        }
      };

      const results = await this.sendToMultipleSubscriptions(clubSubscriptions, payload);
      console.log(`Join request approved push notification sent: ${results.successful}/${results.total}`);

      return results;
    } catch (error) {
      console.error('Error sending join request approved push notification:', error);
      throw error;
    }
  }

  /**
   * Send push notifications to multiple subscriptions
   */
  static async sendToMultipleSubscriptions(subscriptions, payload) {
    const results = {
      total: subscriptions.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          subscription.webPushSubscription,
          JSON.stringify(payload)
        );

        // Update last used timestamp
        await subscription.updateLastUsed();
        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          subscriptionId: subscription._id,
          error: error.message,
          statusCode: error.statusCode
        });

        console.warn(`Failed to send push notification to subscription ${subscription._id}:`, error.message);

        // Handle expired subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Deactivating expired subscription: ${subscription._id}`);
          await subscription.deactivate();
        }
      }
    });

    await Promise.allSettled(pushPromises);
    return results;
  }

  /**
   * Send a custom push notification to specific users
   */
  static async sendCustomNotificationToUsers(userIds, payload) {
    try {
      console.log(`Sending custom push notification to ${userIds.length} users`);

      const subscriptions = await PushSubscription.findActiveForUsers(userIds);

      if (subscriptions.length === 0) {
        console.log('No push subscriptions found for specified users');
        return [];
      }

      const results = await this.sendToMultipleSubscriptions(subscriptions, payload);
      console.log(`Custom push notifications sent: ${results.successful}/${results.total}`);

      return results;
    } catch (error) {
      console.error('Error sending custom push notifications:', error);
      throw error;
    }
  }

  /**
   * Send system-wide announcement (admin only)
   */
  static async sendSystemAnnouncement(payload) {
    try {
      console.log('Sending system-wide push notification');

      // Get all active subscriptions that accept system notifications
      const subscriptions = await PushSubscription.find({ isActive: true });
      const systemSubscriptions = subscriptions.filter(sub =>
        sub.shouldReceiveNotification('system')
      );

      if (systemSubscriptions.length === 0) {
        console.log('No subscriptions found for system announcement');
        return [];
      }

      const results = await this.sendToMultipleSubscriptions(systemSubscriptions, {
        ...payload,
        type: 'system',
        tag: `system-${Date.now()}`
      });

      console.log(`System announcement sent: ${results.successful}/${results.total}`);
      return results;
    } catch (error) {
      console.error('Error sending system announcement:', error);
      throw error;
    }
  }

  /**
   * Test push notification for a specific user
   */
  static async sendTestNotification(userId, customPayload = null) {
    try {
      console.log(`Sending test push notification to user: ${userId}`);

      const subscriptions = await PushSubscription.findActiveForUser(userId);

      if (subscriptions.length === 0) {
        throw new Error('No active push subscriptions found for user');
      }

      const payload = customPayload || {
        title: 'Test Notification',
        message: 'This is a test push notification from PlaySquad!',
        type: 'system',
        tag: `test-${Date.now()}`,
        requireInteraction: false
      };

      const results = await this.sendToMultipleSubscriptions(subscriptions, payload);
      console.log(`Test push notifications sent: ${results.successful}/${results.total}`);

      return results;
    } catch (error) {
      console.error('Error sending test push notification:', error);
      throw error;
    }
  }

  /**
   * Clean up failed subscriptions periodically
   */
  static async cleanupFailedSubscriptions() {
    try {
      const cleanupResult = await PushSubscription.cleanupOldSubscriptions(30); // 30 days old
      console.log(`Cleaned up ${cleanupResult} old push subscriptions`);
      return cleanupResult;
    } catch (error) {
      console.error('Error cleaning up push subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get push notification statistics
   */
  static async getStatistics() {
    try {
      const stats = await PushSubscription.getStats();
      return {
        ...stats,
        vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
      };
    } catch (error) {
      console.error('Error getting push notification statistics:', error);
      throw error;
    }
  }
}

module.exports = PushNotificationService;