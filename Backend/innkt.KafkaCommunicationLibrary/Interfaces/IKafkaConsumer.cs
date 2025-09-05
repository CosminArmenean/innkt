using innkt.KafkaCommunicationLibrary.Models;

namespace innkt.KafkaCommunicationLibrary.Interfaces;

public interface IKafkaConsumer
{
    Task StartConsumingAsync(string topic, Func<KafkaMessage<object>, Task> messageHandler, CancellationToken cancellationToken = default);
    
    Task StartConsumingAsync<T>(string topic, Func<KafkaMessage<T>, Task> messageHandler, CancellationToken cancellationToken = default);
    
    void StopConsuming();
    
    bool IsConsuming { get; }
}






