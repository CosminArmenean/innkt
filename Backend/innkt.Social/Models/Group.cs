using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Social.Models;

public class Group
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public Guid OwnerId { get; set; }
    
    [MaxLength(255)]
    public string? AvatarUrl { get; set; }
    
    [MaxLength(255)]
    public string? CoverImageUrl { get; set; }
    
    public bool IsPublic { get; set; } = true;
    
    public bool IsActive { get; set; } = true;
    
    public int MembersCount { get; set; } = 0;
    
    public int PostsCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public virtual ICollection<GroupPost> GroupPosts { get; set; } = new List<GroupPost>();
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
    [MaxLength(50)]
    public string Role { get; set; } = "member"; // owner, admin, moderator, member
    
    public bool IsActive { get; set; } = true;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
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
    
    public bool IsPinned { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    [ForeignKey("PostId")]
    public virtual Post Post { get; set; } = null!;
}
