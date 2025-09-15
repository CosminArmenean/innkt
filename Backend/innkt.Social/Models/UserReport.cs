using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Social.Models;

public class UserReport
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid ReporterId { get; set; }
    
    [Required]
    public Guid ReportedUserId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Reason { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public string Status { get; set; } = "pending"; // pending, reviewed, resolved, dismissed
    
    public string? AdminNotes { get; set; }
    
    public DateTime? ReviewedAt { get; set; }
    
    public Guid? ReviewedBy { get; set; }
    
    // Ensure user cannot report themselves
    public bool IsValid => ReporterId != ReportedUserId;
}
