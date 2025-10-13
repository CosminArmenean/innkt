using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using innkt.Officer.Data;
using System.Globalization;

namespace innkt.Officer.Services;

/// <summary>
/// Service for detecting user's preferred language from multiple sources
/// Priority: Cookie > Database > Accept-Language Header > Default (en)
/// </summary>
public class LanguageDetectionService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private static readonly string[] SupportedLanguages = 
    { 
        "en", "ro", "he", "ar", "es", "fr", "de", "it", "pt", "ru", 
        "zh", "ja", "ko", "hi", "tr", "nl", "pl", "cs", "hu" 
    };

    public LanguageDetectionService(
        ApplicationDbContext context, 
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Detects the user's preferred language following the priority:
    /// 1. Language cookie
    /// 2. Database user preference
    /// 3. Accept-Language header
    /// 4. Default to English
    /// </summary>
    /// <param name="userId">Optional user ID to check database preference</param>
    /// <returns>Language code (e.g., "en", "ro", "he")</returns>
    public async Task<string> DetectLanguageAsync(string? userId = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return "en";
        }

        // Step 1: Check for language cookie
        var cookieLanguage = GetLanguageFromCookie(httpContext);
        if (!string.IsNullOrEmpty(cookieLanguage) && IsLanguageSupported(cookieLanguage))
        {
            return cookieLanguage;
        }

        // Step 2: Check database preference if user is authenticated
        if (!string.IsNullOrEmpty(userId))
        {
            var dbLanguage = await GetLanguageFromDatabaseAsync(userId);
            if (!string.IsNullOrEmpty(dbLanguage) && IsLanguageSupported(dbLanguage))
            {
                return dbLanguage;
            }
        }

        // Step 3: Check Accept-Language header
        var headerLanguage = GetLanguageFromHeader(httpContext);
        if (!string.IsNullOrEmpty(headerLanguage) && IsLanguageSupported(headerLanguage))
        {
            return headerLanguage;
        }

        // Step 4: Default to English
        return "en";
    }

    /// <summary>
    /// Gets language from cookie
    /// </summary>
    private string? GetLanguageFromCookie(HttpContext httpContext)
    {
        if (httpContext.Request.Cookies.TryGetValue("innkt_language", out var language))
        {
            return language;
        }
        return null;
    }

    /// <summary>
    /// Gets language from database user preference
    /// </summary>
    private async Task<string?> GetLanguageFromDatabaseAsync(string userId)
    {
        try
        {
            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new { u.PreferredLanguage, u.Language })
                .FirstOrDefaultAsync();

            return user?.PreferredLanguage ?? user?.Language;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Gets language from Accept-Language header
    /// </summary>
    private string? GetLanguageFromHeader(HttpContext httpContext)
    {
        var acceptLanguageHeader = httpContext.Request.Headers["Accept-Language"].ToString();
        if (string.IsNullOrEmpty(acceptLanguageHeader))
        {
            return null;
        }

        // Parse Accept-Language header (e.g., "en-US,en;q=0.9,ro;q=0.8")
        try
        {
            var languages = acceptLanguageHeader
                .Split(',')
                .Select(lang =>
                {
                    var parts = lang.Trim().Split(';');
                    var code = parts[0].Trim();
                    var quality = 1.0;

                    if (parts.Length > 1 && parts[1].StartsWith("q="))
                    {
                        double.TryParse(parts[1].Substring(2), NumberStyles.Float, 
                            CultureInfo.InvariantCulture, out quality);
                    }

                    // Extract language code (e.g., "en-US" -> "en")
                    var langCode = code.Contains('-') ? code.Split('-')[0] : code;
                    return new { Code = langCode, Quality = quality };
                })
                .OrderByDescending(x => x.Quality)
                .Select(x => x.Code)
                .FirstOrDefault(code => IsLanguageSupported(code));

            return languages;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Checks if a language is supported
    /// </summary>
    private bool IsLanguageSupported(string language)
    {
        return SupportedLanguages.Contains(language?.ToLowerInvariant());
    }

    /// <summary>
    /// Sets the language cookie
    /// </summary>
    public void SetLanguageCookie(string language)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null || !IsLanguageSupported(language))
        {
            return;
        }

        var cookieOptions = new CookieOptions
        {
            Expires = DateTimeOffset.UtcNow.AddYears(1),
            HttpOnly = false, // Allow JavaScript to read for client-side i18n
            Secure = true, // Only over HTTPS
            SameSite = SameSiteMode.Lax,
            Path = "/"
        };

        httpContext.Response.Cookies.Append("innkt_language", language, cookieOptions);
    }

    /// <summary>
    /// Updates user's language preference in the database
    /// </summary>
    public async Task<bool> UpdateUserLanguagePreferenceAsync(string userId, string language)
    {
        if (!IsLanguageSupported(language))
        {
            return false;
        }

        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            user.PreferredLanguage = language;
            user.Language = language; // Update both for backwards compatibility
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            // Also set the cookie
            SetLanguageCookie(language);

            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Gets all supported languages
    /// </summary>
    public IEnumerable<string> GetSupportedLanguages()
    {
        return SupportedLanguages;
    }

    /// <summary>
    /// Checks if a language uses RTL (Right-to-Left) text direction
    /// </summary>
    public bool IsRtlLanguage(string language)
    {
        return language?.ToLowerInvariant() switch
        {
            "ar" => true,  // Arabic
            "he" => true,  // Hebrew
            _ => false
        };
    }

    /// <summary>
    /// Gets language metadata including name, native name, and RTL status
    /// </summary>
    public object GetLanguageMetadata(string language)
    {
        return language?.ToLowerInvariant() switch
        {
            "en" => new { Code = "en", Name = "English", NativeName = "English", IsRtl = false },
            "ro" => new { Code = "ro", Name = "Romanian", NativeName = "Română", IsRtl = false },
            "he" => new { Code = "he", Name = "Hebrew", NativeName = "עברית", IsRtl = true },
            "ar" => new { Code = "ar", Name = "Arabic", NativeName = "العربية", IsRtl = true },
            "es" => new { Code = "es", Name = "Spanish", NativeName = "Español", IsRtl = false },
            "fr" => new { Code = "fr", Name = "French", NativeName = "Français", IsRtl = false },
            "de" => new { Code = "de", Name = "German", NativeName = "Deutsch", IsRtl = false },
            "it" => new { Code = "it", Name = "Italian", NativeName = "Italiano", IsRtl = false },
            "pt" => new { Code = "pt", Name = "Portuguese", NativeName = "Português", IsRtl = false },
            "ru" => new { Code = "ru", Name = "Russian", NativeName = "Русский", IsRtl = false },
            "zh" => new { Code = "zh", Name = "Chinese", NativeName = "中文", IsRtl = false },
            "ja" => new { Code = "ja", Name = "Japanese", NativeName = "日本語", IsRtl = false },
            "ko" => new { Code = "ko", Name = "Korean", NativeName = "한국어", IsRtl = false },
            "hi" => new { Code = "hi", Name = "Hindi", NativeName = "हिन्दी", IsRtl = false },
            "tr" => new { Code = "tr", Name = "Turkish", NativeName = "Türkçe", IsRtl = false },
            "nl" => new { Code = "nl", Name = "Dutch", NativeName = "Nederlands", IsRtl = false },
            "pl" => new { Code = "pl", Name = "Polish", NativeName = "Polski", IsRtl = false },
            "cs" => new { Code = "cs", Name = "Czech", NativeName = "Čeština", IsRtl = false },
            "hu" => new { Code = "hu", Name = "Hungarian", NativeName = "Magyar", IsRtl = false },
            _ => new { Code = "en", Name = "English", NativeName = "English", IsRtl = false }
        };
    }
}

