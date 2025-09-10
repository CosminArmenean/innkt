using System.ComponentModel.DataAnnotations;

namespace innkt.Follow.DTOs;

public class FollowUserRequest
{
    [Required]
    public Guid UserId { get; set; }
    
    [MaxLength(500)]
    public string? Message { get; set; }
}

public class UnfollowUserRequest
{
    [Required]
    public Guid UserId { get; set; }
}

public class FollowResponse
{
    public Guid Id { get; set; }
    public Guid FollowerId { get; set; }
    public Guid FollowingId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastInteractionAt { get; set; }
    public bool IsActive { get; set; }
    public bool IsMuted { get; set; }
    public bool IsBlocked { get; set; }
    public string? Notes { get; set; }
    public UserBasicInfo? Follower { get; set; }
    public UserBasicInfo? Following { get; set; }
}

public class FollowListResponse
{
    public List<FollowResponse> Follows { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class FollowRequestResponse
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public Guid TargetUserId { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public UserBasicInfo? Requester { get; set; }
    public UserBasicInfo? TargetUser { get; set; }
}

public class FollowRequestListResponse
{
    public List<FollowRequestResponse> Requests { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class RespondToFollowRequestRequest
{
    [Required]
    public Guid RequestId { get; set; }
    
    [Required]
    public string Action { get; set; } = string.Empty; // "accept" or "reject"
}

public class FollowStatsResponse
{
    public Guid UserId { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public int MutualFollowsCount { get; set; }
    public int FollowRequestsSent { get; set; }
    public int FollowRequestsReceived { get; set; }
    public int FollowRequestsAccepted { get; set; }
    public int FollowRequestsRejected { get; set; }
    public DateTime LastUpdatedAt { get; set; }
}

public class FollowNotificationResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid RelatedUserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Message { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
    public UserBasicInfo? RelatedUser { get; set; }
}

public class FollowNotificationListResponse
{
    public List<FollowNotificationResponse> Notifications { get; set; } = new();
    public int TotalCount { get; set; }
    public int UnreadCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class FollowSuggestionResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid SuggestedUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public double Score { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsDismissed { get; set; }
    public UserBasicInfo? SuggestedUser { get; set; }
}

public class FollowSuggestionListResponse
{
    public List<FollowSuggestionResponse> Suggestions { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class MuteUserRequest
{
    [Required]
    public Guid UserId { get; set; }
    
    public bool Mute { get; set; } = true;
}

public class BlockUserRequest
{
    [Required]
    public Guid UserId { get; set; }
    
    public bool Block { get; set; } = true;
}

public class UpdateFollowNotesRequest
{
    [Required]
    public Guid UserId { get; set; }
    
    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class GetMutualFollowsRequest
{
    [Required]
    public Guid UserId { get; set; }
    
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class GetFollowSuggestionsRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string[]? Reasons { get; set; }
    public double? MinScore { get; set; }
    public double? MaxScore { get; set; }
}

public class DismissSuggestionRequest
{
    [Required]
    public Guid SuggestionId { get; set; }
}

public class GetFollowTimelineRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public DateTime? Since { get; set; }
    public DateTime? Until { get; set; }
    public string[]? Types { get; set; }
}

public class FollowTimelineResponse
{
    public List<FollowTimelineItem> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class FollowTimelineItem
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty; // "follow", "unfollow", "follow_request", "follow_accepted"
    public Guid UserId { get; set; }
    public Guid RelatedUserId { get; set; }
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserBasicInfo? User { get; set; }
    public UserBasicInfo? RelatedUser { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
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
    public bool IsFollowing { get; set; }
    public bool IsFollowedBy { get; set; }
    public bool IsMuted { get; set; }
    public bool IsBlocked { get; set; }
    public string? FollowNotes { get; set; }
}
