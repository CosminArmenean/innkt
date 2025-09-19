using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace innkt.Social.Models.MongoDB;

/// <summary>
/// MongoDB document model for reposts with cached user and original post data
/// Optimized for fast feed queries and real-time repost tracking
/// </summary>
[BsonCollection("reposts")]
public class MongoRepost
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("repostId")]
    [BsonRepresentation(BsonType.String)]
    public Guid RepostId { get; set; } = Guid.NewGuid();

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.String)]
    public Guid UserId { get; set; }

    [BsonElement("originalPostId")]
    [BsonRepresentation(BsonType.String)]
    public Guid OriginalPostId { get; set; }

    [BsonElement("repostType")]
    public string RepostType { get; set; } = "simple"; // "simple" or "quote"

    [BsonElement("quoteText")]
    public string? QuoteText { get; set; } // Only for quote reposts

    [BsonElement("visibility")]
    public string Visibility { get; set; } = "public"; // "public", "friends", "private"

    // Timestamps
    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Cached user profile data (PERFORMANCE OPTIMIZATION)
    [BsonElement("userSnapshot")]
    public UserSnapshot? UserSnapshot { get; set; }

    // Cached original post data (PERFORMANCE OPTIMIZATION)
    [BsonElement("originalPostSnapshot")]
    public OriginalPostSnapshot? OriginalPostSnapshot { get; set; }

    // Engagement metrics for quote reposts
    [BsonElement("likesCount")]
    public int LikesCount { get; set; } = 0;

    [BsonElement("commentsCount")]
    public int CommentsCount { get; set; } = 0;

    [BsonElement("sharesCount")]
    public int SharesCount { get; set; } = 0;

    [BsonElement("viewsCount")]
    public int ViewsCount { get; set; } = 0;

    // Engagement arrays for real-time updates
    [BsonElement("likedBy")]
    public List<string> LikedBy { get; set; } = new(); // User IDs who liked this repost

    [BsonElement("sharedBy")]
    public List<string> SharedBy { get; set; } = new(); // User IDs who shared this repost

    // Feed optimization fields
    [BsonElement("feedScore")]
    public double FeedScore { get; set; } = 0; // Algorithm score for feed ranking

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("isDeleted")]
    public bool IsDeleted { get; set; } = false;

    [BsonElement("deletedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? DeletedAt { get; set; }

    // Repost chain tracking (for preventing spam)
    [BsonElement("repostChainLength")]
    public int RepostChainLength { get; set; } = 1; // How deep in the repost chain this is

    [BsonElement("originalAuthorId")]
    [BsonRepresentation(BsonType.String)]
    public Guid OriginalAuthorId { get; set; } // For attribution and controls

    // Moderation fields
    [BsonElement("isApproved")]
    public bool IsApproved { get; set; } = true; // For author-controlled reposts

    [BsonElement("moderationFlags")]
    public List<string> ModerationFlags { get; set; } = new(); // Spam, inappropriate, etc.

    // Indexing hints
    [BsonElement("tags")]
    public List<string> Tags { get; set; } = new(); // For search optimization

    /// <summary>
    /// Check if user snapshot needs refresh
    /// </summary>
    public bool NeedsUserRefresh => UserSnapshot?.IsStale ?? true;

    /// <summary>
    /// Check if original post snapshot needs refresh
    /// </summary>
    public bool NeedsOriginalPostRefresh => OriginalPostSnapshot?.IsStale ?? true;

    /// <summary>
    /// Check if this is a quote repost
    /// </summary>
    public bool IsQuoteRepost => RepostType == "quote" && !string.IsNullOrEmpty(QuoteText);

    /// <summary>
    /// Update engagement metrics
    /// </summary>
    public void UpdateEngagement(int likes, int comments, int shares, int views)
    {
        LikesCount = likes;
        CommentsCount = comments;
        SharesCount = shares;
        ViewsCount = views;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Calculate feed score based on engagement, recency, and original post popularity
    /// </summary>
    public void CalculateFeedScore()
    {
        var baseScore = 1.0;
        var engagementScore = (LikesCount * 1.0) + (CommentsCount * 2.0) + (SharesCount * 1.5);
        var recencyScore = Math.Max(0, 1.0 - ((DateTime.UtcNow - CreatedAt).TotalDays / 7.0)); // Decay over a week
        var originalPostScore = OriginalPostSnapshot?.FeedScore ?? 1.0;
        
        // Quote reposts get slightly higher score for original content
        var contentBonus = IsQuoteRepost ? 1.2 : 1.0;
        
        FeedScore = (baseScore + engagementScore) * recencyScore * contentBonus * Math.Min(originalPostScore, 2.0);
    }

    /// <summary>
    /// Soft delete the repost
    /// </summary>
    public void SoftDelete()
    {
        IsDeleted = true;
        IsActive = false;
        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Restore a soft deleted repost
    /// </summary>
    public void Restore()
    {
        IsDeleted = false;
        IsActive = true;
        DeletedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Cached original post data to avoid N+1 queries
/// </summary>
public class OriginalPostSnapshot
{
    [BsonElement("postId")]
    [BsonRepresentation(BsonType.String)]
    public Guid PostId { get; set; }

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("postType")]
    public string PostType { get; set; } = "text";

    [BsonElement("mediaUrls")]
    public List<string> MediaUrls { get; set; } = new();

    [BsonElement("authorId")]
    [BsonRepresentation(BsonType.String)]
    public Guid AuthorId { get; set; }

    [BsonElement("authorSnapshot")]
    public UserSnapshot? AuthorSnapshot { get; set; }

    [BsonElement("likesCount")]
    public int LikesCount { get; set; } = 0;

    [BsonElement("commentsCount")]
    public int CommentsCount { get; set; } = 0;

    [BsonElement("sharesCount")]
    public int SharesCount { get; set; } = 0;

    [BsonElement("repostsCount")]
    public int RepostsCount { get; set; } = 0;

    [BsonElement("viewsCount")]
    public int ViewsCount { get; set; } = 0;

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; }

    [BsonElement("feedScore")]
    public double FeedScore { get; set; } = 0;

    [BsonElement("isDeleted")]
    public bool IsDeleted { get; set; } = false;

    [BsonElement("cacheExpiry")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CacheExpiry { get; set; } = DateTime.UtcNow.AddHours(24); // Cache for 24 hours

    /// <summary>
    /// Check if the cached post data is stale
    /// </summary>
    public bool IsStale => DateTime.UtcNow > CacheExpiry;

    /// <summary>
    /// Update cache expiry
    /// </summary>
    public void RefreshCache()
    {
        CacheExpiry = DateTime.UtcNow.AddHours(24);
    }
}
