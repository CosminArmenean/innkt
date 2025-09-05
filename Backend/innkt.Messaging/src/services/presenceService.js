const logger = require('../utils/logger');

class PresenceService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.presenceKey = 'user:presence';
    this.onlineUsersKey = 'online:users';
    this.userSessionsKey = 'user:sessions';
  }

  // Set user as online
  async setUserOnline(userId, socketId, userInfo = {}) {
    try {
      const timestamp = Date.now();
      const presenceData = {
        userId,
        socketId,
        status: 'online',
        lastSeen: timestamp,
        userInfo,
        connectedAt: timestamp
      };

      // Store user presence
      await this.redis.hSet(this.presenceKey, userId, JSON.stringify(presenceData));
      
      // Add to online users set
      await this.redis.sAdd(this.onlineUsersKey, userId);
      
      // Store session mapping
      await this.redis.hSet(this.userSessionsKey, socketId, userId);
      
      // Set expiration (24 hours)
      await this.redis.expire(`${this.presenceKey}:${userId}`, 86400);
      
      logger.info(`User ${userId} is now online`);
      return presenceData;
    } catch (error) {
      logger.error('Error setting user online:', error);
      throw error;
    }
  }

  // Set user as offline
  async setUserOffline(userId, socketId) {
    try {
      // Remove from online users set
      await this.redis.sRem(this.onlineUsersKey, userId);
      
      // Remove session mapping
      await this.redis.hDel(this.userSessionsKey, socketId);
      
      // Update presence to offline
      const presenceData = await this.getUserPresence(userId);
      if (presenceData) {
        presenceData.status = 'offline';
        presenceData.lastSeen = Date.now();
        await this.redis.hSet(this.presenceKey, userId, JSON.stringify(presenceData));
      }
      
      logger.info(`User ${userId} is now offline`);
    } catch (error) {
      logger.error('Error setting user offline:', error);
      throw error;
    }
  }

  // Get user presence
  async getUserPresence(userId) {
    try {
      const presenceData = await this.redis.hGet(this.presenceKey, userId);
      return presenceData ? JSON.parse(presenceData) : null;
    } catch (error) {
      logger.error('Error getting user presence:', error);
      return null;
    }
  }

  // Get all online users
  async getOnlineUsers() {
    try {
      const onlineUserIds = await this.redis.sMembers(this.onlineUsersKey);
      const onlineUsers = [];
      
      for (const userId of onlineUserIds) {
        const presence = await this.getUserPresence(userId);
        if (presence && presence.status === 'online') {
          onlineUsers.push(presence);
        }
      }
      
      return onlineUsers;
    } catch (error) {
      logger.error('Error getting online users:', error);
      return [];
    }
  }

  // Update user status (online, away, busy, offline)
  async updateUserStatus(userId, status) {
    try {
      const presenceData = await this.getUserPresence(userId);
      if (presenceData) {
        presenceData.status = status;
        presenceData.lastSeen = Date.now();
        await this.redis.hSet(this.presenceKey, userId, JSON.stringify(presenceData));
        
        logger.info(`User ${userId} status updated to ${status}`);
        return presenceData;
      }
      return null;
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw error;
    }
  }

  // Get user's last seen time
  async getUserLastSeen(userId) {
    try {
      const presenceData = await this.getUserPresence(userId);
      return presenceData ? presenceData.lastSeen : null;
    } catch (error) {
      logger.error('Error getting user last seen:', error);
      return null;
    }
  }

  // Check if user is online
  async isUserOnline(userId) {
    try {
      const isOnline = await this.redis.sIsMember(this.onlineUsersKey, userId);
      return isOnline;
    } catch (error) {
      logger.error('Error checking if user is online:', error);
      return false;
    }
  }

  // Get user's socket ID
  async getUserSocketId(userId) {
    try {
      const presenceData = await this.getUserPresence(userId);
      return presenceData ? presenceData.socketId : null;
    } catch (error) {
      logger.error('Error getting user socket ID:', error);
      return null;
    }
  }

  // Get socket's user ID
  async getSocketUserId(socketId) {
    try {
      const userId = await this.redis.hGet(this.userSessionsKey, socketId);
      return userId;
    } catch (error) {
      logger.error('Error getting socket user ID:', error);
      return null;
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      const allSessions = await this.redis.hGetAll(this.userSessionsKey);
      const now = Date.now();
      const expiredThreshold = 30 * 60 * 1000; // 30 minutes

      for (const [socketId, userId] of Object.entries(allSessions)) {
        const presence = await this.getUserPresence(userId);
        if (presence && (now - presence.lastSeen) > expiredThreshold) {
          await this.setUserOffline(userId, socketId);
          logger.info(`Cleaned up expired session for user ${userId}`);
        }
      }
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
    }
  }

  // Subscribe to presence changes
  async subscribeToPresenceChanges(callback) {
    try {
      const subscriber = this.redis.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe('presence:changes', (message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          logger.error('Error parsing presence change message:', error);
        }
      });
      
      return subscriber;
    } catch (error) {
      logger.error('Error subscribing to presence changes:', error);
      throw error;
    }
  }

  // Publish presence change
  async publishPresenceChange(userId, status, userInfo = {}) {
    try {
      const message = {
        userId,
        status,
        userInfo,
        timestamp: Date.now()
      };
      
      await this.redis.publish('presence:changes', JSON.stringify(message));
    } catch (error) {
      logger.error('Error publishing presence change:', error);
    }
  }
}

module.exports = { PresenceService };

