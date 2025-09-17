using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace innkt.Social.Models.MongoDB;

/// <summary>
/// MongoDB document model for social posts with cached user data
/// Optimized for fast feed queries and real-time updates
/// </summary>
[BsonCollection("posts")]
public class MongoPost
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("postId")]
    [BsonRepresentation(BsonType.String)]
    public Guid PostId { get; set; } = Guid.NewGuid();

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.String)]
    public Guid UserId { get; set; }

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("postType")]
    public string PostType { get; set; } = "text";

    [BsonElement("mediaUrls")]
    public List<string> MediaUrls { get; set; } = new();

    [BsonElement("hashtags")]
    public List<string> Hashtags { get; set; } = new();

    [BsonElement("mentions")]
    public List<string> Mentions { get; set; } = new();

    [BsonElement("location")]
    public string? Location { get; set; }

    [BsonElement("isPublic")]
    public bool IsPublic { get; set; } = true;

    [BsonElement("isPinned")]
    public bool IsPinned { get; set; } = false;

    // Poll-specific fields
    [BsonElement("pollOptions")]
    public List<string>? PollOptions { get; set; }

    [BsonElement("pollDuration")]
    public int? PollDuration { get; set; }

    [BsonElement("pollExpiresAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PollExpiresAt { get; set; }

    // Engagement metrics
    [BsonElement("likesCount")]
    public int LikesCount { get; set; } = 0;

    [BsonElement("commentsCount")]
    public int CommentsCount { get; set; } = 0;

    [BsonElement("sharesCount")]
    public int SharesCount { get; set; } = 0;

    [BsonElement("viewsCount")]
    public int ViewsCount { get; set; } = 0;

    // Timestamps
    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Cached user profile data (KEY OPTIMIZATION)
    [BsonElement("userSnapshot")]
    public UserSnapshot? UserSnapshot { get; set; }

    // Engagement arrays for real-time updates
    [BsonElement("likedBy")]
    public List<string> LikedBy { get; set; } = new(); // User IDs who liked

    [BsonElement("sharedBy")]
    public List<string> SharedBy { get; set; } = new(); // User IDs who shared

    // Feed optimization fields
    [BsonElement("feedScore")]
    public double FeedScore { get; set; } = 0; // Algorithm score for feed ranking

    [BsonElement("isDeleted")]
    public bool IsDeleted { get; set; } = false;

    [BsonElement("deletedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? DeletedAt { get; set; }

    // Indexing hints
    [BsonElement("tags")]
    public List<string> Tags { get; set; } = new(); // For search optimization

    /// <summary>
    /// Check if user snapshot needs refresh
    /// </summary>
    public bool NeedsUserRefresh => UserSnapshot?.IsStale ?? true;

    /// <summary>
    /// Check if poll has expired
    /// </summary>
    public bool IsPollExpired => PollExpiresAt.HasValue && DateTime.UtcNow > PollExpiresAt.Value;

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
    /// Calculate feed score based on engagement and recency
    /// </summary>
    public void CalculateFeedScore()
    {
        var hoursSinceCreation = (DateTime.UtcNow - CreatedAt).TotalHours;
        var engagementScore = (LikesCount * 1.0) + (CommentsCount * 2.0) + (SharesCount * 1.5);
        var recencyScore = Math.Max(0, 100 - hoursSinceCreation); // Decay over time
        
        FeedScore = engagementScore + recencyScore;
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Attribute to specify MongoDB collection name
/// </summary>
[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public class BsonCollectionAttribute : Attribute
{
    public string CollectionName { get; }

    public BsonCollectionAttribute(string collectionName)
    {
        CollectionName = collectionName;
    }
}
