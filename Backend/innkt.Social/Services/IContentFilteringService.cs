using innkt.Social.Models.MongoDB;
using innkt.Social.Models.KidAccounts;

namespace innkt.Social.Services;

/// <summary>
/// AI-powered content filtering service for kid account safety
/// Implements comprehensive content analysis and educational prioritization
/// </summary>
public interface IContentFilteringService
{
    // Content safety analysis
    Task<ContentSafetyResult> AnalyzeContentSafetyAsync(string content, List<string>? mediaUrls = null, int? kidAge = null);
    Task<bool> IsContentSafeForKidAsync(string content, Guid kidAccountId, List<string>? mediaUrls = null);
    Task<double> CalculateContentSafetyScoreAsync(string content, int kidAge, List<string>? mediaUrls = null);
    Task<List<string>> DetectInappropriateContentAsync(string content, List<string>? mediaUrls = null);

    // Educational content analysis
    Task<EducationalContentResult> AnalyzeEducationalValueAsync(string content, int kidAge, string? subject = null);
    Task<bool> IsEducationalContentAsync(string content, int kidAge);
    Task<double> CalculateEducationalScoreAsync(string content, int kidAge, string? gradeLevel = null);
    Task<List<string>> SuggestEducationalImprovementsAsync(string content, int kidAge);

    // Feed filtering for kid accounts
    Task<List<MongoPost>> FilterPostsForKidAsync(List<MongoPost> posts, Guid kidAccountId);
    Task<List<MongoPost>> GetEducationalPostsAsync(Guid kidAccountId, int count = 20);
    Task<List<MongoPost>> GetAgeAppropriatePostsAsync(int kidAge, int count = 20);
    Task<List<MongoPost>> GetSafePostsFromNetworkAsync(Guid kidAccountId, List<Guid> allowedUserIds, int count = 20);

    // Content categorization
    Task<ContentCategory> CategorizeContentAsync(string content, List<string>? mediaUrls = null);
    Task<List<string>> ExtractTopicsAsync(string content);
    Task<AgeAppropriatenessResult> AssessAgeAppropriatenessAsync(string content, int targetAge);
    Task<List<string>> DetectSensitiveTopicsAsync(string content);

    // Real-time content moderation
    Task<ModerationResult> ModerateContentInRealTimeAsync(string content, Guid authorId, List<string>? mediaUrls = null);
    Task<bool> RequiresHumanModerationAsync(string content, double aiConfidence);
    Task<List<ModerationAction>> GetRecommendedModerationActionsAsync(string content, ModerationResult result);

    // Content enhancement for kids
    Task<EnhancedContentResult> EnhanceContentForKidsAsync(string content, int kidAge);
    Task<List<string>> GenerateEducationalQuestionsAsync(string content, int kidAge);
    Task<List<string>> SuggestRelatedLearningResourcesAsync(string content, int kidAge);
    Task<string> SimplifyLanguageForAgeAsync(string content, int targetAge);

    // Batch processing
    Task<List<ContentSafetyResult>> AnalyzeBatchContentAsync(List<string> contents, int kidAge);
    Task<Dictionary<Guid, bool>> FilterPostIdsForKidAsync(List<Guid> postIds, Guid kidAccountId);
    Task<List<MongoPost>> ApplyBulkContentFilteringAsync(List<MongoPost> posts, List<ContentSafetyRule> rules);

    // Analytics and reporting
    Task<ContentFilteringReport> GenerateFilteringReportAsync(Guid kidAccountId, DateTime startDate, DateTime endDate);
    Task<List<ContentTrend>> GetContentTrendsAsync(int kidAge, int days = 30);
    Task<EducationalEngagementMetrics> GetEducationalEngagementAsync(Guid kidAccountId, int days = 7);
}

