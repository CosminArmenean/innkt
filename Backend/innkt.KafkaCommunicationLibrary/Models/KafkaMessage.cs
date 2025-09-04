using System.Text.Json.Serialization;

namespace innkt.KafkaCommunicationLibrary.Models;

public class KafkaMessage<T>
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("version")]
    public string Version { get; set; } = "1.0";
    
    [JsonPropertyName("data")]
    public T? Data { get; set; }
    
    [JsonPropertyName("metadata")]
    public Dictionary<string, object> Metadata { get; set; } = new();
    
    [JsonPropertyName("correlationId")]
    public string? CorrelationId { get; set; }
    
    [JsonPropertyName("source")]
    public string Source { get; set; } = string.Empty;
}





