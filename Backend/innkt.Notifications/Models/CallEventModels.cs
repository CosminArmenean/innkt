using System.ComponentModel.DataAnnotations;

namespace innkt.Notifications.Models;

/// <summary>
/// Call event types for Kafka messaging
/// </summary>
public enum CallEventType
{
    CallInitiated,
    CallRinging,
    CallAnswered,
    CallRejected,
    CallEnded,
    CallMissed,
    ParticipantJoined,
    ParticipantLeft,
    ParticipantMuted,
    ParticipantVideoToggled,
    QualityChanged,
    CallFailed
}

/// <summary>
/// Call types
/// </summary>
public enum CallType
{
    Voice,
    Video
}

/// <summary>
/// Call status
/// </summary>
public enum CallStatus
{
    Initiated,
    Ringing,
    Connecting,
    Active,
    Ended,
    Declined,
    Missed,
    Failed
}

/// <summary>
/// Participant role in a call
/// </summary>
public enum ParticipantRole
{
    Host,
    Moderator,
    Participant
}

/// <summary>
/// Participant status
/// </summary>
public enum ParticipantStatus
{
    Invited,
    Joining,
    Connected,
    Disconnected,
    Left
}

/// <summary>
/// Call participant information
/// </summary>
public class CallParticipant
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    
    public ParticipantRole Role { get; set; } = ParticipantRole.Participant;
    public ParticipantStatus Status { get; set; } = ParticipantStatus.Invited;
    
    public bool IsMuted { get; set; }
    public bool IsVideoEnabled { get; set; }
    
    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
}

/// <summary>
/// Call information
/// </summary>
public class Call
{
    [Required]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    public string CallerId { get; set; } = string.Empty;
    
    [Required]
    public string CalleeId { get; set; } = string.Empty;
    
    public CallType Type { get; set; } = CallType.Voice;
    public CallStatus Status { get; set; } = CallStatus.Initiated;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int? Duration { get; set; } // in seconds
    
    public string? RoomId { get; set; }
    public string? ConversationId { get; set; }
    
    public List<CallParticipant> Participants { get; set; } = new();
}

/// <summary>
/// Call event for Kafka messaging
/// </summary>
public class CallEvent
{
    [Required]
    public CallEventType Type { get; set; }
    
    [Required]
    public string CallId { get; set; } = string.Empty;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public Dictionary<string, object>? Data { get; set; }
    
    // Additional context
    public string? SenderName { get; set; }
    public string? SenderAvatar { get; set; }
    public string? ActionUrl { get; set; }
    public string? RelatedContentId { get; set; }
    public string? RelatedContentType { get; set; }
}

/// <summary>
/// Call notification for real-time delivery
/// </summary>
public class CallNotification : BaseNotification
{
    // Call-specific fields
    public string? CallId { get; set; }
    public string? CallType { get; set; }
    public string? CallStatus { get; set; }
    public string? CallerName { get; set; }
    public string? CallerAvatar { get; set; }
    public int? CallDuration { get; set; }
    public string? ActionType { get; set; } // "answer", "reject", "view_history", etc.
}

/// <summary>
/// Call quality information
/// </summary>
public class CallQuality
{
    [Required]
    public string CallId { get; set; } = string.Empty;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    public int Latency { get; set; } // in milliseconds
    public double PacketLoss { get; set; } // percentage
    public int Jitter { get; set; } // in milliseconds
    public int Bitrate { get; set; } // in kbps
    
    public string Quality { get; set; } = "unknown"; // poor, fair, good, excellent
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Call history entry
/// </summary>
public class CallHistoryEntry
{
    [Required]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    [Required]
    public string CallId { get; set; } = string.Empty;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public string OtherUserId { get; set; } = string.Empty;
    
    public string? OtherUserName { get; set; }
    public string? OtherUserAvatar { get; set; }
    
    public CallType Type { get; set; }
    public CallStatus Status { get; set; }
    
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int? Duration { get; set; } // in seconds
    
    public string? ConversationId { get; set; }
    
    public bool IsMissed { get; set; }
    public bool IsOutgoing { get; set; }
    
    public Dictionary<string, object>? Metadata { get; set; }
}
