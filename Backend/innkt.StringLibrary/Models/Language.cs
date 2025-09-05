using System.ComponentModel.DataAnnotations;

namespace innkt.StringLibrary.Models;

/// <summary>
/// Represents a supported language in the system
/// </summary>
public class Language
{
    [Key]
    public int Id { get; set; }
    
    /// <summary>
    /// Language code (e.g., "en", "es", "fr", "de", "ro")
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// Language name in English (e.g., "English", "Spanish", "French", "German", "Romanian")
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// Native language name (e.g., "English", "Español", "Français", "Deutsch", "Română")
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string NativeName { get; set; } = string.Empty;
    
    /// <summary>
    /// Whether this language is active/available
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Whether this is the default language
    /// </summary>
    public bool IsDefault { get; set; } = false;
    
    /// <summary>
    /// Language direction (LTR or RTL)
    /// </summary>
    [MaxLength(3)]
    public string Direction { get; set; } = "LTR";
    
    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}




