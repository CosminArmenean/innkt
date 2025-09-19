using MongoDB.Driver;
using MongoDB.Bson;
using innkt.Social.Models.MongoDB;
using innkt.Social.Data;
using innkt.Social.DTOs;

namespace innkt.Social.Services;

/// <summary>
/// MongoDB-based repost service implementation with advanced features
/// Handles simple and quote reposts with performance optimization
/// </summary>
public class RepostService : IRepostService
{
    private readonly MongoDbContext _mongoContext;
    private readonly IOfficerService _officerService;
    private readonly IUserProfileCacheService _userProfileCache;
    private readonly INotificationService _notificationService;
    private readonly ILogger<RepostService> _logger;

    // Rate limiting constants
    private const int MAX_REPOSTS_PER_HOUR = 50;
    private const int MAX_REPOST_CHAIN_LENGTH = 5;
    private const double SPAM_THRESHOLD = 0.7;

    public RepostService(
        MongoDbContext mongoContext,
        IOfficerService officerService,
        IUserProfileCacheService userProfileCache,
        INotificationService notificationService,
        ILogger<RepostService> logger)
    {
        _mongoContext = mongoContext;
        _officerService = officerService;
        _userProfileCache = userProfileCache;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<MongoRepost> CreateRepostAsync(CreateRepostRequest request, Guid userId)
    {
        try
        {
            _logger.LogInformation("Creating repost for user {UserId} on post {OriginalPostId}", userId, request.OriginalPostId);

            // Validate user can repost
            if (!await CanUserRepostAsync(userId, request.OriginalPostId))
            {
                throw new InvalidOperationException("User cannot repost this content due to rate limits or restrictions");
            }

            // Check if user already reposted this post
            if (await HasUserRepostedAsync(userId, request.OriginalPostId))
            {
                throw new InvalidOperationException("User has already reposted this post");
            }

            // Get original post
            var originalPost = await GetOriginalPostAsync(request.OriginalPostId);
            if (originalPost == null)
            {
                throw new ArgumentException("Original post not found or has been deleted");
            }

            // Get user snapshot
            var userSnapshot = await GetOrCreateUserSnapshotAsync(userId);

            // Create original post snapshot
            var originalPostSnapshot = await CreateOriginalPostSnapshotAsync(originalPost);

            // Detect repost chain length
            var chainLength = await CalculateRepostChainLengthAsync(request.OriginalPostId);

            // Create repost
            var repost = new MongoRepost
            {
                UserId = userId,
                OriginalPostId = request.OriginalPostId,
                OriginalAuthorId = originalPost.UserId,
                RepostType = request.RepostType,
                QuoteText = request.QuoteText,
                Visibility = request.Visibility,
                UserSnapshot = userSnapshot,
                OriginalPostSnapshot = originalPostSnapshot,
                RepostChainLength = chainLength + 1,
                Tags = request.Tags ?? new List<string>(),
                IsApproved = await ShouldAutoApproveRepostAsync(userId, originalPost.UserId)
            };

            // Calculate feed score
            repost.CalculateFeedScore();

            // Insert repost
            await _mongoContext.Reposts.InsertOneAsync(repost);

            // Update original post repost count
            await IncrementOriginalPostRepostCountAsync(request.OriginalPostId);

            // Send notification to original author
            await _notificationService.SendRepostNotificationAsync(
                originalPost.UserId, 
                userId, 
                request.OriginalPostId, 
                repost.RepostId, 
                request.RepostType, 
                request.QuoteText);

            _logger.LogInformation("Created repost {RepostId} for user {UserId} and sent notification", repost.RepostId, userId);
            return repost;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating repost for user {UserId} on post {OriginalPostId}", userId, request.OriginalPostId);
            throw;
        }
    }

    public async Task<MongoRepost?> GetRepostByIdAsync(Guid repostId)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.And(
                Builders<MongoRepost>.Filter.Eq(r => r.RepostId, repostId),
                Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false)
            );

