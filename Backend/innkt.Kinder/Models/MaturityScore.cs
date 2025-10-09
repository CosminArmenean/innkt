using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Kinder.Models;

/// <summary>
/// Maturity score calculation for kid accounts
/// Formula: Age (0-40) + Parent Assessment (0-30) + Behavioral (0-30) = Total (0-100)
/// Low: 0-40, Medium: 40-70, High: 70+
/// </summary>
[Table("maturity_scores")]
public class MaturityScore
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Kid account this score belongs to
    /// </summary>
    [Required]
    public Guid KidAccountId { get; set; }

    /// <summary>
    /// Age-based score (0-40 points)
    /// Formula: Math.min(40, Math.max(0, (age - 6) * 4))
    /// Age 6 = 0 points, Age 16 = 40 points
    /// </summary>
    [Range(0, 40)]
    public int AgeScore { get; set; } = 0;

    /// <summary>
    /// Parent assessment score (0-30 points)
    /// Parent rates on 0-5 scale, multiplied by 6
    /// 0 = 0 points, 5 = 30 points
    /// </summary>
    [Range(0, 30)]
    public int ParentAssessment { get; set; } = 0;

    /// <summary>
    /// Parent's rating (0-5 scale)
    /// </summary>
    [Range(0, 5)]
    public int ParentRating { get; set; } = 0;

    /// <summary>
    /// Behavioral tracking score (0-30 points)
    /// Calculated from BehaviorMetrics
    /// </summary>
    [Range(0, 30)]
    public int BehavioralScore { get; set; } = 0;

    /// <summary>
    /// Total maturity score (0-100 points)
    /// AgeScore + ParentAssessment + BehavioralScore
    /// </summary>
    [Range(0, 100)]
    public int TotalScore { get; set; } = 0;

    /// <summary>
    /// Maturity level based on total score
    /// Low: 0-40, Medium: 40-70, High: 70+
    /// </summary>
    [Required]
    [StringLength(10)]
    public string Level { get; set; } = "low"; // low, medium, high

    /// <summary>
    /// Behavioral metrics breakdown
    /// </summary>
    [Range(0, 100)]
    public double TimeManagement { get; set; } = 50; // 0-100 scale

    [Range(0, 100)]
    public double ContentAppropriateness { get; set; } = 50; // 0-100 scale

    [Range(0, 100)]
    public double SocialInteraction { get; set; } = 50; // 0-100 scale

    [Range(0, 100)]
    public double ResponsibilityScore { get; set; } = 50; // 0-100 scale

    [Range(0, 100)]
    public double SecurityAwareness { get; set; } = 50; // 0-100 scale

    /// <summary>
    /// Assessment notes from parent or system
    /// </summary>
    public string? AssessmentNotes { get; set; }

    /// <summary>
    /// When this score was last calculated
    /// </summary>
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Who last updated this score (parent or system)
    /// </summary>
    public Guid? UpdatedBy { get; set; }

    /// <summary>
    /// Whether this assessment was automatic or manual
    /// </summary>
    public string AssessmentMethod { get; set; } = "automatic"; // automatic, manual, parent_review

    /// <summary>
    /// Previous maturity level (for tracking progression)
    /// </summary>
    public string? PreviousLevel { get; set; }

    /// <summary>
    /// When the level last changed
    /// </summary>
    public DateTime? LevelChangedAt { get; set; }

    /// <summary>
    /// When this score was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

