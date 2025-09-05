using Confluent.Kafka;

namespace innkt.KafkaCommunicationLibrary.Configuration;

public class KafkaConsumerSettings
{
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string GroupId { get; set; } = "innkt-consumer-group";
    public string ClientId { get; set; } = "innkt-consumer";
    public AutoOffsetReset AutoOffsetReset { get; set; } = AutoOffsetReset.Earliest;
    public bool EnableAutoCommit { get; set; } = true;
    public int AutoCommitIntervalMs { get; set; } = 5000;
    public int SessionTimeoutMs { get; set; } = 30000;
    public int HeartbeatIntervalMs { get; set; } = 3000;
    public int MaxPollIntervalMs { get; set; } = 300000;
    public int FetchMinBytes { get; set; } = 1;
    public int FetchWaitMaxMs { get; set; } = 100;
    public bool StopOnError { get; set; } = false;
}



