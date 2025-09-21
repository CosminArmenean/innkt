using System.ComponentModel.DataAnnotations;

namespace innkt.Notifications.Models;

/// <summary>
/// Base notification model for all notification types
/// </summary>
public abstract class BaseNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Type { get; set; } = string.Empty;
    public Guid RecipientId { get; set; }
    public Guid? SenderId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
    public bool IsRead { get; set; } = false;
    public string Priority { get; set; } = "medium"; // low, medium, high, urgent
    public string Channel { get; set; } = "in_app"; // in_app, email, push, sms
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Repost notification when someone reposts a user's content
/// </summary>
public class RepostNotification : BaseNotification
{
    public Guid OriginalPostId { get; set; }
    public Guid RepostId { get; set; }
    public string RepostType { get; set; } = "simple"; // simple, quote
    public string? QuoteText { get; set; }
    
    public RepostNotification()
    {
        Type = "repost_created";
        Priority = "medium";
        Channel = "in_app,push";
    }
}

/// <summary>
/// Kid account notification with enhanced safety features
/// </summary>
public class KidNotification : BaseNotification
{
    public Guid KidAccountId { get; set; }
    public Guid ParentAccountId { get; set; }
    public bool ParentVisible { get; set; } = true; // Parents can see all kid notifications
    public bool SafetyChecked { get; set; } = false;
    public double SafetyScore { get; set; } = 1.0; // 0-1 scale
    public List<string> SafetyFlags { get; set; } = new();
    public bool RequiresParentAction { get; set; } = false;
    
    // Allowed types for kid accounts
    public static readonly string[] AllowedKidNotificationTypes = {
        "comment_on_own_post",
        "direct_message",
        "follow_approved",
        "parent_message",
        "educational_content",
        "safety_reminder",
        "achievement_earned",
        "independence_day_reminder"
    };
    
    public KidNotification()
    {
        Priority = "low"; // Default to low priority for kids
        Channel = "in_app"; // Limited channels for kids
    }
}

/// <summary>
/// Parent notification for managing kid account activities
/// </summary>
public class ParentNotification : BaseNotification
{
    public Guid ParentAccountId { get; set; }
    public Guid KidAccountId { get; set; }
    public string RequestType { get; set; } = string.Empty; // follow, message, content_share, group_join
    public Guid? TargetUserId { get; set; }
    public string RequestData { get; set; } = string.Empty; // JSON data
    public bool RequiresAction { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public string? ParentNotes { get; set; }
    public string Status { get; set; } = "pending"; // pending, approved, denied, expired
    
    public ParentNotification()
    {
        Type = "parent_approval_request";
        Priority = "high"; // Parent notifications are important
        Channel = "in_app,email,push"; // Multi-channel for parents
    }
}

/// <summary>
/// Safety alert notification for concerning activities
/// </summary>
public class SafetyAlertNotification : BaseNotification
{
    public Guid? KidAccountId { get; set; }
    public string AlertType { get; set; } = string.Empty; // behavior_change, suspicious_interaction, time_violation
    public string Severity { get; set; } = "info"; // info, warning, alert, emergency
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, object> SafetyData { get; set; } = new();
    public bool AutoResolved { get; set; } = false;
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }
    
    public SafetyAlertNotification()
    {
        Type = "safety_alert";
        Priority = "urgent";
        Channel = "in_app,email,push,sms"; // All channels for safety
    }
}

/// <summary>
/// Educational notification for learning opportunities
/// </summary>
public class EducationalNotification : BaseNotification
{
    public Guid? StudentId { get; set; }
    public Guid? TeacherId { get; set; }
    public Guid? ParentId { get; set; }
    public string EducationType { get; set; } = string.Empty; // assignment, achievement, progress, collaboration
    public string Subject { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public Dictionary<string, object> EducationalData { get; set; } = new();
    public bool RequiresParentAcknowledgment { get; set; } = false;
    
    public EducationalNotification()
    {
        Type = "educational_content";
        Priority = "medium";
        Channel = "in_app,email"; // Educational notifications via app and email
    }
}

/// <summary>
/// Independence day notification for account transition
/// </summary>
public class IndependenceDayNotification : BaseNotification
{
    public Guid KidAccountId { get; set; }
    public Guid ParentAccountId { get; set; }
    public DateTime IndependenceDate { get; set; }
    public string TransitionPhase { get; set; } = string.Empty; // warning, preparation, transition, celebration
    public double MaturityScore { get; set; }
    public bool ParentApprovalRequired { get; set; } = true;
    public bool MaturityRequirementsMet { get; set; } = false;
    public Dictionary<string, bool> Requirements { get; set; } = new();
    
    public IndependenceDayNotification()
    {
        Type = "independence_day";
        Priority = "high";
        Channel = "in_app,email"; // Important milestone notifications
    }
}

/// <summary>
/// Grok AI response notification
/// </summary>
public class GrokResponseNotification : BaseNotification
{
    public Guid OriginalCommentId { get; set; }
    public Guid PostId { get; set; }
    public Guid GrokCommentId { get; set; }
    public string OriginalQuestion { get; set; } = string.Empty;
    public double GrokConfidence { get; set; }
    
    public GrokResponseNotification()
    {
        Type = "grok_response";
        Priority = "medium";
        Channel = "in_app,push";
    }
}

