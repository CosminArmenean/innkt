using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Follow.Models;

public class Follow
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid FollowerId { get; set; }
    
    [Required]
    public Guid FollowingId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastInteractionAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public bool IsMuted { get; set; } = false;
    
    public bool IsBlocked { get; set; } = false;
    
    public string? Notes { get; set; } // Personal notes about the follow
    
    // Ensure user cannot follow themselves
    public bool IsValid => FollowerId != FollowingId;
}

public class FollowRequest
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid RequesterId { get; set; }
    
    [Required]
    public Guid TargetUserId { get; set; }
    
    [MaxLength(500)]
    public string? Message { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending"; // pending, accepted, rejected, cancelled
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? RespondedAt { get; set; }
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    
    // Navigation properties
    public virtual UserBasicInfo? Requester { get; set; }
    public virtual UserBasicInfo? TargetUser { get; set; }
}

public class FollowNotification
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public Guid RelatedUserId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // follow, unfollow, follow_request, follow_accepted
    
    [MaxLength(500)]
    public string? Message { get; set; }
    
    public bool IsRead { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ReadAt { get; set; }
    
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class FollowStats
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid UserId { get; set; }
    
    public int FollowersCount { get; set; } = 0;
    
    public int FollowingCount { get; set; } = 0;
    
    public int MutualFollowsCount { get; set; } = 0;
    
    public int FollowRequestsSent { get; set; } = 0;
    
    public int FollowRequestsReceived { get; set; } = 0;
    
    public int FollowRequestsAccepted { get; set; } = 0;
    
    public int FollowRequestsRejected { get; set; } = 0;
    
    public DateTime LastUpdatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserBasicInfo
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
    public bool IsPublic { get; set; } = true;
    public DateTime? LastSeenAt { get; set; }
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
}

public class FollowSuggestion
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public Guid SuggestedUserId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Reason { get; set; } = string.Empty; // mutual_friends, similar_interests, location, etc.
    
    public double Score { get; set; } = 0.0; // 0.0 to 1.0
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? DismissedAt { get; set; }
    
    public bool IsDismissed { get; set; } = false;
    
    // Navigation properties
    public virtual UserBasicInfo? SuggestedUser { get; set; }
}
