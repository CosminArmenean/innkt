using MongoDB.Driver;
using innkt.Social.Data;
using innkt.Social.Models.MongoDB;
using innkt.Social.Models.KidAccounts;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace innkt.Social.Services;

/// <summary>
/// AI-powered content filtering service for comprehensive kid account safety
/// Implements industry-leading content analysis and educational prioritization
/// </summary>
public class ContentFilteringService : IContentFilteringService
{
    private readonly MongoDbContext _mongoContext;
    private readonly SocialDbContext _socialContext;
    private readonly IKidSafetyService _kidSafetyService;
    private readonly ILogger<ContentFilteringService> _logger;

    // Content safety thresholds
    private const double DEFAULT_SAFETY_THRESHOLD = 0.8;
    private const double EDUCATIONAL_BOOST_MULTIPLIER = 1.5;
    private const double HIGH_CONFIDENCE_THRESHOLD = 0.9;
    private const int MAX_CONTENT_LENGTH = 10000;

    // Educational keywords and topics
    private readonly Dictionary<string, List<string>> _educationalKeywords = new()
    {
        ["science"] = new() { "experiment", "discovery", "research", "hypothesis", "theory", "biology", "chemistry", "physics", "astronomy", "nature" },
        ["math"] = new() { "calculate", "equation", "formula", "geometry", "algebra", "statistics", "problem solving", "mathematics", "numbers" },
        ["history"] = new() { "historical", "ancient", "civilization", "timeline", "events", "culture", "heritage", "archaeology", "museum" },
        ["literature"] = new() { "reading", "story", "book", "author", "poetry", "writing", "creative", "imagination", "narrative" },
        ["art"] = new() { "creative", "drawing", "painting", "sculpture", "design", "artistic", "gallery", "museum", "expression" },
        ["technology"] = new() { "coding", "programming", "computer", "digital", "innovation", "engineering", "robotics", "science" },
        ["language"] = new() { "vocabulary", "grammar", "communication", "translation", "linguistics", "speaking", "writing" },
        ["geography"] = new() { "countries", "maps", "continents", "climate", "environment", "travel", "exploration", "world" }
    };

    // Inappropriate content patterns (simplified for demo)
    private readonly Dictionary<string, List<string>> _inappropriatePatterns = new()
    {
        ["violence"] = new() { "fight", "hurt", "weapon", "blood", "violent", "attack", "kill", "death", "war" },
        ["mature_themes"] = new() { "adult", "mature", "inappropriate", "explicit", "sexual", "drug", "alcohol", "smoking" },
        ["negative_behavior"] = new() { "bully", "hate", "cruel", "mean", "nasty", "rude", "disrespect", "harassment" },
        ["fear_inducing"] = new() { "scary", "terrifying", "nightmare", "horror", "frightening", "creepy", "disturbing" }
    };

    public ContentFilteringService(
        MongoDbContext mongoContext,
        SocialDbContext socialContext,
        IKidSafetyService kidSafetyService,
        ILogger<ContentFilteringService> logger)
    {
        _mongoContext = mongoContext;
        _socialContext = socialContext;
        _kidSafetyService = kidSafetyService;
        _logger = logger;
    }

    public async Task<ContentSafetyResult> AnalyzeContentSafetyAsync(string content, List<string>? mediaUrls = null, int? kidAge = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return new ContentSafetyResult
                {
                    IsSafe = true,
                    SafetyScore = 1.0,
                    ConfidenceLevel = 1.0
                };
            }

            _logger.LogDebug("Analyzing content safety for content length: {Length}", content.Length);

            var result = new ContentSafetyResult();
            
            // Detect inappropriate content patterns
            var detectedIssues = await DetectInappropriateContentAsync(content, mediaUrls);
            result.DetectedIssues = detectedIssues;

            // Calculate safety score
            result.SafetyScore = await CalculateContentSafetyScoreAsync(content, kidAge ?? 10, mediaUrls);
            result.IsSafe = result.SafetyScore >= DEFAULT_SAFETY_THRESHOLD;

            // Generate safety flags
            result.Flags = await GenerateSafetyFlagsAsync(content, detectedIssues);

            // Categorize content
            result.Category = await CategorizeContentAsync(content, mediaUrls);

