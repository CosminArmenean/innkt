using System.ComponentModel.DataAnnotations;

namespace innkt.Social.DTOs;

public class CreatePostRequest
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public string[] MediaUrls { get; set; } = Array.Empty<string>();
    
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    
    public string[] Mentions { get; set; } = Array.Empty<string>();
    
    [MaxLength(255)]
    public string? Location { get; set; }
    
    public string PostType { get; set; } = "text";
    
    public bool IsPublic { get; set; } = true;
    
    // Poll fields
    public string[]? PollOptions { get; set; }
    public int? PollDuration { get; set; }
}

public class UpdatePostRequest
{
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public string[] MediaUrls { get; set; } = Array.Empty<string>();
    
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    
    public string[] Mentions { get; set; } = Array.Empty<string>();
    
    [MaxLength(255)]
    public string? Location { get; set; }
    
    public string PostType { get; set; } = "text";
    
    public bool IsPublic { get; set; } = true;
    
    // Poll fields
    public string[]? PollOptions { get; set; }
    public int? PollDuration { get; set; }
}

public class PostResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string[] MediaUrls { get; set; } = Array.Empty<string>();
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    public string[] Mentions { get; set; } = Array.Empty<string>();
    public string? Location { get; set; }
    public string PostType { get; set; } = "text";
    public bool IsPublic { get; set; }
    public bool IsPinned { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }
    public int ViewsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public UserBasicInfo? Author { get; set; }
    
    // Poll fields
    public string[]? PollOptions { get; set; }
    public int? PollDuration { get; set; }
    public DateTime? PollExpiresAt { get; set; }
}

public class PostListResponse
{
    public List<PostResponse> Posts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class CreateCommentRequest
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
    
    public Guid? ParentCommentId { get; set; }
}

public class UpdateCommentRequest
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
}

public class CommentResponse
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid? ParentCommentId { get; set; }
    public int LikesCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public UserBasicInfo? Author { get; set; }
    public List<CommentResponse> Replies { get; set; } = new();
}

public class CommentListResponse
{
    public List<CommentResponse> Comments { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class VotePollRequest
{
    [Required]
    public string SelectedOption { get; set; } = string.Empty;
    
    [Required]
    public int OptionIndex { get; set; }
}

public class PollOptionResult
{
    public string Option { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public double Percentage { get; set; }
}

public class PollResultsResponse
{
    public int TotalVotes { get; set; }
    public List<PollOptionResult> Results { get; set; } = new();
    public bool IsExpired { get; set; }
    public int? UserVotedOptionIndex { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class UserBasicInfo
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
}

public class LikePostRequest
{
    [Required]
    public Guid PostId { get; set; }
}

public class LikeCommentRequest
{
    [Required]
    public Guid CommentId { get; set; }
}

public class FollowUserRequest
{
    [Required]
    public Guid UserId { get; set; }
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

public class FeedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Hashtag { get; set; }
    public string? Location { get; set; }
    public DateTime? Since { get; set; }
    public DateTime? Until { get; set; }
}

public class SearchRequest
{
    [Required]
    public string Query { get; set; } = string.Empty;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Type { get; set; } // "posts", "users", "hashtags"
    public string? Hashtag { get; set; }
    public string? Location { get; set; }
}

public class ReportUserRequest
{
    [Required]
    [MaxLength(50)]
    public string Reason { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
}

// Analytics DTOs
public class PostAnalytics
{
    public Guid PostId { get; set; }
    public int TotalViews { get; set; }
    public int TotalLikes { get; set; }
    public int TotalComments { get; set; }
    public int TotalShares { get; set; }
    public double EngagementRate { get; set; }
    public Dictionary<string, int> ViewsByCountry { get; set; } = new();
    public Dictionary<string, int> ViewsByHour { get; set; } = new();
    public DateTime AnalyticsDate { get; set; } = DateTime.UtcNow;
}

public class UserAnalytics
{
    public Guid UserId { get; set; }
    public int TotalPosts { get; set; }
    public int TotalViews { get; set; }
    public int TotalLikes { get; set; }
    public int TotalComments { get; set; }
    public int TotalFollowers { get; set; }
    public int TotalFollowing { get; set; }
    public double AverageEngagementRate { get; set; }
    public List<string> TopHashtags { get; set; } = new();
    public DateTime AnalyticsDate { get; set; } = DateTime.UtcNow;
}

// MongoDB-specific DTOs
public class MongoPostResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string PostType { get; set; } = "text";
    public List<string> MediaUrls { get; set; } = new();
    public List<string> Hashtags { get; set; } = new();
    public List<string> Mentions { get; set; } = new();
    public string? Location { get; set; }
    public bool IsPublic { get; set; } = true;
    public bool IsPinned { get; set; } = false;
    
    // Poll fields
    public List<string>? PollOptions { get; set; }
    public int? PollDuration { get; set; }
    public DateTime? PollExpiresAt { get; set; }
    
    // Engagement metrics
    public int LikesCount { get; set; } = 0;
    public int CommentsCount { get; set; } = 0;
    public int SharesCount { get; set; } = 0;
    public int ViewsCount { get; set; } = 0;
    public double FeedScore { get; set; } = 0;
    
    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Cached user profile - KEY OPTIMIZATION!
    public CachedUserProfile? UserProfile { get; set; }
}

public class CachedUserProfile
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime LastUpdated { get; set; }
}

public class MongoFeedResponse
{
    public List<MongoPostResponse> Posts { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore { get; set; }
    public int TotalCachedProfiles { get; set; } // For monitoring cache effectiveness
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
