using System.ComponentModel.DataAnnotations;

namespace innkt.Domain.DTOs.User;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
    
    public bool RememberMe { get; set; } = false;
    
    public string? ReturnUrl { get; set; }
}





