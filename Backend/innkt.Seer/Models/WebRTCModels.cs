namespace innkt.Seer.Models
{
    public class WebRTCOffer
    {
        public string CallId { get; set; } = string.Empty;
        public string FromUserId { get; set; } = string.Empty;
        public string ToUserId { get; set; } = string.Empty;
        public string Sdp { get; set; } = string.Empty;
        public RTCSessionDescriptionInit Type { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class WebRTCAnswer
    {
        public string CallId { get; set; } = string.Empty;
        public string FromUserId { get; set; } = string.Empty;
        public string ToUserId { get; set; } = string.Empty;
        public string Sdp { get; set; } = string.Empty;
        public RTCSessionDescriptionInit Type { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class WebRTCIceCandidate
    {
        public string CallId { get; set; } = string.Empty;
        public string FromUserId { get; set; } = string.Empty;
        public string ToUserId { get; set; } = string.Empty;
        public string Candidate { get; set; } = string.Empty;
        public string SdpMid { get; set; } = string.Empty;
        public int SdpMLineIndex { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class WebRTCConnectionState
    {
        public string CallId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public RTCIceConnectionState State { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class WebRTCStats
    {
        public string CallId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public double Latency { get; set; }
        public double PacketLoss { get; set; }
        public double Jitter { get; set; }
        public int Bitrate { get; set; }
        public int FrameRate { get; set; }
        public int Resolution { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class CallInvitation
    {
        public string CallId { get; set; } = string.Empty;
        public string CallerId { get; set; } = string.Empty;
        public string CallerName { get; set; } = string.Empty;
        public string CallerAvatar { get; set; } = string.Empty;
        public string CalleeId { get; set; } = string.Empty;
        public CallType Type { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public int TimeoutSeconds { get; set; } = 30;
    }

    public class CallResponse
    {
        public string CallId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public CallResponseType Response { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class MediaStreamInfo
    {
        public string UserId { get; set; } = string.Empty;
        public bool HasAudio { get; set; }
        public bool HasVideo { get; set; }
        public bool IsMuted { get; set; }
        public bool IsVideoEnabled { get; set; }
        public bool IsScreenSharing { get; set; }
        public VideoQuality VideoQuality { get; set; }
        public AudioQuality AudioQuality { get; set; }
    }

    public class CallRoom
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public List<string> Participants { get; set; } = new();
        public CallSettings Settings { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastActivity { get; set; }
        public bool IsActive { get; set; } = true;
    }

    // WebRTC Enums (matching browser APIs)
    public enum RTCSessionDescriptionInit
    {
        Offer,
        Answer,
        Pranswer,
        Rollback
    }

    public enum RTCIceConnectionState
    {
        New,
        Checking,
        Connected,
        Completed,
        Failed,
        Disconnected,
        Closed
    }

    public enum CallResponseType
    {
        Accepted,
        Declined,
        Busy,
        NoAnswer,
        Failed
    }

    // STUN/TURN Configuration
    public class IceServerConfig
    {
        public List<string> Urls { get; set; } = new();
        public string? Username { get; set; }
        public string? Credential { get; set; }
    }

    public class WebRTCConfiguration
    {
        public List<IceServerConfig> IceServers { get; set; } = new();
        public string? IceCandidatePoolSize { get; set; }
        public bool BundlePolicy { get; set; } = true;
        public bool RtcpMuxPolicy { get; set; } = true;
    }
}