            return await _mongoContext.Reposts.Find(filter).FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting repost {RepostId}", repostId);
            return null;
        }
    }

    public async Task<bool> DeleteRepostAsync(Guid repostId, Guid userId)
    {
        try
        {
            var repost = await GetRepostByIdAsync(repostId);
            if (repost == null || repost.UserId != userId)
            {
                return false;
            }

            // Soft delete the repost
            var filter = Builders<MongoRepost>.Filter.Eq(r => r.RepostId, repostId);
            var update = Builders<MongoRepost>.Update
                .Set(r => r.IsDeleted, true)
                .Set(r => r.IsActive, false)
                .Set(r => r.DeletedAt, DateTime.UtcNow)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Reposts.UpdateOneAsync(filter, update);

            if (result.ModifiedCount > 0)
            {
                // Decrement original post repost count
                await DecrementOriginalPostRepostCountAsync(repost.OriginalPostId);
                _logger.LogInformation("Deleted repost {RepostId} by user {UserId}", repostId, userId);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting repost {RepostId} by user {UserId}", repostId, userId);
            return false;
        }
    }

    public async Task<List<MongoRepost>> GetUserRepostsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.And(
                Builders<MongoRepost>.Filter.Eq(r => r.UserId, userId),
                Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false),
                Builders<MongoRepost>.Filter.Eq(r => r.IsActive, true)
            );

            var sort = Builders<MongoRepost>.Sort.Descending(r => r.CreatedAt);
            var skip = (page - 1) * pageSize;

            return await _mongoContext.Reposts
                .Find(filter)
                .Sort(sort)
                .Skip(skip)
                .Limit(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reposts for user {UserId}", userId);
            return new List<MongoRepost>();
        }
    }

    public async Task<List<MongoRepost>> GetRepostsForFeedAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        try
        {
            // Get reposts from users that the current user follows
            // For now, get public reposts - later integrate with follow system
            var filter = Builders<MongoRepost>.Filter.And(
                Builders<MongoRepost>.Filter.Eq(r => r.Visibility, "public"),
                Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false),
                Builders<MongoRepost>.Filter.Eq(r => r.IsActive, true),
                Builders<MongoRepost>.Filter.Eq(r => r.IsApproved, true)
            );

            var sort = Builders<MongoRepost>.Sort
                .Descending(r => r.FeedScore)
                .Descending(r => r.CreatedAt);
            
            var skip = (page - 1) * pageSize;

            return await _mongoContext.Reposts
                .Find(filter)
                .Sort(sort)
                .Skip(skip)
                .Limit(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reposts for feed for user {UserId}", userId);
            return new List<MongoRepost>();
        }
    }

    public async Task<bool> HasUserRepostedAsync(Guid userId, Guid originalPostId)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.And(
                Builders<MongoRepost>.Filter.Eq(r => r.UserId, userId),
                Builders<MongoRepost>.Filter.Eq(r => r.OriginalPostId, originalPostId),
                Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false)
            );

            var count = await _mongoContext.Reposts.CountDocumentsAsync(filter);
            return count > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if user {UserId} reposted post {PostId}", userId, originalPostId);
            return false;
        }
    }

    public async Task<bool> CanUserRepostAsync(Guid userId, Guid originalPostId)
    {
        try
        {
            // Check rate limiting
            var repostCountLastHour = await GetUserRepostCountInLastHourAsync(userId);
            if (repostCountLastHour >= MAX_REPOSTS_PER_HOUR)
            {
                _logger.LogWarning("User {UserId} exceeded repost rate limit: {Count}/{Max}", userId, repostCountLastHour, MAX_REPOSTS_PER_HOUR);
                return false;
            }

            // Check if already reposted
            if (await HasUserRepostedAsync(userId, originalPostId))
            {
                return false;
            }

            // Check repost chain length
            var chainLength = await CalculateRepostChainLengthAsync(originalPostId);
            if (chainLength >= MAX_REPOST_CHAIN_LENGTH)
            {
                _logger.LogWarning("Repost chain too long for post {PostId}: {Length}/{Max}", originalPostId, chainLength, MAX_REPOST_CHAIN_LENGTH);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if user {UserId} can repost post {PostId}", userId, originalPostId);
            return false;
        }
    }

    public async Task<int> GetUserRepostCountInLastHourAsync(Guid userId)
    {
        try
        {
            var oneHourAgo = DateTime.UtcNow.AddHours(-1);
            var filter = Builders<MongoRepost>.Filter.And(
                Builders<MongoRepost>.Filter.Eq(r => r.UserId, userId),
                Builders<MongoRepost>.Filter.Gte(r => r.CreatedAt, oneHourAgo),
                Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false)
            );

            return (int)await _mongoContext.Reposts.CountDocumentsAsync(filter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting repost count for user {UserId}", userId);
            return 0;
        }
    }

    // Helper methods

    private async Task<MongoPost?> GetOriginalPostAsync(Guid postId)
    {
        var filter = Builders<MongoPost>.Filter.And(
            Builders<MongoPost>.Filter.Eq(p => p.PostId, postId),
            Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
        );

        return await _mongoContext.Posts.Find(filter).FirstOrDefaultAsync();
    }

    private async Task<UserSnapshot?> GetOrCreateUserSnapshotAsync(Guid userId)
    {
        try
        {
            var cachedProfile = await _userProfileCache.GetUserProfileAsync(userId);
            if (cachedProfile != null)
            {
                return new UserSnapshot
                {
                    UserId = userId.ToString(),
                    DisplayName = cachedProfile.DisplayName,
                    Username = cachedProfile.Username,
                    AvatarUrl = cachedProfile.AvatarUrl,
                    IsVerified = cachedProfile.IsVerified,
                    IsActive = true,
                    CacheExpiry = DateTime.UtcNow.AddHours(24)
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user snapshot for {UserId}", userId);
            return null;
        }
    }

    private async Task<OriginalPostSnapshot> CreateOriginalPostSnapshotAsync(MongoPost originalPost)
    {
        return new OriginalPostSnapshot
        {
            PostId = originalPost.PostId,
            Content = originalPost.Content,
            PostType = originalPost.PostType,
            MediaUrls = originalPost.MediaUrls,
            AuthorId = originalPost.UserId,
            AuthorSnapshot = originalPost.UserSnapshot,
            LikesCount = originalPost.LikesCount,
            CommentsCount = originalPost.CommentsCount,
            SharesCount = originalPost.SharesCount,
            RepostsCount = originalPost.RepostsCount,
            ViewsCount = originalPost.ViewsCount,
            CreatedAt = originalPost.CreatedAt,
            FeedScore = originalPost.FeedScore,
            IsDeleted = originalPost.IsDeleted
        };
    }

    private async Task<int> CalculateRepostChainLengthAsync(Guid originalPostId)
    {
        try
        {
            // Check if the original post is itself a repost
            var originalAsRepost = await _mongoContext.Reposts
                .Find(r => r.RepostId == originalPostId)
                .FirstOrDefaultAsync();

            if (originalAsRepost != null)
            {
                return originalAsRepost.RepostChainLength;
            }

            return 0; // Original post, not a repost
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating repost chain length for post {PostId}", originalPostId);
            return 0;
        }
    }

    private async Task<bool> ShouldAutoApproveRepostAsync(Guid reposterId, Guid originalAuthorId)
    {
        // Auto-approve if:
        // 1. Reposter is the original author (self-repost)
        // 2. Original author has public repost settings (future feature)
        // For now, auto-approve all reposts
        return true;
    }

    private async Task IncrementOriginalPostRepostCountAsync(Guid originalPostId)
    {
        try
        {
            var filter = Builders<MongoPost>.Filter.Eq(p => p.PostId, originalPostId);
            var update = Builders<MongoPost>.Update
                .Inc(p => p.RepostsCount, 1)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            await _mongoContext.Posts.UpdateOneAsync(filter, update);
            _logger.LogDebug("Incremented repost count for post {PostId}", originalPostId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing repost count for post {PostId}", originalPostId);
        }
    }

    private async Task DecrementOriginalPostRepostCountAsync(Guid originalPostId)
    {
        try
        {
            var filter = Builders<MongoPost>.Filter.Eq(p => p.PostId, originalPostId);
            var update = Builders<MongoPost>.Update
                .Inc(p => p.RepostsCount, -1)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            await _mongoContext.Posts.UpdateOneAsync(filter, update);
            _logger.LogDebug("Decremented repost count for post {PostId}", originalPostId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decrementing repost count for post {PostId}", originalPostId);
        }
    }

    // Interface implementation stubs for remaining methods
    public async Task<bool> UpdateQuoteTextAsync(Guid repostId, Guid userId, string newQuoteText)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.And(
                Builders<MongoRepost>.Filter.Eq(r => r.RepostId, repostId),
                Builders<MongoRepost>.Filter.Eq(r => r.UserId, userId),
                Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false)
            );

            var update = Builders<MongoRepost>.Update
                .Set(r => r.QuoteText, newQuoteText)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Reposts.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quote text for repost {RepostId}", repostId);
            return false;
        }
    }

    public async Task<List<MongoRepost>> GetUserSimpleRepostsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var filter = Builders<MongoRepost>.Filter.And(
            Builders<MongoRepost>.Filter.Eq(r => r.UserId, userId),
            Builders<MongoRepost>.Filter.Eq(r => r.RepostType, "simple"),
            Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false)
        );

        return await GetRepostsByFilterAsync(filter, page, pageSize);
    }

    public async Task<List<MongoRepost>> GetUserQuoteRepostsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var filter = Builders<MongoRepost>.Filter.And(
            Builders<MongoRepost>.Filter.Eq(r => r.UserId, userId),
            Builders<MongoRepost>.Filter.Eq(r => r.RepostType, "quote"),
            Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false)
        );

        return await GetRepostsByFilterAsync(filter, page, pageSize);
    }

    public async Task<List<MongoRepost>> GetPostRepostsAsync(Guid originalPostId, int page = 1, int pageSize = 20)
    {
        var filter = Builders<MongoRepost>.Filter.And(
            Builders<MongoRepost>.Filter.Eq(r => r.OriginalPostId, originalPostId),
            Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false),
            Builders<MongoRepost>.Filter.Eq(r => r.IsActive, true)
        );

        return await GetRepostsByFilterAsync(filter, page, pageSize);
    }

    public async Task<int> GetPostRepostCountAsync(Guid originalPostId)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.And(
                Builders<MongoRepost>.Filter.Eq(r => r.OriginalPostId, originalPostId),
                Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false)
            );

            return (int)await _mongoContext.Reposts.CountDocumentsAsync(filter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting repost count for post {PostId}", originalPostId);
            return 0;
        }
    }

    public async Task<List<MongoRepost>> GetPublicRepostsForFeedAsync(int page = 1, int pageSize = 20)
    {
        var filter = Builders<MongoRepost>.Filter.And(
            Builders<MongoRepost>.Filter.Eq(r => r.Visibility, "public"),
            Builders<MongoRepost>.Filter.Eq(r => r.IsDeleted, false),
            Builders<MongoRepost>.Filter.Eq(r => r.IsActive, true),
            Builders<MongoRepost>.Filter.Eq(r => r.IsApproved, true)
        );

        return await GetRepostsByFilterAsync(filter, page, pageSize);
    }

    public async Task<bool> LikeRepostAsync(Guid repostId, Guid userId)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.Eq(r => r.RepostId, repostId);
            var update = Builders<MongoRepost>.Update
                .AddToSet(r => r.LikedBy, userId.ToString())
                .Inc(r => r.LikesCount, 1)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Reposts.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking repost {RepostId} by user {UserId}", repostId, userId);
            return false;
        }
    }

    public async Task<bool> UnlikeRepostAsync(Guid repostId, Guid userId)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.Eq(r => r.RepostId, repostId);
            var update = Builders<MongoRepost>.Update
                .Pull(r => r.LikedBy, userId.ToString())
                .Inc(r => r.LikesCount, -1)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Reposts.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking repost {RepostId} by user {UserId}", repostId, userId);
            return false;
        }
    }

    public async Task<bool> IncrementRepostViewsAsync(Guid repostId)
    {
        try
        {
            var filter = Builders<MongoRepost>.Filter.Eq(r => r.RepostId, repostId);
            var update = Builders<MongoRepost>.Update
                .Inc(r => r.ViewsCount, 1)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Reposts.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing views for repost {RepostId}", repostId);
            return false;
        }
    }

    // Helper method for common query pattern
    private async Task<List<MongoRepost>> GetRepostsByFilterAsync(FilterDefinition<MongoRepost> filter, int page, int pageSize)
    {
        try
        {
            var sort = Builders<MongoRepost>.Sort.Descending(r => r.CreatedAt);
            var skip = (page - 1) * pageSize;

            return await _mongoContext.Reposts
                .Find(filter)
                .Sort(sort)
                .Skip(skip)
                .Limit(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing repost query");
            return new List<MongoRepost>();
        }
    }

    // Placeholder implementations for remaining interface methods
    public Task<bool> UpdateRepostEngagementMetricsAsync(Guid repostId) => Task.FromResult(true);
    public Task<RepostAnalytics> GetRepostAnalyticsAsync(Guid repostId) => Task.FromResult(new RepostAnalytics());
    public Task<RepostAnalytics> GetOriginalPostRepostAnalyticsAsync(Guid originalPostId) => Task.FromResult(new RepostAnalytics());
    public Task<List<RepostTrend>> GetTrendingRepostsAsync(int hours = 24, int limit = 10) => Task.FromResult(new List<RepostTrend>());
    public Task<List<MongoRepost>> GetRepostsByUserNetworkAsync(Guid userId, int page = 1, int pageSize = 20) => Task.FromResult(new List<MongoRepost>());
    public Task<bool> RefreshUserCacheAsync(Guid userId) => Task.FromResult(true);
    public Task<bool> RefreshOriginalPostCacheAsync(Guid originalPostId) => Task.FromResult(true);
    public Task<int> RefreshStaleUserCachesAsync() => Task.FromResult(0);
    public Task<int> RefreshStaleOriginalPostCachesAsync() => Task.FromResult(0);
    public Task<bool> ApproveRepostAsync(Guid repostId, Guid originalAuthorId) => Task.FromResult(true);
    public Task<bool> RejectRepostAsync(Guid repostId, Guid originalAuthorId) => Task.FromResult(true);
    public Task<bool> FlagRepostAsync(Guid repostId, string flag, Guid reporterId) => Task.FromResult(true);
    public Task<List<MongoRepost>> GetPendingRepostsForApprovalAsync(Guid authorId) => Task.FromResult(new List<MongoRepost>());
    public Task<bool> IsRepostSpamAsync(Guid userId, string content) => Task.FromResult(false);
    public Task<List<MongoRepost>> SearchRepostsAsync(string query, int page = 1, int pageSize = 20) => Task.FromResult(new List<MongoRepost>());
    public Task<List<MongoRepost>> GetRepostsByHashtagAsync(string hashtag, int page = 1, int pageSize = 20) => Task.FromResult(new List<MongoRepost>());
}
