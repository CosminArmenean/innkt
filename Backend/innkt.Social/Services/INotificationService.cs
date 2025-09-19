using innkt.Social.Models.Notifications;

namespace innkt.Social.Services;

/// <summary>
/// Kafka-powered notification service for real-time updates
/// Handles all notification types with safety filtering for kid accounts
/// </summary>
public interface INotificationService
{
    // Core notification operations
    Task SendNotificationAsync<T>(T notification) where T : BaseNotification;
    Task SendBulkNotificationsAsync<T>(IEnumerable<T> notifications) where T : BaseNotification;
    Task<List<BaseNotification>> GetUserNotificationsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<bool> MarkNotificationAsReadAsync(Guid notificationId, Guid userId);
    Task<bool> MarkAllNotificationsAsReadAsync(Guid userId);
    Task<int> GetUnreadNotificationCountAsync(Guid userId);

    // Repost notifications
    Task SendRepostNotificationAsync(Guid originalAuthorId, Guid reposterId, Guid originalPostId, Guid repostId, string repostType, string? quoteText = null);
    Task SendRepostLikedNotificationAsync(Guid repostAuthorId, Guid likerId, Guid repostId);
    Task SendRepostCommentedNotificationAsync(Guid repostAuthorId, Guid commenterId, Guid repostId, string commentText);

    // Kid account notifications (SAFETY FILTERED)
    Task SendKidNotificationAsync(KidNotification notification);
    Task<List<KidNotification>> GetKidNotificationsAsync(Guid kidAccountId, int page = 1, int pageSize = 20);
    Task<bool> IsNotificationAllowedForKidAsync(string notificationType, Guid kidAccountId);

    // Parent notifications
    Task SendParentApprovalRequestAsync(Guid parentId, Guid kidAccountId, string requestType, Guid targetUserId, Dictionary<string, object> requestData);
    Task SendParentSafetyAlertAsync(Guid parentId, Guid kidAccountId, string alertType, string description, Dictionary<string, object> safetyData);
    Task<List<ParentNotification>> GetParentNotificationsAsync(Guid parentId, int page = 1, int pageSize = 20);
    Task<List<ParentNotification>> GetPendingApprovalRequestsAsync(Guid parentId);

    // Safety and moderation
    Task SendSafetyAlertAsync(SafetyAlertNotification alert);
    Task<bool> CheckContentSafetyAsync(string content, Guid? kidAccountId = null);
    Task<double> CalculateContentSafetyScoreAsync(string content, List<string>? mediaUrls = null);

    // Educational notifications
    Task SendEducationalNotificationAsync(EducationalNotification notification);
    Task SendTeacherStudentNotificationAsync(Guid teacherId, Guid studentId, string subject, string message, Dictionary<string, object> educationalData);
    Task SendParentTeacherNotificationAsync(Guid parentId, Guid teacherId, Guid studentId, string subject, string message);

    // Independence day notifications
    Task SendIndependenceDayReminderAsync(Guid kidAccountId, Guid parentId, DateTime independenceDate, string phase);
    Task SendIndependenceDayApprovalRequestAsync(Guid kidAccountId, Guid parentId, double maturityScore, Dictionary<string, bool> requirements);

    // Real-time delivery
    Task SendRealTimeNotificationAsync(Guid userId, string notificationType, object notificationData);
    Task BroadcastNotificationAsync(string notificationType, object notificationData, List<Guid>? userIds = null);

    // Analytics and insights
    Task<NotificationAnalytics> GetNotificationAnalyticsAsync(Guid userId, DateTime startDate, DateTime endDate);
    Task<List<NotificationTrend>> GetNotificationTrendsAsync(string notificationType, int days = 7);

    // Admin and moderation
    Task<List<BaseNotification>> GetNotificationsForModerationAsync(int page = 1, int pageSize = 50);
    Task<bool> FlagNotificationAsync(Guid notificationId, string reason, Guid moderatorId);
    Task<bool> DeleteNotificationAsync(Guid notificationId, Guid moderatorId);
}
