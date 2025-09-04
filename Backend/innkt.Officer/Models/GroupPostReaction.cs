using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Officer.Models;

public class GroupPostReaction
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string GroupPostId { get; set; } = string.Empty;

    [ForeignKey("GroupPostId")]
    public virtual GroupPost GroupPost { get; set; } = null!;

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey("UserId")]
    public virtual ApplicationUser User { get; set; } = null!;

    [Required]
    [StringLength(50)]
    public string ReactionType { get; set; } = string.Empty; // e.g., "like", "love", "laugh", "wow", "sad", "angry"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}



