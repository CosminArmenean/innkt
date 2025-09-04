const logger = require('../utils/logger');

class NotificationService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.notificationKey = 'notifications';
    this.userNotificationsKey = 'user:notifications';
  }

  // Send message notification
  async sendMessageNotification(message, conversation, senderInfo) {
    try {
      const participants = conversation.participants.filter(p => p.userId !== message.senderId);
      
      for (const participant of participants) {
        const notification = {
          id: `msg_${message.id}_${participant.userId}`,
          type: 'message',
          userId: participant.userId,
          title: this.getNotificationTitle(conversation, senderInfo),
          body: this.getNotificationBody(message),
          data: {
            conversationId: conversation.id,
            messageId: message.id,
            senderId: message.senderId,
            senderName: senderInfo.displayName || senderInfo.username
          },
          timestamp: Date.now(),
          read: false
        };

        await this.createNotification(notification);
        await this.publishNotification(notification);
      }
      
      logger.info(`Message notifications sent for conversation ${conversation.id}`);
    } catch (error) {
      logger.error('Error sending message notification:', error);
    }
  }

  // Send mention notification
  async sendMentionNotification(message, mentionedUsers, senderInfo) {
    try {
      for (const userId of mentionedUsers) {
        const notification = {
          id: `mention_${message.id}_${userId}`,
          type: 'mention',
          userId,
          title: `${senderInfo.displayName || senderInfo.username} mentioned you`,
          body: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          data: {
            conversationId: message.conversationId,
            messageId: message.id,
            senderId: message.senderId,
            senderName: senderInfo.displayName || senderInfo.username
          },
          timestamp: Date.now(),
          read: false
        };

        await this.createNotification(notification);
        await this.publishNotification(notification);
      }
      
      logger.info(`Mention notifications sent for message ${message.id}`);
    } catch (error) {
      logger.error('Error sending mention notification:', error);
    }
  }

  // Send group invitation notification
  async sendGroupInvitationNotification(groupId, groupName, invitedUsers, inviterInfo) {
    try {
      for (const userId of invitedUsers) {
        const notification = {
          id: `group_invite_${groupId}_${userId}`,
          type: 'group_invitation',
          userId,
          title: `You're invited to join ${groupName}`,
          body: `${inviterInfo.displayName || inviterInfo.username} invited you to join the group`,
          data: {
            groupId,
            groupName,
            inviterId: inviterInfo.id,
            inviterName: inviterInfo.displayName || inviterInfo.username
          },
          timestamp: Date.now(),
          read: false
        };

        await this.createNotification(notification);
        await this.publishNotification(notification);
      }
      
      logger.info(`Group invitation notifications sent for group ${groupId}`);
    } catch (error) {
      logger.error('Error sending group invitation notification:', error);
    }
  }

  // Create notification
  async createNotification(notification) {
    try {
      // Store in user's notification list
      await this.redis.lPush(`${this.userNotificationsKey}:${notification.userId}`, JSON.stringify(notification));
      
      // Keep only last 100 notifications per user
      await this.redis.lTrim(`${this.userNotificationsKey}:${notification.userId}`, 0, 99);
      
      // Update unread count
      await this.redis.hIncrBy(`${this.userNotificationsKey}:${notification.userId}:count`, 'unread', 1);
      
      logger.debug(`Notification created for user ${notification.userId}`);
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const notifications = await this.redis.lRange(
        `${this.userNotificationsKey}:${userId}`, 
        offset, 
        offset + limit - 1
      );
      
      return notifications.map(n => JSON.parse(n));
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    try {
      const notifications = await this.redis.lRange(`${this.userNotificationsKey}:${userId}`, 0, -1);
      
      for (let i = 0; i < notifications.length; i++) {
        const notification = JSON.parse(notifications[i]);
        if (notification.id === notificationId && !notification.read) {
          notification.read = true;
          await this.redis.lSet(`${this.userNotificationsKey}:${userId}`, i, JSON.stringify(notification));
          
          // Decrease unread count
          await this.redis.hIncrBy(`${this.userNotificationsKey}:${userId}:count`, 'unread', -1);
          break;
        }
      }
      
      logger.debug(`Notification ${notificationId} marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      const notifications = await this.redis.lRange(`${this.userNotificationsKey}:${userId}`, 0, -1);
      
      for (let i = 0; i < notifications.length; i++) {
        const notification = JSON.parse(notifications[i]);
        if (!notification.read) {
          notification.read = true;
          await this.redis.lSet(`${this.userNotificationsKey}:${userId}`, i, JSON.stringify(notification));
        }
      }
      
      // Reset unread count
      await this.redis.hSet(`${this.userNotificationsKey}:${userId}:count`, 'unread', 0);
      
      logger.debug(`All notifications marked as read for user ${userId}`);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const count = await this.redis.hGet(`${this.userNotificationsKey}:${userId}:count`, 'unread');
      return parseInt(count) || 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Publish notification to real-time subscribers
  async publishNotification(notification) {
    try {
      await this.redis.publish(`notifications:${notification.userId}`, JSON.stringify(notification));
    } catch (error) {
      logger.error('Error publishing notification:', error);
    }
  }

  // Subscribe to user notifications
  async subscribeToUserNotifications(userId, callback) {
    try {
      const subscriber = this.redis.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe(`notifications:${userId}`, (message) => {
        try {
          const notification = JSON.parse(message);
          callback(notification);
        } catch (error) {
          logger.error('Error parsing notification message:', error);
        }
      });
      
      return subscriber;
    } catch (error) {
      logger.error('Error subscribing to user notifications:', error);
      throw error;
    }
  }

  // Helper methods
  getNotificationTitle(conversation, senderInfo) {
    if (conversation.type === 'direct') {
      return senderInfo.displayName || senderInfo.username;
    } else {
      return `${senderInfo.displayName || senderInfo.username} in ${conversation.name}`;
    }
  }

  getNotificationBody(message) {
    switch (message.type) {
      case 'text':
        return message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '');
      case 'image':
        return '📷 Sent a photo';
      case 'file':
        return '📎 Sent a file';
      default:
        return 'New message';
    }
  }

  // Clean up old notifications
  async cleanupOldNotifications() {
    try {
      const userKeys = await this.redis.keys(`${this.userNotificationsKey}:*`);
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago

      for (const key of userKeys) {
        if (key.endsWith(':count')) continue;
        
        const notifications = await this.redis.lRange(key, 0, -1);
        const validNotifications = notifications.filter(n => {
          const notification = JSON.parse(n);
          return notification.timestamp > cutoffTime;
        });

        if (validNotifications.length !== notifications.length) {
          await this.redis.del(key);
          if (validNotifications.length > 0) {
            await this.redis.lPush(key, ...validNotifications);
          }
        }
      }
      
      logger.info('Old notifications cleaned up');
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
    }
  }
}

module.exports = { NotificationService };
