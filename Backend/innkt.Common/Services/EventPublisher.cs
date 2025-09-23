using Confluent.Kafka;
using innkt.Common.Models.Events;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text;

namespace innkt.Common.Services;

/// <summary>
/// Event publisher implementation using Kafka
/// </summary>
public class EventPublisher : IEventPublisher
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<EventPublisher> _logger;
    private readonly string _socialEventsTopic;
    private readonly string _grokEventsTopic;
    private readonly string _messageEventsTopic;
    private readonly string _kidSafetyEventsTopic;
    private readonly string _systemEventsTopic;

    public EventPublisher(IConfiguration configuration, ILogger<EventPublisher> logger)
    {
        _logger = logger;

        var producerConfig = new ProducerConfig
        {
            BootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092",
            ClientId = "innkt-event-publisher",
            Acks = Acks.All,
            EnableIdempotence = true,
            MessageTimeoutMs = 30000,
            RetryBackoffMs = 100,
            MessageSendMaxRetries = 3,
            CompressionType = CompressionType.Snappy,
            BatchSize = 16384,
            LingerMs = 5
        };

        _producer = new ProducerBuilder<string, string>(producerConfig)
            .SetLogHandler((_, message) => _logger.LogDebug("Kafka: {Message}", message.Message))
            .SetErrorHandler((_, error) => _logger.LogError("Kafka error: {Error}", error.Reason))
            .Build();

        _socialEventsTopic = configuration["Kafka:Topics:SocialEvents"] ?? "social.events";
        _grokEventsTopic = configuration["Kafka:Topics:GrokEvents"] ?? "grok.events";
        _messageEventsTopic = configuration["Kafka:Topics:MessageEvents"] ?? "messaging.events";
        _kidSafetyEventsTopic = configuration["Kafka:Topics:KidSafetyEvents"] ?? "kid.safety";
        _systemEventsTopic = configuration["Kafka:Topics:SystemEvents"] ?? "system.alerts";
    }

    private async Task PublishEventAsync<T>(string topic, T eventData) where T : BaseEvent
    {
        try
        {
            var jsonEvent = JsonSerializer.Serialize(eventData, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var message = new Message<string, string>
            {
                Key = eventData.UserId,
                Value = jsonEvent,
                Headers = new Headers
                {
                    { "eventType", Encoding.UTF8.GetBytes(eventData.EventType) },
                    { "userId", Encoding.UTF8.GetBytes(eventData.UserId) },
                    { "source", Encoding.UTF8.GetBytes(eventData.Metadata.Source) },
                    { "priority", Encoding.UTF8.GetBytes(eventData.Metadata.Priority) }
                }
            };

            var deliveryResult = await _producer.ProduceAsync(topic, message);
            _logger.LogInformation("Event {EventType} published to topic {Topic} with offset {Offset}", 
                eventData.EventType, topic, deliveryResult.Offset);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish event {EventType} to topic {Topic}", eventData.EventType, topic);
            throw;
        }
    }

    public Task PublishSocialEventAsync(SocialEvent socialEvent) => PublishEventAsync(_socialEventsTopic, socialEvent);
    public Task PublishGrokEventAsync(GrokEvent grokEvent) => PublishEventAsync(_grokEventsTopic, grokEvent);
    public Task PublishMessageEventAsync(MessageEvent messageEvent) => PublishEventAsync(_messageEventsTopic, messageEvent);
    public Task PublishKidSafetyEventAsync(KidSafetyEvent kidSafetyEvent) => PublishEventAsync(_kidSafetyEventsTopic, kidSafetyEvent);
    public Task PublishSystemEventAsync(SystemEvent systemEvent) => PublishEventAsync(_systemEventsTopic, systemEvent);

    public void Dispose()
    {
        _producer.Flush(TimeSpan.FromSeconds(10));
        _producer.Dispose();
    }
}