using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Officer.Models;

public class GroupMember
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string GroupId { get; set; } = string.Empty;

    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; } = null!;

    [Required]
    public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;

    [Required]
    public GroupMemberStatus Status { get; set; } = GroupMemberStatus.Active;

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastActivityAt { get; set; }

    public string? InvitedByUserId { get; set; }

    [ForeignKey("InvitedByUserId")]
    public virtual ApplicationUser? InvitedByUser { get; set; }

    // For kid accounts, this tracks parental approval
    public bool? ParentalApprovalRequired { get; set; }

    public bool? ParentalApprovalGranted { get; set; }

    public string? ParentalApprovalNotes { get; set; }

    public DateTime? ParentalApprovalDate { get; set; }

    public string? ParentalApprovalByUserId { get; set; }

    [ForeignKey("ParentalApprovalByUserId")]
    public virtual ApplicationUser? ParentalApprovalByUser { get; set; }
}

public enum GroupMemberRole
{
    Member,
    Moderator,
    Admin,
    Owner
}

public enum GroupMemberStatus
{
    Pending,
    Active,
    Suspended,
    Banned,
    Left
}



