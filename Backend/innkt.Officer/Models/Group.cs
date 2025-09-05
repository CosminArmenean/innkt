using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Officer.Models;

public class Group
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    public GroupType Type { get; set; }

    [Required]
    public GroupPrivacy Privacy { get; set; }

    [Required]
    public string OwnerId { get; set; } = string.Empty;

    [ForeignKey("OwnerId")]
    public virtual ApplicationUser Owner { get; set; } = null!;

    public string? CoverImageUrl { get; set; }

    public string? GroupAvatarUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public virtual ICollection<GroupPost> Posts { get; set; } = new List<GroupPost>();
    public virtual ICollection<GroupInvitation> Invitations { get; set; } = new List<GroupInvitation>();
}

public enum GroupType
{
    General,
    Education,
    Kids,
    Business,
    Hobby,
    Community,
    Family
}

public enum GroupPrivacy
{
    Public,
    Private,
    Secret
}




