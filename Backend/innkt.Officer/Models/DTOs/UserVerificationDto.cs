using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Models.DTOs;

public class CreditCardVerificationDto
{
    [Required]
    [CreditCard]
    public string CardNumber { get; set; } = string.Empty;
    
    [Required]
    [StringLength(4, MinimumLength = 4)]
    public string ExpiryMonth { get; set; } = string.Empty;
    
    [Required]
    [StringLength(4, MinimumLength = 4)]
    public string ExpiryYear { get; set; } = string.Empty;
    
    [Required]
    [StringLength(4, MinimumLength = 3)]
    public string Cvv { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string CardholderName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string BillingAddress { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string BillingCity { get; set; } = string.Empty;
    
    [Required]
    [StringLength(20)]
    public string BillingPostalCode { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string BillingCountry { get; set; } = string.Empty;
}

public class DriverLicenseVerificationDto
{
    [Required]
    public string PhotoUrl { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LicenseNumber { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string IssuingState { get; set; } = string.Empty;
    
    public DateTime? ExpiryDate { get; set; }
    
    [Required]
    public DateTime DateOfBirth { get; set; }
    
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;
}

public class UserVerificationRequestDto
{
    public CreditCardVerificationDto? CreditCard { get; set; }
    public DriverLicenseVerificationDto? DriverLicense { get; set; }
    
    [Required]
    public bool AcceptTerms { get; set; }
    
    [Required]
    public bool AcceptPrivacyPolicy { get; set; }
}

public class UserVerificationStatusDto
{
    public bool IsVerified { get; set; }
    public string VerificationStatus { get; set; } = string.Empty;
    public string VerificationMethod { get; set; } = string.Empty;
    public DateTime? VerifiedAt { get; set; }
    public string? RejectionReason { get; set; }
    public string? CreditCardLastFour { get; set; }
    public string? DriverLicensePhotoUrl { get; set; }
}

public class UserVerificationResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string VerificationId { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}



