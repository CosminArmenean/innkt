using MongoDB.Driver;
using innkt.Social.Data;
using innkt.Social.Models.MongoDB;
using innkt.Social.DTOs;

namespace innkt.Social.Services;

/// <summary>
/// Kid-safe feed service with comprehensive content filtering and educational prioritization
/// Ensures all content shown to kids meets safety standards and promotes learning
/// </summary>
public interface IKidSafeFeedService
{
    Task<List<FeedItem>> GetKidSafeFeedAsync(Guid kidAccountId, int page = 1, int pageSize = 15);
    Task<List<MongoPost>> GetEducationalFeedAsync(Guid kidAccountId, int page = 1, int pageSize = 10);
    Task<List<MongoPost>> GetSafePostsFromFollowingAsync(Guid kidAccountId, int page = 1, int pageSize = 10);
    Task<KidFeedMetrics> GetFeedMetricsAsync(Guid kidAccountId);
    Task<List<SafeUserSuggestion>> GetSafeUserSuggestionsAsync(Guid kidAccountId, int limit = 5);
    Task<List<EducationalContentSuggestion>> GetEducationalContentSuggestionsAsync(Guid kidAccountId, int limit = 5);
    Task<bool> ReportInappropriateContentAsync(Guid kidAccountId, Guid postId, string reason);
}

public class KidSafeFeedService : IKidSafeFeedService
{
    private readonly MongoDbContext _mongoContext;
    private readonly IKidSafetyService _kidSafetyService;
    private readonly IContentFilteringService _contentFilteringService;
    private readonly IUserProfileCacheService _userProfileCache;
    private readonly ILogger<KidSafeFeedService> _logger;

    public KidSafeFeedService(
        MongoDbContext mongoContext,
        IKidSafetyService kidSafetyService,
        IContentFilteringService contentFilteringService,
        IUserProfileCacheService userProfileCache,
        ILogger<KidSafeFeedService> logger)
    {
        _mongoContext = mongoContext;
        _kidSafetyService = kidSafetyService;
        _contentFilteringService = contentFilteringService;
        _userProfileCache = userProfileCache;
        _logger = logger;
    }

