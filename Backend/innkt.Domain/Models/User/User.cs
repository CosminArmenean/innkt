using System.ComponentModel.DataAnnotations;
using innkt.Common.Models;

namespace innkt.Domain.Models.User;

public class User : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? CountryCode { get; set; }
    
    [MaxLength(20)]
    public string? MobilePhone { get; set; }
    
    // Additional properties for compatibility
    public string Username { get; set; } = string.Empty;
    
    public string DisplayName { get; set; } = string.Empty;
    
    public string? Bio { get; set; }
    
    public string? AvatarUrl { get; set; }
    
    public string? CoverImageUrl { get; set; }
    
    public bool IsVerified { get; set; } = false;
    
    public bool IsPrivate { get; set; } = false;
    
    public int FollowersCount { get; set; } = 0;
    
    public int FollowingCount { get; set; } = 0;
    
    public DateTime? BirthDate { get; set; }
    
    [MaxLength(10)]
    public string? Gender { get; set; }
    
    [MaxLength(10)]
    public string Language { get; set; } = "en";
    
    [MaxLength(10)]
    public string Theme { get; set; } = "light";
    
    [MaxLength(255)]
    public string? ProfilePictureUrl { get; set; }
    
    // Joint account support
    public bool IsJointAccount { get; set; } = false;
    
    public Guid? LinkedUserId { get; set; }
    
    public virtual User? LinkedUser { get; set; }
    
    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    
    public virtual ICollection<UserConsent> UserConsents { get; set; } = new List<UserConsent>();
    
    // Computed properties
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    public bool IsLinked => LinkedUserId.HasValue || UserRoles.Any(ur => ur.UserId != Id);
}

