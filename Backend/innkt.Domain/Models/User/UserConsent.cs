using System.ComponentModel.DataAnnotations;
using innkt.Common.Models;

namespace innkt.Domain.Models.User;

public class UserConsent : BaseEntity
{
    public Guid UserId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string ConsentType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string ConsentDescription { get; set; } = string.Empty;
    
    public bool IsGranted { get; set; }
    
    public DateTime? GrantedAt { get; set; }
    
    public DateTime? RevokedAt { get; set; }
    
    [MaxLength(255)]
    public string? IpAddress { get; set; }
    
    [MaxLength(500)]
    public string? UserAgent { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
}

