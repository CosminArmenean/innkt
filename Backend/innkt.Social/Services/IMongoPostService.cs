using innkt.Social.Models.MongoDB;
using innkt.Social.DTOs;

namespace innkt.Social.Services;

/// <summary>
/// MongoDB-based post service for scalable social media operations
/// Handles posts with cached user data and real-time updates
/// </summary>
public interface IMongoPostService
{
    // Post CRUD operations
    Task<MongoPost> CreatePostAsync(CreatePostRequest request, Guid userId);
    Task<MongoPost?> GetPostByIdAsync(Guid postId);
    Task<List<MongoPost>> GetUserPostsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<List<MongoPost>> GetFeedAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<List<MongoPost>> GetPublicFeedAsync(int page = 1, int pageSize = 20);
    Task<bool> UpdatePostAsync(Guid postId, UpdatePostRequest request);
    Task<bool> DeletePostAsync(Guid postId, Guid userId);

    // Engagement operations
    Task<bool> LikePostAsync(Guid postId, Guid userId);
    Task<bool> UnlikePostAsync(Guid postId, Guid userId);
    Task<bool> AddCommentAsync(Guid postId, Guid userId, string content);
    Task<bool> IncrementViewsAsync(Guid postId);
    Task<bool> UpdateEngagementMetricsAsync(Guid postId);

    // Poll operations
    Task<bool> VoteOnPollAsync(Guid postId, Guid userId, string selectedOption, int optionIndex);
    Task<PollResultsResponse> GetPollResultsAsync(Guid postId, Guid? userId = null);

    // User cache management
    Task<bool> RefreshUserCacheAsync(Guid userId);
    Task<bool> RefreshUserCachesAsync(IEnumerable<Guid> userIds);
    Task<int> RefreshStaleUserCachesAsync();
    Task<List<Guid>> GetAllUniqueUserIdsAsync();

    // Search and filtering
    Task<List<MongoPost>> SearchPostsAsync(string query, int page = 1, int pageSize = 20);
    Task<List<MongoPost>> GetPostsByHashtagAsync(string hashtag, int page = 1, int pageSize = 20);
    Task<List<MongoPost>> GetTrendingPostsAsync(int page = 1, int pageSize = 20);

    // Analytics
    Task<PostAnalytics> GetPostAnalyticsAsync(Guid postId);
    Task<UserAnalytics> GetUserAnalyticsAsync(Guid userId);

    // Migration support
    Task<MongoPost> MigratePostFromPostgreSQLAsync(Models.Post sqlPost);
    Task<int> MigrateAllPostsAsync();
}
