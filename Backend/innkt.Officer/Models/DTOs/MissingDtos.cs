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
    public string Username { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public string? Website { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string Language { get; set; } = "en";
    public string Theme { get; set; } = "light";
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; }
    public bool IsVerified { get; set; }
    public bool IsKidAccount { get; set; }
    public string? ParentId { get; set; }
    public DateTime? IndependenceDate { get; set; }
    public int FollowersCount { get; set; }
    public int FollowingCount { get; set; }
    public int PostsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public UserPreferencesDto Preferences { get; set; } = new();
    public SocialLinksDto SocialLinks { get; set; } = new();
    public ParentalControlsDto? ParentalControls { get; set; }
}

public class UserPreferencesDto
{
    public string PrivacyLevel { get; set; } = "public"; // public, friends, private
    public bool AllowDirectMessages { get; set; } = true;
    public bool AllowMentions { get; set; } = true;
    public NotificationSettingsDto NotificationSettings { get; set; } = new();
    public string Theme { get; set; } = "light"; // light, dark, auto
    public string Language { get; set; } = "en";
    public string Timezone { get; set; } = "UTC";
}

public class NotificationSettingsDto
{
    public bool NewFollowers { get; set; } = true;
    public bool NewPosts { get; set; } = true;
    public bool Mentions { get; set; } = true;
    public bool DirectMessages { get; set; } = true;
    public bool GroupUpdates { get; set; } = true;
    public bool EmailNotifications { get; set; } = true;
    public bool PushNotifications { get; set; } = true;
}

public class SocialLinksDto
{
    public string? Twitter { get; set; }
    public string? Instagram { get; set; }
    public string? LinkedIn { get; set; }
    public string? Facebook { get; set; }
    public string? YouTube { get; set; }
}

public class ParentalControlsDto
{
    public bool CanPost { get; set; } = true;
    public bool CanMessage { get; set; } = true;
    public bool CanJoinGroups { get; set; } = true;
    public string CanViewContent { get; set; } = "all"; // all, filtered, restricted
    public TimeRestrictionsDto TimeRestrictions { get; set; } = new();
    public List<string> ContentFilters { get; set; } = new();
    public List<string> AllowedContacts { get; set; } = new();
}

public class TimeRestrictionsDto
{
    public bool Enabled { get; set; } = false;
    public string StartTime { get; set; } = "08:00";
    public string EndTime { get; set; } = "22:00";
    public string Timezone { get; set; } = "UTC";
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

public class UpdateUserProfileDto
{
    [StringLength(50)]
    public string? Username { get; set; }
    
    [StringLength(100)]
    public string? FirstName { get; set; }
    
    [StringLength(100)]
    public string? LastName { get; set; }
    
    [StringLength(500)]
    public string? Bio { get; set; }
    
    [StringLength(200)]
    public string? Location { get; set; }
    
    [StringLength(200)]
    public string? Website { get; set; }
    
    public DateTime? DateOfBirth { get; set; }
    
    public string? ProfilePictureUrl { get; set; }
    
    [StringLength(20)]
    public string? PhoneNumber { get; set; }
    
    [StringLength(200)]
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(100)]
    public string? State { get; set; }
    
    [StringLength(100)]
    public string? Country { get; set; }
    
    [StringLength(20)]
    public string? PostalCode { get; set; }
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




