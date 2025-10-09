using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Kinder.Models;

/// <summary>
/// Password lifecycle management for kid accounts
/// Tracks password changes, parent notifications, and independence day
/// </summary>
[Table("kid_password_settings")]
public class KidPasswordSettings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Kid account these settings belong to
    /// </summary>
    [Required]
    public Guid KidAccountId { get; set; }

    /// <summary>
    /// Whether kid has a password set
    /// </summary>
    public bool HasPassword { get; set; } = false;

    /// <summary>
    /// Whether password was set by parent (first time)
    /// </summary>
    public bool PasswordSetByParent { get; set; } = true;

    /// <summary>
    /// When the first password was set
    /// </summary>
    public DateTime? FirstPasswordSetAt { get; set; }

    /// <summary>
    /// When the password was last changed
    /// </summary>
    public DateTime? LastPasswordChangeAt { get; set; }

    /// <summary>
    /// Whether kid has changed password themselves
    /// </summary>
    public bool PasswordChangedByKid { get; set; } = false;

    /// <summary>
    /// Independence day - when kid gets full autonomy
    /// </summary>
    public DateTime? IndependenceDay { get; set; }

    /// <summary>
    /// Whether kid can change password (based on maturity)
    /// </summary>
    public bool CanChangePassword { get; set; } = false;

    /// <summary>
    /// Whether password access was revoked by parent
    /// </summary>
    public bool PasswordRevoked { get; set; } = false;

    /// <summary>
    /// When password was revoked
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Reason for password revocation
    /// </summary>
    public string? RevocationReason { get; set; }

    /// <summary>
    /// Parent notification settings
    /// </summary>
    public bool NotifyParentOnPasswordChange { get; set; } = true;

    /// <summary>
    /// Whether independence day has been reached
    /// </summary>
    public bool IndependenceDayReached { get; set; } = false;

    /// <summary>
    /// Password change history count
    /// </summary>
    public int PasswordChangeCount { get; set; } = 0;

    /// <summary>
    /// When these settings were created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When these settings were last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

