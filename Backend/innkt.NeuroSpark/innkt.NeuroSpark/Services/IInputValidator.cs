namespace innkt.NeuroSpark.Services;

public interface IInputValidator
{
    /// <summary>
    /// Validates and sanitizes string input
    /// </summary>
    string ValidateString(string input, string fieldName, int maxLength = 1000, bool allowHtml = false);
    
    /// <summary>
    /// Validates email address format
    /// </summary>
    bool ValidateEmail(string email);
    
    /// <summary>
    /// Validates file upload
    /// </summary>
    ValidationResult ValidateFileUpload(IFormFile file, long maxSizeBytes, string[] allowedExtensions);
    
    /// <summary>
    /// Validates JSON payload
    /// </summary>
    ValidationResult ValidateJson<T>(string json, int maxSizeBytes = 1048576);
    
    /// <summary>
    /// Validates URL format
    /// </summary>
    bool ValidateUrl(string url);
    
    /// <summary>
    /// Sanitizes HTML content
    /// </summary>
    string SanitizeHtml(string html);
    
    /// <summary>
    /// Validates request headers
    /// </summary>
    ValidationResult ValidateHeaders(IHeaderDictionary headers);
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public Dictionary<string, object> Metadata { get; set; } = new();
    
    public static ValidationResult Success() => new() { IsValid = true };
    public static ValidationResult Failure(params string[] errors) => new() { IsValid = false, Errors = errors.ToList() };
}

public class FileValidationRules
{
    public long MaxSizeBytes { get; set; } = 10 * 1024 * 1024; // 10MB
    public string[] AllowedExtensions { get; set; } = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    public string[] AllowedMimeTypes { get; set; } = { "image/jpeg", "image/png", "image/gif", "image/webp" };
    public bool ValidateContent { get; set; } = true;
    public int MaxFileNameLength { get; set; } = 255;
}


