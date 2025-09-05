using innkt.KafkaCommunicationLibrary.Models;

namespace innkt.NeuroSpark.Services;

public interface IKafkaService
{
    /// <summary>
    /// Publishes an event to a Kafka topic
    /// </summary>
    Task PublishEventAsync<T>(string topic, T eventData, string eventType, string? correlationId = null);
    
    /// <summary>
    /// Subscribes to events from a Kafka topic
    /// </summary>
    Task SubscribeToEventsAsync<T>(string topic, Func<T, Task> eventHandler);
    
    /// <summary>
    /// Gets the current Kafka connection status
    /// </summary>
    Task<KafkaConnectionStatus> GetConnectionStatusAsync();
    
    /// <summary>
    /// Gets Kafka metrics and statistics
    /// </summary>
    Task<KafkaMetrics> GetMetricsAsync();
}

public class KafkaConnectionStatus
{
    public bool IsConnected { get; set; }
    public string BootstrapServers { get; set; } = string.Empty;
    public DateTime LastConnected { get; set; }
    public string? ErrorMessage { get; set; }
    public List<string> ConnectedTopics { get; set; } = new();
}

public class KafkaMetrics
{
    public int MessagesProduced { get; set; }
    public int MessagesConsumed { get; set; }
    public int Errors { get; set; }
    public TimeSpan Uptime { get; set; }
    public Dictionary<string, int> TopicMessageCounts { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}



