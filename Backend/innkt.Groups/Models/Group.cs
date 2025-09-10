using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Groups.Models;

public class Group
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [MaxLength(500)]
    public string? AvatarUrl { get; set; }
    
    [MaxLength(500)]
    public string? CoverImageUrl { get; set; }
    
    [Required]
    public Guid OwnerId { get; set; }
    
    public bool IsPublic { get; set; } = true;
    
    public bool IsVerified { get; set; } = false;
    
    public int MembersCount { get; set; } = 0;
    
    public int PostsCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public virtual ICollection<GroupPost> GroupPosts { get; set; } = new List<GroupPost>();
    public virtual ICollection<GroupInvitation> Invitations { get; set; } = new List<GroupInvitation>();
}

public class GroupMember
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "member"; // owner, admin, moderator, member
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastSeenAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
}

public class GroupPost
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid PostId { get; set; }
    
    [Required]
    public Guid UserId { get; set; } // User who posted in the group
    
    public bool IsAnnouncement { get; set; } = false;
    
    public bool IsPinned { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
}

public class GroupInvitation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid InvitedUserId { get; set; }
    
    [Required]
    public Guid InvitedByUserId { get; set; }
    
    [MaxLength(500)]
    public string? Message { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending"; // pending, accepted, rejected, expired
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? RespondedAt { get; set; }
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
}

public class GroupSettings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    public bool AllowMemberPosts { get; set; } = true;
    
    public bool AllowMemberInvites { get; set; } = true;
    
    public bool RequireApprovalForPosts { get; set; } = false;
    
    public bool RequireApprovalForMembers { get; set; } = false;
    
    public bool AllowAnonymousPosts { get; set; } = false;
    
    public bool AllowFileSharing { get; set; } = true;
    
    public bool AllowReactions { get; set; } = true;
    
    public bool AllowComments { get; set; } = true;
    
    public int MaxMembers { get; set; } = 1000;
    
    public int MaxPostLength { get; set; } = 5000;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
}
