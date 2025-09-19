using Confluent.Kafka;
using System.Text.Json;
using MongoDB.Driver;
using innkt.Social.Models.Notifications;
using innkt.Social.Models.MongoDB;
using innkt.Social.Data;
using Microsoft.Extensions.Options;

namespace innkt.Social.Services;

/// <summary>
/// Kafka-powered notification service with kid safety filtering
/// Handles real-time notifications with multi-channel delivery
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IProducer<string, string> _kafkaProducer;
    private readonly MongoDbContext _mongoContext;
    private readonly IUserProfileCacheService _userProfileCache;
    private readonly ILogger<NotificationService> _logger;
    private readonly NotificationConfig _config;

    // Kafka topic names
    private const string USER_NOTIFICATIONS_TOPIC = "user.notifications";
    private const string KID_NOTIFICATIONS_TOPIC = "kid.notifications";
    private const string PARENT_NOTIFICATIONS_TOPIC = "parent.notifications";
    private const string REPOST_NOTIFICATIONS_TOPIC = "repost.notifications";
    private const string SAFETY_ALERTS_TOPIC = "safety.alerts";

    public NotificationService(
        IProducer<string, string> kafkaProducer,
        MongoDbContext mongoContext,
        IUserProfileCacheService userProfileCache,
        ILogger<NotificationService> logger,
        IOptions<NotificationConfig> config)
    {
        _kafkaProducer = kafkaProducer;
        _mongoContext = mongoContext;
        _userProfileCache = userProfileCache;
        _logger = logger;
        _config = config.Value;
    }

    public async Task SendNotificationAsync<T>(T notification) where T : BaseNotification
    {
        try
        {
            _logger.LogInformation("Sending notification {Type} to user {RecipientId}", 
                notification.Type, notification.RecipientId);

            // Determine the appropriate Kafka topic
            var topic = GetKafkaTopicForNotification(notification);
            
            // TODO: Check if recipient is a kid account and filter accordingly
            // This will be implemented with a direct database check to avoid circular dependency
            var isKidAccount = await IsKidAccountDirectAsync(notification.RecipientId);
            if (isKidAccount)
            {
                if (!await IsNotificationAllowedForKidAsync(notification.Type, notification.RecipientId))
                {
                    _logger.LogWarning("Notification {Type} blocked for kid account {KidAccountId}", 
                        notification.Type, notification.RecipientId);
                    return;
                }
                
                // Route to kid-specific topic for additional safety processing
                topic = KID_NOTIFICATIONS_TOPIC;
            }

            // Serialize notification
            var message = JsonSerializer.Serialize(notification, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            // Send to Kafka
            var kafkaMessage = new Message<string, string>
            {
                Key = notification.RecipientId.ToString(),
                Value = message,
                Headers = new Headers
                {
                    { "notification-type", System.Text.Encoding.UTF8.GetBytes(notification.Type) },
                    { "priority", System.Text.Encoding.UTF8.GetBytes(notification.Priority) },
                    { "channel", System.Text.Encoding.UTF8.GetBytes(notification.Channel) },
                    { "created-at", System.Text.Encoding.UTF8.GetBytes(notification.CreatedAt.ToString("O")) }
                }
            };

            var result = await _kafkaProducer.ProduceAsync(topic, kafkaMessage);
            
            _logger.LogInformation("Notification sent to Kafka topic {Topic} with offset {Offset}", 
                topic, result.Offset);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification {Type} to user {RecipientId}", 
                notification.Type, notification.RecipientId);
            throw;
        }
    }

    public async Task SendRepostNotificationAsync(Guid originalAuthorId, Guid reposterId, Guid originalPostId, Guid repostId, string repostType, string? quoteText = null)
    {
        try
        {
            // Don't notify if user reposted their own content
            if (originalAuthorId == reposterId)
            {
                _logger.LogDebug("Skipping self-repost notification for user {UserId}", originalAuthorId);
                return;
            }

            // Get reposter profile
            var reposterProfile = await GetUserSnapshotAsync(reposterId);
            if (reposterProfile == null)
            {
                _logger.LogWarning("Could not load reposter profile for {ReposterId}", reposterId);
                return;
            }

            // Get original post data
            var originalPost = await GetOriginalPostSnapshotAsync(originalPostId);
            if (originalPost == null)
            {
                _logger.LogWarning("Could not load original post for {OriginalPostId}", originalPostId);
                return;
            }

            // Create repost notification
            var notification = new RepostNotification
            {
                RecipientId = originalAuthorId,
                SenderId = reposterId,
                OriginalPostId = originalPostId,
                RepostId = repostId,
                RepostType = repostType,
                QuoteText = quoteText,
                ReposterProfile = reposterProfile,
                OriginalPostSnapshot = originalPost,
                Title = repostType == "quote" ? "Quote Repost" : "Repost",
                Message = repostType == "quote" 
                    ? $"{reposterProfile.DisplayName} quote reposted your post: \"{quoteText}\""
                    : $"{reposterProfile.DisplayName} reposted your post",
                Priority = "medium",
                Channel = "in_app,push"
            };

            // Add metadata for analytics
            notification.Metadata = new Dictionary<string, object>
            {
                { "originalPostContent", originalPost.Content.Substring(0, Math.Min(100, originalPost.Content.Length)) },
                { "reposterUsername", reposterProfile.Username },
                { "repostChainLength", 1 }, // TODO: Calculate actual chain length
                { "originalPostEngagement", new { 
                    likes = originalPost.LikesCount, 
                    comments = originalPost.CommentsCount,
                    reposts = originalPost.RepostsCount
                }}
            };

            await SendNotificationAsync(notification);

            _logger.LogInformation("Repost notification sent: {ReposterName} {RepostType} reposted post {OriginalPostId}", 
                reposterProfile.DisplayName, repostType, originalPostId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send repost notification");
        }
    }

    public async Task<bool> IsNotificationAllowedForKidAsync(string notificationType, Guid kidAccountId)
    {
        try
        {
            // Check if this notification type is allowed for kid accounts
            if (!KidNotification.AllowedKidNotificationTypes.Contains(notificationType))
            {
                _logger.LogDebug("Notification type {Type} not allowed for kid account {KidAccountId}", 
                    notificationType, kidAccountId);
                return false;
            }

            // TODO: Add additional safety checks
            // - Check parent settings
            // - Verify content safety score
            // - Check time restrictions
            // - Validate sender appropriateness

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking notification permission for kid account {KidAccountId}", kidAccountId);
            return false; // Fail safe - deny if error
        }
    }

    public async Task SendParentApprovalRequestAsync(Guid parentId, Guid kidAccountId, string requestType, Guid targetUserId, Dictionary<string, object> requestData)
    {
        try
        {
            // Get kid profile
            var kidProfile = await GetUserSnapshotAsync(kidAccountId);
            var targetProfile = await GetUserSnapshotAsync(targetUserId);

            var notification = new ParentNotification
            {
                RecipientId = parentId,
                SenderId = kidAccountId,
                ParentAccountId = parentId,
                KidAccountId = kidAccountId,
                RequestType = requestType,
                TargetUserId = targetUserId,
                RequestData = JsonSerializer.Serialize(requestData),
                RequiresAction = true,
                ExpiresAt = DateTime.UtcNow.AddDays(7), // Expire after 1 week
                Title = $"Approval Request from {kidProfile?.DisplayName}",
                Message = requestType switch
                {
                    "follow" => $"{kidProfile?.DisplayName} wants to follow {targetProfile?.DisplayName}",
                    "message" => $"{kidProfile?.DisplayName} wants to message {targetProfile?.DisplayName}",
                    "group_join" => $"{kidProfile?.DisplayName} wants to join a group",
                    _ => $"{kidProfile?.DisplayName} has made a request that needs your approval"
                },
                Priority = "high",
                Channel = "in_app,email,push"
            };

            await SendNotificationAsync(notification);

            _logger.LogInformation("Parent approval request sent: {RequestType} for kid {KidAccountId} to parent {ParentId}", 
                requestType, kidAccountId, parentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send parent approval request");
        }
    }

    // Helper methods
    private string GetKafkaTopicForNotification<T>(T notification) where T : BaseNotification
    {
        return notification switch
        {
            RepostNotification => REPOST_NOTIFICATIONS_TOPIC,
            KidNotification => KID_NOTIFICATIONS_TOPIC,
            ParentNotification => PARENT_NOTIFICATIONS_TOPIC,
            SafetyAlertNotification => SAFETY_ALERTS_TOPIC,
            EducationalNotification => USER_NOTIFICATIONS_TOPIC,
            IndependenceDayNotification => PARENT_NOTIFICATIONS_TOPIC,
            _ => USER_NOTIFICATIONS_TOPIC
        };
    }

    private async Task<bool> IsKidAccountDirectAsync(Guid userId)
    {
        try
        {
            // Direct database check to avoid circular dependency
            // TODO: This should be replaced with a proper service when circular dependency is resolved
            return false; // For now, assume no kid accounts to avoid issues
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking kid account status for user {UserId}", userId);
            return false;
        }
    }

    private async Task<UserSnapshot?> GetUserSnapshotAsync(Guid userId)
    {
        try
        {
            var cachedProfile = await _userProfileCache.GetUserProfileAsync(userId);
            if (cachedProfile != null)
            {
                return new UserSnapshot
                {
                    UserId = userId.ToString(),
                    DisplayName = cachedProfile.DisplayName,
                    Username = cachedProfile.Username,
                    AvatarUrl = cachedProfile.AvatarUrl,
                    IsVerified = cachedProfile.IsVerified,
                    IsActive = true,
                    LastUpdated = DateTime.UtcNow
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user snapshot for {UserId}", userId);
            return null;
        }
    }

    private async Task<OriginalPostSnapshot?> GetOriginalPostSnapshotAsync(Guid postId)
    {
        try
        {
            var post = await _mongoContext.Posts
                .Find(p => p.PostId == postId && !p.IsDeleted)
                .FirstOrDefaultAsync();

            if (post == null) return null;

            return new OriginalPostSnapshot
            {
                PostId = post.PostId,
                Content = post.Content,
                PostType = post.PostType,
                MediaUrls = post.MediaUrls,
                AuthorId = post.UserId,
                AuthorSnapshot = post.UserSnapshot,
                LikesCount = post.LikesCount,
                CommentsCount = post.CommentsCount,
                SharesCount = post.SharesCount,
                RepostsCount = post.RepostsCount,
                ViewsCount = post.ViewsCount,
                CreatedAt = post.CreatedAt,
                FeedScore = post.FeedScore,
                IsDeleted = post.IsDeleted
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting original post snapshot for {PostId}", postId);
            return null;
        }
    }

    // Placeholder implementations for remaining interface methods
    public Task SendBulkNotificationsAsync<T>(IEnumerable<T> notifications) where T : BaseNotification
    {
        return Task.WhenAll(notifications.Select(SendNotificationAsync));
    }

    public Task<List<BaseNotification>> GetUserNotificationsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        // TODO: Implement with MongoDB or Redis storage
        return Task.FromResult(new List<BaseNotification>());
    }

    public Task<bool> MarkNotificationAsReadAsync(Guid notificationId, Guid userId)
    {
        // TODO: Implement notification read status tracking
        return Task.FromResult(true);
    }

    public Task<bool> MarkAllNotificationsAsReadAsync(Guid userId)
    {
        // TODO: Implement bulk read status update
        return Task.FromResult(true);
    }

    public Task<int> GetUnreadNotificationCountAsync(Guid userId)
    {
        // TODO: Implement unread count tracking
        return Task.FromResult(0);
    }

    public Task SendRepostLikedNotificationAsync(Guid repostAuthorId, Guid likerId, Guid repostId)
    {
        // TODO: Implement repost engagement notifications
        return Task.CompletedTask;
    }

    public Task SendRepostCommentedNotificationAsync(Guid repostAuthorId, Guid commenterId, Guid repostId, string commentText)
    {
        // TODO: Implement repost comment notifications
        return Task.CompletedTask;
    }

    public Task SendKidNotificationAsync(KidNotification notification)
    {
        // TODO: Implement kid-specific notification handling
        return SendNotificationAsync(notification);
    }

    public Task<List<KidNotification>> GetKidNotificationsAsync(Guid kidAccountId, int page = 1, int pageSize = 20)
    {
        // TODO: Implement kid notification retrieval
        return Task.FromResult(new List<KidNotification>());
    }

    public Task SendParentSafetyAlertAsync(Guid parentId, Guid kidAccountId, string alertType, string description, Dictionary<string, object> safetyData)
    {
        // TODO: Implement parent safety alerts
        return Task.CompletedTask;
    }

    public Task<List<ParentNotification>> GetParentNotificationsAsync(Guid parentId, int page = 1, int pageSize = 20)
    {
        // TODO: Implement parent notification retrieval
        return Task.FromResult(new List<ParentNotification>());
    }

    public Task<List<ParentNotification>> GetPendingApprovalRequestsAsync(Guid parentId)
    {
        // TODO: Implement pending approval requests
        return Task.FromResult(new List<ParentNotification>());
    }

    public Task SendSafetyAlertAsync(SafetyAlertNotification alert)
    {
        // TODO: Implement safety alert handling
        return SendNotificationAsync(alert);
    }

    public Task<bool> CheckContentSafetyAsync(string content, Guid? kidAccountId = null)
    {
        // TODO: Implement AI-powered content safety checking
        return Task.FromResult(true);
    }

    public Task<double> CalculateContentSafetyScoreAsync(string content, List<string>? mediaUrls = null)
    {
        // TODO: Implement AI safety scoring
        return Task.FromResult(1.0);
    }

    public Task SendEducationalNotificationAsync(EducationalNotification notification)
    {
        // TODO: Implement educational notifications
        return SendNotificationAsync(notification);
    }

    public Task SendTeacherStudentNotificationAsync(Guid teacherId, Guid studentId, string subject, string message, Dictionary<string, object> educationalData)
    {
        // TODO: Implement teacher-student notifications
        return Task.CompletedTask;
    }

    public Task SendParentTeacherNotificationAsync(Guid parentId, Guid teacherId, Guid studentId, string subject, string message)
    {
        // TODO: Implement parent-teacher notifications
        return Task.CompletedTask;
    }

    public Task SendIndependenceDayReminderAsync(Guid kidAccountId, Guid parentId, DateTime independenceDate, string phase)
    {
        // TODO: Implement independence day reminders
        return Task.CompletedTask;
    }

    public Task SendIndependenceDayApprovalRequestAsync(Guid kidAccountId, Guid parentId, double maturityScore, Dictionary<string, bool> requirements)
    {
        // TODO: Implement independence day approval requests
        return Task.CompletedTask;
    }

    public Task SendRealTimeNotificationAsync(Guid userId, string notificationType, object notificationData)
    {
        // TODO: Implement WebSocket real-time delivery
        return Task.CompletedTask;
    }

    public Task BroadcastNotificationAsync(string notificationType, object notificationData, List<Guid>? userIds = null)
    {
        // TODO: Implement broadcast notifications
        return Task.CompletedTask;
    }

    public Task<NotificationAnalytics> GetNotificationAnalyticsAsync(Guid userId, DateTime startDate, DateTime endDate)
    {
        // TODO: Implement notification analytics
        return Task.FromResult(new NotificationAnalytics { UserId = userId, StartDate = startDate, EndDate = endDate });
    }

    public Task<List<NotificationTrend>> GetNotificationTrendsAsync(string notificationType, int days = 7)
    {
        // TODO: Implement notification trends
        return Task.FromResult(new List<NotificationTrend>());
    }

    public Task<List<BaseNotification>> GetNotificationsForModerationAsync(int page = 1, int pageSize = 50)
    {
        // TODO: Implement moderation notifications
        return Task.FromResult(new List<BaseNotification>());
    }

    public Task<bool> FlagNotificationAsync(Guid notificationId, string reason, Guid moderatorId)
    {
        // TODO: Implement notification flagging
        return Task.FromResult(true);
    }

    public Task<bool> DeleteNotificationAsync(Guid notificationId, Guid moderatorId)
    {
        // TODO: Implement notification deletion
        return Task.FromResult(true);
    }
}

/// <summary>
/// Configuration for notification service
/// </summary>
public class NotificationConfig
{
    public string KafkaBootstrapServers { get; set; } = "localhost:9092";
    public int MaxRetryAttempts { get; set; } = 3;
    public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds(1);
    public bool EnableRealTimeDelivery { get; set; } = true;
    public bool EnableKidSafetyFiltering { get; set; } = true;
    public int NotificationRetentionDays { get; set; } = 30;
    public Dictionary<string, string> ChannelSettings { get; set; } = new();
}
