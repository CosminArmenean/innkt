using System.ComponentModel.DataAnnotations;

namespace innkt.StringLibrary.Models;

/// <summary>
/// Represents a localized string with support for multiple languages
/// </summary>
public class LocalizedString
{
    [Key]
    public int Id { get; set; }
    
    /// <summary>
    /// The key identifier for the string
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;
    
    /// <summary>
    /// The language code (e.g., "en", "es", "fr", "de", "ro")
    /// </summary>
    [Required]
    [MaxLength(10)]
    public string LanguageCode { get; set; } = string.Empty;
    
    /// <summary>
    /// The localized text value
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string Value { get; set; } = string.Empty;
    
    /// <summary>
    /// Description or context for the string
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }
    
    /// <summary>
    /// Category for grouping related strings
    /// </summary>
    [MaxLength(50)]
    public string? Category { get; set; }
    
    /// <summary>
    /// Whether this string is active/available
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// Version for tracking changes
    /// </summary>
    public int Version { get; set; } = 1;
}




