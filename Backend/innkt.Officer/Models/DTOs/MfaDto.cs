using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Models.DTOs;

public class EnableMfaDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string MfaCode { get; set; } = string.Empty;
}

public class VerifyMfaDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string MfaCode { get; set; } = string.Empty;
    
    public bool RememberDevice { get; set; } = false;
}

public class MfaSetupDto
{
    [Required]
    public string SecretKey { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string VerificationCode { get; set; } = string.Empty;
}

public class MfaStatusDto
{
    public bool IsEnabled { get; set; }
    public DateTime? LastVerification { get; set; }
    public bool IsRequired { get; set; }
    public string SecretKey { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
}

public class DisableMfaDto
{
    [Required]
    [MinLength(6)]
    public string CurrentMfaCode { get; set; } = string.Empty;
}




