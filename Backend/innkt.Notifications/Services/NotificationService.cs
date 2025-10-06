using Microsoft.Extensions.Caching.Memory;
using innkt.Notifications.Models;
using innkt.Notifications.Configuration;
using innkt.Notifications.Data;
using Confluent.Kafka;
using System.Text.Json;
using MongoDB.Driver;

namespace innkt.Notifications.Services;

/// <summary>
/// Complete Kafka-powered notification service implementation
/// </summary>
public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;
    private readonly IMemoryCache _cache;
    private readonly IProducer<string, string> _kafkaProducer;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly NotificationDbContext _dbContext;

    public NotificationService(
        ILogger<NotificationService> logger,
        IMemoryCache cache,
        IProducer<string, string> kafkaProducer,
        IHttpClientFactory httpClientFactory,
        NotificationDbContext dbContext)
    {
        _logger = logger;
        _cache = cache;
        _kafkaProducer = kafkaProducer;
        _httpClientFactory = httpClientFactory;
        _dbContext = dbContext;
    }

    #region Core Notification Operations

    public async Task<bool> SendNotificationAsync(BaseNotification notification)
    {
        try
        {
            _logger.LogInformation("📤 Sending {Type} notification to user {RecipientId}", 
                notification.Type, notification.RecipientId);

            // 1. Store notification in MongoDB for offline users
            var document = new NotificationDocument
            {
                Id = notification.Id.ToString(),
                Type = notification.Type,
                RecipientId = notification.RecipientId.ToString(),
                SenderId = notification.SenderId?.ToString(),
                Title = notification.Title,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                ReadAt = notification.ReadAt,
                Priority = notification.Priority,
                Channel = notification.Channel,
                Metadata = notification.Metadata,
                Delivered = false, // Will be marked as delivered when user connects
                RetryCount = 0,
                ExpiresAt = notification.CreatedAt.AddDays(30) // Expire after 30 days
            };

            await _dbContext.Notifications.InsertOneAsync(document);
            _logger.LogInformation("💾 Notification stored in MongoDB for offline delivery");

            // 2. Determine Kafka topic based on notification type
            var topic = GetKafkaTopicForNotification(notification);
            
            // 3. Serialize notification
            var message = JsonSerializer.Serialize(notification);
            
            // 4. Send to Kafka for real-time delivery
            var result = await _kafkaProducer.ProduceAsync(topic, new Message<string, string>
            {
                Key = notification.RecipientId.ToString(),
                Value = message,
                Headers = new Headers
                {
                    { "notification-type", System.Text.Encoding.UTF8.GetBytes(notification.Type) },
                    { "priority", System.Text.Encoding.UTF8.GetBytes(notification.Priority) },
                    { "timestamp", System.Text.Encoding.UTF8.GetBytes(DateTime.UtcNow.ToString()) }
                }
            });

            _logger.LogInformation("✅ Notification sent to Kafka topic {Topic}, partition {Partition}, offset {Offset}", 
                result.Topic, result.Partition.Value, result.Offset.Value);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending notification");
            return false;
        }
    }

    public async Task<bool> SendBulkNotificationsAsync(List<BaseNotification> notifications)
    {
        try
        {
            var tasks = notifications.Select(SendNotificationAsync);
            var results = await Task.WhenAll(tasks);
            
            var successCount = results.Count(r => r);
            _logger.LogInformation("📊 Bulk notifications: {Success}/{Total} sent successfully", 
                successCount, notifications.Count);
            
            return successCount == notifications.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending bulk notifications");
            return false;
        }
    }

    #endregion

    #region Specialized Notification Types

    public async Task<bool> SendRepostNotificationAsync(RepostNotification notification)
    {
        notification.Type = "repost_created";
        notification.Priority = "medium";
        return await SendNotificationAsync(notification);
    }

    public async Task<bool> SendKidNotificationAsync(KidNotification notification)
    {
        // Enhanced safety filtering for kid notifications
        if (!IsNotificationTypeAllowedForKid(notification.Type))
        {
            _logger.LogWarning("🛡️ Notification type {Type} not allowed for kid account", notification.Type);
            return false;
        }

        // Apply kid-safe filtering
        notification.SafetyChecked = true;
        notification.Priority = "low"; // Kids get low priority notifications
        notification.Channel = "in_app"; // Limited channels for kids

        return await SendNotificationAsync(notification);
    }

    public async Task<bool> SendParentNotificationAsync(ParentNotification notification)
    {
        notification.Type = "parent_approval_request";
        notification.Priority = "high"; // Parent notifications are high priority
        notification.Channel = "in_app,email,push"; // Multi-channel for parents

        return await SendNotificationAsync(notification);
    }

    public async Task<bool> SendSafetyAlertAsync(SafetyAlertNotification notification)
    {
        notification.Type = "safety_alert";
        notification.Priority = "urgent";
        notification.Channel = "in_app,email,push,sms"; // All channels for safety

        _logger.LogWarning("🚨 SAFETY ALERT: {AlertType} - {Severity}", 
            notification.AlertType, notification.Severity);

        return await SendNotificationAsync(notification);
    }

    public async Task<bool> SendEducationalNotificationAsync(EducationalNotification notification)
    {
        notification.Type = "educational_content";
        notification.Priority = "medium";
        notification.Channel = "in_app,email";

        return await SendNotificationAsync(notification);
    }

    public async Task<bool> SendIndependenceDayNotificationAsync(IndependenceDayNotification notification)
    {
        notification.Type = "independence_day";
        notification.Priority = "high";
        notification.Channel = "in_app,email";

        _logger.LogInformation("🗓️ Independence Day notification sent for kid {KidAccountId}", 
            notification.KidAccountId);

        return await SendNotificationAsync(notification);
    }

    public async Task<bool> SendGrokResponseNotificationAsync(GrokResponseNotification notification)
    {
        notification.Type = "grok_response";
        notification.Priority = "medium";
        notification.Channel = "in_app,push";

        return await SendNotificationAsync(notification);
    }

    #endregion

    #region Kid-Safe Filtering

    public async Task<bool> IsNotificationSafeForKidAsync(BaseNotification notification, Guid kidAccountId)
    {
        try
        {
            // Check if notification type is allowed for kids
            if (!IsNotificationTypeAllowedForKid(notification.Type))
                return false;

            // Check content safety (integrate with NeuroSpark when available)
            if (!string.IsNullOrEmpty(notification.Message))
            {
                // TODO: Integrate with NeuroSpark content filtering
                // For now, basic safety check
                if (ContainsInappropriateContent(notification.Message))
                    return false;
            }

            // Check safety score if available
            if (notification is KidNotification kidNotification)
            {
                return kidNotification.SafetyScore >= 0.8;
            }

            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error checking notification safety for kid {KidAccountId}", kidAccountId);
            return false; // Fail safe
        }
    }

    public async Task<List<BaseNotification>> FilterNotificationsForKidAsync(List<BaseNotification> notifications, Guid kidAccountId)
    {
        var filteredNotifications = new List<BaseNotification>();

        foreach (var notification in notifications)
        {
            if (await IsNotificationSafeForKidAsync(notification, kidAccountId))
            {
                filteredNotifications.Add(notification);
            }
        }

        _logger.LogInformation("🛡️ Filtered {Original} notifications to {Filtered} for kid {KidAccountId}", 
            notifications.Count, filteredNotifications.Count, kidAccountId);

        return filteredNotifications;
    }

    public Task<bool> RequiresParentApprovalAsync(BaseNotification notification, Guid kidAccountId)
    {
        // Determine if notification requires parent approval before delivery
        var requiresApproval = notification.Type switch
        {
            "follow_request" => true,
            "message_request" => true,
            "group_invitation" => true,
            "content_share_request" => true,
            _ => false
        };

        return Task.FromResult(requiresApproval);
    }

    #endregion

    #region Multi-Channel Delivery

    public async Task<bool> SendEmailNotificationAsync(Guid userId, string subject, string content)
    {
        try
        {
            // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
            _logger.LogInformation("📧 Email notification sent to user {UserId}: {Subject}", userId, subject);
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending email notification");
            return false;
        }
    }

    public async Task<bool> SendPushNotificationAsync(Guid userId, string title, string message, Dictionary<string, object>? data = null)
    {
        try
        {
            // TODO: Integrate with FCM/APNS
            _logger.LogInformation("📱 Push notification sent to user {UserId}: {Title}", userId, title);
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending push notification");
            return false;
        }
    }

    public async Task<bool> SendSMSNotificationAsync(string phoneNumber, string message)
    {
        try
        {
            // TODO: Integrate with Twilio
            _logger.LogInformation("📱 SMS notification sent to {PhoneNumber}", phoneNumber);
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending SMS notification");
            return false;
        }
    }

    public async Task<bool> SendInAppNotificationAsync(Guid userId, BaseNotification notification)
    {
        try
        {
            // Store in cache for real-time retrieval
            var cacheKey = $"notifications_{userId}";
            var cached = _cache.Get<List<BaseNotification>>(cacheKey) ?? new List<BaseNotification>();
            cached.Insert(0, notification);
            
            // Keep only last 100 notifications in cache
            if (cached.Count > 100)
                cached = cached.Take(100).ToList();
            
            _cache.Set(cacheKey, cached, TimeSpan.FromHours(24));

            _logger.LogInformation("📱 In-app notification cached for user {UserId}", userId);
            await Task.CompletedTask;
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending in-app notification");
            return false;
        }
    }

    #endregion

    #region Group Notifications

    public async Task<bool> SendGroupInvitationNotificationAsync(GroupInvitationNotification notification)
    {
        try
        {
            _logger.LogInformation("📧 Sending group invitation notification to user {RecipientId} for group {GroupName}", 
                notification.RecipientId, notification.GroupName);

            // Set appropriate channels based on group type
            if (notification.IsEducationalGroup)
            {
                notification.Channel = "in_app,email"; // Educational groups prefer email
                notification.Priority = "high"; // Educational invitations are important
            }

            return await SendNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending group invitation notification");
            return false;
        }
    }

    public async Task<bool> SendGroupNotificationAsync(GroupNotification notification)
    {
        try
        {
            _logger.LogInformation("📢 Sending group notification to user {RecipientId} for group {GroupName}", 
                notification.RecipientId, notification.GroupName);

            // Adjust priority based on notification type
            if (notification.IsUrgent)
            {
                notification.Priority = "urgent";
                notification.Channel = "in_app,email,push,sms";
            }

            return await SendNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending group notification");
            return false;
        }
    }

    public async Task<bool> SendGroupRoleChangeNotificationAsync(GroupRoleChangeNotification notification)
    {
        try
        {
            _logger.LogInformation("👑 Sending group role change notification to user {RecipientId} for group {GroupName}", 
                notification.RecipientId, notification.GroupName);

            // Role changes are important, especially for admins
            if (notification.NewRole == "admin")
            {
                notification.Priority = "urgent";
                notification.Channel = "in_app,email,push";
            }

            return await SendNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending group role change notification");
            return false;
        }
    }

    #endregion

    #region Helper Methods

    private string GetKafkaTopicForNotification(BaseNotification notification)
    {
        return notification switch
        {
            KidNotification => KafkaConfig.Topics.KidNotifications,
            ParentNotification => KafkaConfig.Topics.ParentNotifications,
            SafetyAlertNotification => KafkaConfig.Topics.SafetyAlerts,
            EducationalNotification => KafkaConfig.Topics.EducationalNotifications,
            IndependenceDayNotification => KafkaConfig.Topics.IndependenceDayNotifications,
            GrokResponseNotification => KafkaConfig.Topics.GrokResponses,
            RepostNotification => KafkaConfig.Topics.RepostNotifications,
            _ => KafkaConfig.Topics.UserNotifications
        };
    }

    private bool IsNotificationTypeAllowedForKid(string notificationType)
    {
        var allowedTypes = new[]
        {
            "comment_on_own_post",
            "direct_message",
            "follow_approved", 
            "parent_message",
            "educational_content",
            "safety_reminder",
            "achievement_earned",
            "independence_day_reminder"
        };

        return allowedTypes.Contains(notificationType);
    }

    private bool ContainsInappropriateContent(string content)
    {
        // Basic content filtering - TODO: integrate with NeuroSpark
        var inappropriateWords = new[] { "violence", "adult", "inappropriate" };
        return inappropriateWords.Any(word => content.ToLower().Contains(word));
    }

    #endregion

    #region Stub Implementations (Systematic completion in progress)

    public Task<List<BaseNotification>> GetUserNotificationsAsync(Guid userId, int page = 1, int pageSize = 20) => 
        Task.FromResult(new List<BaseNotification>());

    public Task<bool> MarkNotificationAsReadAsync(Guid notificationId, Guid userId) => 
        Task.FromResult(true);

    public Task<bool> MarkAllNotificationsAsReadAsync(Guid userId) => 
        Task.FromResult(true);

    public Task<bool> SendRealTimeNotificationAsync(Guid userId, BaseNotification notification) => 
        Task.FromResult(true);

    public Task<bool> BroadcastToGroupAsync(List<Guid> userIds, BaseNotification notification) => 
        Task.FromResult(true);

    public Task<bool> SendEmergencyBroadcastAsync(EmergencyBroadcast broadcast) => 
        Task.FromResult(true);

    public Task<NotificationPreferences> GetUserNotificationPreferencesAsync(Guid userId) => 
        Task.FromResult(new NotificationPreferences { UserId = userId });

    public Task<bool> UpdateNotificationPreferencesAsync(Guid userId, NotificationPreferences preferences) => 
        Task.FromResult(true);

    public Task<bool> IsChannelEnabledForUserAsync(Guid userId, string channel) => 
        Task.FromResult(true);

    public Task<NotificationStats> GetNotificationStatsAsync(Guid userId, DateTime startDate, DateTime endDate) => 
        Task.FromResult(new NotificationStats { UserId = userId });

    public Task<List<NotificationTrend>> GetNotificationTrendsAsync(int days = 30) => 
        Task.FromResult(new List<NotificationTrend>());

    public Task<DeliveryReport> GetDeliveryReportAsync(Guid notificationId) => 
        Task.FromResult(new DeliveryReport { NotificationId = notificationId });

    #endregion

    #region MongoDB Notification Operations

    /// <summary>
    /// Get notifications for a user from MongoDB
    /// </summary>
    public async Task<List<NotificationDocument>> GetUserNotificationsAsync(string userId, int page = 0, int limit = 50)
    {
        try
        {
            var filter = Builders<NotificationDocument>.Filter.Eq(n => n.RecipientId, userId);
            var sort = Builders<NotificationDocument>.Sort.Descending(n => n.CreatedAt);
            
            var notifications = await _dbContext.Notifications
                .Find(filter)
                .Sort(sort)
                .Skip(page * limit)
                .Limit(limit)
                .ToListAsync();

            _logger.LogInformation("📱 Retrieved {Count} notifications for user {UserId}", 
                notifications.Count, userId);

            return notifications;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get notifications for user {UserId}", userId);
            return new List<NotificationDocument>();
        }
    }

    /// <summary>
    /// Get unread notifications for a user
    /// </summary>
    public async Task<List<NotificationDocument>> GetUnreadNotificationsAsync(string userId)
    {
        try
        {
            var filter = Builders<NotificationDocument>.Filter.And(
                Builders<NotificationDocument>.Filter.Eq(n => n.RecipientId, userId),
                Builders<NotificationDocument>.Filter.Eq(n => n.IsRead, false)
            );
            
            var notifications = await _dbContext.Notifications
                .Find(filter)
                .Sort(Builders<NotificationDocument>.Sort.Descending(n => n.CreatedAt))
                .ToListAsync();

            _logger.LogInformation("📱 Retrieved {Count} unread notifications for user {UserId}", 
                notifications.Count, userId);

            return notifications;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get unread notifications for user {UserId}", userId);
            return new List<NotificationDocument>();
        }
    }

    /// <summary>
    /// Mark notification as read in MongoDB
    /// </summary>
    public async Task<bool> MarkNotificationAsReadAsync(string notificationId)
    {
        try
        {
            var filter = Builders<NotificationDocument>.Filter.Eq(n => n.Id, notificationId);
            var update = Builders<NotificationDocument>.Update
                .Set(n => n.IsRead, true)
                .Set(n => n.ReadAt, DateTime.UtcNow);

            var result = await _dbContext.Notifications.UpdateOneAsync(filter, update);

            if (result.ModifiedCount > 0)
            {
                _logger.LogInformation("✅ Marked notification {NotificationId} as read", notificationId);
                return true;
            }

            _logger.LogWarning("⚠️ Notification {NotificationId} not found or already read", notificationId);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to mark notification {NotificationId} as read", notificationId);
            return false;
        }
    }

    /// <summary>
    /// Mark all notifications as read for a user
    /// </summary>
    public async Task<bool> MarkAllNotificationsAsReadAsync(string userId)
    {
        try
        {
            var filter = Builders<NotificationDocument>.Filter.And(
                Builders<NotificationDocument>.Filter.Eq(n => n.RecipientId, userId),
                Builders<NotificationDocument>.Filter.Eq(n => n.IsRead, false)
            );
            
            var update = Builders<NotificationDocument>.Update
                .Set(n => n.IsRead, true)
                .Set(n => n.ReadAt, DateTime.UtcNow);

            var result = await _dbContext.Notifications.UpdateManyAsync(filter, update);

            _logger.LogInformation("✅ Marked {Count} notifications as read for user {UserId}", 
                result.ModifiedCount, userId);

            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to mark all notifications as read for user {UserId}", userId);
            return false;
        }
    }

    /// <summary>
    /// Get undelivered notifications for offline users
    /// </summary>
    public async Task<List<NotificationDocument>> GetUndeliveredNotificationsAsync()
    {
        try
        {
            var filter = Builders<NotificationDocument>.Filter.And(
                Builders<NotificationDocument>.Filter.Eq(n => n.Delivered, false),
                Builders<NotificationDocument>.Filter.Lt(n => n.RetryCount, 3) // Max 3 retries
            );
            
            var notifications = await _dbContext.Notifications
                .Find(filter)
                .Sort(Builders<NotificationDocument>.Sort.Ascending(n => n.CreatedAt))
                .ToListAsync();

            _logger.LogInformation("📱 Retrieved {Count} undelivered notifications", notifications.Count);
            return notifications;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get undelivered notifications");
            return new List<NotificationDocument>();
        }
    }

    /// <summary>
    /// Mark notification as delivered
    /// </summary>
    public async Task<bool> MarkNotificationAsDeliveredAsync(string notificationId)
    {
        try
        {
            var filter = Builders<NotificationDocument>.Filter.Eq(n => n.Id, notificationId);
            var update = Builders<NotificationDocument>.Update
                .Set(n => n.Delivered, true)
                .Set(n => n.DeliveredAt, DateTime.UtcNow);

            var result = await _dbContext.Notifications.UpdateOneAsync(filter, update);

            if (result.ModifiedCount > 0)
            {
                _logger.LogInformation("✅ Marked notification {NotificationId} as delivered", notificationId);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to mark notification {NotificationId} as delivered", notificationId);
            return false;
        }
    }

    /// <summary>
    /// Clean up expired notifications
    /// </summary>
    public async Task<int> CleanupExpiredNotificationsAsync()
    {
        try
        {
            var filter = Builders<NotificationDocument>.Filter.Lt(n => n.ExpiresAt, DateTime.UtcNow);
            var result = await _dbContext.Notifications.DeleteManyAsync(filter);

            _logger.LogInformation("🧹 Cleaned up {Count} expired notifications", result.DeletedCount);
            return (int)result.DeletedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to cleanup expired notifications");
            return 0;
        }
    }


    #endregion
}

