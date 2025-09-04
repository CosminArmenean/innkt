using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SecurityController : ControllerBase
{
    private readonly IInputValidator _inputValidator;
    private readonly IPerformanceMonitor _performanceMonitor;
    private readonly ILogger<SecurityController> _logger;

    public SecurityController(
        IInputValidator inputValidator,
        IPerformanceMonitor performanceMonitor,
        ILogger<SecurityController> logger)
    {
        _inputValidator = inputValidator ?? throw new ArgumentNullException(nameof(inputValidator));
        _performanceMonitor = performanceMonitor ?? throw new ArgumentNullException(nameof(performanceMonitor));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpPost("validate/string")]
    public IActionResult ValidateString([FromBody] StringValidationRequest request)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var validatedString = _inputValidator.ValidateString(
                request.Input, 
                request.FieldName, 
                request.MaxLength, 
                request.AllowHtml);

            stopwatch.Stop();
            _performanceMonitor.RecordTiming("string_validation_duration", stopwatch.Elapsed, "security");

            return Ok(new
            {
                original = request.Input,
                validated = validatedString,
                validationTime = stopwatch.ElapsedMilliseconds,
                fieldName = request.FieldName,
                maxLength = request.MaxLength,
                allowHtml = request.AllowHtml
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating string input");
            return StatusCode(500, new { error = "Validation error occurred" });
        }
    }

    [HttpPost("validate/email")]
    public IActionResult ValidateEmail([FromBody] EmailValidationRequest request)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var isValid = _inputValidator.ValidateEmail(request.Email);

            stopwatch.Stop();
            _performanceMonitor.RecordTiming("email_validation_duration", stopwatch.Elapsed, "security");

            return Ok(new
            {
                email = request.Email,
                isValid = isValid,
                validationTime = stopwatch.Elapsed.TotalMilliseconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating email");
            return StatusCode(500, new { error = "Validation error occurred" });
        }
    }

    [HttpPost("validate/url")]
    public IActionResult ValidateUrl([FromBody] UrlValidationRequest request)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var isValid = _inputValidator.ValidateUrl(request.Url);

            stopwatch.Stop();
            _performanceMonitor.RecordTiming("url_validation_duration", stopwatch.Elapsed, "security");

            return Ok(new
            {
                url = request.Url,
                isValid = isValid,
                validationTime = stopwatch.Elapsed.TotalMilliseconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating URL");
            return StatusCode(500, new { error = "Validation error occurred" });
        }
    }

    [HttpPost("validate/json")]
    public IActionResult ValidateJson([FromBody] JsonValidationRequest request)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var result = _inputValidator.ValidateJson<object>(request.Json, request.MaxSizeBytes);

            stopwatch.Stop();
            _performanceMonitor.RecordTiming("json_validation_duration", stopwatch.Elapsed, "security");

            return Ok(new
            {
                json = request.Json,
                isValid = result.IsValid,
                errors = result.Errors,
                warnings = result.Warnings,
                metadata = result.Metadata,
                validationTime = stopwatch.Elapsed.TotalMilliseconds,
                maxSizeBytes = request.MaxSizeBytes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating JSON");
            return StatusCode(500, new { error = "Validation error occurred" });
        }
    }

    [HttpPost("sanitize/html")]
    public IActionResult SanitizeHtml([FromBody] HtmlSanitizationRequest request)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            var sanitized = _inputValidator.SanitizeHtml(request.Html);

            stopwatch.Stop();
            _performanceMonitor.RecordTiming("html_sanitization_duration", stopwatch.Elapsed, "security");

            return Ok(new
            {
                original = request.Html,
                sanitized = sanitized,
                sanitizationTime = stopwatch.Elapsed.TotalMilliseconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sanitizing HTML");
            return StatusCode(500, new { error = "Sanitization error occurred" });
        }
    }

    [HttpPost("validate/headers")]
    public IActionResult ValidateHeaders([FromBody] HeadersValidationRequest request)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            // Convert dictionary to IHeaderDictionary for validation
            var headers = new HeaderDictionary();
            foreach (var header in request.Headers)
            {
                headers[header.Key] = header.Value;
            }

            var result = _inputValidator.ValidateHeaders(headers);

            stopwatch.Stop();
            _performanceMonitor.RecordTiming("headers_validation_duration", stopwatch.Elapsed, "security");

            return Ok(new
            {
                headers = request.Headers,
                isValid = result.IsValid,
                errors = result.Errors,
                warnings = result.Warnings,
                metadata = result.Metadata,
                validationTime = stopwatch.Elapsed.TotalMilliseconds
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating headers");
            return StatusCode(500, new { error = "Validation error occurred" });
        }
    }

    [HttpGet("test/security-headers")]
    public IActionResult TestSecurityHeaders()
    {
        // This endpoint will have security headers applied by the middleware
        return Ok(new
        {
            message = "Security headers test endpoint",
            timestamp = DateTime.UtcNow,
            headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
        });
    }

    [HttpGet("test/rate-limit")]
    public IActionResult TestRateLimit()
    {
        // This endpoint will be rate limited
        return Ok(new
        {
            message = "Rate limit test endpoint",
            timestamp = DateTime.UtcNow,
            clientId = HttpContext.Connection.RemoteIpAddress?.ToString()
        });
    }
}

// Request models
public class StringValidationRequest
{
    public string Input { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public int MaxLength { get; set; } = 1000;
    public bool AllowHtml { get; set; } = false;
}

public class EmailValidationRequest
{
    public string Email { get; set; } = string.Empty;
}

public class UrlValidationRequest
{
    public string Url { get; set; } = string.Empty;
}

public class JsonValidationRequest
{
    public string Json { get; set; } = string.Empty;
    public int MaxSizeBytes { get; set; } = 1048576;
}

public class HtmlSanitizationRequest
{
    public string Html { get; set; } = string.Empty;
}

public class HeadersValidationRequest
{
    public Dictionary<string, string> Headers { get; set; } = new();
}
