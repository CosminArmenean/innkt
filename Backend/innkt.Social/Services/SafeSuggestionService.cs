using MongoDB.Driver;
using Microsoft.EntityFrameworkCore;
using innkt.Social.Data;
using innkt.Social.Models.MongoDB;
using innkt.Social.Models.KidAccounts;

namespace innkt.Social.Services;

/// <summary>
/// Safe suggestion service for kid accounts based on parent network and educational connections
/// Provides intelligent, safety-verified user and content recommendations
/// </summary>
public interface ISafeSuggestionService
{
    // User suggestions
    Task<List<SafeUserRecommendation>> GetSafeUserRecommendationsAsync(Guid kidAccountId, int limit = 10);
    Task<List<SafeUserRecommendation>> GetEducatorRecommendationsAsync(Guid kidAccountId, int limit = 5);
    Task<List<SafeUserRecommendation>> GetPeerRecommendationsAsync(Guid kidAccountId, int limit = 5);
    Task<List<SafeUserRecommendation>> GetParentNetworkRecommendationsAsync(Guid kidAccountId, int limit = 5);

    // Content suggestions
    Task<List<SafeContentRecommendation>> GetSafeContentRecommendationsAsync(Guid kidAccountId, int limit = 10);
    Task<List<SafeContentRecommendation>> GetEducationalContentRecommendationsAsync(Guid kidAccountId, string? subject = null, int limit = 10);
    Task<List<SafeContentRecommendation>> GetAgeAppropriateContentAsync(Guid kidAccountId, int limit = 10);

    // Activity suggestions
    Task<List<SafeActivitySuggestion>> GetLearningActivitySuggestionsAsync(Guid kidAccountId, int limit = 5);
    Task<List<SafeActivitySuggestion>> GetSocialActivitySuggestionsAsync(Guid kidAccountId, int limit = 5);

    // Safety scoring and validation
    Task<double> CalculateUserSafetyScoreAsync(Guid targetUserId, Guid kidAccountId);
    Task<bool> IsUserSafeForKidAsync(Guid targetUserId, Guid kidAccountId);
    Task<UserSafetyAssessment> AssessUserSafetyAsync(Guid targetUserId, Guid kidAccountId);

    // Suggestion analytics
    Task<SuggestionMetrics> GetSuggestionMetricsAsync(Guid kidAccountId);
    Task<bool> RecordSuggestionInteractionAsync(Guid kidAccountId, string suggestionType, Guid targetId, string action);
}

public class SafeSuggestionService : ISafeSuggestionService
{
    private readonly MongoDbContext _mongoContext;
    private readonly SocialDbContext _socialContext;
    private readonly IKidSafetyService _kidSafetyService;
    private readonly IContentFilteringService _contentFilteringService;
    private readonly IUserProfileCacheService _userProfileCache;
    private readonly ILogger<SafeSuggestionService> _logger;

    // Safety scoring weights
    private const double PARENT_NETWORK_WEIGHT = 0.4;
    private const double EDUCATOR_WEIGHT = 0.3;
    private const double PEER_AGE_WEIGHT = 0.2;
    private const double CONTENT_SAFETY_WEIGHT = 0.1;

    public SafeSuggestionService(
        MongoDbContext mongoContext,
        SocialDbContext socialContext,
        IKidSafetyService kidSafetyService,
        IContentFilteringService contentFilteringService,
        IUserProfileCacheService userProfileCache,
        ILogger<SafeSuggestionService> logger)
    {
        _mongoContext = mongoContext;
        _socialContext = socialContext;
        _kidSafetyService = kidSafetyService;
        _contentFilteringService = contentFilteringService;
        _userProfileCache = userProfileCache;
        _logger = logger;
    }

