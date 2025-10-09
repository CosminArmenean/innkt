using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Kinder.Models;

/// <summary>
/// Kid login codes for QR code and code-based authentication
/// Enables password-less login for kids with parent-controlled expiration
/// </summary>
[Table("kid_login_codes")]
public class KidLoginCode
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The login code (6-digit alphanumeric or UUID)
    /// </summary>
    [Required]
    [StringLength(50)]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// QR code data (Base64 encoded image)
    /// </summary>
    public string? QRCodeData { get; set; }

    /// <summary>
    /// Kid account this code belongs to
    /// </summary>
    [Required]
    public Guid KidAccountId { get; set; }

    /// <summary>
    /// Parent who generated this code
    /// </summary>
    [Required]
    public Guid ParentId { get; set; }

    /// <summary>
    /// When this code expires (based on maturity level)
    /// </summary>
    [Required]
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Number of days until expiration (set by parent or maturity level)
    /// Low maturity: 7 days, Medium: 30 days, High: 90 days
    /// </summary>
    public int ExpirationDays { get; set; } = 7;

    /// <summary>
    /// Whether this code has been used
    /// </summary>
    public bool IsUsed { get; set; } = false;

    /// <summary>
    /// When this code was used (if applicable)
    /// </summary>
    public DateTime? UsedAt { get; set; }

    /// <summary>
    /// Whether this code was revoked by parent
    /// </summary>
    public bool IsRevoked { get; set; } = false;

    /// <summary>
    /// When this code was revoked (if applicable)
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// When this code was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Device information (user agent, IP) for security
    /// </summary>
    public string? DeviceInfo { get; set; }

    /// <summary>
    /// Last login attempt timestamp
    /// </summary>
    public DateTime? LastLoginAttempt { get; set; }

    /// <summary>
    /// Number of failed login attempts
    /// </summary>
    public int FailedAttempts { get; set; } = 0;

    // Navigation properties
    public virtual KidAccount KidAccount { get; set; } = null!;
}

