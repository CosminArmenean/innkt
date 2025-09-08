using System.ComponentModel.DataAnnotations;

namespace innkt.Seer.Models
{
    public class Call
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string CallerId { get; set; }
        
        [Required]
        public string CalleeId { get; set; }
        
        public CallType Type { get; set; } = CallType.Voice;
        
        public CallStatus Status { get; set; } = CallStatus.Initiated;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? StartedAt { get; set; }
        
        public DateTime? EndedAt { get; set; }
        
        public TimeSpan? Duration => EndedAt.HasValue && StartedAt.HasValue 
            ? EndedAt.Value - StartedAt.Value 
            : null;
        
        public string? RoomId { get; set; }
        
        public List<CallParticipant> Participants { get; set; } = new();
        
        public CallSettings Settings { get; set; } = new();
        
        public CallQuality? Quality { get; set; }
        
        public bool IsRecording { get; set; } = false;
        
        public string? RecordingUrl { get; set; }
        
        public string? ConversationId { get; set; }
        
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class CallParticipant
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string CallId { get; set; }
        
        [Required]
        public string UserId { get; set; }
        
        public string? Username { get; set; }
        
        public string? DisplayName { get; set; }
        
        public string? AvatarUrl { get; set; }
        
        public ParticipantRole Role { get; set; } = ParticipantRole.Participant;
        
        public ParticipantStatus Status { get; set; } = ParticipantStatus.Invited;
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? LeftAt { get; set; }
        
        public bool IsMuted { get; set; } = false;
        
        public bool IsVideoEnabled { get; set; } = true;
        
        public bool IsScreenSharing { get; set; } = false;
        
        public string? ConnectionId { get; set; }
        
        public ParticipantQuality? Quality { get; set; }
        
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class CallSettings
    {
        public bool AllowScreenSharing { get; set; } = true;
        
        public bool AllowRecording { get; set; } = false;
        
        public bool AllowParticipantInvite { get; set; } = true;
        
        public int MaxParticipants { get; set; } = 8;
        
        public bool RequireApproval { get; set; } = false;
        
        public bool EnableNoiseSuppression { get; set; } = true;
        
        public bool EnableEchoCancellation { get; set; } = true;
        
        public VideoQuality VideoQuality { get; set; } = VideoQuality.HD;
        
        public AudioQuality AudioQuality { get; set; } = AudioQuality.High;
    }

    public class CallQuality
    {
        public double AverageLatency { get; set; }
        
        public double PacketLoss { get; set; }
        
        public double Jitter { get; set; }
        
        public int Bitrate { get; set; }
        
        public QualityLevel OverallQuality { get; set; }
        
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class ParticipantQuality
    {
        public double Latency { get; set; }
        
        public double PacketLoss { get; set; }
        
        public double Jitter { get; set; }
        
        public int Bitrate { get; set; }
        
        public QualityLevel Quality { get; set; }
        
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }

    public class CallEvent
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string CallId { get; set; }
        
        [Required]
        public string UserId { get; set; }
        
        public CallEventType Type { get; set; }
        
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public Dictionary<string, object> Data { get; set; } = new();
    }

    // Enums
    public enum CallType
    {
        Voice = 0,
        Video = 1,
        ScreenShare = 2
    }

    public enum CallStatus
    {
        Initiated = 0,
        Ringing = 1,
        Connecting = 2,
        Active = 3,
        Ended = 4,
        Declined = 5,
        Missed = 6,
        Failed = 7
    }

    public enum ParticipantRole
    {
        Participant = 0,
        Moderator = 1,
        Host = 2
    }

    public enum ParticipantStatus
    {
        Invited = 0,
        Joining = 1,
        Connected = 2,
        Disconnected = 3,
        Left = 4
    }

    public enum VideoQuality
    {
        Low = 0,    // 240p
        Medium = 1, // 480p
        HD = 2,     // 720p
        FullHD = 3  // 1080p
    }

    public enum AudioQuality
    {
        Low = 0,    // 8kHz
        Medium = 1, // 16kHz
        High = 2,   // 44.1kHz
        Ultra = 3   // 48kHz
    }

    public enum QualityLevel
    {
        Poor = 0,
        Fair = 1,
        Good = 2,
        Excellent = 3
    }

    public enum CallEventType
    {
        CallStarted = 0,
        CallEnded = 1,
        ParticipantJoined = 2,
        ParticipantLeft = 3,
        ParticipantMuted = 4,
        ParticipantUnmuted = 5,
        VideoEnabled = 6,
        VideoDisabled = 7,
        ScreenShareStarted = 8,
        ScreenShareStopped = 9,
        RecordingStarted = 10,
        RecordingStopped = 11,
        QualityChanged = 12,
        CallDeclined = 13,
        CallMissed = 14,
        CallFailed = 15
    }
}
