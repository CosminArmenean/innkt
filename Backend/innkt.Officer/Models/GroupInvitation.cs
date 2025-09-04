using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Officer.Models;

public class GroupInvitation
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string GroupId { get; set; } = string.Empty;

    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;

    [Required]
    public string InvitedUserId { get; set; } = string.Empty;

    [ForeignKey("InvitedUserId")]
    public virtual ApplicationUser InvitedUser { get; set; } = null!;

    [Required]
    public string InvitedByUserId { get; set; } = string.Empty;

    [ForeignKey("InvitedByUserId")]
    public virtual ApplicationUser InvitedByUser { get; set; } = null!;

    [Required]
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public DateTime InvitedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public string? Message { get; set; }

    // For kid groups - QR code invitation
    public string? QrCodeData { get; set; }

    public string? QrCodeLocation { get; set; }

    public DateTime? QrCodeGeneratedAt { get; set; }

    public DateTime? QrCodeScannedAt { get; set; }

    public string? QrCodeScannedByUserId { get; set; }

    [ForeignKey("QrCodeScannedByUserId")]
    public virtual ApplicationUser? QrCodeScannedByUser { get; set; }

    // For kid groups - parental approval
    public bool? RequiresParentalApproval { get; set; }

    public bool? ParentalApprovalGranted { get; set; }

    public string? ParentalApprovalNotes { get; set; }

    public DateTime? ParentalApprovalDate { get; set; }

    public string? ParentalApprovalByUserId { get; set; }

    [ForeignKey("ParentalApprovalByUserId")]
    public virtual ApplicationUser? ParentalApprovalByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public enum InvitationStatus
{
    Pending,
    Accepted,
    Declined,
    Expired,
    Cancelled
}



