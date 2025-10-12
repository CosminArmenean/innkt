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
    private readonly ParentNotificationService _parentNotificationService;
    private readonly ILogger<EventConsumer> _logger;
    private readonly CancellationTokenSource _cancellationTokenSource;

    public EventConsumer(
        IConsumer<string, string> kafkaConsumer,
        INotificationService notificationService,
        IHubContext<NotificationHub> hubContext,
        ParentNotificationService parentNotificationService,
        ILogger<EventConsumer> logger)
    {
        _kafkaConsumer = kafkaConsumer;
        _notificationService = notificationService;
        _hubContext = hubContext;
        _parentNotificationService = parentNotificationService;
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
                "kid.accounts",
                "user.actions",
                "system.alerts",
                "group-invitations",          // Group invitation events
                "group-notifications",        // Group notification broadcasts
                "kid-login-code-generated",   // Kid login code events
                "kid-maturity-updated",       // Kid maturity level changes
                "kid-password-changed",       // Kid password events
                "kid-activity-tracked"        // Kid behavioral tracking
            };

            _kafkaConsumer.Subscribe(topics);
            
            _logger.LogInformation("✅ Event consumer started successfully for topics: {Topics}", string.Join(", ", topics));
            await Task.CompletedTask;

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
                catch (OperationCanceledException)
                {
                    // Normal shutdown, don't log as error
                    _logger.LogInformation("🛑 Event consumer is stopping (cancellation requested)");
                    break;
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Normal shutdown during startup, don't throw
            _logger.LogInformation("🛑 Event consumer startup cancelled");
        }
        catch (Exception ex)
        {
            // Log the error but don't throw - let the hosted service handle retries
            _logger.LogError(ex, "❌ Error in event consumer (will retry)");
            
            // Re-throw only if it's a critical startup failure that can't be recovered
            // For now, we'll let the hosted service retry instead of crashing
        }
    }

    public async Task StopConsumingAsync()
    {
        try
        {
            _cancellationTokenSource.Cancel();
            _kafkaConsumer.Unsubscribe();
            _logger.LogInformation("🛑 Event consumer stopped");
            await Task.CompletedTask;
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
                case "kid.accounts":
                    await ProcessKidAccountEventAsync(consumeResult);
                    break;
                case "user.actions":
                    await ProcessUserActionEventAsync(consumeResult);
                    break;
                case "system.alerts":
                    await ProcessSystemAlertEventAsync(consumeResult);
                    break;
                case "group-invitations":
                    await ProcessGroupInvitationEventAsync(consumeResult);
                    break;
                case "group-notifications":
                    await ProcessGroupNotificationEventAsync(consumeResult);
                    break;
                case "kid-login-code-generated":
                    await ProcessKidLoginCodeGeneratedEventAsync(consumeResult);
                    break;
                case "kid-maturity-updated":
                    await ProcessKidMaturityUpdatedEventAsync(consumeResult);
                    break;
                case "kid-password-changed":
                    await ProcessKidPasswordChangedEventAsync(consumeResult);
                    break;
                case "kid-activity-tracked":
                    await ProcessKidActivityTrackedEventAsync(consumeResult);
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
                SenderId = !string.IsNullOrEmpty(socialEvent.SenderId) && Guid.TryParse(socialEvent.SenderId, out var senderId) ? senderId : null,
                Title = GetSocialEventTitle(socialEvent),
                Message = GetSocialEventMessage(socialEvent),
                Priority = socialEvent.Metadata.Priority,
                Channel = "in_app,push",
                Metadata = new Dictionary<string, object>
                {
                    { "senderName", socialEvent.SenderName ?? "Someone" },
                    { "senderAvatar", socialEvent.SenderAvatar ?? "" },
                    { "actionUrl", socialEvent.ActionUrl ?? "" },
                    { "relatedContentId", socialEvent.RelatedContentId ?? socialEvent.PostId },
                    { "relatedContentType", socialEvent.RelatedContentType ?? "post" },
                    { "postId", socialEvent.PostId },
                    { "commentId", socialEvent.CommentId ?? "" }
                }
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
            await Task.CompletedTask;
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
            "comment_notification" => $"{socialEvent.SenderName} commented on your post",
            "like_notification" => $"{socialEvent.SenderName} liked your post",
            "follow_notification" => $"{socialEvent.SenderName} started following you",
            _ => "You have a new social update"
        };
    }

    private async Task ProcessKidAccountEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("👶 Processing kid account event: {Key}", consumeResult.Message.Key);

            // Parse the kid account event
            var kidAccountEvent = System.Text.Json.JsonSerializer.Deserialize<dynamic>(consumeResult.Message.Value);
            
            if (kidAccountEvent == null)
            {
                _logger.LogWarning("⚠️ Failed to deserialize kid account event");
                return;
            }

            // Extract event data
            var eventType = kidAccountEvent.GetProperty("eventType").GetString() ?? "unknown";
            var kidUserId = kidAccountEvent.GetProperty("kidUserId").GetString() ?? "";
            var kidDisplayName = kidAccountEvent.GetProperty("kidDisplayName").GetString() ?? "";

            // Handle different kid account events
            switch (eventType)
            {
                case "kid_follow_request":
                    var targetUserId = kidAccountEvent.GetProperty("targetUserId").GetString();
                    var targetDisplayName = kidAccountEvent.GetProperty("targetDisplayName").GetString();
                    await _parentNotificationService.NotifyParentKidFollowRequestAsync(
                        kidUserId, targetUserId, kidDisplayName, targetDisplayName);
                    break;

                case "follow_request_for_kid":
                    var followerUserId = kidAccountEvent.GetProperty("followerUserId").GetString();
                    var followerDisplayName = kidAccountEvent.GetProperty("followerDisplayName").GetString();
                    await _parentNotificationService.NotifyParentFollowRequestForKidAsync(
                        followerUserId, kidUserId, followerDisplayName, kidDisplayName);
                    break;

                case "kid_post":
                    var postId = kidAccountEvent.GetProperty("postId").GetString();
                    var postContent = kidAccountEvent.GetProperty("postContent").GetString();
                    await _parentNotificationService.NotifyParentKidPostAsync(
                        kidUserId, postId, kidDisplayName, postContent);
                    break;

                case "kid_message":
                    var senderUserId = kidAccountEvent.GetProperty("senderUserId").GetString();
                    var senderDisplayName = kidAccountEvent.GetProperty("senderDisplayName").GetString();
                    var messageContent = kidAccountEvent.GetProperty("messageContent").GetString();
                    await _parentNotificationService.NotifyParentKidMessageAsync(
                        kidUserId, senderUserId, senderDisplayName, kidDisplayName, messageContent);
                    break;

                case "kid_content_flagged":
                    var contentId = kidAccountEvent.GetProperty("contentId").GetString();
                    var reason = kidAccountEvent.GetProperty("reason").GetString();
                    await _parentNotificationService.NotifyParentKidContentFlaggedAsync(
                        kidUserId, contentId, kidDisplayName, reason);
                    break;

                case "kid_time_limit":
                    var timeUsed = kidAccountEvent.GetProperty("timeUsed").GetInt32();
                    var timeLimit = kidAccountEvent.GetProperty("timeLimit").GetInt32();
                    await _parentNotificationService.NotifyParentKidTimeLimitReachedAsync(
                        kidUserId, kidDisplayName, timeUsed, timeLimit);
                    break;

                default:
                    _logger.LogWarning("⚠️ Unknown kid account event type: {EventType}", (string)eventType);
                    break;
            }

            _logger.LogInformation("✅ Kid account event processed successfully: {EventType}", (string)eventType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to process kid account event");
        }
    }

    private async Task ProcessGroupInvitationEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("📧 Processing group invitation event");
            
            var invitationEvent = JsonSerializer.Deserialize<JsonElement>(consumeResult.Message.Value);
            if (invitationEvent.ValueKind == JsonValueKind.Undefined) return;

            var invitationId = Guid.Parse(invitationEvent.GetProperty("InvitationId").GetString() ?? "");
            _logger.LogInformation("📧 Processing invitation ID: {InvitationId}", invitationId);
            var recipientId = Guid.Parse(invitationEvent.GetProperty("InvitedUserId").GetString() ?? "");
            var senderId = Guid.Parse(invitationEvent.GetProperty("InvitedByUserId").GetString() ?? "");
            var groupName = invitationEvent.GetProperty("GroupName").GetString() ?? "";
            var groupId = Guid.Parse(invitationEvent.GetProperty("GroupId").GetString() ?? "");
            var message = invitationEvent.GetProperty("InvitationMessage").GetString() ?? "";
            var isEducational = invitationEvent.GetProperty("IsEducationalGroup").GetBoolean();
            var subgroupId = invitationEvent.TryGetProperty("SubgroupId", out var subGroupProp) && subGroupProp.ValueKind != JsonValueKind.Null ? Guid.Parse(subGroupProp.GetString() ?? "") : (Guid?)null;
            var subgroupName = invitationEvent.TryGetProperty("SubgroupName", out var subGroupNameProp) ? subGroupNameProp.GetString() : null;

            // Create notification for the invited user
            var notification = new GroupInvitationNotification
            {
                Id = invitationId, // This is crucial for the notification URL
                RecipientId = recipientId,
                SenderId = senderId,
                GroupId = groupId,
                GroupName = groupName,
                SubgroupId = subgroupId,
                SubgroupName = subgroupName,
                InvitationMessage = message,
                IsEducationalGroup = isEducational,
                Title = subgroupId.HasValue ? $"Subgroup Invitation: {subgroupName}" : $"Group Invitation: {groupName}",
                Message = subgroupId.HasValue 
                    ? $"You've been invited to join the subgroup \"{subgroupName}\" in {groupName}"
                    : $"You've been invited to join {groupName}",
                Priority = isEducational ? "high" : "medium",
                Channel = isEducational ? "in_app,email" : "in_app"
            };

            // Send the notification
            await _notificationService.SendGroupInvitationNotificationAsync(notification);
            
            // Send real-time notification via SignalR
            await _hubContext.Clients.User(recipientId.ToString())
                .SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("✅ Group invitation notification sent to user {RecipientId} for group {GroupName}", recipientId, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to process group invitation event");
        }
    }

    private async Task ProcessGroupNotificationEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("📢 Processing group notification event");
            
            var notificationEvent = JsonSerializer.Deserialize<JsonElement>(consumeResult.Message.Value);
            if (notificationEvent.ValueKind == JsonValueKind.Undefined) return;

            var recipientId = Guid.Parse(notificationEvent.GetProperty("RecipientId").GetString() ?? "");
            var senderId = Guid.Parse(notificationEvent.GetProperty("SenderId").GetString() ?? "");
            var groupName = notificationEvent.GetProperty("GroupName").GetString() ?? "";
            var groupId = Guid.Parse(notificationEvent.GetProperty("GroupId").GetString() ?? "");
            var title = notificationEvent.GetProperty("Title").GetString() ?? "";
            var message = notificationEvent.GetProperty("Message").GetString() ?? "";
            var isUrgent = notificationEvent.GetProperty("IsUrgent").GetBoolean();

            // Create notification for the group member
            var notification = new GroupNotification
            {
                RecipientId = recipientId,
                SenderId = senderId,
                GroupId = groupId,
                GroupName = groupName,
                Title = title,
                Message = message,
                IsUrgent = isUrgent,
                Priority = isUrgent ? "urgent" : "medium",
                Channel = isUrgent ? "in_app,email,push" : "in_app"
            };

            // Send the notification
            await _notificationService.SendGroupNotificationAsync(notification);
            
            // Send real-time notification via SignalR
            await _hubContext.Clients.User(recipientId.ToString())
                .SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("✅ Group notification sent to user {RecipientId} from group {GroupName}", recipientId, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to process group notification event");
        }
    }

    private async Task ProcessKidLoginCodeGeneratedEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("🔑 Processing kid login code generated event");

            var eventData = JsonSerializer.Deserialize<JsonElement>(consumeResult.Message.Value);
            if (eventData.ValueKind == JsonValueKind.Undefined) return;

            var parentId = Guid.Parse(eventData.GetProperty("ParentId").GetString() ?? "");
            var kidAccountId = Guid.Parse(eventData.GetProperty("KidAccountId").GetString() ?? "");
            var expiresAt = DateTime.Parse(eventData.GetProperty("ExpiresAt").GetString() ?? "");
            var maturityLevel = eventData.GetProperty("MaturityLevel").GetString() ?? "low";

            // Create notification for parent
            var notification = new EventNotification
            {
                Type = "kid_login_code_generated",
                RecipientId = parentId,
                Title = "🔑 Kid Login Code Generated",
                Message = $"A new login code has been generated for your kid. Expires on {expiresAt:MMM dd, yyyy}. Maturity level: {maturityLevel.ToUpper()}",
                Priority = "medium",
                Channel = "in_app",
                Metadata = new Dictionary<string, object>
                {
                    { "kidAccountId", kidAccountId.ToString() },
                    { "expiresAt", expiresAt.ToString("o") },
                    { "maturityLevel", maturityLevel }
                }
            };

            await _notificationService.SendNotificationAsync(notification);
            await _hubContext.Clients.User(parentId.ToString()).SendAsync("ReceiveNotification", notification);

            _logger.LogInformation("✅ Kid login code notification sent to parent {ParentId}", parentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to process kid login code event");
        }
    }

    private async Task ProcessKidMaturityUpdatedEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("📊 Processing kid maturity updated event");

            var eventData = JsonSerializer.Deserialize<JsonElement>(consumeResult.Message.Value);
            if (eventData.ValueKind == JsonValueKind.Undefined) return;

            var kidAccountId = Guid.Parse(eventData.GetProperty("KidAccountId").GetString() ?? "");
            var totalScore = eventData.GetProperty("TotalScore").GetInt32();
            var level = eventData.GetProperty("Level").GetString() ?? "low";
            var previousLevel = eventData.TryGetProperty("PreviousLevel", out var prev) ? prev.GetString() : null;

            // Get parent ID from kid account (would need to query Officer service or cache)
            // For now, we'll publish to kid account topic and parents subscribe
            
            var notification = new EventNotification
            {
                Type = "kid_maturity_updated",
                RecipientId = kidAccountId, // Will be forwarded to parent
                Title = level != previousLevel && !string.IsNullOrEmpty(previousLevel)
                    ? $"🎉 Maturity Level Increased!"
                    : "📊 Maturity Score Updated",
                Message = level != previousLevel && !string.IsNullOrEmpty(previousLevel)
                    ? $"Great progress! Maturity level changed from {previousLevel?.ToUpper()} to {level.ToUpper()}. Total score: {totalScore}/100"
                    : $"Maturity score updated to {totalScore}/100 ({level.ToUpper()} level)",
                Priority = level != previousLevel ? "high" : "medium",
                Channel = level != previousLevel ? "in_app,email" : "in_app",
                Metadata = new Dictionary<string, object>
                {
                    { "kidAccountId", kidAccountId.ToString() },
                    { "totalScore", totalScore },
                    { "level", level },
                    { "previousLevel", previousLevel ?? "" }
                }
            };

            await _notificationService.SendNotificationAsync(notification);

            _logger.LogInformation("✅ Kid maturity update notification sent for kid {KidAccountId}", kidAccountId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to process kid maturity event");
        }
    }

    private async Task ProcessKidPasswordChangedEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("🔐 Processing kid password changed event");

            var eventData = JsonSerializer.Deserialize<JsonElement>(consumeResult.Message.Value);
            if (eventData.ValueKind == JsonValueKind.Undefined) return;

            var kidAccountId = Guid.Parse(eventData.GetProperty("KidAccountId").GetString() ?? "");
            var eventType = eventData.GetProperty("EventType").GetString() ?? "";
            var changedByParent = eventData.TryGetProperty("ChangedByParent", out var byParent) && byParent.GetBoolean();
            var isFirstTime = eventData.TryGetProperty("IsFirstTime", out var first) && first.GetBoolean();

            string title = eventType switch
            {
                "kid-password-set" => isFirstTime ? "🔐 Password Set for Kid Account" : "🔐 Password Updated",
                "kid-password-revoked" => "⚠️ Password Access Revoked",
                _ => "🔐 Password Changed"
            };

            string message = eventType switch
            {
                "kid-password-set" when isFirstTime => "You've successfully set a password for your kid's account. They can now use password authentication.",
                "kid-password-set" => "Kid account password has been updated.",
                "kid-password-revoked" => "Password access has been revoked. Kid must use QR code login only.",
                _ when !changedByParent => "Your kid has changed their account password. You're receiving this notification for security.",
                _ => "Password has been changed for kid account."
            };

            var notification = new EventNotification
            {
                Type = "kid_password_changed",
                RecipientId = kidAccountId, // Will forward to parent
                Title = title,
                Message = message,
                Priority = eventType == "kid-password-revoked" || !changedByParent ? "high" : "medium",
                Channel = !changedByParent ? "in_app,email" : "in_app",
                Metadata = new Dictionary<string, object>
                {
                    { "kidAccountId", kidAccountId.ToString() },
                    { "changedByParent", changedByParent },
                    { "eventType", eventType }
                }
            };

            await _notificationService.SendNotificationAsync(notification);

            _logger.LogInformation("✅ Kid password change notification sent for kid {KidAccountId}", kidAccountId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to process kid password event");
        }
    }

    private async Task ProcessKidActivityTrackedEventAsync(ConsumeResult<string, string> consumeResult)
    {
        try
        {
            _logger.LogInformation("📱 Processing kid activity tracked event");

            var eventData = JsonSerializer.Deserialize<JsonElement>(consumeResult.Message.Value);
            if (eventData.ValueKind == JsonValueKind.Undefined) return;

            var kidAccountId = Guid.Parse(eventData.GetProperty("KidAccountId").GetString() ?? "");
            var activityType = eventData.GetProperty("ActivityType").GetString() ?? "";
            var contentType = eventData.TryGetProperty("ContentType", out var ct) ? ct.GetString() : "general";

            // Only notify parent for significant activities or safety concerns
            if (activityType == "safety_concern" || activityType == "inappropriate_content_attempt")
            {
                var notification = new EventNotification
                {
                    Type = "kid_activity_alert",
                    RecipientId = kidAccountId, // Will forward to parent
                    Title = "⚠️ Kid Safety Alert",
                    Message = activityType == "safety_concern"
                        ? "A safety concern was detected in your kid's activity. Please review."
                        : "Your kid attempted to access inappropriate content. Content was blocked.",
                    Priority = "urgent",
                    Channel = "in_app,email,push",
                    Metadata = new Dictionary<string, object>
                    {
                        { "kidAccountId", kidAccountId.ToString() },
                        { "activityType", activityType },
                        { "contentType", contentType ?? "" }
                    }
                };

                await _notificationService.SendNotificationAsync(notification);
                _logger.LogInformation("⚠️ Safety alert notification sent for kid {KidAccountId}", kidAccountId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to process kid activity event");
        }
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
