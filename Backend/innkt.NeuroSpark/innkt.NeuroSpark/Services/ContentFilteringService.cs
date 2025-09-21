using System.Text.RegularExpressions;

namespace innkt.NeuroSpark.Services;

/// <summary>
/// AI-powered content filtering service implementation
/// </summary>
public class ContentFilteringService : IContentFilteringService
{
    private readonly ILogger<ContentFilteringService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    // Safety thresholds
    private const double SAFETY_THRESHOLD = 0.8;
    private const double EDUCATIONAL_THRESHOLD = 0.6;

    public ContentFilteringService(
        ILogger<ContentFilteringService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    #region Content Safety Analysis

    public async Task<ContentSafetyResult> AnalyzeContentSafetyAsync(string content, List<string>? mediaUrls = null, int? kidAge = null)
    {
        try
        {
            _logger.LogInformation("🤖 Analyzing content safety for age {KidAge}", kidAge ?? 0);

            var result = new ContentSafetyResult
            {
                IsSafe = true,
                SafetyScore = 1.0,
                ConfidenceLevel = 0.9,
                AnalyzedAt = DateTime.UtcNow
            };

            // Basic content analysis
            result.SafetyScore = CalculateBasicSafetyScore(content);
            result.IsSafe = result.SafetyScore >= SAFETY_THRESHOLD;

            // Educational analysis
            result.IsEducational = await IsEducationalContentAsync(content, kidAge ?? 16);

            // Age appropriateness
            result.AgeAppropriateness = await AssessAgeAppropriatenessAsync(content, kidAge ?? 16);

            // Content categorization
            result.Category = await CategorizeContentAsync(content, mediaUrls);

            // Safety flags
            result.Flags = DetectSafetyFlags(content);

            _logger.LogInformation("✅ Content analysis complete: Safety={SafetyScore:F2}, Educational={IsEducational}", 
                result.SafetyScore, result.IsEducational);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error analyzing content safety");
            return new ContentSafetyResult { IsSafe = false, SafetyScore = 0.0 };
        }
    }

    public async Task<bool> IsContentSafeForKidAsync(string content, Guid kidAccountId, List<string>? mediaUrls = null)
    {
        try
        {
            // TODO: Get kid account details from Kinder service
            var kidAge = 12; // Default age for now
            
            var result = await AnalyzeContentSafetyAsync(content, mediaUrls, kidAge);
            return result.IsSafe && result.SafetyScore >= SAFETY_THRESHOLD;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error checking content safety for kid");
            return false; // Fail safe
        }
    }

    public async Task<double> CalculateContentSafetyScoreAsync(string content, int kidAge, List<string>? mediaUrls = null)
    {
        try
        {
            var result = await AnalyzeContentSafetyAsync(content, mediaUrls, kidAge);
            return result.SafetyScore;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error calculating content safety score");
            return 0.0; // Fail safe
        }
    }

    public Task<List<string>> DetectInappropriateContentAsync(string content, List<string>? mediaUrls = null)
    {
        var issues = new List<string>();
        
        // Basic inappropriate content detection
        var inappropriatePatterns = new[]
        {
            @"\b(violence|violent|fight|hurt)\b",
            @"\b(inappropriate|adult|mature)\b",
            @"\b(hate|racism|discrimination)\b",
            @"\b(drug|alcohol|smoking)\b"
        };

        foreach (var pattern in inappropriatePatterns)
        {
            if (Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase))
            {
                issues.Add($"Detected inappropriate content: {pattern}");
            }
        }

        return Task.FromResult(issues);
    }

    #endregion

    #region Educational Content Analysis

    public async Task<EducationalContentResult> AnalyzeEducationalValueAsync(string content, int kidAge, string? subject = null)
    {
        var result = new EducationalContentResult
        {
            IsEducational = IsEducationalContent(content),
            EducationalScore = CalculateEducationalScore(content),
            AnalyzedAt = DateTime.UtcNow
        };

        if (result.IsEducational)
        {
            result.EducationalTopics = await ExtractTopicsAsync(content);
            result.RecommendedGradeLevel = GetRecommendedGradeLevel(kidAge);
            result.SubjectAreas = DetermineSubjectAreas(content);
            result.LearningObjectives = GenerateLearningObjectives(content, kidAge);
        }

        return result;
    }

    public Task<bool> IsEducationalContentAsync(string content, int kidAge)
    {
        return Task.FromResult(IsEducationalContent(content));
    }

    public Task<double> CalculateEducationalScoreAsync(string content, int kidAge, string? gradeLevel = null)
    {
        return Task.FromResult(CalculateEducationalScore(content));
    }

    public Task<List<string>> SuggestEducationalImprovementsAsync(string content, int kidAge)
    {
        var suggestions = new List<string>
        {
            "Add more educational context",
            "Include learning objectives",
            "Provide age-appropriate explanations"
        };
        return Task.FromResult(suggestions);
    }

    #endregion

    #region Helper Methods

    private double CalculateBasicSafetyScore(string content)
    {
        if (string.IsNullOrWhiteSpace(content)) return 0.5;

        var score = 1.0;
        
        // Deduct for inappropriate content
        var inappropriateWords = new[] { "violence", "hate", "inappropriate", "adult" };
        foreach (var word in inappropriateWords)
        {
            if (content.ToLower().Contains(word))
                score -= 0.2;
        }

        // Boost for educational content
        var educationalWords = new[] { "learn", "education", "study", "science", "math" };
        foreach (var word in educationalWords)
        {
            if (content.ToLower().Contains(word))
                score += 0.1;
        }

        return Math.Max(0.0, Math.Min(1.0, score));
    }

