using System.Text.RegularExpressions;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace innkt.NeuroSpark.Services;

public class InputValidator : IInputValidator
{
    private readonly ILogger<InputValidator> _logger;
    private readonly IPerformanceMonitor _performanceMonitor;
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex UrlRegex = new(@"^https?://[^\s/$.?#].[^\s]*$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex HtmlTagRegex = new(@"<[^>]*>", RegexOptions.Compiled);

    public InputValidator(ILogger<InputValidator> logger, IPerformanceMonitor performanceMonitor)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _performanceMonitor = performanceMonitor ?? throw new ArgumentNullException(nameof(performanceMonitor));
    }

    public string ValidateString(string input, string fieldName, int maxLength = 1000, bool allowHtml = false)
    {
        try
        {
            if (string.IsNullOrEmpty(input))
            {
                return string.Empty;
            }

            // Check length
            if (input.Length > maxLength)
            {
                _logger.LogWarning("Input validation failed: {FieldName} exceeds max length {MaxLength}", fieldName, maxLength);
                _performanceMonitor.IncrementCounter("input_validation_failed", 1, "security");
                return input.Substring(0, maxLength);
            }

            // Sanitize HTML if not allowed
            if (!allowHtml)
            {
                input = SanitizeHtml(input);
            }

            // Remove null characters and other control characters
            input = Regex.Replace(input, @"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "");

            _performanceMonitor.IncrementCounter("input_validation_success", 1, "security");
            return input;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating string input for {FieldName}", fieldName);
            _performanceMonitor.IncrementCounter("input_validation_error", 1, "security");
            return string.Empty;
        }
    }

    public bool ValidateEmail(string email)
    {
        try
        {
            if (string.IsNullOrEmpty(email))
            {
                return false;
            }

            var isValid = EmailRegex.IsMatch(email);
            _performanceMonitor.IncrementCounter(isValid ? "email_validation_success" : "email_validation_failed", 1, "security");
            
            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating email: {Email}", email);
            _performanceMonitor.IncrementCounter("email_validation_error", 1, "security");
            return false;
        }
    }

    public ValidationResult ValidateFileUpload(IFormFile file, long maxSizeBytes, string[] allowedExtensions)
    {
        try
        {
            var result = new ValidationResult();

            if (file == null)
            {
                return ValidationResult.Failure("File is required");
            }

            // Check file size
            if (file.Length > maxSizeBytes)
            {
                result.Errors.Add($"File size {file.Length} bytes exceeds maximum allowed size {maxSizeBytes} bytes");
            }

            // Check file extension
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                result.Errors.Add($"File extension '{extension}' is not allowed. Allowed extensions: {string.Join(", ", allowedExtensions)}");
            }

            // Check file name length
            if (file.FileName.Length > 255)
            {
                result.Errors.Add("File name is too long (maximum 255 characters)");
            }

            // Check for null bytes in filename
            if (file.FileName.Contains('\0'))
            {
                result.Errors.Add("File name contains invalid characters");
            }

            // Validate MIME type if possible
            if (!string.IsNullOrEmpty(file.ContentType))
            {
                var expectedMimeType = GetMimeTypeFromExtension(extension);
                if (!string.IsNullOrEmpty(expectedMimeType) && file.ContentType != expectedMimeType)
                {
                    result.Warnings.Add($"File MIME type '{file.ContentType}' doesn't match expected type '{expectedMimeType}' for extension '{extension}'");
                }
            }

            result.IsValid = result.Errors.Count == 0;
            result.Metadata["FileSize"] = file.Length;
            result.Metadata["FileName"] = file.FileName;
            result.Metadata["ContentType"] = file.ContentType;

            _performanceMonitor.IncrementCounter(result.IsValid ? "file_validation_success" : "file_validation_failed", 1, "security");
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating file upload");
            _performanceMonitor.IncrementCounter("file_validation_error", 1, "security");
            return ValidationResult.Failure("Error validating file upload");
        }
    }

