using System.ComponentModel.DataAnnotations;
using innkt.Social.Models.MongoDB;

namespace innkt.Social.DTOs;

/// <summary>
/// Request to create a new repost
/// </summary>
public class CreateRepostRequest
{
    [Required]
    public Guid OriginalPostId { get; set; }

    [Required]
    [AllowedValues("simple", "quote")]
    public string RepostType { get; set; } = "simple";

    [MaxLength(280)] // X-style character limit for quote text
    public string? QuoteText { get; set; }

    [AllowedValues("public", "friends", "private")]
    public string Visibility { get; set; } = "public";

    public List<string>? Tags { get; set; }
}

/// <summary>
/// Response after creating a repost
/// </summary>
public class CreateRepostResponse
{
    public MongoRepost Repost { get; set; } = new();
    public MongoPost UpdatedOriginalPost { get; set; } = new();
    public RepostAnalytics Analytics { get; set; } = new();
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Request to update quote text in an existing repost
/// </summary>
public class UpdateRepostRequest
{
    [Required]
    [MaxLength(280)]
    public string QuoteText { get; set; } = string.Empty;

    public List<string>? Tags { get; set; }
}

/// <summary>
/// Response for repost queries with pagination
/// </summary>
public class RepostListResponse
{
    public List<MongoRepost> Reposts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore { get; set; }
}

/// <summary>
/// Combined feed item that can be either a post or repost
/// </summary>
public class FeedItem
{
    public string Type { get; set; } = "post"; // "post" or "repost"
    public MongoPost? Post { get; set; }
    public MongoRepost? Repost { get; set; }
    public DateTime CreatedAt { get; set; }
    public double FeedScore { get; set; }
    public string ItemId { get; set; } = string.Empty; // For React keys
}

/// <summary>
/// Repost analytics and insights
/// </summary>
public class RepostAnalytics
{
    public Guid RepostId { get; set; }
    public Guid OriginalPostId { get; set; }
    public Guid UserId { get; set; }
    
    // Engagement metrics
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int SharesCount { get; set; }
    public int ViewsCount { get; set; }
    
    // Repost specific metrics
    public int RepostChainLength { get; set; }
    public DateTime CreatedAt { get; set; }
    public string RepostType { get; set; } = string.Empty;
    
    // Performance metrics
    public double EngagementRate { get; set; }
    public double ReachMultiplier { get; set; } // How much the repost amplified the original
    public TimeSpan TimeToFirstEngagement { get; set; }
    
    // Network insights
    public List<RepostNetworkInsight> NetworkInsights { get; set; } = new();
    public List<string> TopHashtags { get; set; } = new();
    public List<RepostEngagementBreakdown> EngagementBreakdown { get; set; } = new();
}

/// <summary>
/// Network insights for repost analytics
/// </summary>
public class RepostNetworkInsight
{
    public string InsightType { get; set; } = string.Empty; // "mutual_connections", "influence_score", etc.
    public string Description { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Score { get; set; }
    public List<string> UserIds { get; set; } = new();
}

/// <summary>
/// Engagement breakdown by time periods
/// </summary>
public class RepostEngagementBreakdown
{
    public string TimePeriod { get; set; } = string.Empty; // "first_hour", "first_day", etc.
    public int Likes { get; set; }
    public int Comments { get; set; }
    public int Shares { get; set; }
    public int Views { get; set; }
    public double EngagementRate { get; set; }
}

/// <summary>
/// Trending repost information
/// </summary>
public class RepostTrend
{
    public Guid OriginalPostId { get; set; }
    public MongoPost OriginalPost { get; set; } = new();
    public int RepostCount { get; set; }
    public int RepostCountInPeriod { get; set; }
    public double TrendingScore { get; set; }
    public List<RepostTrendUser> TopReposters { get; set; } = new();
    public DateTime TrendStarted { get; set; }
    public string TrendReason { get; set; } = string.Empty; // "viral", "influencer_boost", etc.
}

/// <summary>
/// User information in trending reposts
/// </summary>
public class RepostTrendUser
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
    public DateTime RepostTime { get; set; }
    public string? QuoteText { get; set; }
}

/// <summary>
/// Repost moderation request
/// </summary>
public class RepostModerationRequest
{
    [Required]
    public Guid RepostId { get; set; }

    [Required]
    public string Action { get; set; } = string.Empty; // "approve", "reject", "flag"

    [Required]
    public string Reason { get; set; } = string.Empty;

    public string? AdditionalNotes { get; set; }
}

/// <summary>
/// Repost spam detection result
/// </summary>
public class RepostSpamDetectionResult
{
    public bool IsSpam { get; set; }
    public double SpamScore { get; set; } // 0.0 - 1.0
    public List<string> SpamIndicators { get; set; } = new();
    public string RecommendedAction { get; set; } = string.Empty; // "allow", "flag", "block"
    public string Explanation { get; set; } = string.Empty;
}

/// <summary>
/// Repost recommendation for AI suggestions
/// </summary>
public class RepostRecommendation
{
    public Guid PostId { get; set; }
    public MongoPost Post { get; set; } = new();
    public double RecommendationScore { get; set; }
    public string RecommendationReason { get; set; } = string.Empty; // "trending", "network_activity", "interests"
    public List<string> SuggestedQuoteTexts { get; set; } = new();
    public DateTime RecommendedAt { get; set; } = DateTime.UtcNow;
}
