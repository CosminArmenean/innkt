namespace innkt.NeuroSpark.Services;

/// <summary>
/// Revolutionary @grok AI integration service for intelligent comment responses
/// Industry-first AI-powered social interaction enhancement
/// </summary>
public interface IGrokService
{
    // Core @grok functionality
    Task<GrokResponse> ProcessGrokMentionAsync(string comment, Guid postId, Guid authorId, string context = "");
    Task<bool> IsGrokMentionAsync(string content);
    Task<List<string>> ExtractGrokQuestionsAsync(string content);
    Task<GrokResponse> GenerateResponseAsync(string question, string context, Guid userId);

    // Advanced AI features
    Task<GrokResponse> GenerateEducationalResponseAsync(string question, int kidAge, string? subject = null);
    Task<GrokResponse> GenerateCreativeResponseAsync(string prompt, string style = "friendly");
    Task<GrokResponse> GenerateFactualResponseAsync(string question, bool requireSources = true);
    Task<GrokResponse> GenerateConversationalResponseAsync(string message, List<GrokConversationTurn> history);

    // Content analysis and enhancement
    Task<ContentAnalysisResult> AnalyzeContentForGrokAsync(string content);
    Task<List<GrokSuggestion>> GetResponseSuggestionsAsync(string question, Guid userId);
    Task<GrokResponse> RefineResponseAsync(GrokResponse originalResponse, string refinementRequest);
    Task<bool> ValidateResponseSafetyAsync(GrokResponse response, Guid userId);

    // Educational integration
    Task<GrokResponse> ExplainConceptAsync(string concept, int gradeLevel, string? subject = null);
    Task<List<GrokQuizQuestion>> GenerateQuizQuestionsAsync(string topic, int difficulty, int count = 5);
    Task<GrokResponse> ProvideHomeworkHelpAsync(string question, int gradeLevel, string subject);
    Task<GrokResponse> CreateLearningPathAsync(string topic, int startLevel, int targetLevel);

    // Personalization and learning
    Task<GrokPersonality> GetPersonalizedGrokAsync(Guid userId);
    Task<bool> UpdateGrokPersonalityAsync(Guid userId, GrokPersonality personality);
    Task<List<GrokInteraction>> GetUserGrokHistoryAsync(Guid userId, int days = 30);
    Task<GrokInsights> GenerateUserInsightsAsync(Guid userId);

    // Safety and moderation
    Task<bool> IsQuestionAppropriateAsync(string question, int? kidAge = null);
    Task<GrokModerationResult> ModerateGrokResponseAsync(GrokResponse response);
    Task<List<string>> GetSafeTopicsForAgeAsync(int age);
    Task<GrokResponse> FilterResponseForKidAsync(GrokResponse response, int kidAge);

    // Analytics and reporting
    Task<GrokUsageStats> GetUsageStatsAsync(DateTime startDate, DateTime endDate);
    Task<List<GrokTrend>> GetTrendingTopicsAsync(int days = 7);
    Task<GrokPerformanceMetrics> GetPerformanceMetricsAsync(Guid userId);
    Task<List<GrokFeedback>> GetUserFeedbackAsync(Guid userId);

    // Advanced features
    Task<GrokResponse> GenerateMultimodalResponseAsync(string question, List<string> mediaUrls);
    Task<GrokResponse> GenerateCodeExplanationAsync(string code, string language);
    Task<GrokResponse> GenerateStoryAsync(string prompt, int targetAge, string genre = "adventure");
    Task<GrokResponse> TranslateAndExplainAsync(string text, string fromLanguage, string toLanguage);
}