    public ValidationResult ValidateJson<T>(string json, int maxSizeBytes = 1048576)
    {
        try
        {
            var result = new ValidationResult();

            if (string.IsNullOrEmpty(json))
            {
                return ValidationResult.Failure("JSON content is required");
            }

            // Check size
            var jsonBytes = System.Text.Encoding.UTF8.GetByteCount(json);
            if (jsonBytes > maxSizeBytes)
            {
                result.Errors.Add($"JSON size {jsonBytes} bytes exceeds maximum allowed size {maxSizeBytes} bytes");
            }

            // Validate JSON syntax
            try
            {
                var options = new JsonSerializerOptions
                {
                    MaxDepth = 32, // Prevent JSON bomb attacks
                    PropertyNameCaseInsensitive = true
                };
                
                JsonSerializer.Deserialize<T>(json, options);
            }
            catch (JsonException ex)
            {
                result.Errors.Add($"Invalid JSON format: {ex.Message}");
            }

            result.IsValid = result.Errors.Count == 0;
            result.Metadata["JsonSize"] = jsonBytes;
            result.Metadata["TargetType"] = typeof(T).Name;

            _performanceMonitor.IncrementCounter(result.IsValid ? "json_validation_success" : "json_validation_failed", 1, "security");
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating JSON");
            _performanceMonitor.IncrementCounter("json_validation_error", 1, "security");
            return ValidationResult.Failure("Error validating JSON");
        }
    }

    public bool ValidateUrl(string url)
    {
        try
        {
            if (string.IsNullOrEmpty(url))
            {
                return false;
            }

            var isValid = UrlRegex.IsMatch(url);
            _performanceMonitor.IncrementCounter(isValid ? "url_validation_success" : "url_validation_failed", 1, "security");
            
            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating URL: {Url}", url);
            _performanceMonitor.IncrementCounter("url_validation_error", 1, "security");
            return false;
        }
    }

    public string SanitizeHtml(string html)
    {
        try
        {
            if (string.IsNullOrEmpty(html))
            {
                return string.Empty;
            }

            // Remove HTML tags
            var sanitized = HtmlTagRegex.Replace(html, "");
            
            // Decode HTML entities (basic implementation)
            sanitized = DecodeHtmlEntities(sanitized);
            
            // Remove script content
            sanitized = Regex.Replace(sanitized, @"javascript:", "", RegexOptions.IgnoreCase);
            sanitized = Regex.Replace(sanitized, @"vbscript:", "", RegexOptions.IgnoreCase);
            sanitized = Regex.Replace(sanitized, @"on\w+\s*=", "", RegexOptions.IgnoreCase);

            _performanceMonitor.IncrementCounter("html_sanitization_success", 1, "security");
            return sanitized;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sanitizing HTML");
            _performanceMonitor.IncrementCounter("html_sanitization_error", 1, "security");
            return string.Empty;
        }
    }

    public ValidationResult ValidateHeaders(IHeaderDictionary headers)
    {
        try
        {
            var result = new ValidationResult();

            // Check for suspicious headers
            var suspiciousHeaders = new[] { "X-Forwarded-For", "X-Real-IP", "X-Forwarded-Host" };
            foreach (var header in suspiciousHeaders)
            {
                if (headers.ContainsKey(header))
                {
                    result.Warnings.Add($"Suspicious header detected: {header}");
                }
            }

            // Check User-Agent for suspicious patterns
            if (headers.TryGetValue("User-Agent", out var userAgent))
            {
                var ua = userAgent.ToString().ToLowerInvariant();
                if (ua.Contains("sqlmap") || ua.Contains("nikto") || ua.Contains("nmap"))
                {
                    result.Errors.Add("Suspicious User-Agent detected");
                }
            }

            // Check Content-Length for reasonable values
            if (headers.TryGetValue("Content-Length", out var contentLength))
            {
                if (long.TryParse(contentLength, out var length) && length > 10 * 1024 * 1024) // 10MB
                {
                    result.Warnings.Add("Content-Length is unusually large");
                }
            }

            result.IsValid = result.Errors.Count == 0;
            result.Metadata["HeaderCount"] = headers.Count;
            result.Metadata["HasUserAgent"] = headers.ContainsKey("User-Agent");
            result.Metadata["HasContentLength"] = headers.ContainsKey("Content-Length");

            _performanceMonitor.IncrementCounter(result.IsValid ? "header_validation_success" : "header_validation_failed", 1, "security");
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating headers");
            _performanceMonitor.IncrementCounter("header_validation_error", 1, "security");
            return ValidationResult.Failure("Error validating headers");
        }
    }

    private string GetMimeTypeFromExtension(string extension)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            ".txt" => "text/plain",
            ".json" => "application/json",
            ".xml" => "application/xml",
            _ => string.Empty
        };
    }

    private string DecodeHtmlEntities(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        return input
            .Replace("&amp;", "&")
            .Replace("&lt;", "<")
            .Replace("&gt;", ">")
            .Replace("&quot;", "\"")
            .Replace("&#39;", "'")
            .Replace("&nbsp;", " ")
            .Replace("&copy;", "©")
            .Replace("&reg;", "®")
            .Replace("&trade;", "™");
    }
}
