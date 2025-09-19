using Confluent.Kafka;

namespace innkt.Social.Configuration;

/// <summary>
/// Kafka configuration for notification system
/// Handles producer and consumer setup with optimal settings
/// </summary>
public static class KafkaConfig
{
    /// <summary>
    /// Configure Kafka producer for notifications
    /// </summary>
    public static ProducerConfig GetProducerConfig(string bootstrapServers)
    {
        return new ProducerConfig
        {
            BootstrapServers = bootstrapServers,
            ClientId = "innkt-social-notifications",
            
            // Performance settings
            BatchSize = 16384, // 16KB batches for efficiency
            LingerMs = 5, // Wait 5ms to batch messages
            CompressionType = CompressionType.Snappy, // Fast compression
            
            // Reliability settings
            Acks = Acks.All, // Required when EnableIdempotence = true
            MessageTimeoutMs = 30000, // 30 second timeout
            RequestTimeoutMs = 30000,
            RetryBackoffMs = 100,
            
            // Error handling
            EnableIdempotence = true, // Prevent duplicate messages
            MaxInFlight = 5, // Max unacknowledged requests
            
            // Security (for production)
            SecurityProtocol = SecurityProtocol.Plaintext, // Use SSL in production
            
            // Monitoring
            StatisticsIntervalMs = 60000 // Stats every minute
        };
    }

    /// <summary>
    /// Configure Kafka consumer for notification processing
    /// </summary>
    public static ConsumerConfig GetConsumerConfig(string bootstrapServers, string groupId)
    {
        return new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = groupId,
            ClientId = $"innkt-social-{groupId}",
            
            // Consumption settings
            AutoOffsetReset = AutoOffsetReset.Latest, // Start from latest messages
            EnableAutoCommit = false, // Manual commit for reliability
            SessionTimeoutMs = 30000,
            HeartbeatIntervalMs = 3000,
            
            // Performance settings
            FetchMinBytes = 1024, // Minimum fetch size
            FetchWaitMaxMs = 500, // Max wait for fetch
            MaxPollIntervalMs = 300000, // 5 minutes max poll interval
            
            // Security (for production)
            SecurityProtocol = SecurityProtocol.Plaintext, // Use SSL in production
            
            // Error handling
            EnablePartitionEof = false,
            AllowAutoCreateTopics = false, // Topics should be pre-created
            
            // Monitoring
            StatisticsIntervalMs = 60000 // Stats every minute
        };
    }

    /// <summary>
    /// Create Kafka topics with optimal settings
    /// </summary>
    public static Dictionary<string, TopicSpecification> GetTopicSpecifications()
    {
        return new Dictionary<string, TopicSpecification>
        {
            ["user.notifications"] = new TopicSpecification
            {
                Name = "user.notifications",
                NumPartitions = 12, // Scale with user volume
                ReplicationFactor = 3,
                Configs = new Dictionary<string, string>
                {
                    ["retention.ms"] = "604800000", // 7 days
                    ["cleanup.policy"] = "delete",
                    ["compression.type"] = "snappy",
                    ["min.insync.replicas"] = "2"
                }
            },
            
            ["kid.notifications"] = new TopicSpecification
            {
                Name = "kid.notifications",
                NumPartitions = 4, // Lower volume, safety-focused
                ReplicationFactor = 3,
                Configs = new Dictionary<string, string>
                {
                    ["retention.ms"] = "2592000000", // 30 days for audit
                    ["cleanup.policy"] = "delete",
                    ["compression.type"] = "snappy",
                    ["min.insync.replicas"] = "2"
                }
            },
            
            ["parent.notifications"] = new TopicSpecification
            {
                Name = "parent.notifications",
                NumPartitions = 6,
                ReplicationFactor = 3,
                Configs = new Dictionary<string, string>
                {
                    ["retention.ms"] = "2592000000", // 30 days
                    ["cleanup.policy"] = "delete",
                    ["compression.type"] = "snappy",
                    ["min.insync.replicas"] = "2"
                }
            },
            
            ["repost.notifications"] = new TopicSpecification
            {
                Name = "repost.notifications",
                NumPartitions = 8,
                ReplicationFactor = 3,
                Configs = new Dictionary<string, string>
                {
                    ["retention.ms"] = "604800000", // 7 days
                    ["cleanup.policy"] = "delete",
                    ["compression.type"] = "snappy",
                    ["min.insync.replicas"] = "2"
                }
            },
            
            ["safety.alerts"] = new TopicSpecification
            {
                Name = "safety.alerts",
                NumPartitions = 2,
                ReplicationFactor = 3,
                Configs = new Dictionary<string, string>
                {
                    ["retention.ms"] = "7776000000", // 90 days for compliance
                    ["cleanup.policy"] = "delete",
                    ["compression.type"] = "snappy",
                    ["min.insync.replicas"] = "2"
                }
            }
        };
    }
}

/// <summary>
/// Kafka topic specification
/// </summary>
public class TopicSpecification
{
    public string Name { get; set; } = string.Empty;
    public int NumPartitions { get; set; }
    public short ReplicationFactor { get; set; }
    public Dictionary<string, string> Configs { get; set; } = new();
}
