using Confluent.Kafka;

namespace innkt.Notifications.Configuration;

/// <summary>
/// Kafka configuration for optimized notification delivery
/// </summary>
public static class KafkaConfig
{
    /// <summary>
    /// Kafka topics for different notification types
    /// </summary>
    public static class Topics
    {
        public const string UserNotifications = "user.notifications";
        public const string KidNotifications = "kid.notifications";
        public const string ParentNotifications = "parent.notifications";
        public const string RepostNotifications = "repost.notifications";
        public const string SafetyAlerts = "safety.alerts";
        public const string EducationalNotifications = "educational.notifications";
        public const string IndependenceDayNotifications = "independence.notifications";
        public const string GrokResponses = "grok.responses";
    }

    /// <summary>
    /// Get producer configuration with optimized settings
    /// </summary>
    public static ProducerConfig GetProducerConfig(string bootstrapServers)
    {
        return new ProducerConfig
        {
            BootstrapServers = bootstrapServers,
            Acks = Acks.All, // Ensure all replicas acknowledge
            EnableIdempotence = true, // Prevent duplicate messages
            MessageTimeoutMs = 30000,
            RequestTimeoutMs = 30000,
            CompressionType = CompressionType.Snappy, // Optimize for speed
            BatchSize = 16384, // 16KB batch size for efficiency
            LingerMs = 5, // Wait 5ms to batch messages
            SecurityProtocol = SecurityProtocol.Plaintext, // For local development
            StatisticsIntervalMs = 60000, // Statistics every minute
        };
    }

    /// <summary>
    /// Get consumer configuration with optimized settings
    /// </summary>
    public static ConsumerConfig GetConsumerConfig(string bootstrapServers, string groupId)
    {
        return new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = groupId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false, // Manual commit for reliability
            SessionTimeoutMs = 30000,
            HeartbeatIntervalMs = 3000,
            MaxPollIntervalMs = 300000, // 5 minutes
            FetchMinBytes = 1,
            PartitionAssignmentStrategy = PartitionAssignmentStrategy.CooperativeSticky,
            SecurityProtocol = SecurityProtocol.Plaintext,
            StatisticsIntervalMs = 60000,
        };
    }
}
