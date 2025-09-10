using innkt.Follow.DTOs;

namespace innkt.Follow.Services;

public interface IFollowService
{
    // Basic follow operations
    Task<bool> FollowUserAsync(Guid followerId, Guid followingId, string? message = null);
    Task<bool> UnfollowUserAsync(Guid followerId, Guid followingId);
    Task<bool> IsFollowingAsync(Guid followerId, Guid followingId);
    Task<bool> IsFollowedByAsync(Guid userId, Guid followerId);
    
    // Follow requests (for private accounts)
    Task<FollowRequestResponse> SendFollowRequestAsync(Guid requesterId, Guid targetUserId, string? message = null);
    Task<FollowRequestResponse?> GetFollowRequestAsync(Guid requestId);
    Task<FollowRequestListResponse> GetFollowRequestsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<FollowRequestListResponse> GetSentFollowRequestsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<bool> RespondToFollowRequestAsync(Guid requestId, Guid userId, string action);
    Task<bool> CancelFollowRequestAsync(Guid requestId, Guid userId);
    
    // Get followers/following
    Task<FollowListResponse> GetFollowersAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<FollowListResponse> GetFollowingAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<FollowListResponse> GetMutualFollowsAsync(Guid userId1, Guid userId2, int page = 1, int pageSize = 20);
    
    // User stats
    Task<FollowStatsResponse> GetFollowStatsAsync(Guid userId);
    Task<int> GetFollowersCountAsync(Guid userId);
    Task<int> GetFollowingCountAsync(Guid userId);
    Task<int> GetMutualFollowsCountAsync(Guid userId1, Guid userId2);
    
    // Follow management
    Task<bool> MuteUserAsync(Guid userId, Guid targetUserId, bool mute = true);
    Task<bool> BlockUserAsync(Guid userId, Guid targetUserId, bool block = true);
    Task<bool> UpdateFollowNotesAsync(Guid userId, Guid targetUserId, string? notes);
    Task<bool> IsUserMutedAsync(Guid userId, Guid targetUserId);
    Task<bool> IsUserBlockedAsync(Guid userId, Guid targetUserId);
    
    // Follow suggestions
    Task<FollowSuggestionListResponse> GetFollowSuggestionsAsync(Guid userId, GetFollowSuggestionsRequest request);
    Task<bool> DismissSuggestionAsync(Guid suggestionId, Guid userId);
    Task<bool> GenerateFollowSuggestionsAsync(Guid userId);
    
    // Notifications
    Task<FollowNotificationListResponse> GetFollowNotificationsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<bool> MarkNotificationAsReadAsync(Guid notificationId, Guid userId);
    Task<bool> MarkAllNotificationsAsReadAsync(Guid userId);
    Task<int> GetUnreadNotificationCountAsync(Guid userId);
    
    // Timeline
    Task<FollowTimelineResponse> GetFollowTimelineAsync(Guid userId, GetFollowTimelineRequest request);
    
    // Bulk operations
    Task<Dictionary<Guid, bool>> GetFollowingStatusAsync(Guid userId, Guid[] targetUserIds);
    Task<Dictionary<Guid, int>> GetFollowersCountsAsync(Guid[] userIds);
    Task<Dictionary<Guid, int>> GetFollowingCountsAsync(Guid[] userIds);
    
    // Search and discovery
    Task<FollowListResponse> SearchFollowersAsync(Guid userId, string query, int page = 1, int pageSize = 20);
    Task<FollowListResponse> SearchFollowingAsync(Guid userId, string query, int page = 1, int pageSize = 20);
    
    // Analytics
    Task<Dictionary<string, object>> GetFollowAnalyticsAsync(Guid userId, DateTime? since = null, DateTime? until = null);
    Task<List<FollowTimelineItem>> GetRecentFollowActivityAsync(Guid userId, int count = 10);
    
    // Cleanup and maintenance
    Task<bool> CleanupExpiredRequestsAsync();
    Task<bool> UpdateFollowStatsAsync(Guid userId);
    Task<bool> RebuildFollowStatsAsync();
}