/// <summary>
/// Content safety analysis result
/// </summary>
public class ContentSafetyResult
{
    public bool IsSafe { get; set; }
    public double SafetyScore { get; set; } // 0.0 to 1.0
    public double ConfidenceLevel { get; set; } // AI confidence in assessment
    public List<SafetyFlag> Flags { get; set; } = new();
    public List<string> DetectedIssues { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public ContentCategory Category { get; set; } = new();
    public AgeAppropriatenessResult AgeAppropriateness { get; set; } = new();
    public bool RequiresHumanReview { get; set; }
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Educational content analysis result
/// </summary>
public class EducationalContentResult
{
    public bool IsEducational { get; set; }
    public double EducationalScore { get; set; } // 0.0 to 1.0
    public List<string> EducationalTopics { get; set; } = new();
    public List<string> LearningObjectives { get; set; } = new();
    public string? RecommendedGradeLevel { get; set; }
    public List<string> SubjectAreas { get; set; } = new();
    public double EngagementPotential { get; set; }
    public List<string> SuggestedActivities { get; set; } = new();
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Content category classification
/// </summary>
public class ContentCategory
{
    public string PrimaryCategory { get; set; } = string.Empty; // educational, entertainment, social, news, etc.
    public List<string> SecondaryCategories { get; set; } = new();
    public double CategoryConfidence { get; set; }
    public List<string> DetectedTopics { get; set; } = new();
    public string ContentType { get; set; } = string.Empty; // text, image, video, mixed
    public bool IsUserGenerated { get; set; } = true;
}

/// <summary>
/// Age appropriateness assessment
/// </summary>
public class AgeAppropriatenessResult
{
    public bool IsAppropriate { get; set; }
    public int RecommendedMinAge { get; set; }
    public int RecommendedMaxAge { get; set; }
    public List<string> AgeSpecificConcerns { get; set; } = new();
    public double MaturityLevelRequired { get; set; } // 0.0 to 1.0
    public List<string> ParentalGuidanceReasons { get; set; } = new();
}

/// <summary>
/// Safety flag for content issues
/// </summary>
public class SafetyFlag
{
    public string Type { get; set; } = string.Empty; // violence, inappropriate_language, mature_themes, etc.
    public string Severity { get; set; } = string.Empty; // low, medium, high, critical
    public double Confidence { get; set; }
    public string Description { get; set; } = string.Empty;
    public List<string> Keywords { get; set; } = new();
    public string RecommendedAction { get; set; } = string.Empty; // block, flag, parent_review, etc.
}

/// <summary>
/// Real-time moderation result
/// </summary>
public class ModerationResult
{
    public bool ShouldBlock { get; set; }
    public bool ShouldFlag { get; set; }
    public bool RequiresHumanReview { get; set; }
    public List<ModerationFlag> Flags { get; set; } = new();
    public double OverallRiskScore { get; set; }
    public string RecommendedAction { get; set; } = string.Empty;
    public List<string> BlockingReasons { get; set; } = new();
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Moderation flag details
/// </summary>
public class ModerationFlag
{
    public string Category { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string Evidence { get; set; } = string.Empty;
    public bool AutoGenerated { get; set; } = true;
}

/// <summary>
/// Recommended moderation action
/// </summary>
public class ModerationAction
{
    public string Action { get; set; } = string.Empty; // block, warn, educate, parent_notify
    public string Reason { get; set; } = string.Empty;
    public int Priority { get; set; }
    public bool RequiresParentApproval { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
}

/// <summary>
/// Enhanced content result for kids
/// </summary>
public class EnhancedContentResult
{
    public string EnhancedContent { get; set; } = string.Empty;
    public List<string> AddedEducationalElements { get; set; } = new();
    public List<string> GeneratedQuestions { get; set; } = new();
    public List<string> LearningResources { get; set; } = new();
    public string SimplifiedLanguage { get; set; } = string.Empty;
    public List<string> VocabularyHelp { get; set; } = new();
    public double EngagementScore { get; set; }
}

/// <summary>
/// Content filtering report for parents
/// </summary>
public class ContentFilteringReport
{
    public Guid KidAccountId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalPostsAnalyzed { get; set; }
    public int PostsBlocked { get; set; }
    public int PostsFlagged { get; set; }
    public int EducationalPostsShown { get; set; }
    public double AverageSafetyScore { get; set; }
    public double AverageEducationalScore { get; set; }
    public List<string> TopBlockingReasons { get; set; } = new();
    public List<string> PopularEducationalTopics { get; set; } = new();
    public Dictionary<string, int> CategoryBreakdown { get; set; } = new();
    public List<ContentTrend> Trends { get; set; } = new();
}

/// <summary>
/// Content trend analysis
/// </summary>
public class ContentTrend
{
    public string Topic { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Frequency { get; set; }
    public double SafetyScore { get; set; }
    public double EducationalValue { get; set; }
    public string TrendDirection { get; set; } = string.Empty; // increasing, decreasing, stable
    public List<string> RelatedTopics { get; set; } = new();
}

/// <summary>
/// Educational engagement metrics
/// </summary>
public class EducationalEngagementMetrics
{
    public Guid KidAccountId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int EducationalPostsViewed { get; set; }
    public int EducationalPostsEngaged { get; set; } // liked, commented, shared
    public double EngagementRate { get; set; }
    public List<string> PreferredSubjects { get; set; } = new();
    public List<string> LearningAchievements { get; set; } = new();
    public double KnowledgeGrowthScore { get; set; }
    public List<string> RecommendedNextTopics { get; set; } = new();
}
