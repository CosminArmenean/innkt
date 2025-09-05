using Confluent.Kafka;

namespace innkt.KafkaCommunicationLibrary.Configuration;

public class KafkaProducerSettings
{
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string ClientId { get; set; } = "innkt-producer";
    public Acks Acks { get; set; } = Acks.All;
    public bool EnableIdempotence { get; set; } = true;
    public int MessageTimeoutMs { get; set; } = 30000;
    public int RetryBackoffMs { get; set; } = 100;
    public int MessageSendMaxRetries { get; set; } = 3;
    public CompressionType CompressionType { get; set; } = CompressionType.Snappy;
    public int BatchSize { get; set; } = 16384;
    public int LingerMs { get; set; } = 5;
}



