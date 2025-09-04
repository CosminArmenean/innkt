using innkt.KafkaCommunicationLibrary.Interfaces;
using innkt.KafkaCommunicationLibrary.Models;
using innkt.KafkaCommunicationLibrary.Configuration;
using Microsoft.Extensions.Options;

namespace innkt.NeuroSpark.Services;

public class KafkaService : IKafkaService, IDisposable
{
    private readonly IKafkaProducer _producer;
    private readonly IKafkaConsumer _consumer;
    private readonly ILogger<KafkaService> _logger;
    private readonly KafkaServiceSettings _settings;
    private readonly Dictionary<string, Func<object, Task>> _eventHandlers;
    private readonly Dictionary<string, int> _topicMessageCounts;
    private readonly DateTime _startTime;
    private int _messagesProduced;
    private int _messagesConsumed;
    private int _errors;
    private bool _disposed = false;

    public KafkaService(
        IKafkaProducer producer,
        IKafkaConsumer consumer,
        IOptions<KafkaServiceSettings> settings,
        ILogger<KafkaService> logger)
    {
        _producer = producer ?? throw new ArgumentNullException(nameof(producer));
        _consumer = consumer ?? throw new ArgumentNullException(nameof(consumer));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        _eventHandlers = new Dictionary<string, Func<object, Task>>();
        _topicMessageCounts = new Dictionary<string, int>();
        _startTime = DateTime.UtcNow;
        
        // Start consuming from configured topics
        StartConsumingFromConfiguredTopics();
    }

    public async Task PublishEventAsync<T>(string topic, T eventData, string eventType, string? correlationId = null)
    {
        try
        {
            var message = new KafkaMessage<T>
            {
                Data = eventData,
                Type = eventType,
                Source = _settings.ServiceName,
                CorrelationId = correlationId
            };

            await _producer.ProduceAsync(topic, message);
            
            Interlocked.Increment(ref _messagesProduced);
            IncrementTopicMessageCount(topic);
            
            _logger.LogDebug("Event published to topic {Topic}: {EventType} from {Source}", 
                topic, eventType, _settings.ServiceName);
        }
        catch (Exception ex)
        {
            Interlocked.Increment(ref _errors);
            _logger.LogError(ex, "Error publishing event to topic {Topic}", topic);
            throw;
        }
    }

    public async Task SubscribeToEventsAsync<T>(string topic, Func<T, Task> eventHandler)
    {
        try
        {
            var handler = new Func<object, Task>(async (data) =>
            {
                if (data is T typedData)
                {
                    await eventHandler(typedData);
                    Interlocked.Increment(ref _messagesConsumed);
                    IncrementTopicMessageCount(topic);
                }
            });

            _eventHandlers[topic] = handler;
            
            await _consumer.StartConsumingAsync(topic, handler);
            
            _logger.LogInformation("Subscribed to events from topic {Topic}", topic);
        }
        catch (Exception ex)
        {
            Interlocked.Increment(ref _errors);
            _logger.LogError(ex, "Error subscribing to topic {Topic}", topic);
            throw;
        }
    }

    public async Task<KafkaConnectionStatus> GetConnectionStatusAsync()
    {
        try
        {
            var status = new KafkaConnectionStatus
            {
                IsConnected = _consumer.IsConsuming,
                BootstrapServers = _settings.BootstrapServers,
                LastConnected = _startTime,
                ConnectedTopics = _eventHandlers.Keys.ToList()
            };

            if (!status.IsConnected)
            {
                status.ErrorMessage = "Consumer is not actively consuming";
            }

            return await Task.FromResult(status);
        }
        catch (Exception ex)
        {
            Interlocked.Increment(ref _errors);
            _logger.LogError(ex, "Error getting connection status");
            
            return new KafkaConnectionStatus
            {
                IsConnected = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<KafkaMetrics> GetMetricsAsync()
    {
        try
        {
            var metrics = new KafkaMetrics
            {
                MessagesProduced = _messagesProduced,
                MessagesConsumed = _messagesConsumed,
                Errors = _errors,
                Uptime = DateTime.UtcNow - _startTime,
                TopicMessageCounts = new Dictionary<string, int>(_topicMessageCounts),
                LastUpdated = DateTime.UtcNow
            };

            return await Task.FromResult(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting metrics");
            throw;
        }
    }

    private void StartConsumingFromConfiguredTopics()
    {
        foreach (var topic in _settings.SubscribeToTopics)
        {
            try
            {
                // Subscribe to topic with a generic handler
                _ = Task.Run(async () =>
                {
                    await _consumer.StartConsumingAsync(topic, async (message) =>
                    {
                        try
                        {
                            _logger.LogDebug("Received message from topic {Topic}: {MessageType}", 
                                topic, message.Type);
                            
                            // Handle the message based on its type
                            await HandleMessageAsync(topic, message);
                            
                            Interlocked.Increment(ref _messagesConsumed);
                            IncrementTopicMessageCount(topic);
                        }
                        catch (Exception ex)
                        {
                            Interlocked.Increment(ref _errors);
                            _logger.LogError(ex, "Error handling message from topic {Topic}", topic);
                        }
                    });
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting consumer for topic {Topic}", topic);
            }
        }
    }

    private async Task HandleMessageAsync(string topic, KafkaMessage<object> message)
    {
        try
        {
            // Handle different message types
            switch (message.Type.ToLower())
            {
                case "user.registered":
                    await HandleUserRegisteredEvent(message);
                    break;
                case "user.updated":
                    await HandleUserUpdatedEvent(message);
                    break;
                case "image.processing.requested":
                    await HandleImageProcessingRequestedEvent(message);
                    break;
                case "qr.code.generated":
                    await HandleQrCodeGeneratedEvent(message);
                    break;
                default:
                    _logger.LogDebug("Unknown message type: {MessageType} from topic {Topic}", 
                        message.Type, topic);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling message of type {MessageType} from topic {Topic}", 
                message.Type, topic);
            throw;
        }
    }

    private async Task HandleUserRegisteredEvent(KafkaMessage<object> message)
    {
        _logger.LogInformation("Handling user registered event: {UserId}", message.CorrelationId);
        // Implement user registration logic
        await Task.CompletedTask;
    }

    private async Task HandleUserUpdatedEvent(KafkaMessage<object> message)
    {
        _logger.LogInformation("Handling user updated event: {UserId}", message.CorrelationId);
        // Implement user update logic
        await Task.CompletedTask;
    }

    private async Task HandleImageProcessingRequestedEvent(KafkaMessage<object> message)
    {
        _logger.LogInformation("Handling image processing requested event: {CorrelationId}", message.CorrelationId);
        // Implement image processing logic
        await Task.CompletedTask;
    }

    private async Task HandleQrCodeGeneratedEvent(KafkaMessage<object> message)
    {
        _logger.LogInformation("Handling QR code generated event: {CorrelationId}", message.CorrelationId);
        // Implement QR code generation logic
        await Task.CompletedTask;
    }

    private void IncrementTopicMessageCount(string topic)
    {
        lock (_topicMessageCounts)
        {
            if (_topicMessageCounts.ContainsKey(topic))
            {
                _topicMessageCounts[topic]++;
            }
            else
            {
                _topicMessageCounts[topic] = 1;
            }
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
            _consumer?.StopConsuming();
            _disposed = true;
        }
    }
}


