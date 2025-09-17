using innkt.Social.Models.MongoDB;
using innkt.Social.DTOs;

namespace innkt.Social.Services;

/// <summary>
/// Service for real-time notifications using MongoDB Change Streams and Server-Sent Events
/// </summary>
public interface IRealtimeService
{
    // Change Stream Management
    Task StartChangeStreamsAsync();
    Task StopChangeStreamsAsync();
    bool IsChangeStreamActive { get; }

    // Client Connection Management
    Task AddClientAsync(Guid userId, string connectionId);
    Task RemoveClientAsync(string connectionId);
    Task<int> GetConnectedClientsCount();
    Task<List<string>> GetUserConnections(Guid userId);

    // Real-time Notifications
    Task NotifyNewPostAsync(MongoPost post, List<Guid> followerIds);
    Task NotifyPostLikedAsync(Guid postId, Guid likedByUserId, Guid postAuthorId);
    Task NotifyPostCommentedAsync(Guid postId, Guid commenterId, Guid postAuthorId);
    Task NotifyPollVoteAsync(Guid postId, Guid voterId, string selectedOption);
    Task NotifyUserFollowedAsync(Guid followerId, Guid followedUserId);

    // Feed Updates
    Task NotifyFeedUpdateAsync(List<Guid> userIds, FeedUpdateType updateType, object data);
    Task NotifyTrendingPostsUpdateAsync();

    // System Events
    Task NotifySystemMaintenanceAsync(string message);
    Task NotifyUserCacheRefreshAsync(Guid userId);
}

// Enums and DTOs for real-time events
public enum FeedUpdateType
{
    NewPost,
    PostLiked,
    PostCommented,
    PostShared,
    PollVoted,
    UserFollowed,
    TrendingUpdate
}

public class RealtimeEvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString();
    public string EventType { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public object Data { get; set; } = new();
    public Guid? UserId { get; set; }
    public List<string> TargetUsers { get; set; } = new();
}

public class PostEvent : RealtimeEvent
{
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public CachedUserProfile? AuthorProfile { get; set; }
}

public class EngagementEvent : RealtimeEvent
{
    public Guid PostId { get; set; }
    public new Guid UserId { get; set; }
    public string ActionType { get; set; } = string.Empty; // "like", "comment", "share"
    public CachedUserProfile? UserProfile { get; set; }
    public int NewCount { get; set; }
}

public class PollVoteEvent : RealtimeEvent
{
    public Guid PostId { get; set; }
    public Guid VoterId { get; set; }
    public string SelectedOption { get; set; } = string.Empty;
    public int OptionIndex { get; set; }
    public int NewVoteCount { get; set; }
    public double NewPercentage { get; set; }
    public CachedUserProfile? VoterProfile { get; set; }
}

public class FollowEvent : RealtimeEvent
{
    public Guid FollowerId { get; set; }
    public Guid FollowedId { get; set; }
    public CachedUserProfile? FollowerProfile { get; set; }
    public CachedUserProfile? FollowedProfile { get; set; }
}

public class SystemEvent : RealtimeEvent
{
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "info"; // "info", "warning", "error"
    public DateTime? ScheduledTime { get; set; }
}
