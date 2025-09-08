const kafkaConfig = {
  bootstrapServers: process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092',
  producer: {
    clientId: 'messaging-producer',
    acks: 'all',
    enableIdempotence: true,
    messageTimeoutMs: 30000,
    retryBackoffMs: 100,
    messageSendMaxRetries: 3,
    compressionType: 'snappy',
    batchSize: 16384,
    lingerMs: 5
  },
  consumer: {
    groupId: 'messaging-consumer-group',
    clientId: 'messaging-consumer',
    autoOffsetReset: 'earliest',
    enableAutoCommit: true,
    autoCommitIntervalMs: 5000,
    sessionTimeoutMs: 30000,
    heartbeatIntervalMs: 3000,
    maxPollIntervalMs: 300000,
    fetchMinBytes: 1,
    fetchWaitMaxMs: 100,
    stopOnError: false
  },
  topics: {
    // Notification topics
    notifications: 'notifications',
    userNotifications: 'user.notifications',
    
    // Social events
    socialEvents: 'social.events',
    followEvents: 'follow.events',
    postEvents: 'post.events',
    groupEvents: 'group.events',
    
    // Message events
    messageEvents: 'message.events',
    conversationEvents: 'conversation.events',
    
    // User events
    userEvents: 'user.events',
    userActivity: 'user.activity',
    
    // System events
    systemEvents: 'system.events',
    healthEvents: 'service.health'
  }
};

module.exports = kafkaConfig;