    private bool IsEducationalContent(string content)
    {
        var educationalKeywords = new[] 
        { 
            "learn", "education", "study", "science", "math", "history", 
            "geography", "literature", "homework", "school", "teacher" 
        };
        
        return educationalKeywords.Any(keyword => 
            content.ToLower().Contains(keyword));
    }

    private double CalculateEducationalScore(string content)
    {
        if (!IsEducationalContent(content)) return 0.0;
        
        var educationalWords = content.ToLower().Split(' ')
            .Count(word => new[] { "learn", "education", "study", "science", "math" }.Contains(word));
        
        return Math.Min(1.0, educationalWords * 0.2);
    }

    private List<SafetyFlag> DetectSafetyFlags(string content)
    {
        var flags = new List<SafetyFlag>();
        
        if (content.ToLower().Contains("violence"))
        {
            flags.Add(new SafetyFlag
            {
                Type = "violence",
                Severity = "high",
                Confidence = 0.8,
                Description = "Content contains violence references"
            });
        }

        return flags;
    }

    private string GetRecommendedGradeLevel(int age) => age switch
    {
        <= 6 => "Kindergarten",
        7 => "1st Grade", 8 => "2nd Grade", 9 => "3rd Grade",
        10 => "4th Grade", 11 => "5th Grade", 12 => "6th Grade",
        _ => "Middle School+"
    };

    private List<string> DetermineSubjectAreas(string content)
    {
        var subjects = new List<string>();
        var contentLower = content.ToLower();
        
        if (contentLower.Contains("math") || contentLower.Contains("number")) subjects.Add("Mathematics");
        if (contentLower.Contains("science") || contentLower.Contains("experiment")) subjects.Add("Science");
        if (contentLower.Contains("history") || contentLower.Contains("past")) subjects.Add("History");
        if (contentLower.Contains("art") || contentLower.Contains("creative")) subjects.Add("Art");
        
        return subjects.Any() ? subjects : new List<string> { "General" };
    }

    private List<string> GenerateLearningObjectives(string content, int kidAge)
    {
        return new List<string>
        {
            "Understand key concepts",
            "Apply knowledge to real situations",
            "Develop critical thinking skills"
        };
    }

    #endregion

    #region Stub Implementations (Systematic completion)

    public Task<ContentCategory> CategorizeContentAsync(string content, List<string>? mediaUrls = null) => 
        Task.FromResult(new ContentCategory { PrimaryCategory = "general" });

    public Task<List<string>> ExtractTopicsAsync(string content) => 
        Task.FromResult(new List<string> { "general" });

    public Task<AgeAppropriatenessResult> AssessAgeAppropriatenessAsync(string content, int targetAge) => 
        Task.FromResult(new AgeAppropriatenessResult { IsAppropriate = true, RecommendedMinAge = targetAge });

    public Task<List<string>> DetectSensitiveTopicsAsync(string content) => 
        Task.FromResult(new List<string>());

    public Task<ModerationResult> ModerateContentInRealTimeAsync(string content, Guid authorId, List<string>? mediaUrls = null) => 
        Task.FromResult(new ModerationResult { ShouldBlock = false });

    public Task<bool> RequiresHumanModerationAsync(string content, double aiConfidence) => 
        Task.FromResult(aiConfidence < 0.7);

    public Task<List<ModerationAction>> GetRecommendedModerationActionsAsync(string content, ModerationResult result) => 
        Task.FromResult(new List<ModerationAction>());

    public Task<EnhancedContentResult> EnhanceContentForKidsAsync(string content, int kidAge) => 
        Task.FromResult(new EnhancedContentResult { EnhancedContent = content });

    public Task<List<string>> GenerateEducationalQuestionsAsync(string content, int kidAge) => 
        Task.FromResult(new List<string>());

    public Task<List<string>> SuggestRelatedLearningResourcesAsync(string content, int kidAge) => 
        Task.FromResult(new List<string>());

    public Task<string> SimplifyLanguageForAgeAsync(string content, int targetAge) => 
        Task.FromResult(content);

    public Task<List<ContentSafetyResult>> AnalyzeBatchContentAsync(List<string> contents, int kidAge) => 
        Task.FromResult(new List<ContentSafetyResult>());

    public Task<Dictionary<Guid, bool>> FilterPostIdsForKidAsync(List<Guid> postIds, Guid kidAccountId) => 
        Task.FromResult(new Dictionary<Guid, bool>());

    public Task<ContentFilteringReport> GenerateFilteringReportAsync(Guid kidAccountId, DateTime startDate, DateTime endDate) => 
        Task.FromResult(new ContentFilteringReport { KidAccountId = kidAccountId });

    public Task<List<ContentTrend>> GetContentTrendsAsync(int kidAge, int days = 30) => 
        Task.FromResult(new List<ContentTrend>());

    public Task<EducationalEngagementMetrics> GetEducationalEngagementAsync(Guid kidAccountId, int days = 7) => 
        Task.FromResult(new EducationalEngagementMetrics { KidAccountId = kidAccountId });

    #endregion
}

