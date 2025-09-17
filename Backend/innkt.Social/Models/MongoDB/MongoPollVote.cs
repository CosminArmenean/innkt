using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace innkt.Social.Models.MongoDB;

/// <summary>
/// MongoDB document model for poll votes
/// Optimized for fast vote counting and user vote tracking
/// </summary>
[BsonCollection("pollVotes")]
public class MongoPollVote
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("voteId")]
    [BsonRepresentation(BsonType.String)]
    public Guid VoteId { get; set; } = Guid.NewGuid();

    [BsonElement("postId")]
    [BsonRepresentation(BsonType.String)]
    public Guid PostId { get; set; }

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.String)]
    public Guid UserId { get; set; }

    [BsonElement("selectedOption")]
    public string SelectedOption { get; set; } = string.Empty;

    [BsonElement("optionIndex")]
    public int OptionIndex { get; set; }

    [BsonElement("createdAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Cached user data for vote display (optional)
    [BsonElement("userSnapshot")]
    public UserSnapshot? UserSnapshot { get; set; }

    // Metadata for analytics
    [BsonElement("ipAddress")]
    public string? IpAddress { get; set; }

    [BsonElement("userAgent")]
    public string? UserAgent { get; set; }

    [BsonElement("isDeleted")]
    public bool IsDeleted { get; set; } = false;

    [BsonElement("deletedAt")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? DeletedAt { get; set; }
}
