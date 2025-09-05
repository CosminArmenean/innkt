using System.ComponentModel.DataAnnotations;

namespace innkt.Domain.DTOs.User;

public class RegisterUserRequest
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
    public string EmailConfirmation { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    [Compare(nameof(Password), ErrorMessage = "Passwords do not match")]
    public string PasswordConfirmation { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? CountryCode { get; set; }
    
    [MaxLength(20)]
    public string? MobilePhone { get; set; }
    
    public DateTime? BirthDate { get; set; }
    
    [MaxLength(10)]
    public string? Gender { get; set; }
    
    [MaxLength(10)]
    public string Language { get; set; } = "en";
    
    [MaxLength(10)]
    public string Theme { get; set; } = "light";
    
    // Joint account support
    public bool IsJointAccount { get; set; } = false;
    
    public JointAccountRequest? JointAccount { get; set; }
    
    // GDPR consent
    public bool AcceptTerms { get; set; }
    
    public bool AcceptPrivacyPolicy { get; set; }
    
    public bool AcceptMarketing { get; set; }
    
    public bool AcceptCookies { get; set; }
}

public class JointAccountRequest
{
    [Required]
    [MaxLength(100)]
    public string SecondUserFirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string SecondUserLastName { get; set; } = string.Empty;
    
    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string SecondUserPassword { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    [Compare(nameof(SecondUserPassword), ErrorMessage = "Passwords do not match")]
    public string SecondUserPasswordConfirmation { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? SecondUserCountryCode { get; set; }
    
    [MaxLength(20)]
    public string? SecondUserMobilePhone { get; set; }
    
    public DateTime? SecondUserBirthDate { get; set; }
    
    [MaxLength(10)]
    public string? SecondUserGender { get; set; }
}