    public async Task<List<SafeUserRecommendation>> GetSafeUserRecommendationsAsync(Guid kidAccountId, int limit = 10)
    {
        try
        {
            _logger.LogInformation("Getting safe user recommendations for kid account {KidAccountId}", kidAccountId);

            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<SafeUserRecommendation>();
            }

            var recommendations = new List<SafeUserRecommendation>();

            // Get educator recommendations (highest priority)
            var educators = await GetEducatorRecommendationsAsync(kidAccountId, Math.Max(2, limit / 3));
            recommendations.AddRange(educators);

            // Get parent network recommendations
            var parentNetwork = await GetParentNetworkRecommendationsAsync(kidAccountId, Math.Max(2, limit / 3));
            recommendations.AddRange(parentNetwork.Where(r => !recommendations.Any(existing => existing.UserId == r.UserId)));

            // Get peer recommendations
            var peers = await GetPeerRecommendationsAsync(kidAccountId, Math.Max(2, limit / 3));
            recommendations.AddRange(peers.Where(r => !recommendations.Any(existing => existing.UserId == r.UserId)));

            // Sort by safety score and take top recommendations
            return recommendations
                .OrderByDescending(r => r.SafetyScore)
                .ThenByDescending(r => r.RecommendationStrength)
                .Take(limit)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting safe user recommendations for kid account {KidAccountId}", kidAccountId);
            return new List<SafeUserRecommendation>();
        }
    }

    public async Task<List<SafeUserRecommendation>> GetEducatorRecommendationsAsync(Guid kidAccountId, int limit = 5)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<SafeUserRecommendation>();
            }

            var recommendations = new List<SafeUserRecommendation>();

            // Get verified teachers from the same grade level or subject area
            var verifiedTeachers = await _socialContext.TeacherProfiles
                .Where(t => t.VerificationStatus == "verified" && 
                           t.GradeLevels.Contains(GetGradeLevelFromAge(kidAccount.Age)))
                .Take(limit * 2) // Get more to filter
                .ToListAsync();

            foreach (var teacher in verifiedTeachers)
            {
                var userProfile = await _userProfileCache.GetUserProfileAsync(teacher.UserId);
                if (userProfile != null)
                {
                    var safetyScore = await CalculateUserSafetyScoreAsync(teacher.UserId, kidAccountId);
                    
                    if (safetyScore >= 0.8) // High safety threshold for educators
                    {
                        recommendations.Add(new SafeUserRecommendation
                        {
                            UserId = teacher.UserId,
                            DisplayName = userProfile.DisplayName,
                            Username = userProfile.Username,
                            AvatarUrl = userProfile.AvatarUrl,
                            SafetyScore = safetyScore,
                            RecommendationStrength = 0.9, // High strength for verified educators
                            RecommendationType = "verified_educator",
                            ReasonForRecommendation = $"Verified {string.Join(", ", teacher.SubjectsTeaching)} teacher",
                            CommonInterests = teacher.SubjectsTeaching.ToList(),
                            IsVerifiedEducator = true,
                            SchoolName = teacher.SchoolName,
                            RequiresParentApproval = false // Educators may have streamlined approval
                        });
                    }
                }

                if (recommendations.Count >= limit)
                {
                    break;
                }
            }

            return recommendations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting educator recommendations for kid account {KidAccountId}", kidAccountId);
            return new List<SafeUserRecommendation>();
        }
    }

    public async Task<List<SafeUserRecommendation>> GetPeerRecommendationsAsync(Guid kidAccountId, int limit = 5)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<SafeUserRecommendation>();
            }

            var recommendations = new List<SafeUserRecommendation>();

            // Find other kid accounts in similar age range
            var ageRange = kidAccount.AgeGapLimitYears;
            var minAge = Math.Max(5, kidAccount.Age - ageRange);
            var maxAge = Math.Min(17, kidAccount.Age + ageRange);

            var potentialPeers = await _socialContext.KidAccounts
                .Where(k => k.Id != kidAccountId && 
                           k.Age >= minAge && 
                           k.Age <= maxAge && 
                           k.IsActive)
                .Take(limit * 3) // Get more to filter
                .ToListAsync();

            foreach (var peer in potentialPeers)
            {
                var userProfile = await _userProfileCache.GetUserProfileAsync(peer.UserId);
                if (userProfile != null)
                {
                    var safetyScore = await CalculateUserSafetyScoreAsync(peer.UserId, kidAccountId);
                    
                    if (safetyScore >= 0.7) // Good safety threshold for peers
                    {
                        recommendations.Add(new SafeUserRecommendation
                        {
                            UserId = peer.UserId,
                            DisplayName = userProfile.DisplayName,
                            Username = userProfile.Username,
                            AvatarUrl = userProfile.AvatarUrl,
                            SafetyScore = safetyScore,
                            RecommendationStrength = 0.6,
                            RecommendationType = "safe_peer",
                            ReasonForRecommendation = $"Safe peer, age {peer.Age}",
                            CommonInterests = GetCommonInterests(kidAccount, peer),
                            IsVerifiedEducator = false,
                            RequiresParentApproval = true
                        });
                    }
                }

                if (recommendations.Count >= limit)
                {
                    break;
                }
            }

            return recommendations.OrderByDescending(r => r.SafetyScore).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting peer recommendations for kid account {KidAccountId}", kidAccountId);
            return new List<SafeUserRecommendation>();
        }
    }

    public async Task<List<SafeUserRecommendation>> GetParentNetworkRecommendationsAsync(Guid kidAccountId, int limit = 5)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<SafeUserRecommendation>();
            }

            var recommendations = new List<SafeUserRecommendation>();

            // TODO: Get parent's following/followers network
            // For now, return empty list as this requires follow system integration
            
            _logger.LogDebug("Parent network recommendations not yet implemented - requires follow system integration");
            return recommendations;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting parent network recommendations for kid account {KidAccountId}", kidAccountId);
            return new List<SafeUserRecommendation>();
        }
    }

    public async Task<double> CalculateUserSafetyScoreAsync(Guid targetUserId, Guid kidAccountId)
    {
        try
        {
            var safetyScore = 0.5; // Base score

            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return 0.0;
            }

            // Check if target is a verified educator
            var isEducator = await _socialContext.TeacherProfiles
                .AnyAsync(t => t.UserId == targetUserId && t.VerificationStatus == "verified");
            
            if (isEducator)
            {
                safetyScore += 0.3; // Boost for verified educators
            }

            // Check if target is also a kid account
            var targetKidAccount = await _kidSafetyService.GetKidAccountByUserIdAsync(targetUserId);
            if (targetKidAccount != null)
            {
                // Age appropriateness check
                var ageDifference = Math.Abs(targetKidAccount.Age - kidAccount.Age);
                if (ageDifference <= kidAccount.AgeGapLimitYears)
                {
                    safetyScore += 0.2;
                }
                else
                {
                    safetyScore -= 0.1; // Penalty for age gap
                }

                // Safety level compatibility
                if (targetKidAccount.SafetyLevel == kidAccount.SafetyLevel)
                {
                    safetyScore += 0.1;
                }
            }

            // Check user's recent content for safety
            var recentPosts = await _mongoContext.Posts
                .Find(p => p.UserId == targetUserId && !p.IsDeleted)
                .SortByDescending(p => p.CreatedAt)
                .Limit(10)
                .ToListAsync();

            if (recentPosts.Any())
            {
                var contentSafetyScores = new List<double>();
                foreach (var post in recentPosts.Take(5)) // Check last 5 posts
                {
                    var contentSafety = await _contentFilteringService.AnalyzeContentSafetyAsync(
                        post.Content, post.MediaUrls, kidAccount.Age);
                    contentSafetyScores.Add(contentSafety.SafetyScore);
                }
                
                var avgContentSafety = contentSafetyScores.Average();
                safetyScore += (avgContentSafety - 0.5) * 0.2; // Adjust based on content safety
            }

            // Check for any safety events or reports
            // TODO: Implement safety event checking

            return Math.Clamp(safetyScore, 0.0, 1.0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating user safety score for target {TargetUserId} and kid {KidAccountId}", 
                targetUserId, kidAccountId);
            return 0.0; // Fail safe
        }
    }

    public async Task<List<SafeContentRecommendation>> GetEducationalContentRecommendationsAsync(Guid kidAccountId, string? subject = null, int limit = 10)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<SafeContentRecommendation>();
            }

            var recommendations = new List<SafeContentRecommendation>();

            // Get educational posts
            var educationalPosts = await _contentFilteringService.GetEducationalPostsAsync(kidAccountId, limit * 2);

            foreach (var post in educationalPosts)
            {
                var educationalResult = await _contentFilteringService.AnalyzeEducationalValueAsync(post.Content, kidAccount.Age, subject);
                var safetyResult = await _contentFilteringService.AnalyzeContentSafetyAsync(post.Content, post.MediaUrls, kidAccount.Age);

                if (educationalResult.IsEducational && safetyResult.IsSafe)
                {
                    // Filter by subject if specified
                    if (subject != null && !educationalResult.SubjectAreas.Any(s => s.Contains(subject, StringComparison.OrdinalIgnoreCase)))
                    {
                        continue;
                    }

                    var authorProfile = await _userProfileCache.GetUserProfileAsync(post.UserId);
                    
                    recommendations.Add(new SafeContentRecommendation
                    {
                        PostId = post.PostId,
                        Title = ExtractTitle(post.Content),
                        Content = post.Content.Length > 200 ? post.Content.Substring(0, 200) + "..." : post.Content,
                        AuthorId = post.UserId,
                        AuthorName = authorProfile?.DisplayName ?? "Unknown",
                        AuthorAvatarUrl = authorProfile?.AvatarUrl,
                        SafetyScore = safetyResult.SafetyScore,
                        EducationalScore = educationalResult.EducationalScore,
                        SubjectAreas = educationalResult.SubjectAreas,
                        RecommendedGradeLevel = educationalResult.RecommendedGradeLevel,
                        LearningObjectives = educationalResult.LearningObjectives.Take(3).ToList(),
                        RecommendationReason = $"Educational content about {string.Join(", ", educationalResult.SubjectAreas.Take(2))}",
                        CreatedAt = post.CreatedAt,
                        EngagementScore = CalculateEngagementScore(post),
                        IsFromTrustedSource = await IsFromTrustedSourceAsync(post.UserId, kidAccountId)
                    });
                }

                if (recommendations.Count >= limit)
                {
                    break;
                }
            }

            return recommendations.OrderByDescending(r => r.EducationalScore)
                                 .ThenByDescending(r => r.SafetyScore)
                                 .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting educational content recommendations for kid account {KidAccountId}", kidAccountId);
            return new List<SafeContentRecommendation>();
        }
    }

    // Helper methods
    private string GetGradeLevelFromAge(int age)
    {
        return age switch
        {
            5 => "Kindergarten",
            6 => "1st Grade",
            7 => "2nd Grade",
            8 => "3rd Grade",
            9 => "4th Grade",
            10 => "5th Grade",
            11 => "6th Grade",
            12 => "7th Grade",
            13 => "8th Grade",
            14 => "9th Grade",
            15 => "10th Grade",
            16 => "11th Grade",
            17 => "12th Grade",
            _ => "General"
        };
    }

    private List<string> GetCommonInterests(KidAccount kidAccount1, KidAccount kidAccount2)
    {
        // Simple common interest detection based on allowed topics
        var common = kidAccount1.AllowedTopics.Intersect(kidAccount2.AllowedTopics).ToList();
        
        if (!common.Any())
        {
            // Default interests based on age
            common = GetDefaultInterestsForAge(Math.Min(kidAccount1.Age, kidAccount2.Age));
        }
        
        return common;
    }

    private List<string> GetDefaultInterestsForAge(int age)
    {
        return age switch
        {
            <= 8 => new List<string> { "Games", "Stories", "Animals", "Art" },
            <= 12 => new List<string> { "Science", "Sports", "Reading", "Music" },
            <= 15 => new List<string> { "Technology", "Movies", "Books", "Friends" },
            _ => new List<string> { "Learning", "Hobbies", "Future Plans", "Creativity" }
        };
    }

    private string ExtractTitle(string content)
    {
        var firstLine = content.Split('\n').FirstOrDefault()?.Trim();
        if (!string.IsNullOrEmpty(firstLine) && firstLine.Length <= 60)
        {
            return firstLine;
        }
        
        return content.Length > 60 ? content.Substring(0, 60) + "..." : content;
    }

    private double CalculateEngagementScore(MongoPost post)
    {
        return (post.LikesCount * 1.0) + (post.CommentsCount * 2.0) + (post.SharesCount * 1.5) + (post.ViewsCount * 0.1);
    }

    private async Task<bool> IsFromTrustedSourceAsync(Guid authorId, Guid kidAccountId)
    {
        // Check if author is a verified educator
        var isEducator = await _socialContext.TeacherProfiles
            .AnyAsync(t => t.UserId == authorId && t.VerificationStatus == "verified");
        
        if (isEducator) return true;

        // Check if author is in approved connections
        var approvedConnections = await _kidSafetyService.GetEducationalConnectionsAsync(kidAccountId);
        return approvedConnections.Contains(authorId);
    }

    // Placeholder implementations for remaining interface methods
    public Task<List<SafeContentRecommendation>> GetSafeContentRecommendationsAsync(Guid kidAccountId, int limit = 10) =>
        Task.FromResult(new List<SafeContentRecommendation>());

    public Task<List<SafeContentRecommendation>> GetAgeAppropriateContentAsync(Guid kidAccountId, int limit = 10) =>
        Task.FromResult(new List<SafeContentRecommendation>());

    public Task<List<SafeActivitySuggestion>> GetLearningActivitySuggestionsAsync(Guid kidAccountId, int limit = 5) =>
        Task.FromResult(new List<SafeActivitySuggestion>());

    public Task<List<SafeActivitySuggestion>> GetSocialActivitySuggestionsAsync(Guid kidAccountId, int limit = 5) =>
        Task.FromResult(new List<SafeActivitySuggestion>());

    public Task<bool> IsUserSafeForKidAsync(Guid targetUserId, Guid kidAccountId) =>
        CalculateUserSafetyScoreAsync(targetUserId, kidAccountId).ContinueWith(t => t.Result >= 0.7);

    public Task<UserSafetyAssessment> AssessUserSafetyAsync(Guid targetUserId, Guid kidAccountId) =>
        Task.FromResult(new UserSafetyAssessment());

    public Task<SuggestionMetrics> GetSuggestionMetricsAsync(Guid kidAccountId) =>
        Task.FromResult(new SuggestionMetrics());

    public Task<bool> RecordSuggestionInteractionAsync(Guid kidAccountId, string suggestionType, Guid targetId, string action) =>
        Task.FromResult(true);
}

