using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Models.DTOs;

public class UserRegistrationDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? CountryCode { get; set; }
    
    public DateTime? BirthDate { get; set; }
    
    [MaxLength(10)]
    public string? Gender { get; set; }
    
    [MaxLength(10)]
    public string Language { get; set; } = "en";
    
    [MaxLength(10)]
    public string Theme { get; set; } = "light";
    
    // Joint Account Fields
    public bool IsJointAccount { get; set; } = false;
    
    [EmailAddress]
    public string? JointAccountEmail { get; set; }
    
    [MinLength(8)]
    public string? JointAccountPassword { get; set; }
    
    // Subaccounts (Kid Accounts)
    public List<SubaccountDto>? Subaccounts { get; set; }
    
    // Profile Picture
    public string? ProfilePictureBase64 { get; set; }
    
    // GDPR Consent
    public bool AcceptTerms { get; set; }
    
    public bool AcceptPrivacyPolicy { get; set; }
    
    public bool AcceptMarketing { get; set; } = false;
    
    public bool AcceptCookies { get; set; } = false;
}

public class SubaccountDto
{
    [Required]
    [MinLength(3)]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    public DateTime? BirthDate { get; set; }
    
    [MaxLength(10)]
    public string? Gender { get; set; }
    
    public string? ProfilePictureBase64 { get; set; }
}

public class JointAccountRegistrationDto
{
    [Required]
    [EmailAddress]
    public string PrimaryEmail { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    public string PrimaryPassword { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string PrimaryFirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string PrimaryLastName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string JointEmail { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    public string JointPassword { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string JointFirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string JointLastName { get; set; } = string.Empty;
    
    // GDPR Consent
    public bool AcceptTerms { get; set; }
    
    public bool AcceptPrivacyPolicy { get; set; }
    
    public bool AcceptMarketing { get; set; } = false;
    
    public bool AcceptCookies { get; set; } = false;
}





