const kafkajs = require('kafkajs');
const kafkaConfig = require('../config/kafkaConfig');
const logger = require('../utils/logger');

class KafkaService {
  constructor() {
    this.kafka = new kafkajs.Kafka({
      clientId: kafkaConfig.consumer.clientId,
      brokers: [kafkaConfig.bootstrapServers],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = null;
    this.consumers = new Map();
    this.isConnected = false;
  }

  async connect() {
    try {
      // Create producer
      this.producer = this.kafka.producer(kafkaConfig.producer);
      await this.producer.connect();
      
      this.isConnected = true;
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      // Disconnect all consumers
      for (const [topic, consumer] of this.consumers) {
        await consumer.disconnect();
        logger.info(`Disconnected consumer for topic: ${topic}`);
      }
      this.consumers.clear();

      // Disconnect producer
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }

      this.isConnected = false;
      logger.info('Kafka service disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting Kafka service:', error);
    }
  }

  // Publish notification events
  async publishNotification(notification) {
    if (!this.isConnected || !this.producer) {
      logger.warn('Kafka producer not connected, skipping notification publish');
      return;
    }

    try {
      const message = {
        id: notification.id,
        type: notification.type,
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        timestamp: notification.timestamp,
        read: notification.read,
        source: 'messaging-service'
      };

      await this.producer.send({
        topic: kafkaConfig.topics.notifications,
        messages: [{
          key: notification.userId,
          value: JSON.stringify(message),
          headers: {
            messageType: notification.type,
            userId: notification.userId,
            source: 'messaging-service'
          }
        }]
      });

      logger.debug(`Published notification ${notification.id} to topic ${kafkaConfig.topics.notifications}`);
    } catch (error) {
      logger.error('Failed to publish notification:', error);
      throw error;
    }
  }

  // Publish user notification
  async publishUserNotification(userId, notification) {
    if (!this.isConnected || !this.producer) {
      logger.warn('Kafka producer not connected, skipping user notification publish');
      return;
    }

    try {
      const message = {
        ...notification,
        userId,
        source: 'messaging-service',
        timestamp: Date.now()
      };

      await this.producer.send({
        topic: kafkaConfig.topics.userNotifications,
        messages: [{
          key: userId,
          value: JSON.stringify(message),
          headers: {
            messageType: notification.type,
            userId,
            source: 'messaging-service'
          }
        }]
      });

      logger.debug(`Published user notification for user ${userId} to topic ${kafkaConfig.topics.userNotifications}`);
    } catch (error) {
      logger.error('Failed to publish user notification:', error);
      throw error;
    }
  }

  // Publish social events
  async publishSocialEvent(eventType, data) {
    if (!this.isConnected || !this.producer) {
      logger.warn('Kafka producer not connected, skipping social event publish');
      return;
    }

    try {
      const message = {
        eventType,
        data,
        timestamp: Date.now(),
        source: 'messaging-service'
      };

      await this.producer.send({
        topic: kafkaConfig.topics.socialEvents,
        messages: [{
          key: data.userId || data.id || 'system',
          value: JSON.stringify(message),
          headers: {
            eventType,
            source: 'messaging-service'
          }
        }]
      });

      logger.debug(`Published social event ${eventType} to topic ${kafkaConfig.topics.socialEvents}`);
    } catch (error) {
      logger.error('Failed to publish social event:', error);
      throw error;
    }
  }

  // Publish follow events
  async publishFollowEvent(followerId, followingId, action) {
    await this.publishSocialEvent('follow', {
      followerId,
      followingId,
      action, // 'follow' or 'unfollow'
      timestamp: Date.now()
    });
  }

  // Publish post events
  async publishPostEvent(postId, authorId, eventType, data = {}) {
    await this.publishSocialEvent('post', {
      postId,
      authorId,
      eventType, // 'created', 'updated', 'deleted', 'liked', 'commented'
      data,
      timestamp: Date.now()
    });
  }

  // Publish group events
  async publishGroupEvent(groupId, eventType, data = {}) {
    await this.publishSocialEvent('group', {
      groupId,
      eventType, // 'created', 'updated', 'deleted', 'joined', 'left', 'invited'
      data,
      timestamp: Date.now()
    });
  }

  // Publish message events
  async publishMessageEvent(conversationId, messageId, eventType, data = {}) {
    if (!this.isConnected || !this.producer) {
      logger.warn('Kafka producer not connected, skipping message event publish');
      return;
    }

    try {
      const message = {
        conversationId,
        messageId,
        eventType, // 'sent', 'delivered', 'read', 'edited', 'deleted'
        data,
        timestamp: Date.now(),
        source: 'messaging-service'
      };

      await this.producer.send({
        topic: kafkaConfig.topics.messageEvents,
        messages: [{
          key: conversationId,
          value: JSON.stringify(message),
          headers: {
            eventType,
            conversationId,
            source: 'messaging-service'
          }
        }]
      });

      logger.debug(`Published message event ${eventType} for conversation ${conversationId}`);
    } catch (error) {
      logger.error('Failed to publish message event:', error);
      throw error;
    }
  }

  // Publish user activity
  async publishUserActivity(userId, activityType, data = {}) {
    if (!this.isConnected || !this.producer) {
      logger.warn('Kafka producer not connected, skipping user activity publish');
      return;
    }

    try {
      const message = {
        userId,
        activityType, // 'login', 'logout', 'online', 'offline', 'typing', 'viewing'
        data,
        timestamp: Date.now(),
        source: 'messaging-service'
      };

      await this.producer.send({
        topic: kafkaConfig.topics.userActivity,
        messages: [{
          key: userId,
          value: JSON.stringify(message),
          headers: {
            activityType,
            userId,
            source: 'messaging-service'
          }
        }]
      });

      logger.debug(`Published user activity ${activityType} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to publish user activity:', error);
      throw error;
    }
  }

  // Subscribe to topics
  async subscribeToTopic(topic, messageHandler) {
    if (this.consumers.has(topic)) {
      logger.warn(`Already subscribed to topic: ${topic}`);
      return;
    }

    try {
      const consumer = this.kafka.consumer({
        groupId: kafkaConfig.consumer.groupId,
        ...kafkaConfig.consumer
      });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageData = JSON.parse(message.value.toString());
            await messageHandler(messageData, topic, partition);
          } catch (error) {
            logger.error(`Error processing message from topic ${topic}:`, error);
          }
        }
      });

      this.consumers.set(topic, consumer);
      logger.info(`Subscribed to topic: ${topic}`);
    } catch (error) {
      logger.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  // Subscribe to user events
  async subscribeToUserEvents(userId, messageHandler) {
    const topic = `user.${userId}.events`;
    await this.subscribeToTopic(topic, messageHandler);
  }

  // Subscribe to social events
  async subscribeToSocialEvents(messageHandler) {
    await this.subscribeToTopic(kafkaConfig.topics.socialEvents, messageHandler);
  }

  // Subscribe to message events
  async subscribeToMessageEvents(messageHandler) {
    await this.subscribeToTopic(kafkaConfig.topics.messageEvents, messageHandler);
  }

  // Health check
  async healthCheck() {
    return {
      connected: this.isConnected,
      producerConnected: !!this.producer,
      consumersCount: this.consumers.size,
      topics: Array.from(this.consumers.keys())
    };
  }
}

module.exports = KafkaService;
