using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Social.Models;

public class Follow
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid FollowerId { get; set; }
    
    [Required]
    public Guid FollowingId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Ensure user cannot follow themselves
    public bool IsValid => FollowerId != FollowingId;
}
