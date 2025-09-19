using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Social.Models.KidAccounts;

/// <summary>
/// Kid account with comprehensive safety features and adaptive AI protection
/// </summary>
[Table("kid_accounts")]
public class KidAccount
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; } // References Officer Service users table

    [Required]
    public Guid ParentId { get; set; } // References Officer Service users table

    [Required]
    [Range(5, 17)]
    public int Age { get; set; }

    [Required]
    public string SafetyLevel { get; set; } = "strict"; // strict, moderate, relaxed, adaptive

    // Time restrictions
    public int MaxDailyTimeMinutes { get; set; } = 120; // 2 hours default
    public TimeOnly AllowedHoursStart { get; set; } = new TimeOnly(6, 0); // 6 AM
    public TimeOnly AllowedHoursEnd { get; set; } = new TimeOnly(20, 0); // 8 PM
    public bool SchoolModeEnabled { get; set; } = true;

    // Social restrictions
    public int MaxConnections { get; set; } = 20;
    public int AgeGapLimitYears { get; set; } = 2;
    public bool ParentNetworkOnly { get; set; } = true;
    public bool RequireParentApproval { get; set; } = true;

    // Content filtering
    public bool EducationalContentOnly { get; set; } = false;
    public bool BlockMatureContent { get; set; } = true;
    public double MinContentSafetyScore { get; set; } = 0.8;
    public string[] AllowedTopics { get; set; } = Array.Empty<string>();
    public string[] BlockedTopics { get; set; } = Array.Empty<string>();

    // Independence day feature
    public DateTime? IndependenceDate { get; set; }
    public bool IndependenceDateSet { get; set; } = false;
    public double CurrentMaturityScore { get; set; } = 0.5;
    public double RequiredMaturityScore { get; set; } = 0.8;

    // AI adaptive features
    public bool AdaptiveSafetyEnabled { get; set; } = true;
    public double BehaviorScore { get; set; } = 0.5; // 0-1 scale
    public double TrustScore { get; set; } = 0.5; // 0-1 scale
    public double EducationalEngagement { get; set; } = 0.5; // 0-1 scale
    public DateTime LastBehaviorAssessment { get; set; } = DateTime.UtcNow;

    // Emergency features
    public string[] EmergencyContacts { get; set; } = Array.Empty<string>();
    public bool PanicButtonEnabled { get; set; } = true;
    public bool LocationSharingEnabled { get; set; } = true;

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; } // Parent who created the account
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual List<ParentApproval> PendingApprovals { get; set; } = new();
    public virtual List<SafetyEvent> SafetyEvents { get; set; } = new();
    public virtual List<BehaviorAssessment> BehaviorAssessments { get; set; } = new();
}

/// <summary>
/// Parent approval requests for kid account activities
/// </summary>
[Table("parent_approvals")]
public class ParentApproval
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid KidAccountId { get; set; }

    [Required]
    public Guid ParentId { get; set; }

    [Required]
    public string RequestType { get; set; } = string.Empty; // follow, message, content_share, group_join

    [Required]
    public Guid TargetUserId { get; set; }

    [Required]
    public string Status { get; set; } = "pending"; // pending, approved, denied, expired

    public string RequestData { get; set; } = "{}"; // JSON data
    public string? ParentNotes { get; set; }
    public DateTime? ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    public DateTime? ProcessedAt { get; set; }

    // Safety assessment
    public double SafetyScore { get; set; } = 1.0;
    public string[] SafetyFlags { get; set; } = Array.Empty<string>();
    public bool AutoApproved { get; set; } = false;

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

/// <summary>
/// Safety events and alerts for kid accounts
/// </summary>
[Table("safety_events")]
public class SafetyEvent
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid KidAccountId { get; set; }

    [Required]
    public string EventType { get; set; } = string.Empty; // behavior_change, suspicious_interaction, time_violation, content_flag

    [Required]
    public string Severity { get; set; } = "info"; // info, warning, alert, emergency

    [Required]
    public string Description { get; set; } = string.Empty;

    public string EventData { get; set; } = "{}"; // JSON metadata
    public bool ParentNotified { get; set; } = false;
    public bool Resolved { get; set; } = false;
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }

    // AI analysis
    public double RiskScore { get; set; } = 0.0; // 0-1 scale
    public string[] AiFlags { get; set; } = Array.Empty<string>();
    public bool RequiresHumanReview { get; set; } = false;

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

/// <summary>
/// AI-powered behavior assessment for adaptive safety
/// </summary>
[Table("behavior_assessments")]
public class BehaviorAssessment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid KidAccountId { get; set; }

    [Required]
    public DateTime AssessmentDate { get; set; } = DateTime.UtcNow;

    // Behavior metrics (0-1 scale)
    public double DigitalCitizenship { get; set; } = 0.5;
    public double ResponsibleBehavior { get; set; } = 0.5;
    public double ParentTrust { get; set; } = 0.5;
    public double EducationalEngagement { get; set; } = 0.5;
    public double SocialInteraction { get; set; } = 0.5;
    public double ContentQuality { get; set; } = 0.5;

    // Composite scores
    public double OverallMaturityScore { get; set; } = 0.5;
    public double SafetyRisk { get; set; } = 0.5;
    public double IndependenceReadiness { get; set; } = 0.0;

    // Assessment metadata
    public string AssessmentMethod { get; set; } = "ai_automatic"; // ai_automatic, parent_manual, teacher_input
    public string AssessmentData { get; set; } = "{}"; // JSON with detailed metrics
    public string? AssessorNotes { get; set; }

    // Recommendations
    public string[] RecommendedActions { get; set; } = Array.Empty<string>();
    public string[] SafetyRecommendations { get; set; } = Array.Empty<string>();
    public DateTime NextAssessmentDate { get; set; } = DateTime.UtcNow.AddDays(7);

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; } // Parent or system

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

