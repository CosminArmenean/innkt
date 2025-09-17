using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace innkt.Social.Models.MongoDB;

/// <summary>
/// Cached user profile data stored with posts to avoid N+1 queries
/// </summary>
public class UserSnapshot
{
    [BsonElement("userId")]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [BsonElement("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("avatarUrl")]
    public string? AvatarUrl { get; set; }

    [BsonElement("isVerified")]
    public bool IsVerified { get; set; }

    [BsonElement("isActive")]
    public bool IsActive { get; set; } = true;

    [BsonElement("cacheExpiry")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CacheExpiry { get; set; }

    [BsonElement("lastUpdated")]
    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Check if the cached user data is stale and needs refresh
    /// </summary>
    public bool IsStale => DateTime.UtcNow > CacheExpiry;

    /// <summary>
    /// Set cache expiry to 1 hour from now
    /// </summary>
    public void RefreshExpiry()
    {
        CacheExpiry = DateTime.UtcNow.AddHours(1);
        LastUpdated = DateTime.UtcNow;
    }
}
