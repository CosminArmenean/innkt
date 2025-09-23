using innkt.Common.Models.Events;
using innkt.Notifications.Models;
using Confluent.Kafka;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using innkt.Notifications.Hubs;

namespace innkt.Notifications.Services;

/// <summary>
/// Event consumer for processing notification events from Kafka
/// </summary>
public class EventConsumer : IEventConsumer
{
    private readonly IConsumer<string, string> _kafkaConsumer;
    private readonly INotificationService _notificationService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<EventConsumer> _logger;
    private readonly CancellationTokenSource _cancellationTokenSource;

    public EventConsumer(
        IConsumer<string, string> kafkaConsumer,
        INotificationService notificationService,
        IHubContext<NotificationHub> hubContext,
        ILogger<EventConsumer> logger)
    {
        _kafkaConsumer = kafkaConsumer;
        _notificationService = notificationService;
        _hubContext = hubContext;
        _logger = logger;
        _cancellationTokenSource = new CancellationTokenSource();
    }

    public async Task StartConsumingAsync()
    {
        try
        {
            _logger.LogInformation("🚀 Starting event consumer for notifications...");

            // Subscribe to notification topics
            var topics = new[]
            {
                "social.events",
                "grok.events", 
                "kid.safety",
                "user.actions",
                "system.alerts"
            };

            _kafkaConsumer.Subscribe(topics);
            
            _logger.LogInformation("✅ Event consumer started successfully for topics: {Topics}", string.Join(", ", topics));

            // Start consuming loop
            while (!_cancellationTokenSource.Token.IsCancellationRequested)
            {
                try
                {
                    var consumeResult = _kafkaConsumer.Consume(_cancellationTokenSource.Token);
                    if (consumeResult?.Message != null)
                    {
                        await ProcessEventAsync(consumeResult);
                    }
                }
                catch (ConsumeException ex) when (ex.Error.Code == ErrorCode.UnknownTopicOrPart)
                {
                    _logger.LogWarning("⚠️ Topic not available yet: {Topic}. Topics will be created automatically when first events are published.", ex.Error.Reason);
                    await Task.Delay(5000, _cancellationTokenSource.Token); // Wait 5 seconds before retrying
                }
                catch (ConsumeException ex)
                {
                    _logger.LogError(ex, "❌ Error consuming message: {Error}", ex.Error.Reason);
                    await Task.Delay(1000, _cancellationTokenSource.Token); // Wait 1 second before retrying
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to start event consumer");
            throw;
        }
    }

    public async Task StopConsumingAsync()
    {
        try
        {
            _cancellationTokenSource.Cancel();
            _kafkaConsumer.Unsubscribe();
            _logger.LogInformation("🛑 Event consumer stopped");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error stopping event consumer");
        }
    }

    private async Task ProcessEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("📨 Processing event from topic {Topic}: {Key}", consumeResult.Topic, consumeResult.Message.Key);

            // Parse the event based on topic
            switch (consumeResult.Topic)
            {
                case "social.events":
                    await ProcessSocialEventAsync(consumeResult);
                    break;
                case "grok.events":
                    await ProcessGrokEventAsync(consumeResult);
                    break;
                case "kid.safety":
                    await ProcessKidSafetyEventAsync(consumeResult);
                    break;
                case "user.actions":
                    await ProcessUserActionEventAsync(consumeResult);
                    break;
                case "system.alerts":
                    await ProcessSystemAlertEventAsync(consumeResult);
                    break;
                default:
                    _logger.LogWarning("⚠️ Unknown topic: {Topic}", consumeResult.Topic);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing event from topic {Topic}", consumeResult.Topic);
        }
    }

    private async Task ProcessSocialEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            var socialEvent = JsonSerializer.Deserialize<SocialEvent>(consumeResult.Message.Value);
            if (socialEvent == null) return;

            _logger.LogInformation("📱 Processing social event: {EventType} for user {UserId}", 
                socialEvent.EventType, socialEvent.UserId);

            // Validate UserId before parsing
            if (string.IsNullOrEmpty(socialEvent.UserId) || !Guid.TryParse(socialEvent.UserId, out var recipientId))
            {
                _logger.LogWarning("⚠️ Invalid or missing UserId in social event: {UserId}", socialEvent.UserId);
                return;
            }

            // Create notification based on event type
            var notification = new EventNotification
            {
                Type = socialEvent.EventType,
                RecipientId = recipientId,
                Title = GetSocialEventTitle(socialEvent),
                Message = GetSocialEventMessage(socialEvent),
                Priority = socialEvent.Metadata.Priority,
                Channel = "in_app,push",
                Metadata = socialEvent.Metadata.Tags
            };

            await _notificationService.SendNotificationAsync(notification);
            
            // Send real-time notification via SignalR
            _logger.LogInformation("📡 Sending SignalR notification to group user_{RecipientId}", notification.RecipientId);
            await _hubContext.Clients.Group($"user_{notification.RecipientId}").SendAsync("notification", notification);
            _logger.LogInformation("✅ SignalR notification sent successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing social event");
        }
    }

    private async Task ProcessGrokEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            var grokEvent = JsonSerializer.Deserialize<GrokEvent>(consumeResult.Message.Value);
            if (grokEvent == null) return;

            _logger.LogInformation("🤖 Processing Grok event: {EventType} for user {UserId}", 
                grokEvent.EventType, grokEvent.UserId);

            var notification = new EventNotification
            {
                Type = "grok_response",
                RecipientId = Guid.Parse(grokEvent.UserId),
                Title = "🤖 Grok AI Response Ready",
                Message = "Your Grok AI response is ready! Check the comments section.",
                Priority = "medium",
                Channel = "in_app,push",
                Metadata = new Dictionary<string, object>
                {
                    { "postId", grokEvent.PostId },
                    { "commentId", grokEvent.OriginalCommentId },
                    { "confidence", grokEvent.Confidence }
                }
            };

            await _notificationService.SendNotificationAsync(notification);
            
            // Send real-time notification via SignalR
            await _hubContext.Clients.Group($"user_{notification.RecipientId}").SendAsync("notification", notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing Grok event");
        }
    }

    private async Task ProcessKidSafetyEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            var safetyEvent = JsonSerializer.Deserialize<KidSafetyEvent>(consumeResult.Message.Value);
            if (safetyEvent == null) return;

            _logger.LogInformation("👶 Processing kid safety event: {EventType} for kid {KidId}", 
                safetyEvent.EventType, safetyEvent.KidAccountId);

            // Create safety alert notification
            var notification = new EventNotification
            {
                Type = "safety_alert",
                RecipientId = Guid.Parse(safetyEvent.ParentAccountId),
                Title = $"🚨 Safety Alert - {safetyEvent.SafetyType}",
                Message = $"Safety alert for {safetyEvent.SafetyType}",
                Priority = safetyEvent.Severity,
                Channel = "in_app,push",
                Metadata = safetyEvent.SafetyData
            };

            await _notificationService.SendNotificationAsync(notification);
            
            // Send real-time notification via SignalR
            await _hubContext.Clients.Group($"user_{notification.RecipientId}").SendAsync("notification", notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing kid safety event");
        }
    }

    private async Task ProcessUserActionEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            var userEvent = JsonSerializer.Deserialize<UserActionEvent>(consumeResult.Message.Value);
            if (userEvent == null) return;

            _logger.LogInformation("👤 Processing user action event: {EventType} for user {UserId}", 
                userEvent.EventType, userEvent.UserId);

            // Process user action notifications (likes, follows, etc.)
            // Implementation depends on specific user action types
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing user action event");
        }
    }

    private async Task ProcessSystemAlertEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            var systemEvent = JsonSerializer.Deserialize<SystemEvent>(consumeResult.Message.Value);
            if (systemEvent == null) return;

            _logger.LogInformation("🔔 Processing system alert event: {EventType}", systemEvent.EventType);

            // Process system alerts
            var notification = new EventNotification
            {
                Type = "system_alert",
                RecipientId = Guid.Parse(systemEvent.UserId),
                Title = "System Alert",
                Message = systemEvent.Message,
                Priority = "high",
                Channel = "in_app,email"
            };

            await _notificationService.SendNotificationAsync(notification);
            
            // Send real-time notification via SignalR
            await _hubContext.Clients.Group($"user_{notification.RecipientId}").SendAsync("notification", notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing system alert event");
        }
    }

    private string GetSocialEventTitle(SocialEvent socialEvent)
    {
        return socialEvent.EventType switch
        {
            "comment_notification" => "💬 New Comment",
            "like_notification" => "❤️ Post Liked",
            "follow_notification" => "👥 New Follower",
            _ => "📱 Social Update"
        };
    }

    private string GetSocialEventMessage(SocialEvent socialEvent)
    {
        return socialEvent.EventType switch
        {
            "comment_notification" => "Someone commented on your post",
            "like_notification" => "Someone liked your post",
            "follow_notification" => "Someone started following you",
            _ => "You have a new social update"
        };
    }

    public void Dispose()
    {
        _cancellationTokenSource?.Dispose();
    }
}

public interface IEventConsumer : IDisposable
{
    Task StartConsumingAsync();
    Task StopConsumingAsync();
}
