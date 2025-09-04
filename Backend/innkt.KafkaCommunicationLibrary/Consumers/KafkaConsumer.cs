using Confluent.Kafka;
using innkt.KafkaCommunicationLibrary.Interfaces;
using innkt.KafkaCommunicationLibrary.Models;
using innkt.KafkaCommunicationLibrary.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace innkt.KafkaCommunicationLibrary.Consumers;

public class KafkaConsumer : IKafkaConsumer, IDisposable
{
    private readonly IConsumer<string, string> _consumer;
    private readonly ILogger<KafkaConsumer> _logger;
    private readonly KafkaConsumerSettings _settings;
    private readonly CancellationTokenSource _cancellationTokenSource;
    private Task? _consumingTask;
    private bool _disposed = false;

    public bool IsConsuming => _consumingTask?.Status == TaskStatus.Running;

    public KafkaConsumer(KafkaConsumerSettings settings, ILogger<KafkaConsumer> logger)
    {
        _settings = settings ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cancellationTokenSource = new CancellationTokenSource();

        var config = new ConsumerConfig
        {
            BootstrapServers = _settings.BootstrapServers,
            GroupId = _settings.GroupId,
            ClientId = _settings.ClientId,
            AutoOffsetReset = _settings.AutoOffsetReset,
            EnableAutoCommit = _settings.EnableAutoCommit,
            AutoCommitIntervalMs = _settings.AutoCommitIntervalMs,
            SessionTimeoutMs = _settings.SessionTimeoutMs,
            HeartbeatIntervalMs = _settings.HeartbeatIntervalMs,
            MaxPollIntervalMs = _settings.MaxPollIntervalMs,
            FetchMinBytes = _settings.FetchMinBytes,
            FetchWaitMaxMs = _settings.FetchWaitMaxMs
        };

        _consumer = new ConsumerBuilder<string, string>(config)
            .SetLogHandler((_, message) => _logger.LogDebug("Kafka: {Message}", message.Message))
            .SetErrorHandler((_, error) => _logger.LogError("Kafka error: {Error}", error.Reason))
            .SetPartitionsAssignedHandler((_, partitions) => _logger.LogInformation("Assigned partitions: {Partitions}", string.Join(", ", partitions)))
            .SetPartitionsRevokedHandler((_, partitions) => _logger.LogInformation("Revoked partitions: {Partitions}", string.Join(", ", partitions)))
            .Build();
    }

    public async Task StartConsumingAsync(string topic, Func<KafkaMessage<object>, Task> messageHandler, CancellationToken cancellationToken = default)
    {
        await StartConsumingAsync<object>(topic, messageHandler, cancellationToken);
    }

    public async Task StartConsumingAsync<T>(string topic, Func<KafkaMessage<T>, Task> messageHandler, CancellationToken cancellationToken = default)
    {
        if (IsConsuming)
        {
            _logger.LogWarning("Consumer is already consuming from topic {Topic}", topic);
            return;
        }

        try
        {
            _consumer.Subscribe(topic);
            _logger.LogInformation("Started consuming from topic {Topic}", topic);

            var combinedCancellationToken = CancellationTokenSource.CreateLinkedTokenSource(
                _cancellationTokenSource.Token, cancellationToken).Token;

            _consumingTask = Task.Run(async () =>
            {
                try
                {
                    while (!combinedCancellationToken.IsCancellationRequested)
                    {
                        try
                        {
                            var consumeResult = _consumer.Consume(combinedCancellationToken);
                            
                            if (consumeResult?.Message?.Value != null)
                            {
                                await ProcessMessageAsync<T>(consumeResult.Message, messageHandler);
                                
                                if (_settings.EnableAutoCommit)
                                {
                                    _consumer.Commit(consumeResult);
                                }
                            }
                        }
                        catch (OperationCanceledException)
                        {
                            _logger.LogInformation("Consuming cancelled for topic {Topic}", topic);
                            break;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error consuming message from topic {Topic}", topic);
                            
                            if (_settings.StopOnError)
                            {
                                break;
                            }
                        }
                    }
                }
                finally
                {
                    _consumer.Close();
                    _logger.LogInformation("Stopped consuming from topic {Topic}", topic);
                }
            }, combinedCancellationToken);

            await _consumingTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting consumer for topic {Topic}", topic);
            throw;
        }
    }

    private async Task ProcessMessageAsync<T>(Message<string, string> message, Func<KafkaMessage<T>, Task> messageHandler)
    {
        try
        {
            var kafkaMessage = JsonSerializer.Deserialize<KafkaMessage<T>>(message.Value);
            if (kafkaMessage != null)
            {
                _logger.LogDebug("Processing message {MessageId} of type {MessageType} from {Source}", 
                    kafkaMessage.Id, kafkaMessage.Type, kafkaMessage.Source);

                await messageHandler(kafkaMessage);
                
                _logger.LogDebug("Successfully processed message {MessageId}", kafkaMessage.Id);
            }
            else
            {
                _logger.LogWarning("Failed to deserialize message from topic");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message {MessageId}", message.Key);
            throw;
        }
    }

    public void StopConsuming()
    {
        if (!IsConsuming)
        {
            _logger.LogWarning("Consumer is not currently consuming");
            return;
        }

        try
        {
            _cancellationTokenSource.Cancel();
            _consumingTask?.Wait(TimeSpan.FromSeconds(10));
            _logger.LogInformation("Consumer stopped successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping consumer");
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
            StopConsuming();
            _cancellationTokenSource?.Dispose();
            _consumer?.Dispose();
            _disposed = true;
        }
    }
}


