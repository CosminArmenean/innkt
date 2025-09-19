using innkt.Social.Models.MongoDB;
using innkt.Social.DTOs;

namespace innkt.Social.Services;

/// <summary>
/// Service interface for repost operations with MongoDB optimization
/// Handles both simple and quote reposts with advanced features
/// </summary>
public interface IRepostService
{
    // Core CRUD operations
    Task<MongoRepost> CreateRepostAsync(CreateRepostRequest request, Guid userId);
    Task<MongoRepost?> GetRepostByIdAsync(Guid repostId);
    Task<bool> DeleteRepostAsync(Guid repostId, Guid userId);
    Task<bool> UpdateQuoteTextAsync(Guid repostId, Guid userId, string newQuoteText);

    // User repost queries
    Task<List<MongoRepost>> GetUserRepostsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<List<MongoRepost>> GetUserSimpleRepostsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<List<MongoRepost>> GetUserQuoteRepostsAsync(Guid userId, int page = 1, int pageSize = 20);

    // Post repost queries
    Task<List<MongoRepost>> GetPostRepostsAsync(Guid originalPostId, int page = 1, int pageSize = 20);
    Task<int> GetPostRepostCountAsync(Guid originalPostId);
    Task<bool> HasUserRepostedAsync(Guid userId, Guid originalPostId);

    // Feed integration
    Task<List<MongoRepost>> GetRepostsForFeedAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<List<MongoRepost>> GetPublicRepostsForFeedAsync(int page = 1, int pageSize = 20);

    // Engagement operations
    Task<bool> LikeRepostAsync(Guid repostId, Guid userId);
    Task<bool> UnlikeRepostAsync(Guid repostId, Guid userId);
    Task<bool> IncrementRepostViewsAsync(Guid repostId);
    Task<bool> UpdateRepostEngagementMetricsAsync(Guid repostId);

    // Analytics and insights
    Task<RepostAnalytics> GetRepostAnalyticsAsync(Guid repostId);
    Task<RepostAnalytics> GetOriginalPostRepostAnalyticsAsync(Guid originalPostId);
    Task<List<RepostTrend>> GetTrendingRepostsAsync(int hours = 24, int limit = 10);
    Task<List<MongoRepost>> GetRepostsByUserNetworkAsync(Guid userId, int page = 1, int pageSize = 20);

    // Cache management
    Task<bool> RefreshUserCacheAsync(Guid userId);
    Task<bool> RefreshOriginalPostCacheAsync(Guid originalPostId);
    Task<int> RefreshStaleUserCachesAsync();
    Task<int> RefreshStaleOriginalPostCachesAsync();

    // Moderation and controls
    Task<bool> ApproveRepostAsync(Guid repostId, Guid originalAuthorId);
    Task<bool> RejectRepostAsync(Guid repostId, Guid originalAuthorId);
    Task<bool> FlagRepostAsync(Guid repostId, string flag, Guid reporterId);
    Task<List<MongoRepost>> GetPendingRepostsForApprovalAsync(Guid authorId);

    // Spam prevention
    Task<bool> CanUserRepostAsync(Guid userId, Guid originalPostId);
    Task<int> GetUserRepostCountInLastHourAsync(Guid userId);
    Task<bool> IsRepostSpamAsync(Guid userId, string content);

    // Search and discovery
    Task<List<MongoRepost>> SearchRepostsAsync(string query, int page = 1, int pageSize = 20);
    Task<List<MongoRepost>> GetRepostsByHashtagAsync(string hashtag, int page = 1, int pageSize = 20);
}
