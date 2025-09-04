using innkt.KafkaCommunicationLibrary.Models;
using Confluent.Kafka;

namespace innkt.KafkaCommunicationLibrary.Interfaces;

public interface IKafkaProducer
{
    Task<DeliveryResult<string, string>> ProduceAsync<T>(string topic, KafkaMessage<T> message, CancellationToken cancellationToken = default);
    
    Task<DeliveryResult<string, string>> ProduceAsync<T>(string topic, T data, string messageType, string source, string? correlationId = null, CancellationToken cancellationToken = default);
    
    void Produce<T>(string topic, KafkaMessage<T> message, Action<DeliveryReport<string, string>>? deliveryHandler = null);
    
    void Produce<T>(string topic, T data, string messageType, string source, string? correlationId = null, Action<DeliveryReport<string, string>>? deliveryHandler = null);
}