            // Assess age appropriateness
            if (kidAge.HasValue)
            {
                result.AgeAppropriateness = await AssessAgeAppropriatenessAsync(content, kidAge.Value);
            }

            // Determine if human review is needed
            result.RequiresHumanReview = await RequiresHumanModerationAsync(content, result.SafetyScore);

            // Set confidence level based on various factors
            result.ConfidenceLevel = CalculateConfidenceLevel(content, result);

            // Generate recommendations
            result.Recommendations = GenerateSafetyRecommendations(result);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing content safety");
            
            // Fail safe - block content if analysis fails
            return new ContentSafetyResult
            {
                IsSafe = false,
                SafetyScore = 0.0,
                ConfidenceLevel = 0.5,
                DetectedIssues = new List<string> { "Content analysis failed - blocked for safety" },
                RequiresHumanReview = true
            };
        }
    }

    public async Task<bool> IsContentSafeForKidAsync(string content, Guid kidAccountId, List<string>? mediaUrls = null)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                _logger.LogWarning("Kid account not found: {KidAccountId}", kidAccountId);
                return false; // Fail safe
            }

            var safetyResult = await AnalyzeContentSafetyAsync(content, mediaUrls, kidAccount.Age);
            
            // Check against kid's specific safety threshold
            var isBasicallySafe = safetyResult.SafetyScore >= kidAccount.MinContentSafetyScore;
            
            // Additional check for educational content only mode
            if (kidAccount.EducationalContentOnly)
            {
                var educationalResult = await AnalyzeEducationalValueAsync(content, kidAccount.Age);
                return isBasicallySafe && educationalResult.IsEducational;
            }

            // Check blocked topics
            if (kidAccount.BlockedTopics.Any())
            {
                var detectedTopics = await ExtractTopicsAsync(content);
                var hasBlockedTopic = detectedTopics.Any(topic => 
                    kidAccount.BlockedTopics.Any(blocked => 
                        topic.Contains(blocked, StringComparison.OrdinalIgnoreCase)));
                
                if (hasBlockedTopic)
                {
                    return false;
                }
            }

            // Check allowed topics (if specified)
            if (kidAccount.AllowedTopics.Any())
            {
                var detectedTopics = await ExtractTopicsAsync(content);
                var hasAllowedTopic = detectedTopics.Any(topic => 
                    kidAccount.AllowedTopics.Any(allowed => 
                        topic.Contains(allowed, StringComparison.OrdinalIgnoreCase)));
                
                return isBasicallySafe && hasAllowedTopic;
            }

            return isBasicallySafe;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking content safety for kid {KidAccountId}", kidAccountId);
            return false; // Fail safe
        }
    }

    public async Task<double> CalculateContentSafetyScoreAsync(string content, int kidAge, List<string>? mediaUrls = null)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return 1.0; // Empty content is safe
            }

            var baseScore = 1.0;
            var contentLower = content.ToLower();

            // Analyze inappropriate content patterns
            foreach (var category in _inappropriatePatterns)
            {
                var categoryWeight = GetCategoryWeight(category.Key, kidAge);
                var matchCount = category.Value.Count(keyword => contentLower.Contains(keyword));
                
                if (matchCount > 0)
                {
                    var penalty = Math.Min(0.3, matchCount * 0.1 * categoryWeight);
                    baseScore -= penalty;
                }
            }

            // Boost score for educational content
            var educationalScore = await CalculateEducationalScoreAsync(content, kidAge);
            if (educationalScore > 0.5)
            {
                baseScore += (educationalScore - 0.5) * 0.2; // Up to 0.1 boost
            }

            // Age appropriateness adjustment
            var ageAppropriatenessPenalty = CalculateAgeAppropriatenessPenalty(content, kidAge);
            baseScore -= ageAppropriatenessPenalty;

            // Content length and complexity consideration
            var lengthPenalty = CalculateLengthComplexityPenalty(content, kidAge);
            baseScore -= lengthPenalty;

            // Media URL analysis (placeholder)
            if (mediaUrls?.Any() == true)
            {
                var mediaScore = await AnalyzeMediaSafetyAsync(mediaUrls);
                baseScore = Math.Min(baseScore, mediaScore);
            }

            return Math.Clamp(baseScore, 0.0, 1.0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating content safety score");
            return 0.0; // Fail safe
        }
    }

    public async Task<List<string>> DetectInappropriateContentAsync(string content, List<string>? mediaUrls = null)
    {
        var issues = new List<string>();
        
        if (string.IsNullOrWhiteSpace(content))
        {
            return issues;
        }

        var contentLower = content.ToLower();

        // Check each inappropriate content category
        foreach (var category in _inappropriatePatterns)
        {
            var matches = category.Value.Where(keyword => contentLower.Contains(keyword)).ToList();
            if (matches.Any())
            {
                issues.Add($"Contains {category.Key}: {string.Join(", ", matches.Take(3))}");
            }
        }

        // Check for excessive caps (shouting)
        if (content.Count(char.IsUpper) > content.Length * 0.7 && content.Length > 10)
        {
            issues.Add("Excessive use of capital letters");
        }

        // Check for repetitive content (spam-like)
        if (HasRepetitiveContent(content))
        {
            issues.Add("Repetitive or spam-like content");
        }

        // Placeholder for media analysis
        if (mediaUrls?.Any() == true)
        {
            var mediaIssues = await AnalyzeMediaContentAsync(mediaUrls);
            issues.AddRange(mediaIssues);
        }

        return issues;
    }

    public async Task<EducationalContentResult> AnalyzeEducationalValueAsync(string content, int kidAge, string? subject = null)
    {
        try
        {
            var result = new EducationalContentResult();
            
            if (string.IsNullOrWhiteSpace(content))
            {
                return result;
            }

            var contentLower = content.ToLower();
            var educationalScore = 0.0;
            var detectedTopics = new List<string>();
            var subjectAreas = new List<string>();

            // Analyze educational keywords
            foreach (var subject_kv in _educationalKeywords)
            {
                var matchCount = subject_kv.Value.Count(keyword => contentLower.Contains(keyword));
                if (matchCount > 0)
                {
                    subjectAreas.Add(subject_kv.Key);
                    detectedTopics.AddRange(subject_kv.Value.Where(keyword => contentLower.Contains(keyword)));
                    educationalScore += matchCount * 0.1;
                }
            }

            // Adjust score based on content characteristics
            if (content.Contains('?')) // Questions are educational
            {
                educationalScore += 0.1;
            }

            if (Regex.IsMatch(content, @"\b\d+\b")) // Contains numbers/data
            {
                educationalScore += 0.05;
            }

            if (content.Length > 100 && content.Length < 1000) // Appropriate length for learning
            {
                educationalScore += 0.05;
            }

            result.EducationalScore = Math.Clamp(educationalScore, 0.0, 1.0);
            result.IsEducational = result.EducationalScore > 0.3;
            result.EducationalTopics = detectedTopics.Distinct().ToList();
            result.SubjectAreas = subjectAreas.Distinct().ToList();
            result.RecommendedGradeLevel = DetermineGradeLevel(kidAge, result.EducationalScore);
            result.EngagementPotential = CalculateEngagementPotential(content, kidAge);
            result.LearningObjectives = GenerateLearningObjectives(content, subjectAreas);
            result.SuggestedActivities = GenerateSuggestedActivities(content, kidAge, subjectAreas);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing educational value");
            return new EducationalContentResult();
        }
    }

    public async Task<List<MongoPost>> FilterPostsForKidAsync(List<MongoPost> posts, Guid kidAccountId)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<MongoPost>(); // No posts if kid account not found
            }

            var filteredPosts = new List<MongoPost>();

            foreach (var post in posts)
            {
                try
                {
                    var isSafe = await IsContentSafeForKidAsync(post.Content, kidAccountId, post.MediaUrls);
                    if (isSafe)
                    {
                        // Boost educational content in ranking
                        if (kidAccount.EducationalContentOnly || kidAccount.AdaptiveSafetyEnabled)
                        {
                            var educationalResult = await AnalyzeEducationalValueAsync(post.Content, kidAccount.Age);
                            if (educationalResult.IsEducational)
                            {
                                // Boost educational posts by increasing their feed score
                                post.FeedScore *= EDUCATIONAL_BOOST_MULTIPLIER;
                            }
                        }

                        filteredPosts.Add(post);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error filtering post {PostId} for kid {KidAccountId}", post.PostId, kidAccountId);
                    // Skip post if filtering fails (fail safe)
                }
            }

            // Sort by feed score (educational content will be boosted)
            return filteredPosts.OrderByDescending(p => p.FeedScore).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error filtering posts for kid {KidAccountId}", kidAccountId);
            return new List<MongoPost>(); // Return empty list on error
        }
    }

    public async Task<List<MongoPost>> GetEducationalPostsAsync(Guid kidAccountId, int count = 20)
    {
        try
        {
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return new List<MongoPost>();
            }

            // Get recent posts
            var recentPosts = await _mongoContext.Posts
                .Find(p => !p.IsDeleted && p.IsPublic)
                .SortByDescending(p => p.CreatedAt)
                .Limit(count * 3) // Get more to filter from
                .ToListAsync();

            var educationalPosts = new List<MongoPost>();

            foreach (var post in recentPosts)
            {
                var educationalResult = await AnalyzeEducationalValueAsync(post.Content, kidAccount.Age);
                if (educationalResult.IsEducational && educationalResult.EducationalScore > 0.5)
                {
                    var isSafe = await IsContentSafeForKidAsync(post.Content, kidAccountId, post.MediaUrls);
                    if (isSafe)
                    {
                        // Set educational score as feed score for ranking
                        post.FeedScore = educationalResult.EducationalScore * 100;
                        educationalPosts.Add(post);
                    }
                }

                if (educationalPosts.Count >= count)
                {
                    break;
                }
            }

            return educationalPosts.OrderByDescending(p => p.FeedScore).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting educational posts for kid {KidAccountId}", kidAccountId);
            return new List<MongoPost>();
        }
    }

    // Helper methods
    private double GetCategoryWeight(string category, int kidAge)
    {
        return category switch
        {
            "violence" => kidAge < 10 ? 2.0 : kidAge < 13 ? 1.5 : 1.0,
            "mature_themes" => kidAge < 13 ? 2.0 : kidAge < 16 ? 1.5 : 1.0,
            "negative_behavior" => kidAge < 8 ? 1.8 : 1.2,
            "fear_inducing" => kidAge < 10 ? 2.0 : 1.3,
            _ => 1.0
        };
    }

    private double CalculateAgeAppropriatenessPenalty(string content, int kidAge)
    {
        // Simple age appropriateness based on complexity and length
        var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var avgWordLength = words.Average(w => w.Length);
        
        var complexityPenalty = 0.0;
        
        // Penalty for complex vocabulary for younger kids
        if (kidAge < 8 && avgWordLength > 6)
        {
            complexityPenalty += 0.1;
        }
        else if (kidAge < 12 && avgWordLength > 8)
        {
            complexityPenalty += 0.05;
        }

        // Penalty for very long content for younger kids
        if (kidAge < 10 && content.Length > 500)
        {
            complexityPenalty += 0.05;
        }

        return complexityPenalty;
    }

    private double CalculateLengthComplexityPenalty(string content, int kidAge)
    {
        if (content.Length > MAX_CONTENT_LENGTH)
        {
            return 0.2; // Penalty for extremely long content
        }

        // Very short content might be spam or low quality
        if (content.Length < 10)
        {
            return 0.1;
        }

        return 0.0;
    }

    private async Task<double> AnalyzeMediaSafetyAsync(List<string> mediaUrls)
    {
        // Placeholder for media analysis
        // In a real implementation, this would use image/video analysis APIs
        // For now, assume media is safe but slightly reduce score
        return 0.9;
    }

    private async Task<List<string>> AnalyzeMediaContentAsync(List<string> mediaUrls)
    {
        // Placeholder for media content analysis
        var issues = new List<string>();
        
        // In a real implementation, this would analyze images/videos for inappropriate content
        // For now, just check file extensions
        foreach (var url in mediaUrls)
        {
            if (url.EndsWith(".exe") || url.EndsWith(".zip"))
            {
                issues.Add("Potentially unsafe file type detected");
            }
        }

        return issues;
    }

    private bool HasRepetitiveContent(string content)
    {
        if (content.Length < 20) return false;
        
        // Simple repetition detection
        var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length < 5) return false;
        
        var wordGroups = words.GroupBy(w => w.ToLower());
        var maxFrequency = wordGroups.Max(g => g.Count());
        
        return maxFrequency > words.Length * 0.5; // More than 50% same word
    }

    private async Task<List<SafetyFlag>> GenerateSafetyFlagsAsync(string content, List<string> detectedIssues)
    {
        var flags = new List<SafetyFlag>();
        
        foreach (var issue in detectedIssues)
        {
            flags.Add(new SafetyFlag
            {
                Type = "content_safety",
                Severity = "medium",
                Confidence = 0.8,
                Description = issue,
                RecommendedAction = "review"
            });
        }

        return flags;
    }

    private double CalculateConfidenceLevel(string content, ContentSafetyResult result)
    {
        var baseConfidence = 0.7;
        
        // Higher confidence for clear educational content
        if (result.Category.PrimaryCategory == "educational")
        {
            baseConfidence += 0.2;
        }
        
        // Lower confidence for edge cases
        if (result.SafetyScore > 0.4 && result.SafetyScore < 0.6)
        {
            baseConfidence -= 0.2; // Uncertain cases
        }
        
        return Math.Clamp(baseConfidence, 0.0, 1.0);
    }

    private List<string> GenerateSafetyRecommendations(ContentSafetyResult result)
    {
        var recommendations = new List<string>();
        
        if (!result.IsSafe)
        {
            recommendations.Add("Content blocked for safety reasons");
            recommendations.Add("Consider reviewing with a parent or teacher");
        }
        else if (result.SafetyScore < 0.9)
        {
            recommendations.Add("Content may require parental guidance");
        }
        
        if (result.Category.PrimaryCategory == "educational")
        {
            recommendations.Add("Educational content - great for learning!");
        }
        
        return recommendations;
    }

    // Placeholder implementations for remaining interface methods
    public Task<bool> IsEducationalContentAsync(string content, int kidAge) => 
        Task.FromResult(_educationalKeywords.Values.SelectMany(x => x).Any(keyword => 
            content.Contains(keyword, StringComparison.OrdinalIgnoreCase)));

    public Task<double> CalculateEducationalScoreAsync(string content, int kidAge, string? gradeLevel = null) => 
        Task.FromResult(Math.Min(1.0, _educationalKeywords.Values.SelectMany(x => x).Count(keyword => 
            content.Contains(keyword, StringComparison.OrdinalIgnoreCase)) * 0.1));

    public Task<List<string>> SuggestEducationalImprovementsAsync(string content, int kidAge) => 
        Task.FromResult(new List<string> { "Add more educational keywords", "Include learning questions" });

    public Task<List<MongoPost>> GetAgeAppropriatePostsAsync(int kidAge, int count = 20) => 
        Task.FromResult(new List<MongoPost>());

    public Task<List<MongoPost>> GetSafePostsFromNetworkAsync(Guid kidAccountId, List<Guid> allowedUserIds, int count = 20) => 
        Task.FromResult(new List<MongoPost>());

    public Task<ContentCategory> CategorizeContentAsync(string content, List<string>? mediaUrls = null) => 
        Task.FromResult(new ContentCategory { PrimaryCategory = "general", CategoryConfidence = 0.7 });

    public Task<List<string>> ExtractTopicsAsync(string content) => 
        Task.FromResult(_educationalKeywords.Keys.Where(topic => 
            content.Contains(topic, StringComparison.OrdinalIgnoreCase)).ToList());

    public Task<AgeAppropriatenessResult> AssessAgeAppropriatenessAsync(string content, int targetAge) => 
        Task.FromResult(new AgeAppropriatenessResult 
        { 
            IsAppropriate = true, 
            RecommendedMinAge = Math.Max(5, targetAge - 2),
            RecommendedMaxAge = targetAge + 5
        });

    public Task<List<string>> DetectSensitiveTopicsAsync(string content) => 
        Task.FromResult(_inappropriatePatterns.Keys.Where(topic => 
            _inappropriatePatterns[topic].Any(keyword => 
                content.Contains(keyword, StringComparison.OrdinalIgnoreCase))).ToList());

    public Task<ModerationResult> ModerateContentInRealTimeAsync(string content, Guid authorId, List<string>? mediaUrls = null) => 
        Task.FromResult(new ModerationResult { ShouldBlock = false, OverallRiskScore = 0.1 });

    public Task<bool> RequiresHumanModerationAsync(string content, double aiConfidence) => 
        Task.FromResult(aiConfidence < 0.7);

    public Task<List<ModerationAction>> GetRecommendedModerationActionsAsync(string content, ModerationResult result) => 
        Task.FromResult(new List<ModerationAction>());

    public Task<EnhancedContentResult> EnhanceContentForKidsAsync(string content, int kidAge) => 
        Task.FromResult(new EnhancedContentResult { EnhancedContent = content });

    public Task<List<string>> GenerateEducationalQuestionsAsync(string content, int kidAge) => 
        Task.FromResult(new List<string> { "What did you learn from this?", "How does this relate to school?" });

    public Task<List<string>> SuggestRelatedLearningResourcesAsync(string content, int kidAge) => 
        Task.FromResult(new List<string> { "Khan Academy", "Educational websites" });

    public Task<string> SimplifyLanguageForAgeAsync(string content, int targetAge) => 
        Task.FromResult(content); // Placeholder

    public Task<List<ContentSafetyResult>> AnalyzeBatchContentAsync(List<string> contents, int kidAge) => 
        Task.FromResult(new List<ContentSafetyResult>());

    public Task<Dictionary<Guid, bool>> FilterPostIdsForKidAsync(List<Guid> postIds, Guid kidAccountId) => 
        Task.FromResult(new Dictionary<Guid, bool>());

    public Task<List<MongoPost>> ApplyBulkContentFilteringAsync(List<MongoPost> posts, List<ContentSafetyRule> rules) => 
        Task.FromResult(posts);

    public Task<ContentFilteringReport> GenerateFilteringReportAsync(Guid kidAccountId, DateTime startDate, DateTime endDate) => 
        Task.FromResult(new ContentFilteringReport());

    public Task<List<ContentTrend>> GetContentTrendsAsync(int kidAge, int days = 30) => 
        Task.FromResult(new List<ContentTrend>());

    public Task<EducationalEngagementMetrics> GetEducationalEngagementAsync(Guid kidAccountId, int days = 7) => 
        Task.FromResult(new EducationalEngagementMetrics());

    // Helper methods for educational analysis
    private string DetermineGradeLevel(int age, double educationalScore)
    {
        var baseGrade = Math.Max(0, age - 5); // Age 5 = Kindergarten
        if (educationalScore > 0.8) baseGrade += 1; // Advanced content
        if (educationalScore < 0.4) baseGrade -= 1; // Simpler content
        
        return baseGrade switch
        {
            0 => "Kindergarten",
            1 => "1st Grade",
            2 => "2nd Grade",
            3 => "3rd Grade",
            4 => "4th Grade",
            5 => "5th Grade",
            6 => "6th Grade",
            7 => "7th Grade",
            8 => "8th Grade",
            9 => "9th Grade",
            10 => "10th Grade",
            11 => "11th Grade",
            12 => "12th Grade",
            _ => "General"
        };
    }

    private double CalculateEngagementPotential(string content, int kidAge)
    {
        var potential = 0.5; // Base potential
        
        if (content.Contains('?')) potential += 0.2; // Questions engage
        if (content.Length > 50 && content.Length < 300) potential += 0.1; // Good length
        if (Regex.IsMatch(content, @"\b(fun|cool|awesome|amazing|interesting)\b", RegexOptions.IgnoreCase)) potential += 0.1;
        
        return Math.Clamp(potential, 0.0, 1.0);
    }

    private List<string> GenerateLearningObjectives(string content, List<string> subjectAreas)
    {
        var objectives = new List<string>();
        
        foreach (var subject in subjectAreas)
        {
            objectives.Add($"Learn about {subject} concepts");
            objectives.Add($"Develop {subject} vocabulary");
        }
        
        return objectives;
    }

    private List<string> GenerateSuggestedActivities(string content, int kidAge, List<string> subjectAreas)
    {
        var activities = new List<string>();
        
        activities.Add("Discuss with parents or teachers");
        activities.Add("Ask questions about the topic");
        
        if (subjectAreas.Contains("science"))
        {
            activities.Add("Try a simple science experiment");
        }
        
        if (subjectAreas.Contains("math"))
        {
            activities.Add("Practice related math problems");
        }
        
        return activities;
    }
}
