using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace innkt.Social.Models.MongoDB;

[BsonCollection("grok_requests")]
public class MongoGrokRequest
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("requestId")]
    public string RequestId { get; set; } = string.Empty;

    [BsonElement("postId")]
    [BsonRepresentation(BsonType.String)]
    public Guid PostId { get; set; }

    [BsonElement("commentId")]
    [BsonRepresentation(BsonType.String)]
    public Guid CommentId { get; set; }

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.String)]
    public Guid UserId { get; set; }

    [BsonElement("postContent")]
    public string PostContent { get; set; } = string.Empty;

    [BsonElement("userQuestion")]
    public string UserQuestion { get; set; } = string.Empty;

    [BsonElement("response")]
    public string? Response { get; set; }

    [BsonElement("status")]
    public string Status { get; set; } = "processing"; // "processing", "completed", "failed"

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("completedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? CompletedAt { get; set; }
}
