using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace innkt.Common.Models.Events;

/// <summary>
/// Base event model for all system events
/// </summary>
public abstract class BaseEvent
{
    [JsonPropertyName("eventId")]
    public string EventId { get; set; } = Guid.NewGuid().ToString();
    
    [JsonPropertyName("eventType")]
    public string EventType { get; set; } = string.Empty;
    
    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty;
    
    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    [JsonPropertyName("data")]
    public object Data { get; set; } = new();
    
    [JsonPropertyName("metadata")]
    public EventMetadata Metadata { get; set; } = new();
}

/// <summary>
/// Event metadata for processing and routing
/// </summary>
public class EventMetadata
{
    public string Source { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium"; // low, medium, high, urgent
    public string[] Channels { get; set; } = { "in_app" }; // in_app, email, push, sms
    public string? CorrelationId { get; set; }
    public string? ParentEventId { get; set; }
    public Dictionary<string, object> Tags { get; set; } = new();
}

/// <summary>
/// Social media events
/// </summary>
public class SocialEvent : BaseEvent
{
    [JsonPropertyName("postId")]
    public string PostId { get; set; } = string.Empty;
    
    [JsonPropertyName("commentId")]
    public string? CommentId { get; set; }
    
    [JsonPropertyName("targetUserId")]
    public string? TargetUserId { get; set; }
    
    [JsonPropertyName("senderId")]
    public string? SenderId { get; set; }
    
    [JsonPropertyName("senderName")]
    public string? SenderName { get; set; }
    
    [JsonPropertyName("senderAvatar")]
    public string? SenderAvatar { get; set; }
    
    [JsonPropertyName("actionUrl")]
    public string? ActionUrl { get; set; }
    
    [JsonPropertyName("relatedContentId")]
    public string? RelatedContentId { get; set; }
    
    [JsonPropertyName("relatedContentType")]
    public string? RelatedContentType { get; set; }
}

/// <summary>
/// Grok AI response events
/// </summary>
public class GrokEvent : BaseEvent
{
    public string PostId { get; set; } = string.Empty;
    public string OriginalCommentId { get; set; } = string.Empty;
    public string GrokCommentId { get; set; } = string.Empty;
    public string OriginalQuestion { get; set; } = string.Empty;
    public double Confidence { get; set; }
}

/// <summary>
/// Kid safety events
/// </summary>
public class KidSafetyEvent : BaseEvent
{
    public string KidAccountId { get; set; } = string.Empty;
    public string ParentAccountId { get; set; } = string.Empty;
    public string SafetyType { get; set; } = string.Empty; // behavior_change, suspicious_interaction, time_violation
    public string Severity { get; set; } = "info"; // info, warning, alert, emergency
    public Dictionary<string, object> SafetyData { get; set; } = new();
}

/// <summary>
/// User action events
/// </summary>
public class UserActionEvent : BaseEvent
{
    public string Action { get; set; } = string.Empty; // like, follow, comment, share
    public string? TargetId { get; set; }
    public string? TargetType { get; set; } // post, user, comment
}

/// <summary>
/// Message events
/// </summary>
public class MessageEvent : BaseEvent
{
    public string ConversationId { get; set; } = string.Empty;
    public string MessageId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string RecipientId { get; set; } = string.Empty;
}

/// <summary>
/// System events
/// </summary>
public class SystemEvent : BaseEvent
{
    public string ServiceName { get; set; } = string.Empty;
    public string Level { get; set; } = "info"; // info, warning, error, critical
    public string Message { get; set; } = string.Empty;
}
