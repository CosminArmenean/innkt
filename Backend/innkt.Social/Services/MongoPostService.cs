using MongoDB.Driver;
using MongoDB.Bson;
using innkt.Social.Models.MongoDB;
using innkt.Social.Data;
using innkt.Social.DTOs;
using Microsoft.EntityFrameworkCore;

namespace innkt.Social.Services;

/// <summary>
/// MongoDB-based post service implementation with user caching optimization
/// </summary>
public class MongoPostService : IMongoPostService
{
    private readonly MongoDbContext _mongoContext;
    private readonly SocialDbContext _sqlContext;
    private readonly IOfficerService _officerService;
    private readonly ILogger<MongoPostService> _logger;

    public MongoPostService(
        MongoDbContext mongoContext, 
        SocialDbContext sqlContext,
        IOfficerService officerService,
        ILogger<MongoPostService> logger)
    {
        _mongoContext = mongoContext;
        _sqlContext = sqlContext;
        _officerService = officerService;
        _logger = logger;
    }

    public async Task<MongoPost> CreatePostAsync(CreatePostRequest request, Guid userId)
    {
        try
        {
            _logger.LogInformation("Creating post for user {UserId}", userId);

            // Get or create user snapshot
            var userSnapshot = await GetOrCreateUserSnapshotAsync(userId);

            var mongoPost = new MongoPost
            {
                UserId = userId,
                Content = request.Content,
                PostType = request.PostType,
                MediaUrls = request.MediaUrls?.ToList() ?? new List<string>(),
                Hashtags = request.Hashtags?.ToList() ?? new List<string>(),
                Mentions = request.Mentions?.ToList() ?? new List<string>(),
                Location = request.Location,
                IsPublic = request.IsPublic,
                PollOptions = request.PollOptions?.ToList(),
                PollDuration = request.PollDuration,
                PollExpiresAt = request.PollDuration.HasValue 
                    ? DateTime.UtcNow.AddHours(request.PollDuration.Value) 
                    : null,
                UserSnapshot = userSnapshot,
                Tags = ExtractTags(request.Content, request.Hashtags?.ToList())
            };

            mongoPost.CalculateFeedScore();

            await _mongoContext.Posts.InsertOneAsync(mongoPost);

            _logger.LogInformation("Created post {PostId} for user {UserId}", mongoPost.PostId, userId);
            return mongoPost;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post for user {UserId}", userId);
            throw;
        }
    }

    public async Task<MongoPost?> GetPostByIdAsync(Guid postId)
    {
        try
        {
            var filter = Builders<MongoPost>.Filter.And(
                Builders<MongoPost>.Filter.Eq(p => p.PostId, postId),
                Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
            );

            var post = await _mongoContext.Posts.Find(filter).FirstOrDefaultAsync();
            
            if (post != null && post.NeedsUserRefresh)
            {
                await RefreshUserCacheAsync(post.UserId);
                post = await _mongoContext.Posts.Find(filter).FirstOrDefaultAsync();
            }

            return post;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting post {PostId}", postId);
            return null;
        }
    }

