using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Officer.Models;

public class GroupPost
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string GroupId { get; set; } = string.Empty;

    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    [ForeignKey("AuthorId")]
    public virtual ApplicationUser Author { get; set; } = null!;

    [StringLength(1000)]
    public string? TextContent { get; set; }

    public string? ImageUrl { get; set; }

    public string? VideoUrl { get; set; }

    public string? DocumentUrl { get; set; }

    [Required]
    public PostContentType ContentType { get; set; } = PostContentType.Text;

    [Required]
    public PostVisibility Visibility { get; set; } = PostVisibility.GroupMembers;

    public bool IsPinned { get; set; } = false;

    public bool IsEdited { get; set; } = false;

    public DateTime? EditedAt { get; set; }

    public string? EditReason { get; set; }

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    public string? DeletedByUserId { get; set; }

    [ForeignKey("DeletedByUserId")]
    public virtual ApplicationUser? DeletedByUser { get; set; }

    public string? DeletionReason { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // For kid groups - QR code scanning content
    public string? QrCodeIdentifier { get; set; }

    public string? QrCodeScannedByUserId { get; set; }

    [ForeignKey("QrCodeScannedByUserId")]
    public virtual ApplicationUser? QrCodeScannedByUser { get; set; }

    public DateTime? QrCodeScannedAt { get; set; }

    public string? QrCodeLocation { get; set; }

    // For kid groups - parental approval
    public bool? RequiresParentalApproval { get; set; }

    public bool? ParentalApprovalGranted { get; set; }

    public string? ParentalApprovalNotes { get; set; }

    public DateTime? ParentalApprovalDate { get; set; }

    public string? ParentalApprovalByUserId { get; set; }

    [ForeignKey("ParentalApprovalByUserId")]
    public virtual ApplicationUser? ParentalApprovalByUser { get; set; }

    // Navigation properties
    public virtual ICollection<GroupPostReaction> Reactions { get; set; } = new List<GroupPostReaction>();
    public virtual ICollection<GroupPostComment> Comments { get; set; } = new List<GroupPostComment>();
}

public enum PostContentType
{
    Text,
    Image,
    Video,
    Document,
    Mixed
}

public enum PostVisibility
{
    Public,
    GroupMembers,
    GroupAdmins,
    Private
}



