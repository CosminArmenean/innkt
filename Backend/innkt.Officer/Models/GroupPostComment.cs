using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Officer.Models;

public class GroupPostComment
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string GroupPostId { get; set; } = string.Empty;

    [ForeignKey("GroupPostId")]
    public virtual GroupPost GroupPost { get; set; } = null!;

    [Required]
    public string AuthorId { get; set; } = string.Empty;

    [ForeignKey("AuthorId")]
    public virtual ApplicationUser Author { get; set; } = null!;

    [Required]
    [StringLength(1000)]
    public string Content { get; set; } = string.Empty;

    public string? ParentCommentId { get; set; }

    [ForeignKey("ParentCommentId")]
    public virtual GroupPostComment? ParentComment { get; set; }

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

    // For kid groups - parental approval
    public bool? RequiresParentalApproval { get; set; }

    public bool? ParentalApprovalGranted { get; set; }

    public string? ParentalApprovalNotes { get; set; }

    public DateTime? ParentalApprovalDate { get; set; }

    public string? ParentalApprovalByUserId { get; set; }

    [ForeignKey("ParentalApprovalByUserId")]
    public virtual ApplicationUser? ParentalApprovalByUser { get; set; }

    // Navigation properties
    public virtual ICollection<GroupPostComment> Replies { get; set; } = new List<GroupPostComment>();
}



