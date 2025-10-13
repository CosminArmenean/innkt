using innkt.Officer.Services;
using System.Security.Claims;

namespace innkt.Officer.Middleware;

/// <summary>
/// Middleware to automatically detect and apply user's preferred language
/// Workflow:
/// 1. Check for language cookie
/// 2. If no cookie, check database preference (for authenticated users)
/// 3. If no database preference, check Accept-Language header
/// 4. If none available, default to "en"
/// 5. Set detected language in cookie for future requests
/// </summary>
public class LanguageDetectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<LanguageDetectionMiddleware> _logger;

    public LanguageDetectionMiddleware(
        RequestDelegate next,
        ILogger<LanguageDetectionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, LanguageDetectionService languageService)
    {
        try
        {
            // Skip for API requests that don't need language detection
            if (context.Request.Path.StartsWithSegments("/api/auth") || 
                context.Request.Path.StartsWithSegments("/health"))
            {
                await _next(context);
                return;
            }

            // Get user ID if authenticated
            string? userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Detect language using the service
            var detectedLanguage = await languageService.DetectLanguageAsync(userId);

            // Set language in cookie if not already set
            if (!context.Request.Cookies.ContainsKey("innkt_language"))
            {
                languageService.SetLanguageCookie(detectedLanguage);
                _logger.LogInformation("Language detected and set to {Language} for user {UserId}", 
                    detectedLanguage, userId ?? "anonymous");
            }

            // Add language to response headers for frontend to use
            context.Response.Headers.Append("X-Content-Language", detectedLanguage);
            
            // Store in HttpContext items for use in controllers
            context.Items["UserLanguage"] = detectedLanguage;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in LanguageDetectionMiddleware");
            // Continue with request even if language detection fails
        }

        await _next(context);
    }
}

/// <summary>
/// Extension methods for LanguageDetectionMiddleware
/// </summary>
public static class LanguageDetectionMiddlewareExtensions
{
    public static IApplicationBuilder UseLanguageDetection(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<LanguageDetectionMiddleware>();
    }
}