/// <summary>
/// Educational integration for kid accounts
/// </summary>
[Table("educational_profiles")]
public class EducationalProfile
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid KidAccountId { get; set; }

    [Required]
    public string GradeLevel { get; set; } = string.Empty;

    public string? SchoolName { get; set; }
    public string? SchoolDistrict { get; set; }
    public Guid? TeacherId { get; set; } // References verified teacher account
    public string[] Subjects { get; set; } = Array.Empty<string>();
    public string[] LearningGoals { get; set; } = Array.Empty<string>();

    // Educational progress
    public double AcademicPerformance { get; set; } = 0.5;
    public double DigitalLiteracy { get; set; } = 0.5;
    public double CollaborationSkills { get; set; } = 0.5;
    public double CreativityScore { get; set; } = 0.5;

    // Parent-teacher communication
    public bool ParentTeacherChatEnabled { get; set; } = true;
    public bool HomeworkCollaborationEnabled { get; set; } = true;
    public bool ProgressSharingEnabled { get; set; } = true;

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

/// <summary>
/// Teacher verification and educational features
/// </summary>
[Table("teacher_profiles")]
public class TeacherProfile
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; } // References Officer Service users table

    [Required]
    public string VerificationStatus { get; set; } = "pending"; // pending, verified, rejected

    [Required]
    public string SchoolName { get; set; } = string.Empty;

    [Required]
    public string SchoolDistrict { get; set; } = string.Empty;

    public string? EducatorLicenseNumber { get; set; }
    public string[] SubjectsTeaching { get; set; } = Array.Empty<string>();
    public string[] GradeLevels { get; set; } = Array.Empty<string>();
    public string? VerificationDocuments { get; set; } // File paths

    // Educational features
    public bool CanCreateStudyGroups { get; set; } = true;
    public bool CanAssignHomework { get; set; } = true;
    public bool CanCommunicateWithParents { get; set; } = true;
    public bool CanAccessStudentProfiles { get; set; } = false; // Requires additional approval

    // Safety features
    public bool BackgroundCheckCompleted { get; set; } = false;
    public DateTime? BackgroundCheckDate { get; set; }
    public string? SafetyCertifications { get; set; }

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? VerifiedBy { get; set; } // Admin who verified
}

/// <summary>
/// Independence day transition tracking
/// </summary>
[Table("independence_transitions")]
public class IndependenceTransition
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid KidAccountId { get; set; }

    [Required]
    public Guid ParentId { get; set; }

    [Required]
    public DateTime IndependenceDate { get; set; }

    [Required]
    public string TransitionPhase { get; set; } = "planning"; // planning, warning, preparation, transition, celebration, monitoring

    // Maturity requirements
    public double RequiredMaturityScore { get; set; } = 0.8;
    public double CurrentMaturityScore { get; set; } = 0.5;
    public bool EducationalGoalsMet { get; set; } = false;
    public bool SafetyTestPassed { get; set; } = false;
    public bool ParentFinalApproval { get; set; } = false;

    // Transition settings
    public int WarningPeriodDays { get; set; } = 30;
    public int PreparationPeriodDays { get; set; } = 7;
    public int MonitoringPeriodDays { get; set; } = 90;
    public bool CanRevert { get; set; } = true;

    // Celebration features
    public string? ParentMessage { get; set; }
    public bool DigitalCertificateGenerated { get; set; } = false;
    public string? CelebrationData { get; set; } // JSON with celebration details

    // Status tracking
    public bool IsCompleted { get; set; } = false;
    public bool WasReverted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }
    public string? RevertReason { get; set; }

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

/// <summary>
/// Content safety rules and AI analysis
/// </summary>
[Table("content_safety_rules")]
public class ContentSafetyRule
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string RuleType { get; set; } = string.Empty; // keyword, pattern, image_analysis, context

    [Required]
    public string RuleContent { get; set; } = string.Empty; // The actual rule content

    [Required]
    public string Action { get; set; } = "block"; // block, flag, parent_notify, ai_review

    [Required]
    public string Severity { get; set; } = "medium"; // low, medium, high, critical

    public int MinAge { get; set; } = 5;
    public int MaxAge { get; set; } = 17;
    public string[] ApplicableContexts { get; set; } = Array.Empty<string>(); // post, comment, message, profile

    // AI configuration
    public double ConfidenceThreshold { get; set; } = 0.7;
    public bool RequiresHumanReview { get; set; } = false;
    public string? AiModelVersion { get; set; }

    // Rule metadata
    public bool IsActive { get; set; } = true;
    public int Priority { get; set; } = 100; // Higher number = higher priority
    public string? Description { get; set; }
    public string? Examples { get; set; }

    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; } // Admin who created the rule
}
