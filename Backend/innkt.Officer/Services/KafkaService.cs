using Confluent.Kafka;
using innkt.KafkaCommunicationLibrary.Interfaces;
using innkt.KafkaCommunicationLibrary.Models;
using innkt.KafkaCommunicationLibrary.Configuration;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace innkt.Officer.Services;

public class KafkaService : IKafkaProducer, IDisposable
{
    private readonly ILogger<KafkaService> _logger;
    private readonly KafkaProducerSettings _producerSettings;
    private readonly KafkaConsumerSettings _consumerSettings;
    private readonly KafkaServiceSettings _serviceSettings;
    private readonly IKafkaProducer _producer;
    private readonly IKafkaConsumer _consumer;
    private bool _disposed = false;

    public KafkaService(
        IOptions<KafkaProducerSettings> producerOptions,
        IOptions<KafkaConsumerSettings> consumerOptions,
        IOptions<KafkaServiceSettings> serviceOptions,
        ILogger<KafkaService> logger,
        ILoggerFactory loggerFactory)
    {
        _producerSettings = producerOptions.Value;
        _consumerSettings = consumerOptions.Value;
        _serviceSettings = serviceOptions.Value;
        _logger = logger;

        // Initialize producer and consumer with correct logger types
        var producerLogger = loggerFactory.CreateLogger<innkt.KafkaCommunicationLibrary.Producers.KafkaProducer>();
        var consumerLogger = loggerFactory.CreateLogger<innkt.KafkaCommunicationLibrary.Consumers.KafkaConsumer>();
        
        _producer = new innkt.KafkaCommunicationLibrary.Producers.KafkaProducer(_producerSettings, producerLogger);
        _consumer = new innkt.KafkaCommunicationLibrary.Consumers.KafkaConsumer(_consumerSettings, consumerLogger);
    }