// DTOs for safe suggestions
public class SafeUserRecommendation
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double SafetyScore { get; set; }
    public double RecommendationStrength { get; set; }
    public string RecommendationType { get; set; } = string.Empty;
    public string ReasonForRecommendation { get; set; } = string.Empty;
    public List<string> CommonInterests { get; set; } = new();
    public bool IsVerifiedEducator { get; set; }
    public string? SchoolName { get; set; }
    public bool RequiresParentApproval { get; set; } = true;
}

public class SafeContentRecommendation
{
    public Guid PostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatarUrl { get; set; }
    public double SafetyScore { get; set; }
    public double EducationalScore { get; set; }
    public List<string> SubjectAreas { get; set; } = new();
    public string? RecommendedGradeLevel { get; set; }
    public List<string> LearningObjectives { get; set; } = new();
    public string RecommendationReason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public double EngagementScore { get; set; }
    public bool IsFromTrustedSource { get; set; }
}

public class SafeActivitySuggestion
{
    public string ActivityType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> RequiredMaterials { get; set; } = new();
    public int EstimatedTimeMinutes { get; set; }
    public string DifficultyLevel { get; set; } = string.Empty;
    public List<string> LearningObjectives { get; set; } = new();
    public bool RequiresParentSupervision { get; set; }
}

public class UserSafetyAssessment
{
    public Guid UserId { get; set; }
    public double OverallSafetyScore { get; set; }
    public List<string> SafetyFactors { get; set; } = new();
    public List<string> ConcernAreas { get; set; } = new();
    public bool IsRecommended { get; set; }
    public string RecommendationLevel { get; set; } = string.Empty;
}

public class SuggestionMetrics
{
    public Guid KidAccountId { get; set; }
    public int TotalSuggestionsProvided { get; set; }
    public int SuggestionsAccepted { get; set; }
    public double AcceptanceRate { get; set; }
    public Dictionary<string, int> SuggestionTypeBreakdown { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}