    public async Task<List<FeedItem>> GetKidSafeFeedAsync(Guid kidAccountId, int page = 1, int pageSize = 15)
    {
        try
        {
            _logger.LogInformation("Getting kid-safe feed for account {KidAccountId}, page {Page}", kidAccountId, page);

            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<FeedItem>();
            }

            var feedItems = new List<FeedItem>();

            // Get educational content first (higher priority)
            var educationalPosts = await GetEducationalFeedAsync(kidAccountId, 1, Math.Max(5, pageSize / 3));
            foreach (var post in educationalPosts)
            {
                feedItems.Add(new FeedItem
                {
                    Type = "post",
                    Post = post,
                    FeedScore = CalculateFeedPriority(post, kidAccount, isEducational: true),
                    CreatedAt = post.CreatedAt,
                    ItemId = post.PostId.ToString()
                });
            }

            // Get safe posts from following (if any)
            var followingPosts = await GetSafePostsFromFollowingAsync(kidAccountId, page, pageSize / 2);
            foreach (var post in followingPosts)
            {
                // Avoid duplicates
                if (!feedItems.Any(f => f.Post?.PostId == post.PostId))
                {
                    feedItems.Add(new FeedItem
                    {
                        Type = "post",
                        Post = post,
                        FeedScore = CalculateFeedPriority(post, kidAccount, isEducational: false),
                        CreatedAt = post.CreatedAt,
                        ItemId = post.PostId.ToString()
                    });
                }
            }

            // Fill remaining slots with general safe content
            var remainingSlots = pageSize - feedItems.Count;
            if (remainingSlots > 0)
            {
                var generalSafePosts = await GetGeneralSafePostsAsync(kidAccountId, remainingSlots);
                foreach (var post in generalSafePosts)
                {
                    if (!feedItems.Any(f => f.Post?.PostId == post.PostId))
                    {
                        feedItems.Add(new FeedItem
                        {
                            Type = "post",
                            Post = post,
                            FeedScore = CalculateFeedPriority(post, kidAccount, isEducational: false),
                            CreatedAt = post.CreatedAt,
                            ItemId = post.PostId.ToString()
                        });
                    }
                }
            }

            // Sort by priority (educational content and safety score)
            var sortedFeed = feedItems
                .OrderByDescending(f => f.FeedScore)
                .ThenByDescending(f => f.Post?.CreatedAt)
                .Take(pageSize)
                .ToList();

            _logger.LogInformation("Generated kid-safe feed with {Count} items for account {KidAccountId}", 
                sortedFeed.Count, kidAccountId);

            return sortedFeed;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating kid-safe feed for account {KidAccountId}", kidAccountId);
            return new List<FeedItem>();
        }
    }

    public async Task<List<MongoPost>> GetEducationalFeedAsync(Guid kidAccountId, int page = 1, int pageSize = 10)
    {
        try
        {
            return await _contentFilteringService.GetEducationalPostsAsync(kidAccountId, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting educational feed for kid account {KidAccountId}", kidAccountId);
            return new List<MongoPost>();
        }
    }

    public async Task<List<MongoPost>> GetSafePostsFromFollowingAsync(Guid kidAccountId, int page = 1, int pageSize = 10)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<MongoPost>();
            }

            // Get safe user connections (approved by parent)
            var safeUserIds = await _kidSafetyService.GetEducationalConnectionsAsync(kidAccountId);
            if (!safeUserIds.Any())
            {
                return new List<MongoPost>();
            }

            // Get recent posts from safe connections
            var skip = (page - 1) * pageSize;
            var posts = await _mongoContext.Posts
                .Find(p => safeUserIds.Contains(p.UserId) && !p.IsDeleted && p.IsPublic)
                .SortByDescending(p => p.CreatedAt)
                .Skip(skip)
                .Limit(pageSize * 2) // Get more to filter
                .ToListAsync();

            // Filter posts for safety
            var safePosts = await _contentFilteringService.FilterPostsForKidAsync(posts, kidAccountId);
            return safePosts.Take(pageSize).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting safe posts from following for kid account {KidAccountId}", kidAccountId);
            return new List<MongoPost>();
        }
    }

    public async Task<KidFeedMetrics> GetFeedMetricsAsync(Guid kidAccountId)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new KidFeedMetrics();
            }

            // Get recent activity metrics
            var oneDayAgo = DateTime.UtcNow.AddDays(-1);
            var oneWeekAgo = DateTime.UtcNow.AddDays(-7);

            var recentPosts = await _mongoContext.Posts
                .Find(p => !p.IsDeleted && p.CreatedAt >= oneWeekAgo)
                .ToListAsync();

            var safePosts = await _contentFilteringService.FilterPostsForKidAsync(recentPosts, kidAccountId);
            var educationalPosts = safePosts.Where(p => IsLikelyEducational(p.Content)).ToList();

            return new KidFeedMetrics
            {
                KidAccountId = kidAccountId,
                TotalSafePostsAvailable = safePosts.Count,
                EducationalPostsAvailable = educationalPosts.Count,
                SafetyFilteringRate = recentPosts.Any() ? (double)safePosts.Count / recentPosts.Count : 1.0,
                EducationalContentRatio = safePosts.Any() ? (double)educationalPosts.Count / safePosts.Count : 0.0,
                LastUpdated = DateTime.UtcNow,
                RecommendedDailyPosts = CalculateRecommendedDailyPosts(kidAccount.Age),
                CurrentEngagementScore = await CalculateEngagementScoreAsync(kidAccountId)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feed metrics for kid account {KidAccountId}", kidAccountId);
            return new KidFeedMetrics();
        }
    }

    public async Task<List<SafeUserSuggestion>> GetSafeUserSuggestionsAsync(Guid kidAccountId, int limit = 5)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<SafeUserSuggestion>();
            }

            var suggestions = new List<SafeUserSuggestion>();

            // Get safe user suggestions from the kid safety service
            var safeUserIds = await _kidSafetyService.GetSafeUserSuggestionsAsync(kidAccountId, limit * 2);

            foreach (var userId in safeUserIds.Take(limit))
            {
                var userProfile = await _userProfileCache.GetUserProfileAsync(userId);
                if (userProfile != null)
                {
                    suggestions.Add(new SafeUserSuggestion
                    {
                        UserId = userId,
                        DisplayName = userProfile.DisplayName,
                        Username = userProfile.Username,
                        AvatarUrl = userProfile.AvatarUrl,
                        SafetyScore = 0.9, // High safety score for suggested users
                        Reason = "Recommended by safety algorithm",
                        IsEducator = false, // TODO: Check if user is a verified educator
                        CommonInterests = new List<string> { "Learning", "Education" }
                    });
                }
            }

            return suggestions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting safe user suggestions for kid account {KidAccountId}", kidAccountId);
            return new List<SafeUserSuggestion>();
        }
    }

    public async Task<List<EducationalContentSuggestion>> GetEducationalContentSuggestionsAsync(Guid kidAccountId, int limit = 5)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<EducationalContentSuggestion>();
            }

            var suggestions = new List<EducationalContentSuggestion>();

            // Get educational posts
            var educationalPosts = await GetEducationalFeedAsync(kidAccountId, 1, limit * 2);

            foreach (var post in educationalPosts.Take(limit))
            {
                var educationalResult = await _contentFilteringService.AnalyzeEducationalValueAsync(post.Content, kidAccount.Age);
                
                suggestions.Add(new EducationalContentSuggestion
                {
                    PostId = post.PostId,
                    Title = ExtractTitleFromContent(post.Content),
                    Content = post.Content.Length > 100 ? post.Content.Substring(0, 100) + "..." : post.Content,
                    EducationalScore = educationalResult.EducationalScore,
                    SubjectAreas = educationalResult.SubjectAreas,
                    RecommendedGradeLevel = educationalResult.RecommendedGradeLevel,
                    LearningObjectives = educationalResult.LearningObjectives.Take(2).ToList(),
                    AuthorId = post.UserId,
                    CreatedAt = post.CreatedAt
                });
            }

            return suggestions;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting educational content suggestions for kid account {KidAccountId}", kidAccountId);
            return new List<EducationalContentSuggestion>();
        }
    }

    public async Task<bool> ReportInappropriateContentAsync(Guid kidAccountId, Guid postId, string reason)
    {
        try
        {
            _logger.LogWarning("Kid account {KidAccountId} reported inappropriate content {PostId}: {Reason}", 
                kidAccountId, postId, reason);

            // Create safety event
            await _kidSafetyService.CreateSafetyEventAsync(
                kidAccountId,
                "inappropriate_content_reported",
                "warning",
                $"Kid reported inappropriate content: {reason}",
                new Dictionary<string, object>
                {
                    { "postId", postId.ToString() },
                    { "reason", reason },
                    { "reportedAt", DateTime.UtcNow }
                });

            // TODO: Add to content moderation queue
            // TODO: Notify parent
            // TODO: Update content safety rules based on report

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reporting inappropriate content for kid account {KidAccountId}", kidAccountId);
            return false;
        }
    }

    // Helper methods
    private async Task<List<MongoPost>> GetGeneralSafePostsAsync(Guid kidAccountId, int count)
    {
        try
        {
            // Get recent public posts
            var recentPosts = await _mongoContext.Posts
                .Find(p => !p.IsDeleted && p.IsPublic)
                .SortByDescending(p => p.CreatedAt)
                .Limit(count * 3) // Get more to filter
                .ToListAsync();

            // Filter for safety
            var safePosts = await _contentFilteringService.FilterPostsForKidAsync(recentPosts, kidAccountId);
            return safePosts.Take(count).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting general safe posts for kid account {KidAccountId}", kidAccountId);
            return new List<MongoPost>();
        }
    }

    private double CalculateFeedPriority(MongoPost post, Models.KidAccounts.KidAccount kidAccount, bool isEducational)
    {
        var basePriority = post.FeedScore;
        
        // Boost educational content
        if (isEducational)
        {
            basePriority *= 2.0; // 2x boost for educational content
        }

        // Boost recent content
        var hoursSinceCreation = (DateTime.UtcNow - post.CreatedAt).TotalHours;
        if (hoursSinceCreation < 24)
        {
            basePriority *= 1.2; // Recent content boost
        }

        // Boost content with good engagement
        var engagementScore = post.LikesCount + (post.CommentsCount * 2) + (post.SharesCount * 1.5);
        basePriority += engagementScore * 0.1;

        return basePriority;
    }

    private bool IsLikelyEducational(string content)
    {
        var educationalKeywords = new[] 
        { 
            "learn", "study", "education", "school", "teach", "knowledge", 
            "science", "math", "history", "reading", "book", "research" 
        };
        
        var contentLower = content.ToLower();
        return educationalKeywords.Count(keyword => contentLower.Contains(keyword)) >= 2;
    }

    private int CalculateRecommendedDailyPosts(int kidAge)
    {
        return kidAge switch
        {
            <= 8 => 10,   // Younger kids - fewer posts
            <= 12 => 15,  // Middle kids - moderate
            <= 15 => 20,  // Teens - more posts
            _ => 25       // Older teens
        };
    }

    private async Task<double> CalculateEngagementScoreAsync(Guid kidAccountId)
    {
        try
        {
            // Simple engagement calculation based on recent activity
            // In a real implementation, this would be more sophisticated
            return 0.75; // Placeholder
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating engagement score for kid account {KidAccountId}", kidAccountId);
            return 0.5; // Default neutral score
        }
    }

    private string ExtractTitleFromContent(string content)
    {
        // Simple title extraction - take first sentence or first 50 characters
        var firstSentence = content.Split('.', '!', '?').FirstOrDefault()?.Trim();
        if (!string.IsNullOrEmpty(firstSentence) && firstSentence.Length <= 50)
        {
            return firstSentence;
        }
        
        return content.Length > 50 ? content.Substring(0, 50) + "..." : content;
    }
}

// DTOs for kid-safe feed
public class KidFeedMetrics
{
    public Guid KidAccountId { get; set; }
    public int TotalSafePostsAvailable { get; set; }
    public int EducationalPostsAvailable { get; set; }
    public double SafetyFilteringRate { get; set; } // Percentage of posts that pass safety filter
    public double EducationalContentRatio { get; set; } // Percentage of safe posts that are educational
    public DateTime LastUpdated { get; set; }
    public int RecommendedDailyPosts { get; set; }
    public double CurrentEngagementScore { get; set; }
}

public class SafeUserSuggestion
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double SafetyScore { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsEducator { get; set; }
    public List<string> CommonInterests { get; set; } = new();
}

public class EducationalContentSuggestion
{
    public Guid PostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public double EducationalScore { get; set; }
    public List<string> SubjectAreas { get; set; } = new();
    public string? RecommendedGradeLevel { get; set; }
    public List<string> LearningObjectives { get; set; } = new();
    public Guid AuthorId { get; set; }
    public DateTime CreatedAt { get; set; }
}