    // Publish user events
    public async Task PublishUserEventAsync(string eventType, object data, string? correlationId = null)
    {
        try
        {
            await _producer.ProduceAsync(
                "user.events",
                data,
                eventType,
                _serviceSettings.ServiceName,
                correlationId
            );
            
            _logger.LogDebug("Published user event {EventType} to user.events topic", eventType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish user event {EventType}", eventType);
            throw;
        }
    }

    // Publish authentication events
    public async Task PublishAuthEventAsync(string eventType, object data, string? correlationId = null)
    {
        try
        {
            await _producer.ProduceAsync(
                "auth.events",
                data,
                eventType,
                _serviceSettings.ServiceName,
                correlationId
            );
            
            _logger.LogDebug("Published auth event {EventType} to auth.events topic", eventType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish auth event {EventType}", eventType);
            throw;
        }
    }

    // Publish user registration event
    public async Task PublishUserRegisteredEventAsync(string userId, string username, string email, string? correlationId = null)
    {
        var eventData = new
        {
            UserId = userId,
            Username = username,
            Email = email,
            RegisteredAt = DateTime.UtcNow,
            Source = "Officer"
        };

        await PublishUserEventAsync("user.registered", eventData, correlationId);
    }

    // Publish user login event
    public async Task PublishUserLoginEventAsync(string userId, string username, string loginMethod, string? correlationId = null)
    {
        var eventData = new
        {
            UserId = userId,
            Username = username,
            LoginMethod = loginMethod, // "password", "oauth", "2fa"
            LoginAt = DateTime.UtcNow,
            Source = "Officer"
        };

        await PublishUserEventAsync("user.login", eventData, correlationId);
    }

    // Publish user logout event
    public async Task PublishUserLogoutEventAsync(string userId, string username, string? correlationId = null)
    {
        var eventData = new
        {
            UserId = userId,
            Username = username,
            LogoutAt = DateTime.UtcNow,
            Source = "Officer"
        };

        await PublishUserEventAsync("user.logout", eventData, correlationId);
    }

    // Publish 2FA setup event
    public async Task Publish2FASetupEventAsync(string userId, string username, string method, string? correlationId = null)
    {
        var eventData = new
        {
            UserId = userId,
            Username = username,
            Method = method, // "email", "sms", "totp"
            SetupAt = DateTime.UtcNow,
            Source = "Officer"
        };

        await PublishAuthEventAsync("2fa.setup", eventData, correlationId);
    }

    // Publish profile update event
    public async Task PublishProfileUpdateEventAsync(string userId, string username, string updateType, object changes, string? correlationId = null)
    {
        var eventData = new
        {
            UserId = userId,
            Username = username,
            UpdateType = updateType, // "profile", "settings", "privacy"
            Changes = changes,
            UpdatedAt = DateTime.UtcNow,
            Source = "Officer"
        };

        await PublishUserEventAsync("user.profile.updated", eventData, correlationId);
    }

    // Publish account verification event
    public async Task PublishAccountVerificationEventAsync(string userId, string username, string verificationType, bool isVerified, string? correlationId = null)
    {
        var eventData = new
        {
            UserId = userId,
            Username = username,
            VerificationType = verificationType, // "email", "phone", "identity"
            IsVerified = isVerified,
            VerifiedAt = DateTime.UtcNow,
            Source = "Officer"
        };

        await PublishUserEventAsync("user.verification", eventData, correlationId);
    }

    // Publish security event
    public async Task PublishSecurityEventAsync(string eventType, string userId, string username, object details, string? correlationId = null)
    {
        var eventData = new
        {
            UserId = userId,
            Username = username,
            EventType = eventType, // "suspicious_login", "password_changed", "account_locked"
            Details = details,
            OccurredAt = DateTime.UtcNow,
            Source = "Officer"
        };

        await PublishAuthEventAsync("security.event", eventData, correlationId);
    }

    // Publish service health event
    public async Task PublishHealthEventAsync(string status, object details, string? correlationId = null)
    {
        var eventData = new
        {
            Service = _serviceSettings.ServiceName,
            Status = status, // "healthy", "degraded", "unhealthy"
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        try
        {
            await _producer.ProduceAsync(
                "service.health",
                eventData,
                "health.check",
                _serviceSettings.ServiceName,
                correlationId
            );
            
            _logger.LogDebug("Published health event for {Service}", _serviceSettings.ServiceName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish health event for {Service}", _serviceSettings.ServiceName);
            throw;
        }
    }

    // Subscribe to identity events (for cross-service communication)
    public async Task SubscribeToIdentityEventsAsync(Func<KafkaMessage<object>, Task> messageHandler, CancellationToken cancellationToken = default)
    {
        try
        {
            await _consumer.StartConsumingAsync("identity.events", messageHandler, cancellationToken);
            _logger.LogInformation("Subscribed to identity.events topic");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to subscribe to identity.events topic");
            throw;
        }
    }

    // Subscribe to system events
    public async Task SubscribeToSystemEventsAsync(Func<KafkaMessage<object>, Task> messageHandler, CancellationToken cancellationToken = default)
    {
        try
        {
            await _consumer.StartConsumingAsync("system.events", messageHandler, cancellationToken);
            _logger.LogInformation("Subscribed to system.events topic");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to subscribe to system.events topic");
            throw;
        }
    }

    // IKafkaProducer implementation
    public async Task<DeliveryResult<string, string>> ProduceAsync<T>(string topic, KafkaMessage<T> message, CancellationToken cancellationToken = default)
    {
        return await _producer.ProduceAsync(topic, message, cancellationToken);
    }

    public async Task<DeliveryResult<string, string>> ProduceAsync<T>(string topic, T data, string messageType, string source, string? correlationId = null, CancellationToken cancellationToken = default)
    {
        return await _producer.ProduceAsync(topic, data, messageType, source, correlationId, cancellationToken);
    }

    public void Produce<T>(string topic, KafkaMessage<T> message, Action<DeliveryReport<string, string>>? deliveryHandler = null)
    {
        _producer.Produce(topic, message, deliveryHandler);
    }

    public void Produce<T>(string topic, T data, string messageType, string source, string? correlationId = null, Action<DeliveryReport<string, string>>? deliveryHandler = null)
    {
        _producer.Produce(topic, data, messageType, source, correlationId, deliveryHandler);
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
            (_producer as IDisposable)?.Dispose();
            (_consumer as IDisposable)?.Dispose();
            _disposed = true;
        }
    }
}
