using Confluent.Kafka;
using innkt.KafkaCommunicationLibrary.Interfaces;
using innkt.KafkaCommunicationLibrary.Models;
using innkt.KafkaCommunicationLibrary.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace innkt.KafkaCommunicationLibrary.Producers;

public class KafkaProducer : IKafkaProducer, IDisposable
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaProducer> _logger;
    private readonly KafkaProducerSettings _settings;
    private bool _disposed = false;

    public KafkaProducer(KafkaProducerSettings settings, ILogger<KafkaProducer> logger)
    {
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        var config = new ProducerConfig
        {
            BootstrapServers = _settings.BootstrapServers,
            ClientId = _settings.ClientId,
            Acks = _settings.Acks,
            EnableIdempotence = _settings.EnableIdempotence,
            MessageTimeoutMs = _settings.MessageTimeoutMs,
            RetryBackoffMs = _settings.RetryBackoffMs,
            MessageSendMaxRetries = _settings.MessageSendMaxRetries,
            CompressionType = _settings.CompressionType,
            BatchSize = _settings.BatchSize,
            LingerMs = _settings.LingerMs
        };

        _producer = new ProducerBuilder<string, string>(config)
            .SetLogHandler((_, message) => _logger.LogDebug("Kafka: {Message}", message.Message))
            .SetErrorHandler((_, error) => _logger.LogError("Kafka error: {Error}", error.Reason))
            .Build();
    }

    public async Task<DeliveryResult<string, string>> ProduceAsync<T>(string topic, KafkaMessage<T> message, CancellationToken cancellationToken = default)
    {
        try
        {
            var jsonMessage = JsonSerializer.Serialize(message);
            var kafkaMessage = new Message<string, string>
            {
                Key = message.Id.ToString(),
                Value = jsonMessage,
                Headers = new Headers
                {
                    { "messageType", System.Text.Encoding.UTF8.GetBytes(message.Type) },
                    { "source", System.Text.Encoding.UTF8.GetBytes(message.Source) },
                    { "version", System.Text.Encoding.UTF8.GetBytes(message.Version) }
                }
            };

            var result = await _producer.ProduceAsync(topic, kafkaMessage, cancellationToken);
            
            _logger.LogDebug("Message produced to topic {Topic}, partition {Partition}, offset {Offset}", 
                result.Topic, result.Partition, result.Offset);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error producing message to topic {Topic}", topic);
            throw;
        }
    }

    public async Task<DeliveryResult<string, string>> ProduceAsync<T>(string topic, T data, string messageType, string source, string? correlationId = null, CancellationToken cancellationToken = default)
    {
        var message = new KafkaMessage<T>
        {
            Data = data,
            Type = messageType,
            Source = source,
            CorrelationId = correlationId
        };

        return await ProduceAsync(topic, message, cancellationToken);
    }

    public void Produce<T>(string topic, KafkaMessage<T> message, Action<DeliveryReport<string, string>>? deliveryHandler = null)
    {
        try
        {
            var jsonMessage = JsonSerializer.Serialize(message);
            var kafkaMessage = new Message<string, string>
            {
                Key = message.Id.ToString(),
                Value = jsonMessage,
                Headers = new Headers
                {
                    { "messageType", System.Text.Encoding.UTF8.GetBytes(message.Type) },
                    { "source", System.Text.Encoding.UTF8.GetBytes(message.Source) },
                    { "version", System.Text.Encoding.UTF8.GetBytes(message.Version) }
                }
            };

            _producer.Produce(topic, kafkaMessage, deliveryHandler ?? DefaultDeliveryHandler);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error producing message to topic {Topic}", topic);
            throw;
        }
    }

    public void Produce<T>(string topic, T data, string messageType, string source, string? correlationId = null, Action<DeliveryReport<string, string>>? deliveryHandler = null)
    {
        var message = new KafkaMessage<T>
        {
            Data = data,
            Type = messageType,
            Source = source,
            CorrelationId = correlationId
        };

        Produce(topic, message, deliveryHandler);
    }

    private void DefaultDeliveryHandler(DeliveryReport<string, string> report)
    {
        if (report.Error.IsError)
        {
            _logger.LogError("Message delivery failed: {Error}", report.Error.Reason);
        }
        else
        {
            _logger.LogDebug("Message delivered to topic {Topic}, partition {Partition}, offset {Offset}", 
                report.Topic, report.Partition, report.Offset);
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _producer?.Flush(TimeSpan.FromSeconds(10));
            _producer?.Dispose();
            _disposed = true;
        }
    }
}


