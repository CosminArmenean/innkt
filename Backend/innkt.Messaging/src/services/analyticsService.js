const logger = require('../utils/logger');

class AnalyticsService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.analyticsPrefix = 'analytics';
    this.metricsPrefix = 'metrics';
  }

  // Track message sent
  async trackMessageSent(userId, conversationId, messageType, timestamp = Date.now()) {
    try {
      const date = new Date(timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = date.getHours();

      // Increment daily message count
      await this.redis.hIncrBy(`${this.analyticsPrefix}:messages:daily:${dateKey}`, 'total', 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:messages:daily:${dateKey}`, messageType, 1);
      
      // Increment hourly message count
      await this.redis.hIncrBy(`${this.analyticsPrefix}:messages:hourly:${dateKey}:${hour}`, 'total', 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:messages:hourly:${dateKey}:${hour}`, messageType, 1);
      
      // Track user activity
      await this.redis.hIncrBy(`${this.analyticsPrefix}:users:${userId}:messages`, dateKey, 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:users:${userId}:messages`, 'total', 1);
      
      // Track conversation activity
      await this.redis.hIncrBy(`${this.analyticsPrefix}:conversations:${conversationId}:messages`, dateKey, 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:conversations:${conversationId}:messages`, 'total', 1);

      // Set expiration for daily data (30 days)
      await this.redis.expire(`${this.analyticsPrefix}:messages:daily:${dateKey}`, 86400 * 30);
      await this.redis.expire(`${this.analyticsPrefix}:messages:hourly:${dateKey}:${hour}`, 86400 * 7);
      await this.redis.expire(`${this.analyticsPrefix}:users:${userId}:messages`, 86400 * 30);
      await this.redis.expire(`${this.analyticsPrefix}:conversations:${conversationId}:messages`, 86400 * 30);

    } catch (error) {
      logger.error('Error tracking message sent:', error);
    }
  }

  // Track user online time
  async trackUserOnlineTime(userId, startTime, endTime) {
    try {
      const duration = endTime - startTime;
      const date = new Date(startTime);
      const dateKey = date.toISOString().split('T')[0];

      await this.redis.hIncrBy(`${this.analyticsPrefix}:users:${userId}:online`, dateKey, duration);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:users:${userId}:online`, 'total', duration);

      // Set expiration
      await this.redis.expire(`${this.analyticsPrefix}:users:${userId}:online`, 86400 * 30);

    } catch (error) {
      logger.error('Error tracking user online time:', error);
    }
  }

  // Track file upload
  async trackFileUpload(userId, conversationId, fileSize, fileType, timestamp = Date.now()) {
    try {
      const date = new Date(timestamp);
      const dateKey = date.toISOString().split('T')[0];

      // Track file uploads
      await this.redis.hIncrBy(`${this.analyticsPrefix}:files:daily:${dateKey}`, 'count', 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:files:daily:${dateKey}`, 'size', fileSize);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:files:daily:${dateKey}`, fileType, 1);

      // Track user file uploads
      await this.redis.hIncrBy(`${this.analyticsPrefix}:users:${userId}:files`, dateKey, 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:users:${userId}:files`, 'total', 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:users:${userId}:files`, 'size', fileSize);

      // Set expiration
      await this.redis.expire(`${this.analyticsPrefix}:files:daily:${dateKey}`, 86400 * 30);
      await this.redis.expire(`${this.analyticsPrefix}:users:${userId}:files`, 86400 * 30);

    } catch (error) {
      logger.error('Error tracking file upload:', error);
    }
  }

  // Track conversation creation
  async trackConversationCreated(conversationId, type, participantCount, timestamp = Date.now()) {
    try {
      const date = new Date(timestamp);
      const dateKey = date.toISOString().split('T')[0];

      await this.redis.hIncrBy(`${this.analyticsPrefix}:conversations:daily:${dateKey}`, 'total', 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:conversations:daily:${dateKey}`, type, 1);
      await this.redis.hIncrBy(`${this.analyticsPrefix}:conversations:daily:${dateKey}`, 'participants', participantCount);

      // Set expiration
      await this.redis.expire(`${this.analyticsPrefix}:conversations:daily:${dateKey}`, 86400 * 30);

    } catch (error) {
      logger.error('Error tracking conversation creation:', error);
    }
  }

  // Get message analytics
  async getMessageAnalytics(startDate, endDate) {
    try {
      const analytics = {
        totalMessages: 0,
        messagesByType: {},
        messagesByDay: {},
        topUsers: [],
        topConversations: []
      };

      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        // Get daily message data
        const dailyData = await this.redis.hGetAll(`${this.analyticsPrefix}:messages:daily:${dateKey}`);
        
        if (Object.keys(dailyData).length > 0) {
          analytics.messagesByDay[dateKey] = dailyData;
          analytics.totalMessages += parseInt(dailyData.total) || 0;
          
          // Aggregate by type
          for (const [type, count] of Object.entries(dailyData)) {
            if (type !== 'total') {
              analytics.messagesByType[type] = (analytics.messagesByType[type] || 0) + parseInt(count);
            }
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return analytics;
    } catch (error) {
      logger.error('Error getting message analytics:', error);
      return null;
    }
  }

  // Get user analytics
  async getUserAnalytics(userId, startDate, endDate) {
    try {
      const analytics = {
        totalMessages: 0,
        totalOnlineTime: 0,
        totalFiles: 0,
        totalFileSize: 0,
        messagesByDay: {},
        onlineTimeByDay: {},
        filesByDay: {}
      };

      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        // Get user message data
        const messageCount = await this.redis.hGet(`${this.analyticsPrefix}:users:${userId}:messages`, dateKey);
        if (messageCount) {
          analytics.messagesByDay[dateKey] = parseInt(messageCount);
          analytics.totalMessages += parseInt(messageCount);
        }

        // Get user online time
        const onlineTime = await this.redis.hGet(`${this.analyticsPrefix}:users:${userId}:online`, dateKey);
        if (onlineTime) {
          analytics.onlineTimeByDay[dateKey] = parseInt(onlineTime);
          analytics.totalOnlineTime += parseInt(onlineTime);
        }

        // Get user file data
        const fileCount = await this.redis.hGet(`${this.analyticsPrefix}:users:${userId}:files`, dateKey);
        if (fileCount) {
          analytics.filesByDay[dateKey] = parseInt(fileCount);
          analytics.totalFiles += parseInt(fileCount);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Get total file size
      const totalFileSize = await this.redis.hGet(`${this.analyticsPrefix}:users:${userId}:files`, 'size');
      if (totalFileSize) {
        analytics.totalFileSize = parseInt(totalFileSize);
      }

      return analytics;
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      return null;
    }
  }

  // Get conversation analytics
  async getConversationAnalytics(conversationId, startDate, endDate) {
    try {
      const analytics = {
        totalMessages: 0,
        messagesByDay: {},
        participantActivity: {},
        messageTypes: {}
      };

      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        // Get conversation message data
        const messageCount = await this.redis.hGet(`${this.analyticsPrefix}:conversations:${conversationId}:messages`, dateKey);
        if (messageCount) {
          analytics.messagesByDay[dateKey] = parseInt(messageCount);
          analytics.totalMessages += parseInt(messageCount);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return analytics;
    } catch (error) {
      logger.error('Error getting conversation analytics:', error);
      return null;
    }
  }

  // Get system metrics
  async getSystemMetrics() {
    try {
      const metrics = {
        totalUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        totalFiles: 0,
        averageMessagesPerUser: 0,
        averageMessagesPerConversation: 0,
        mostActiveHour: 0,
        mostActiveDay: '',
        timestamp: new Date().toISOString()
      };

      // Get total users (approximate)
      const userKeys = await this.redis.keys(`${this.analyticsPrefix}:users:*:messages`);
      metrics.totalUsers = userKeys.length;

      // Get total conversations (approximate)
      const conversationKeys = await this.redis.keys(`${this.analyticsPrefix}:conversations:*:messages`);
      metrics.totalConversations = conversationKeys.length;

      // Get total messages from today
      const today = new Date().toISOString().split('T')[0];
      const todayMessages = await this.redis.hGet(`${this.analyticsPrefix}:messages:daily:${today}`, 'total');
      metrics.totalMessages = parseInt(todayMessages) || 0;

      // Get total files from today
      const todayFiles = await this.redis.hGet(`${this.analyticsPrefix}:files:daily:${today}`, 'count');
      metrics.totalFiles = parseInt(todayFiles) || 0;

      // Calculate averages
      if (metrics.totalUsers > 0) {
        metrics.averageMessagesPerUser = metrics.totalMessages / metrics.totalUsers;
      }
      if (metrics.totalConversations > 0) {
        metrics.averageMessagesPerConversation = metrics.totalMessages / metrics.totalConversations;
      }

      return metrics;
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      return null;
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const today = now.toISOString().split('T')[0];

      const metrics = {
        messagesThisHour: 0,
        messagesToday: 0,
        activeUsers: 0,
        onlineUsers: 0,
        timestamp: now.toISOString()
      };

      // Get messages this hour
      const hourlyMessages = await this.redis.hGet(`${this.analyticsPrefix}:messages:hourly:${today}:${currentHour}`, 'total');
      metrics.messagesThisHour = parseInt(hourlyMessages) || 0;

      // Get messages today
      const dailyMessages = await this.redis.hGet(`${this.analyticsPrefix}:messages:daily:${today}`, 'total');
      metrics.messagesToday = parseInt(dailyMessages) || 0;

      // Get active users (users who sent messages today)
      const userKeys = await this.redis.keys(`${this.analyticsPrefix}:users:*:messages`);
      let activeUsers = 0;
      for (const key of userKeys) {
        const todayMessages = await this.redis.hGet(key, today);
        if (todayMessages && parseInt(todayMessages) > 0) {
          activeUsers++;
        }
      }
      metrics.activeUsers = activeUsers;

      return metrics;
    } catch (error) {
      logger.error('Error getting real-time metrics:', error);
      return null;
    }
  }

  // Clean up old analytics data
  async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffKey = cutoffDate.toISOString().split('T')[0];

      // Get all daily analytics keys
      const dailyKeys = await this.redis.keys(`${this.analyticsPrefix}:*:daily:*`);
      let cleanedCount = 0;

      for (const key of dailyKeys) {
        const dateMatch = key.match(/:(\d{4}-\d{2}-\d{2})$/);
        if (dateMatch && dateMatch[1] < cutoffKey) {
          await this.redis.del(key);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} old analytics records`);
    } catch (error) {
      logger.error('Error cleaning up old analytics data:', error);
    }
  }
}

module.exports = { AnalyticsService };

