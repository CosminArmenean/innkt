using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Models;

public class ApplicationUser : IdentityUser
{
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
    public string? PreferredLanguage { get; set; } = "en";
    
    [MaxLength(10)]
    public string Theme { get; set; } = "light";
    
    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }
    
    // Additional Profile Fields
    public DateTime? RegisteredAt { get; set; }
    
    public DateTime? LastLogin { get; set; }
    
    [MaxLength(100)]
    public string? Country { get; set; }
    
    [MaxLength(200)]
    public string? Address { get; set; }
    
    [MaxLength(20)]
    public string? PostalCode { get; set; }
    
    [MaxLength(100)]
    public string? City { get; set; }
    
    [MaxLength(100)]
    public string? State { get; set; }
    
    // Profile Picture Storage
    public bool IsProfilePicturePng { get; set; } = false;
    
    public string? ProfilePicturePngUrl { get; set; }
    
    public string? ProfilePictureCroppedUrl { get; set; }
    
    // Multi-Factor Authentication
    public bool IsMfaEnabled { get; set; } = false;
    
    public string? MfaSecretKey { get; set; }
    
    public DateTime? MfaEnabledAt { get; set; }
    
    public DateTime? LastMfaVerification { get; set; }
    
    // User Verification
    public bool IsIdentityVerified { get; set; } = false;
    
    public DateTime? IdentityVerifiedAt { get; set; }
    
    public string? VerificationMethod { get; set; } // "credit_card", "driver_license", "both"
    
    public string? CreditCardLastFour { get; set; }
    
    public string? DriverLicensePhotoUrl { get; set; }
    
    public string? VerificationStatus { get; set; } // "pending", "verified", "rejected"
    
    public string? VerificationRejectionReason { get; set; }
    
    // Kid Account Support
    public bool IsKidAccount { get; set; } = false;
    
    public string? ParentUserId { get; set; }
    
    public virtual ApplicationUser? ParentUser { get; set; }
    
    public string? KidQrCode { get; set; }
    
    public string? KidPairingCode { get; set; }
    
    public DateTime? KidAccountCreatedAt { get; set; }
    
    public DateTime? KidIndependenceDate { get; set; }
    
    public bool IsKidAccountIndependent { get; set; } = false;
    
    public string? KidAccountStatus { get; set; } // "active", "suspended", "pending_independence"
    
    // Enhanced Joint Account Support
    public bool IsJointAccount { get; set; } = false;
    
    public string? LinkedUserId { get; set; }
    
    public virtual ApplicationUser? LinkedUser { get; set; }
    
    // Joint Account Specific Fields
    public string? JointAccountEmail { get; set; }
    
    public string? JointAccountPassword { get; set; }
    
    public DateTime? JointAccountCreatedAt { get; set; }
    
    public string? JointAccountStatus { get; set; } // "pending", "active", "suspended"
    
    // Account Verification
    public bool IsEmailVerified { get; set; } = false;
    
    public bool IsPhoneVerified { get; set; } = false;
    
    public DateTime? EmailVerifiedAt { get; set; }
    
    public DateTime? PhoneVerifiedAt { get; set; }
    
    // Account Status
    public bool IsActive { get; set; } = true;
    
    public bool IsLocked { get; set; } = false;
    
    public DateTime? LockedAt { get; set; }
    
    public string? LockReason { get; set; }
    
    // GDPR consent tracking
    public bool AcceptTerms { get; set; }
    
    public bool AcceptPrivacyPolicy { get; set; }
    
    public bool AcceptMarketing { get; set; }
    
    public bool AcceptCookies { get; set; }
    
    public DateTime? TermsAcceptedAt { get; set; }
    
    public DateTime? PrivacyPolicyAcceptedAt { get; set; }
    
    public DateTime? MarketingAcceptedAt { get; set; }
    
    public DateTime? CookiesAcceptedAt { get; set; }
    
    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public string? CreatedBy { get; set; }
    
    public string? UpdatedBy { get; set; }
    
    // Additional properties expected by services
    public string Username => UserName ?? string.Empty;
    
    public string DisplayName => FullName;
    
    public string? Bio { get; set; }
    
    public string? AvatarUrl => ProfilePictureUrl;
    
    public string? CoverImageUrl { get; set; }
    
    public bool IsVerified => IsIdentityVerified;
    
    public bool IsPrivate { get; set; } = false;
    
    // Computed properties
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    public bool IsJointAccountActive => IsJointAccount && JointAccountStatus == "active";
    
    public bool CanLinkAccount => !IsJointAccount && string.IsNullOrEmpty(LinkedUserId);
    
    public bool IsKidAccountActive => IsKidAccount && KidAccountStatus == "active";
    
    public bool CanKidAccountBecomeIndependent => IsKidAccount && !IsKidAccountIndependent && KidIndependenceDate.HasValue && KidIndependenceDate.Value <= DateTime.UtcNow;
    
    public bool IsProfilePictureCropped => !string.IsNullOrEmpty(ProfilePictureCroppedUrl);
    
    public bool IsMfaRequired => IsMfaEnabled && (LastMfaVerification == null || LastMfaVerification.Value.AddDays(30) < DateTime.UtcNow);
}
