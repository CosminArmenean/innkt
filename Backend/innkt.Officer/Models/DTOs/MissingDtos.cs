using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Models.DTOs;

// DTOs for AuthController
public class ConfirmEmailDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    public string Token { get; set; } = string.Empty;
}

public class ResendEmailConfirmationDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public string Language { get; set; } = "en";
    public string Theme { get; set; } = "light";
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateProfileDto
{
    [StringLength(100)]
    public string? FirstName { get; set; }
    
    [StringLength(100)]
    public string? LastName { get; set; }
    
    [StringLength(100)]
    public string? Country { get; set; }
    
    [StringLength(200)]
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(100)]
    public string? State { get; set; }
    
    [StringLength(20)]
    public string? PostalCode { get; set; }
    
    public string? Language { get; set; }
    
    public string? Theme { get; set; }
}

// DTOs for KidAccountController
public class SetIndependenceDateDto
{
    [Required]
    public string KidAccountId { get; set; } = string.Empty;
    
    [Required]
    public DateTime IndependenceDate { get; set; }
}

public class ApproveFollowRequestDto
{
    [Required]
    public string FollowRequestId { get; set; } = string.Empty;
}

public class RejectFollowRequestDto
{
    [Required]
    public string FollowRequestId { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Reason { get; set; }
}

public class KidUnfollowDto
{
    [Required]
    public string KidAccountId { get; set; } = string.Empty;
    
    [Required]
    public string TargetUserId { get; set; } = string.Empty;
}

public class KidFollowerDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public DateTime FollowedAt { get; set; }
    public bool IsKidAccount { get; set; }
}

public class KidFollowingDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public DateTime FollowedAt { get; set; }
    public bool IsKidAccount { get; set; }
}

public class SetContentRestrictionsDto
{
    [Required]
    public string KidAccountId { get; set; } = string.Empty;
    
    [Required]
    public List<string> RestrictedCategories { get; set; } = new();
}



