using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Models.DTOs;

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
