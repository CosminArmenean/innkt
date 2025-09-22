using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace innkt.Social.Models.MongoDB;

/// <summary>
/// MongoDB document model for comments with cached user data
/// Optimized for fast queries and real-time updates
/// </summary>
[BsonCollection("comments")]
public class MongoComment
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("commentId")]
    [BsonRepresentation(BsonType.String)]
    public Guid CommentId { get; set; } = Guid.NewGuid();

    [BsonElement("postId")]
    [BsonRepresentation(BsonType.String)]
    public Guid PostId { get; set; }

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.String)]
    public Guid UserId { get; set; }

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("parentCommentId")]
    [BsonRepresentation(BsonType.String)]
    public Guid? ParentCommentId { get; set; }

    [BsonElement("likesCount")]
    public int LikesCount { get; set; } = 0;

    [BsonElement("repliesCount")]
    public int RepliesCount { get; set; } = 0;

    [BsonElement("isDeleted")]
    public bool IsDeleted { get; set; } = false;

    [BsonElement("deletedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? DeletedAt { get; set; }

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

    // Threading support
    [BsonElement("threadPath")]
    public List<string> ThreadPath { get; set; } = new(); // Path for nested comments

    [BsonElement("depth")]
    public int Depth { get; set; } = 0; // Comment depth in thread

    /// <summary>
    /// Check if user snapshot needs refresh
    /// </summary>
    public bool NeedsUserRefresh => UserSnapshot?.IsStale ?? true;

    /// <summary>
    /// Update engagement metrics
    /// </summary>
    public void UpdateEngagement(int likes, int replies)
    {
        LikesCount = likes;
        RepliesCount = replies;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Soft delete comment
    /// </summary>
    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
