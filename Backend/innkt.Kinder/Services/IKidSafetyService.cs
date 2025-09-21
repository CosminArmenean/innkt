using innkt.Kinder.Models;

namespace innkt.Kinder.Services;

/// <summary>
/// Comprehensive kid account safety service with AI-adaptive protection
/// Implements revolutionary safety features for child protection
/// </summary>
public interface IKidSafetyService
{
    // Kid account management
    Task<KidAccount> CreateKidAccountAsync(Guid parentId, Guid userId, int age, string safetyLevel = "strict");
    Task<KidAccount?> GetKidAccountAsync(Guid kidAccountId);
    Task<KidAccount?> GetKidAccountByUserIdAsync(Guid userId);
    Task<bool> IsKidAccountAsync(Guid userId);
    Task<bool> UpdateKidAccountSettingsAsync(Guid kidAccountId, Guid parentId, KidAccount updatedSettings);

    // Parent approval system
    Task<ParentApproval> CreateApprovalRequestAsync(Guid kidAccountId, string requestType, Guid targetUserId, Dictionary<string, object> requestData);
    Task<bool> ProcessApprovalRequestAsync(Guid approvalId, Guid parentId, bool approved, string? notes = null);
    Task<List<ParentApproval>> GetPendingApprovalRequestsAsync(Guid parentId);
    Task<List<ParentApproval>> GetKidApprovalHistoryAsync(Guid kidAccountId, int page = 1, int pageSize = 20);

    // Content safety and filtering
    Task<bool> IsContentSafeForKidAsync(string content, Guid kidAccountId, List<string>? mediaUrls = null);
    Task<double> CalculateContentSafetyScoreAsync(string content, int kidAge, List<string>? mediaUrls = null);
    Task<bool> IsUserSafeForKidAsync(Guid targetUserId, Guid kidAccountId);
    Task<List<Guid>> GetSafeUserSuggestionsAsync(Guid kidAccountId, int limit = 10);

    // Behavior monitoring and assessment
    Task<BehaviorAssessment> CreateBehaviorAssessmentAsync(Guid kidAccountId, string assessmentMethod = "ai_automatic");
    Task<double> CalculateMaturityScoreAsync(Guid kidAccountId);
    Task<bool> UpdateBehaviorMetricsAsync(Guid kidAccountId, Dictionary<string, double> metrics);
    Task<List<BehaviorAssessment>> GetBehaviorHistoryAsync(Guid kidAccountId, int days = 30);

    // Safety events and alerts
    Task<SafetyEvent> CreateSafetyEventAsync(Guid kidAccountId, string eventType, string severity, string description, Dictionary<string, object>? eventData = null);
    Task<List<SafetyEvent>> GetSafetyEventsAsync(Guid kidAccountId, int days = 7);
    Task<bool> ResolveSafetyEventAsync(Guid eventId, Guid parentId, string resolutionNotes);

    // Time and usage restrictions
    Task<bool> CanKidAccessPlatformAsync(Guid kidAccountId);
    Task<int> GetKidDailyUsageMinutesAsync(Guid kidAccountId);
    Task<bool> IsWithinAllowedHoursAsync(Guid kidAccountId);
    Task<bool> UpdateUsageTimeAsync(Guid kidAccountId, int additionalMinutes);

    // Independence day system (REVOLUTIONARY FEATURE)
    Task<IndependenceTransition> CreateIndependenceTransitionAsync(Guid kidAccountId, Guid parentId, DateTime independenceDate);
    Task<bool> UpdateIndependenceProgressAsync(Guid transitionId, Dictionary<string, bool> requirements);
    Task<bool> ProcessIndependenceDayAsync(Guid transitionId, Guid parentId);
    Task<List<IndependenceTransition>> GetUpcomingIndependenceDaysAsync(int daysAhead = 30);

    // Educational integration
    Task<EducationalProfile> CreateEducationalProfileAsync(Guid kidAccountId, string gradeLevel, string? schoolName = null);
    Task<bool> ConnectWithTeacherAsync(Guid kidAccountId, Guid teacherId, Guid parentId);
    Task<List<Guid>> GetEducationalConnectionsAsync(Guid kidAccountId);

    // Emergency and safety features
    Task<bool> TriggerPanicButtonAsync(Guid kidAccountId, string? message = null);
    Task<bool> SendEmergencyAlertAsync(Guid kidAccountId, string alertType, string description);
    Task<List<string>> GetEmergencyContactsAsync(Guid kidAccountId);

    // Analytics and reporting
    Task<KidSafetyReport> GenerateWeeklySafetyReportAsync(Guid kidAccountId);
    Task<List<KidSafetyInsight>> GetSafetyInsightsAsync(Guid parentId);
    Task<KidActivitySummary> GetKidActivitySummaryAsync(Guid kidAccountId, int days = 7);

    // AI and machine learning
    Task<double> PredictSafetyRiskAsync(Guid kidAccountId, string context);
    Task<List<string>> GetAiSafetyRecommendationsAsync(Guid kidAccountId);
    Task<bool> TrainBehaviorModelAsync(Guid kidAccountId, Dictionary<string, object> trainingData);
}

/// <summary>
/// Weekly safety report for parents
/// </summary>
public class KidSafetyReport
{
    public Guid KidAccountId { get; set; }
    public Guid ParentId { get; set; }
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }

    // Activity summary
    public int TotalActiveMinutes { get; set; }
    public int PostsCreated { get; set; }
    public int CommentsReceived { get; set; }
    public int MessagesExchanged { get; set; }
    public int NewConnections { get; set; }

    // Safety metrics
    public double OverallSafetyScore { get; set; }
    public int SafetyEvents { get; set; }
    public int ParentInterventions { get; set; }
    public double MaturityProgress { get; set; }

    // Educational metrics
    public double EducationalEngagement { get; set; }
    public int LearningAchievements { get; set; }
    public double TeacherFeedback { get; set; }

    // Recommendations
    public List<string> ParentRecommendations { get; set; } = new();
    public List<string> SafetyImprovements { get; set; } = new();
    public List<string> EducationalOpportunities { get; set; } = new();

    // Trend analysis
    public string TrendDirection { get; set; } = "stable"; // improving, stable, concerning
    public string? TrendExplanation { get; set; }
}

/// <summary>
/// Safety insights for parent dashboard
/// </summary>
public class KidSafetyInsight
{
    public string InsightType { get; set; } = string.Empty; // behavior_trend, safety_improvement, concern_alert
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
    public string ActionRequired { get; set; } = "none"; // none, review, approve, intervene
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

/// <summary>
/// Kid activity summary for monitoring
/// </summary>
public class KidActivitySummary
{
    public Guid KidAccountId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    // Platform usage
    public int TotalMinutesActive { get; set; }
    public int SessionsCount { get; set; }
    public double AverageSessionLength { get; set; }

    // Content interaction
    public int PostsViewed { get; set; }
    public int PostsCreated { get; set; }
    public int CommentsPosted { get; set; }
    public int CommentsReceived { get; set; }

    // Social interaction
    public int MessagesExchanged { get; set; }
    public int NewConnectionRequests { get; set; }
    public int ApprovedConnections { get; set; }

    // Safety metrics
    public int SafetyEventsTriggered { get; set; }
    public double ContentSafetyScore { get; set; }
    public double BehaviorScore { get; set; }

    // Educational metrics
    public int EducationalContentViewed { get; set; }
    public int LearningAchievements { get; set; }
    public double EducationalEngagementScore { get; set; }
}