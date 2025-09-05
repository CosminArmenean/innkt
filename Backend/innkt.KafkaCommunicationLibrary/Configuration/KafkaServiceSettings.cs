namespace innkt.KafkaCommunicationLibrary.Configuration;

public class KafkaServiceSettings
{
    public string BootstrapServers { get; set; } = "localhost:9092";
    public string ServiceName { get; set; } = "NeuroSpark";
    public List<string> SubscribeToTopics { get; set; } = new()
    {
        "user.events",
        "image.processing.events",
        "qr.code.events"
    };
    public List<string> PublishToTopics { get; set; } = new()
    {
        "image.processing.results",
        "qr.code.results",
        "service.health"
    };
}