    public async Task<List<MongoPost>> GetFeedAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        try
        {
            _logger.LogInformation("Getting feed for user {UserId}, page {Page}", userId, page);

            // Get user's following list (from PostgreSQL for now)
            var followingIds = await _sqlContext.Follows
                .Where(f => f.FollowerId == userId)
                .Select(f => f.FollowingId)
                .ToListAsync();

            // Include user's own posts
            followingIds.Add(userId);

            var filter = Builders<MongoPost>.Filter.And(
                Builders<MongoPost>.Filter.In(p => p.UserId, followingIds),
                Builders<MongoPost>.Filter.Eq(p => p.IsPublic, true),
                Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
            );

            var posts = await _mongoContext.Posts
                .Find(filter)
                .SortByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            // Refresh stale user caches
            await RefreshStaleUserCachesForPosts(posts);

            _logger.LogInformation("Retrieved {Count} posts for user {UserId} feed", posts.Count, userId);
            return posts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feed for user {UserId}", userId);
            return new List<MongoPost>();
        }
    }

    public async Task<List<MongoPost>> GetPublicFeedAsync(int page = 1, int pageSize = 20)
    {
        try
        {
            var filter = Builders<MongoPost>.Filter.And(
                Builders<MongoPost>.Filter.Eq(p => p.IsPublic, true),
                Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
            );

            var posts = await _mongoContext.Posts
                .Find(filter)
                .SortByDescending(p => p.FeedScore)
                .ThenByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            await RefreshStaleUserCachesForPosts(posts);

            return posts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public feed");
            return new List<MongoPost>();
        }
    }

    public async Task<List<MongoPost>> GetUserPostsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        try
        {
            var filter = Builders<MongoPost>.Filter.And(
                Builders<MongoPost>.Filter.Eq(p => p.UserId, userId),
                Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
            );

            var posts = await _mongoContext.Posts
                .Find(filter)
                .SortByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            await RefreshStaleUserCachesForPosts(posts);

            return posts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for user {UserId}", userId);
            return new List<MongoPost>();
        }
    }

    public async Task<bool> LikePostAsync(Guid postId, Guid userId)
    {
        try
        {
            var filter = Builders<MongoPost>.Filter.Eq(p => p.PostId, postId);
            var update = Builders<MongoPost>.Update
                .AddToSet(p => p.LikedBy, userId.ToString())
                .Inc(p => p.LikesCount, 1)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Posts.UpdateOneAsync(filter, update);
            
            if (result.ModifiedCount > 0)
            {
                // Recalculate feed score
                await RecalculateFeedScoreAsync(postId);
            }

            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking post {PostId} by user {UserId}", postId, userId);
            return false;
        }
    }

    public async Task<bool> UnlikePostAsync(Guid postId, Guid userId)
    {
        try
        {
            var filter = Builders<MongoPost>.Filter.Eq(p => p.PostId, postId);
            var update = Builders<MongoPost>.Update
                .Pull(p => p.LikedBy, userId.ToString())
                .Inc(p => p.LikesCount, -1)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Posts.UpdateOneAsync(filter, update);
            
            if (result.ModifiedCount > 0)
            {
                await RecalculateFeedScoreAsync(postId);
            }

            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking post {PostId} by user {UserId}", postId, userId);
            return false;
        }
    }

    public async Task<bool> AddCommentAsync(Guid postId, Guid userId, string content)
    {
        try
        {
            _logger.LogInformation("User {UserId} adding comment to post {PostId}", userId, postId);

            var filter = Builders<MongoPost>.Filter.Eq(p => p.PostId, postId);
            var update = Builders<MongoPost>.Update
                .Inc(p => p.CommentsCount, 1)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            var result = await _mongoContext.Posts.UpdateOneAsync(filter, update);
            
            if (result.ModifiedCount > 0)
            {
                await RecalculateFeedScoreAsync(postId);
                _logger.LogInformation("Comment added to post {PostId}, comments count incremented", postId);
            }

            return result.ModifiedCount > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment to post {PostId} by user {UserId}", postId, userId);
            return false;
        }
    }

    public async Task<bool> VoteOnPollAsync(Guid postId, Guid userId, string selectedOption, int optionIndex)
    {
        try
        {
            // Check if user has already voted
            var existingVote = await _mongoContext.PollVotes
                .Find(v => v.PostId == postId && v.UserId == userId && !v.IsDeleted)
                .FirstOrDefaultAsync();

            if (existingVote != null)
            {
                _logger.LogWarning("User {UserId} already voted on poll {PostId}", userId, postId);
                return false;
            }

            // Get user snapshot for vote record
            var userSnapshot = await GetOrCreateUserSnapshotAsync(userId);

            var vote = new MongoPollVote
            {
                PostId = postId,
                UserId = userId,
                SelectedOption = selectedOption,
                OptionIndex = optionIndex,
                UserSnapshot = userSnapshot
            };

            await _mongoContext.PollVotes.InsertOneAsync(vote);

            _logger.LogInformation("User {UserId} voted on poll {PostId}", userId, postId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voting on poll {PostId} by user {UserId}", postId, userId);
            return false;
        }
    }

    public async Task<PollResultsResponse> GetPollResultsAsync(Guid postId, Guid? userId = null)
    {
        try
        {
            var post = await GetPostByIdAsync(postId);
            if (post?.PollOptions == null)
            {
                return new PollResultsResponse();
            }

            var votes = await _mongoContext.PollVotes
                .Find(v => v.PostId == postId && !v.IsDeleted)
                .ToListAsync();

            var totalVotes = votes.Count;
            var results = new List<PollOptionResult>();

            for (int i = 0; i < post.PollOptions.Count; i++)
            {
                var option = post.PollOptions[i];
                var voteCount = votes.Count(v => v.OptionIndex == i);
                var percentage = totalVotes > 0 ? (double)voteCount / totalVotes * 100 : 0;

                results.Add(new PollOptionResult
                {
                    Option = option,
                    VoteCount = voteCount,
                    Percentage = Math.Round(percentage, 1)
                });
            }

            int? userVotedOptionIndex = null;
            if (userId.HasValue)
            {
                var userVote = votes.FirstOrDefault(v => v.UserId == userId.Value);
                userVotedOptionIndex = userVote?.OptionIndex;
            }

            return new PollResultsResponse
            {
                TotalVotes = totalVotes,
                Results = results,
                IsExpired = post.IsPollExpired,
                UserVotedOptionIndex = userVotedOptionIndex,
                ExpiresAt = post.PollExpiresAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting poll results for post {PostId}", postId);
            return new PollResultsResponse();
        }
    }

    public async Task<bool> RefreshUserCacheAsync(Guid userId)
    {
        try
        {
            var userInfo = await _officerService.GetUserByIdAsync(userId);
            if (userInfo == null)
            {
                return false;
            }

            var userSnapshot = new UserSnapshot
            {
                UserId = userId.ToString(),
                DisplayName = userInfo.DisplayName,
                Username = userInfo.Username,
                AvatarUrl = userInfo.AvatarUrl,
                IsVerified = userInfo.IsVerified,
                IsActive = true
            };
            
            userSnapshot.RefreshExpiry();

            var filter = Builders<MongoPost>.Filter.Eq(p => p.UserId, userId);
            var update = Builders<MongoPost>.Update.Set(p => p.UserSnapshot, userSnapshot);

            await _mongoContext.Posts.UpdateManyAsync(filter, update);

            _logger.LogInformation("Refreshed user cache for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing user cache for {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> RefreshUserCachesAsync(IEnumerable<Guid> userIds)
    {
        try
        {
            var userInfos = await _officerService.GetUsersByIdsAsync(userIds);

            var updateTasks = userInfos.Select(async kvp =>
            {
                var userId = kvp.Key;
                var userInfo = kvp.Value;

                var userSnapshot = new UserSnapshot
                {
                    UserId = userId.ToString(),
                    DisplayName = userInfo.DisplayName,
                    Username = userInfo.Username,
                    AvatarUrl = userInfo.AvatarUrl,
                    IsVerified = userInfo.IsVerified,
                    IsActive = true
                };
                
                userSnapshot.RefreshExpiry();

                var filter = Builders<MongoPost>.Filter.Eq(p => p.UserId, userId);
                var update = Builders<MongoPost>.Update.Set(p => p.UserSnapshot, userSnapshot);

                await _mongoContext.Posts.UpdateManyAsync(filter, update);
            });

            await Task.WhenAll(updateTasks);

            _logger.LogInformation("Refreshed user caches for {Count} users", userInfos.Count);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing user caches");
            return false;
        }
    }

    public async Task<int> RefreshStaleUserCachesAsync()
    {
        try
        {
            var staleFilter = Builders<MongoPost>.Filter.Lt("userSnapshot.cacheExpiry", DateTime.UtcNow);
            
            var stalePosts = await _mongoContext.Posts
                .Find(staleFilter)
                .Project(p => p.UserId)
                .ToListAsync();

            var uniqueUserIds = stalePosts.Distinct().ToList();

            if (uniqueUserIds.Any())
            {
                await RefreshUserCachesAsync(uniqueUserIds);
            }

            return uniqueUserIds.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing stale user caches");
            return 0;
        }
    }

    // Helper methods
    private async Task<UserSnapshot> GetOrCreateUserSnapshotAsync(Guid userId)
    {
        _logger.LogInformation("🔍 DEBUG: Fetching user profile for {UserId} from Officer service", userId);
        
        var userInfo = await _officerService.GetUserByIdAsync(userId);
        if (userInfo == null)
        {
            _logger.LogWarning("❌ DEBUG: Officer service returned null for user {UserId}", userId);
            return new UserSnapshot
            {
                UserId = userId.ToString(),
                DisplayName = "Unknown User",
                Username = "unknown",
                IsActive = false
            };
        }

        _logger.LogInformation("✅ DEBUG: Officer service returned user data - DisplayName: {DisplayName}, AvatarUrl: {AvatarUrl}", 
            userInfo.DisplayName, userInfo.AvatarUrl ?? "NULL");

        var snapshot = new UserSnapshot
        {
            UserId = userId.ToString(),
            DisplayName = userInfo.DisplayName,
            Username = userInfo.Username,
            AvatarUrl = userInfo.AvatarUrl,
            IsVerified = userInfo.IsVerified,
            IsActive = true
        };
        
        snapshot.RefreshExpiry();
        
        _logger.LogInformation("📊 DEBUG: Created UserSnapshot - DisplayName: {DisplayName}, AvatarUrl: {AvatarUrl}", 
            snapshot.DisplayName, snapshot.AvatarUrl ?? "NULL");
            
        return snapshot;
    }

    private async Task RefreshStaleUserCachesForPosts(List<MongoPost> posts)
    {
        var staleUserIds = posts
            .Where(p => p.NeedsUserRefresh)
            .Select(p => p.UserId)
            .Distinct()
            .ToList();

        if (staleUserIds.Any())
        {
            _logger.LogInformation("Refreshing {Count} stale user caches", staleUserIds.Count);
            await RefreshUserCachesAsync(staleUserIds);
        }
    }

    private async Task RecalculateFeedScoreAsync(Guid postId)
    {
        var filter = Builders<MongoPost>.Filter.Eq(p => p.PostId, postId);
        var post = await _mongoContext.Posts.Find(filter).FirstOrDefaultAsync();
        
        if (post != null)
        {
            post.CalculateFeedScore();
            var update = Builders<MongoPost>.Update.Set(p => p.FeedScore, post.FeedScore);
            await _mongoContext.Posts.UpdateOneAsync(filter, update);
        }
    }

    private List<string> ExtractTags(string content, List<string>? hashtags)
    {
        var tags = new List<string>();
        
        if (hashtags != null)
        {
            tags.AddRange(hashtags);
        }
        
        // Extract hashtags from content
        var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        foreach (var word in words)
        {
            if (word.StartsWith('#') && word.Length > 1)
            {
                tags.Add(word.Substring(1).ToLowerInvariant());
            }
        }
        
        return tags.Distinct().ToList();
    }

    // Placeholder implementations for remaining interface methods
    public Task<bool> UpdatePostAsync(Guid postId, UpdatePostRequest request) => throw new NotImplementedException();
    public Task<bool> DeletePostAsync(Guid postId, Guid userId) => throw new NotImplementedException();
    public Task<bool> IncrementViewsAsync(Guid postId) => throw new NotImplementedException();
    public Task<bool> UpdateEngagementMetricsAsync(Guid postId) => throw new NotImplementedException();
    public Task<List<MongoPost>> SearchPostsAsync(string query, int page = 1, int pageSize = 20) => throw new NotImplementedException();
    public async Task<List<Guid>> GetAllUniqueUserIdsAsync()
    {
        try
        {
            var userIds = await _mongoContext.Posts
                .Distinct<Guid>("userId", Builders<MongoPost>.Filter.Empty)
                .ToListAsync();
                
            _logger.LogInformation("Found {Count} unique user IDs in MongoDB posts", userIds.Count);
            return userIds;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unique user IDs from posts");
            return new List<Guid>();
        }
    }

    public Task<List<MongoPost>> GetPostsByHashtagAsync(string hashtag, int page = 1, int pageSize = 20) => throw new NotImplementedException();
    public Task<List<MongoPost>> GetTrendingPostsAsync(int page = 1, int pageSize = 20) => throw new NotImplementedException();
    public Task<PostAnalytics> GetPostAnalyticsAsync(Guid postId) => throw new NotImplementedException();
    public Task<UserAnalytics> GetUserAnalyticsAsync(Guid userId) => throw new NotImplementedException();
    public Task<MongoPost> MigratePostFromPostgreSQLAsync(Models.Post sqlPost) => throw new NotImplementedException();
    public Task<int> MigrateAllPostsAsync() => throw new NotImplementedException();
}
