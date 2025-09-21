using innkt.Notifications.Models;

namespace innkt.Notifications.Services;

/// <summary>
/// Comprehensive notification service with Kafka integration
/// Handles all notification types with kid-safe filtering
/// </summary>
public interface INotificationService
{
    // Core notification operations
    Task<bool> SendNotificationAsync(BaseNotification notification);
    Task<bool> SendBulkNotificationsAsync(List<BaseNotification> notifications);
    Task<List<BaseNotification>> GetUserNotificationsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<bool> MarkNotificationAsReadAsync(Guid notificationId, Guid userId);
    Task<bool> MarkAllNotificationsAsReadAsync(Guid userId);

    // Specialized notification types
    Task<bool> SendRepostNotificationAsync(RepostNotification notification);
    Task<bool> SendKidNotificationAsync(KidNotification notification);
    Task<bool> SendParentNotificationAsync(ParentNotification notification);
    Task<bool> SendSafetyAlertAsync(SafetyAlertNotification notification);
    Task<bool> SendEducationalNotificationAsync(EducationalNotification notification);
    Task<bool> SendIndependenceDayNotificationAsync(IndependenceDayNotification notification);
    Task<bool> SendGrokResponseNotificationAsync(GrokResponseNotification notification);

    // Kid-safe notification filtering
    Task<bool> IsNotificationSafeForKidAsync(BaseNotification notification, Guid kidAccountId);
    Task<List<BaseNotification>> FilterNotificationsForKidAsync(List<BaseNotification> notifications, Guid kidAccountId);
    Task<bool> RequiresParentApprovalAsync(BaseNotification notification, Guid kidAccountId);

    // Multi-channel delivery
    Task<bool> SendEmailNotificationAsync(Guid userId, string subject, string content);
    Task<bool> SendPushNotificationAsync(Guid userId, string title, string message, Dictionary<string, object>? data = null);
    Task<bool> SendSMSNotificationAsync(string phoneNumber, string message);
    Task<bool> SendInAppNotificationAsync(Guid userId, BaseNotification notification);

    // Real-time notifications
    Task<bool> SendRealTimeNotificationAsync(Guid userId, BaseNotification notification);
    Task<bool> BroadcastToGroupAsync(List<Guid> userIds, BaseNotification notification);
    Task<bool> SendEmergencyBroadcastAsync(EmergencyBroadcast broadcast);

    // Notification preferences and settings
    Task<NotificationPreferences> GetUserNotificationPreferencesAsync(Guid userId);
    Task<bool> UpdateNotificationPreferencesAsync(Guid userId, NotificationPreferences preferences);
    Task<bool> IsChannelEnabledForUserAsync(Guid userId, string channel);

    // Analytics and reporting
    Task<NotificationStats> GetNotificationStatsAsync(Guid userId, DateTime startDate, DateTime endDate);
    Task<List<NotificationTrend>> GetNotificationTrendsAsync(int days = 30);
    Task<DeliveryReport> GetDeliveryReportAsync(Guid notificationId);
}

/// <summary>
/// User notification preferences
/// </summary>
public class NotificationPreferences
{
    public Guid UserId { get; set; }
    public bool EmailEnabled { get; set; } = true;
    public bool PushEnabled { get; set; } = true;
    public bool SMSEnabled { get; set; } = false;
    public bool InAppEnabled { get; set; } = true;
    
    // Kid-specific settings
    public bool ParentOversight { get; set; } = true;
    public List<string> AllowedTypes { get; set; } = new();
    public List<string> BlockedTypes { get; set; } = new();
    
    // Timing preferences
    public TimeOnly QuietHoursStart { get; set; } = new TimeOnly(22, 0);
    public TimeOnly QuietHoursEnd { get; set; } = new TimeOnly(7, 0);
    public bool RespectQuietHours { get; set; } = true;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Emergency broadcast for critical situations
/// </summary>
public class EmergencyBroadcast
{
    public string Type { get; set; } = string.Empty; // panic_button, missing_child, safety_alert
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<Guid> TargetUsers { get; set; } = new();
    public Dictionary<string, object> EmergencyData { get; set; } = new();
    public bool BypassQuietHours { get; set; } = true;
    public bool RequireDeliveryConfirmation { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Notification delivery statistics
/// </summary>
public class NotificationStats
{
    public Guid UserId { get; set; }
    public int TotalSent { get; set; }
    public int TotalRead { get; set; }
    public int TotalUnread { get; set; }
    public double ReadRate { get; set; }
    public Dictionary<string, int> ByType { get; set; } = new();
    public Dictionary<string, int> ByChannel { get; set; } = new();
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

/// <summary>
/// Notification trends and analytics
/// </summary>
public class NotificationTrend
{
    public string Type { get; set; } = string.Empty;
    public int Count { get; set; }
    public double EngagementRate { get; set; }
    public DateTime Date { get; set; }
    public string Channel { get; set; } = string.Empty;
}

/// <summary>
/// Delivery confirmation and tracking
/// </summary>
public class DeliveryReport
{
    public Guid NotificationId { get; set; }
    public string Status { get; set; } = string.Empty; // sent, delivered, read, failed
    public List<string> Channels { get; set; } = new();
    public Dictionary<string, DateTime> DeliveryTimes { get; set; } = new();
    public List<string> FailureReasons { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

