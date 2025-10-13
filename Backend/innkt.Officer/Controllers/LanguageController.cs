using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using innkt.Officer.Services;
using System.Security.Claims;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LanguageController : ControllerBase
{
    private readonly LanguageDetectionService _languageService;
    private readonly ILogger<LanguageController> _logger;

    public LanguageController(
        LanguageDetectionService languageService,
        ILogger<LanguageController> logger)
    {
        _languageService = languageService;
        _logger = logger;
    }

    /// <summary>
    /// Gets the current user's detected language
    /// Checks: Cookie > Database (if authenticated) > Accept-Language header > Default (en)
    /// </summary>
    [HttpGet("detect")]
    [AllowAnonymous]
    public async Task<IActionResult> DetectLanguage()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var language = await _languageService.DetectLanguageAsync(userId);
            var metadata = _languageService.GetLanguageMetadata(language);

            return Ok(new
            {
                language,
                metadata,
                source = GetLanguageSource()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting language");
            return StatusCode(500, new { error = "Failed to detect language" });
        }
    }

    /// <summary>
    /// Gets all supported languages with metadata
    /// </summary>
    [HttpGet("supported")]
    [AllowAnonymous]
    public IActionResult GetSupportedLanguages()
    {
        try
        {
            var languages = _languageService.GetSupportedLanguages()
                .Select(lang => _languageService.GetLanguageMetadata(lang))
                .ToList();

            return Ok(new { languages });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting supported languages");
            return StatusCode(500, new { error = "Failed to get supported languages" });
        }
    }

    /// <summary>
    /// Sets the user's preferred language
    /// Updates: Cookie + Database (if authenticated)
    /// </summary>
    [HttpPost("set")]
    public async Task<IActionResult> SetLanguage([FromBody] SetLanguageRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Language))
            {
                return BadRequest(new { error = "Language is required" });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            // Set cookie for all users (anonymous and authenticated)
            _languageService.SetLanguageCookie(request.Language);

            // Update database for authenticated users
            if (!string.IsNullOrEmpty(userId))
            {
                var success = await _languageService.UpdateUserLanguagePreferenceAsync(
                    userId, request.Language);
                
                if (!success)
                {
                    _logger.LogWarning("Failed to update language preference for user {UserId}", userId);
                }
            }

            var metadata = _languageService.GetLanguageMetadata(request.Language);
            
            _logger.LogInformation(
                "Language set to {Language} for user {UserId}", 
                request.Language, 
                userId ?? "anonymous");

            return Ok(new
            {
                success = true,
                language = request.Language,
                metadata,
                message = "Language preference updated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting language");
            return StatusCode(500, new { error = "Failed to set language" });
        }
    }

    /// <summary>
    /// Gets language metadata for a specific language
    /// </summary>
    [HttpGet("metadata/{language}")]
    [AllowAnonymous]
    public IActionResult GetLanguageMetadata(string language)
    {
        try
        {
            var metadata = _languageService.GetLanguageMetadata(language);
            return Ok(metadata);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting language metadata for {Language}", language);
            return StatusCode(500, new { error = "Failed to get language metadata" });
        }
    }

    /// <summary>
    /// Checks if a language uses RTL (Right-to-Left) text direction
    /// </summary>
    [HttpGet("is-rtl/{language}")]
    [AllowAnonymous]
    public IActionResult IsRtl(string language)
    {
        try
        {
            var isRtl = _languageService.IsRtlLanguage(language);
            return Ok(new { language, isRtl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking RTL for {Language}", language);
            return StatusCode(500, new { error = "Failed to check RTL status" });
        }
    }

    /// <summary>
    /// Gets the current detected language from HttpContext
    /// </summary>
    [HttpGet("current")]
    [AllowAnonymous]
    public IActionResult GetCurrentLanguage()
    {
        try
        {
            var language = HttpContext.Items["UserLanguage"]?.ToString() ?? "en";
            var metadata = _languageService.GetLanguageMetadata(language);
            
            return Ok(new
            {
                language,
                metadata,
                source = GetLanguageSource()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current language");
            return StatusCode(500, new { error = "Failed to get current language" });
        }
    }

    private string GetLanguageSource()
    {
        if (Request.Cookies.ContainsKey("innkt_language"))
            return "cookie";
        
        if (User.Identity?.IsAuthenticated == true)
            return "database";
        
        if (Request.Headers.ContainsKey("Accept-Language"))
            return "header";
        
        return "default";
    }
}

public class SetLanguageRequest
{
    public string Language { get; set; } = string.Empty;
}