/// <summary>
/// Grok AI response with comprehensive metadata
/// </summary>
public class GrokResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Question { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public string ResponseType { get; set; } = "informational"; // informational, educational, creative, factual
    public double ConfidenceScore { get; set; } = 0.0; // 0.0 to 1.0
    public double SafetyScore { get; set; } = 1.0; // 0.0 to 1.0
    public List<string> Sources { get; set; } = new();
    public List<string> RelatedTopics { get; set; } = new();
    public List<string> FollowUpQuestions { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public string Model { get; set; } = "grok-1.5";
    public int TokensUsed { get; set; } = 0;
    public bool IsKidSafe { get; set; } = true;
    public bool RequiresHumanReview { get; set; } = false;
}

/// <summary>
/// Grok conversation turn for context
/// </summary>
public class GrokConversationTurn
{
    public string Role { get; set; } = string.Empty; // user, assistant
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Content analysis result for Grok processing
/// </summary>
public class ContentAnalysisResult
{
    public string ContentType { get; set; } = string.Empty; // question, statement, request, creative
    public List<string> DetectedIntents { get; set; } = new();
    public List<string> KeyTopics { get; set; } = new();
    public double ComplexityScore { get; set; } = 0.0; // 0.0 to 1.0
    public int EstimatedAge { get; set; } = 0; // Estimated age of questioner
    public string Language { get; set; } = "en";
    public bool RequiresSpecialHandling { get; set; } = false;
    public List<string> SpecialFlags { get; set; } = new();
}

/// <summary>
/// Grok response suggestions
/// </summary>
public class GrokSuggestion
{
    public string SuggestionText { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double RelevanceScore { get; set; } = 0.0;
    public string Reasoning { get; set; } = string.Empty;
}

/// <summary>
/// Grok quiz question for educational content
/// </summary>
public class GrokQuizQuestion
{
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public string CorrectAnswer { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public int Difficulty { get; set; } = 1; // 1-5 scale
    public string Subject { get; set; } = string.Empty;
    public List<string> LearningObjectives { get; set; } = new();
}

/// <summary>
/// Personalized Grok personality settings
/// </summary>
public class GrokPersonality
{
    public Guid UserId { get; set; }
    public string Tone { get; set; } = "friendly"; // friendly, professional, casual, enthusiastic
    public string ExplanationStyle { get; set; } = "detailed"; // brief, detailed, step-by-step, visual
    public List<string> PreferredTopics { get; set; } = new();
    public List<string> AvoidedTopics { get; set; } = new();
    public int ComplexityPreference { get; set; } = 3; // 1-5 scale
    public bool IncludeExamples { get; set; } = true;
    public bool IncludeFollowUps { get; set; } = true;
    public bool IncludeSources { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Grok interaction history
/// </summary>
public class GrokInteraction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Question { get; set; } = string.Empty;
    public GrokResponse Response { get; set; } = new();
    public bool UserSatisfied { get; set; } = true;
    public int UserRating { get; set; } = 0; // 1-5 stars
    public string? UserFeedback { get; set; }
    public DateTime InteractionTime { get; set; } = DateTime.UtcNow;
    public string Context { get; set; } = string.Empty; // post, comment, direct
}

/// <summary>
/// Grok insights for users
/// </summary>
public class GrokInsights
{
    public Guid UserId { get; set; }
    public List<string> TopInterests { get; set; } = new();
    public List<string> LearningPatterns { get; set; } = new();
    public double EngagementScore { get; set; } = 0.0;
    public List<string> RecommendedTopics { get; set; } = new();
    public List<string> SkillGaps { get; set; } = new();
    public Dictionary<string, int> TopicFrequency { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Grok moderation result
/// </summary>
public class GrokModerationResult
{
    public bool IsApproved { get; set; } = true;
    public List<string> Concerns { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public double SafetyScore { get; set; } = 1.0;
    public bool RequiresHumanReview { get; set; } = false;
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Grok usage statistics
/// </summary>
public class GrokUsageStats
{
    public int TotalQuestions { get; set; }
    public int TotalResponses { get; set; }
    public double AverageResponseTime { get; set; }
    public double AverageSatisfactionRating { get; set; }
    public Dictionary<string, int> TopCategories { get; set; } = new();
    public Dictionary<string, int> TopTopics { get; set; } = new();
    public int UniqueUsers { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

/// <summary>
/// Grok trending topics
/// </summary>
public class GrokTrend
{
    public string Topic { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public double PopularityScore { get; set; }
    public List<string> RelatedTopics { get; set; } = new();
    public string Category { get; set; } = string.Empty;
    public DateTime TrendDate { get; set; }
}

/// <summary>
/// Grok performance metrics for individual users
/// </summary>
public class GrokPerformanceMetrics
{
    public Guid UserId { get; set; }
    public int TotalInteractions { get; set; }
    public double AverageRating { get; set; }
    public List<string> MostAskedTopics { get; set; } = new();
    public double LearningProgress { get; set; } = 0.0;
    public int ConsecutiveDaysUsed { get; set; }
    public DateTime LastInteraction { get; set; }
}

/// <summary>
/// User feedback for Grok responses
/// </summary>
public class GrokFeedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid ResponseId { get; set; }
    public int Rating { get; set; } // 1-5 stars
    public string? Comment { get; set; }
    public List<string> Tags { get; set; } = new(); // helpful, accurate, creative, etc.
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}

