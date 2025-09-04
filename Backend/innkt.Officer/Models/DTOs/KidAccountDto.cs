using System.ComponentModel.DataAnnotations;

namespace innkt.Officer.Models.DTOs;

public class CreateKidAccountDto
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    public DateTime BirthDate { get; set; }
    
    [Required]
    [StringLength(100)]
    public string Country { get; set; } = string.Empty;
    
    [StringLength(200)]
    public string? Address { get; set; }
    
    [StringLength(100)]
    public string? City { get; set; }
    
    [StringLength(100)]
    public string? State { get; set; }
    
    [StringLength(20)]
    public string? PostalCode { get; set; }
    
    public DateTime? IndependenceDate { get; set; }
    
    [Required]
    public bool AcceptTerms { get; set; }
    
    [Required]
    public bool AcceptPrivacyPolicy { get; set; }
}

public class KidAccountPairingDto
{
    [Required]
    public string QrCode { get; set; } = string.Empty;
    
    [Required]
    [StringLength(10, MinimumLength = 4)]
    public string PairingCode { get; set; } = string.Empty;
    
    [Required]
    public string DeviceId { get; set; } = string.Empty;
    
    [Required]
    public string DeviceName { get; set; } = string.Empty;
}

public class KidAccountStatusDto
{
    public string Id { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? IndependenceDate { get; set; }
    public bool IsIndependent { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public string ParentUserId { get; set; } = string.Empty;
    public string ParentFullName { get; set; } = string.Empty;
}

public class KidAccountIndependenceDto
{
    [Required]
    public string KidAccountId { get; set; } = string.Empty;
    
    [Required]
    public DateTime IndependenceDate { get; set; }
    
    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
    
    [Required]
    [Compare("NewPassword")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class KidFollowRequestDto
{
    [Required]
    public string KidAccountId { get; set; } = string.Empty;
    
    [Required]
    public string TargetUserId { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Message { get; set; }
}

public class KidFollowApprovalDto
{
    [Required]
    public string FollowRequestId { get; set; } = string.Empty;
    
    [Required]
    public bool IsApproved { get; set; }
    
    [StringLength(500)]
    public string? RejectionReason { get; set; }
}

public class KidGroupDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsKidGroup { get; set; }
    public string AdminUserId { get; set; } = string.Empty;
    public string AdminFullName { get; set; } = string.Empty;
    public List<string> MemberIds { get; set; } = new();
    public List<string> KidMemberIds { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}



