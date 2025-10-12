using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using innkt.StringLibrary.Models;
using innkt.StringLibrary.Data;
using System.Globalization;

namespace innkt.StringLibrary.Services;

/// <summary>
/// Implementation of the localization service with caching and database support
/// </summary>
public class LocalizationService : ILocalizationService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<LocalizationService> _logger;
    private readonly string _currentLanguageKey = "CurrentLanguage";
    private readonly TimeSpan _cacheExpiration = TimeSpan.FromHours(1);
    
    // Comprehensive translations for all microservices and European languages
    private readonly Dictionary<string, Dictionary<string, string>> _fallbackStrings;

    public LocalizationService(IMemoryCache cache, ILogger<LocalizationService> logger)
    {
        _cache = cache;
        _logger = logger;
        
        // Initialize comprehensive translations
        _fallbackStrings = ComprehensiveTranslations.GetCompleteTranslations();
        
        // Set default language
        SetCurrentLanguage("en");
    }

    public async Task<string> GetStringAsync(string key, string languageCode, string? defaultValue = null)
    {
        try
        {
            // Normalize language code
            languageCode = NormalizeLanguageCode(languageCode);
            
            // Try to get from cache first
            var cacheKey = $"localized_string_{languageCode}_{key}";
            if (_cache.TryGetValue(cacheKey, out string? cachedValue))
            {
                return cachedValue ?? defaultValue ?? key;
            }

            // Try to get from fallback strings
            if (_fallbackStrings.TryGetValue(languageCode, out var languageStrings) &&
                languageStrings.TryGetValue(key, out var fallbackValue))
            {
                // Cache the result
                _cache.Set(cacheKey, fallbackValue, _cacheExpiration);
                return fallbackValue;
            }

            // Try to get from default language if different
            if (languageCode != "en" && _fallbackStrings.TryGetValue("en", out var defaultStrings) &&
                defaultStrings.TryGetValue(key, out var englishValue))
            {
                _logger.LogWarning("String '{Key}' not found for language '{Language}', using English fallback", key, languageCode);
                _cache.Set(cacheKey, englishValue, _cacheExpiration);
                return englishValue;
            }

            // Return default value or key if nothing found
            var result = defaultValue ?? key;
            _cache.Set(cacheKey, result, _cacheExpiration);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting localized string for key '{Key}' and language '{Language}'", key, languageCode);
            return defaultValue ?? key;
        }
    }

    public async Task<string> GetStringAsync(string key, string? defaultValue = null)
    {
        var currentLanguage = GetCurrentLanguage();
        return await GetStringAsync(key, currentLanguage, defaultValue);
    }

    public async Task<Dictionary<string, string>> GetStringsAsync(string[] keys, string languageCode)
    {
        var result = new Dictionary<string, string>();
        
        foreach (var key in keys)
        {
            var value = await GetStringAsync(key, languageCode);
            result[key] = value;
        }
        
        return result;
    }

    public async Task<Dictionary<string, string>> GetStringsByCategoryAsync(string category, string languageCode)
    {
        try
        {
            // For now, filter fallback strings by category
            // In a real implementation, this would query the database
            var result = new Dictionary<string, string>();
            
            if (_fallbackStrings.TryGetValue(languageCode, out var languageStrings))
            {
                foreach (var kvp in languageStrings)
                {
                    if (kvp.Key.StartsWith(category + "."))
                    {
                        result[kvp.Key] = kvp.Value;
                    }
                }
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting strings for category '{Category}' and language '{Language}'", category, languageCode);
            return new Dictionary<string, string>();
        }
    }

    public async Task<bool> SetStringAsync(string key, string languageCode, string value, string? description = null, string? category = null)
    {
        try
        {
            // Normalize language code
            languageCode = NormalizeLanguageCode(languageCode);
            
            // Update fallback strings (in real implementation, this would update the database)
            if (!_fallbackStrings.ContainsKey(languageCode))
            {
                _fallbackStrings[languageCode] = new Dictionary<string, string>();
            }
            
            _fallbackStrings[languageCode][key] = value;
            
            // Clear cache for this key
            var cacheKey = $"localized_string_{languageCode}_{key}";
            _cache.Remove(cacheKey);
            
            _logger.LogInformation("String '{Key}' updated for language '{Language}'", key, languageCode);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting localized string for key '{Key}' and language '{Language}'", key, languageCode);
            return false;
        }
    }

    public async Task<List<Language>> GetSupportedLanguagesAsync()
    {
        // Return supported languages from fallback strings
        var languages = new List<Language>();
        
        foreach (var langCode in _fallbackStrings.Keys)
        {
            var language = new Language
            {
                Code = langCode,
                Name = GetLanguageName(langCode),
                NativeName = GetNativeLanguageName(langCode),
                IsActive = true,
                IsDefault = langCode == "en",
                Direction = "LTR"
            };
            languages.Add(language);
        }
        
        return languages;
    }

    public async Task<Language?> GetDefaultLanguageAsync()
    {
        var languages = await GetSupportedLanguagesAsync();
        return languages.FirstOrDefault(l => l.IsDefault);
    }

    public async Task<bool> IsLanguageSupportedAsync(string languageCode)
    {
        var normalizedCode = NormalizeLanguageCode(languageCode);
        return _fallbackStrings.ContainsKey(normalizedCode);
    }

    public string GetCurrentLanguage()
    {
        return _cache.Get<string>(_currentLanguageKey) ?? "en";
    }

    public void SetCurrentLanguage(string languageCode)
    {
        var normalizedCode = NormalizeLanguageCode(languageCode);
        _cache.Set(_currentLanguageKey, normalizedCode);
        _logger.LogInformation("Current language set to '{Language}'", normalizedCode);
    }

    public async Task ClearCacheAsync(string languageCode)
    {
        try
        {
            var normalizedCode = NormalizeLanguageCode(languageCode);
            // Note: IMemoryCache doesn't support getting all keys
            // In a real implementation, you would track keys separately or use a different caching strategy
            _logger.LogInformation("Cache clear requested for language '{Language}' (implementation note: keys tracking not supported)", normalizedCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache for language '{Language}'", languageCode);
        }
    }

    public async Task ClearAllCachesAsync()
    {
        try
        {
            // Note: IMemoryCache doesn't support getting all keys
            // In a real implementation, you would track keys separately or use a different caching strategy
            _logger.LogInformation("All localization caches clear requested (implementation note: keys tracking not supported)");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing all localization caches");
        }
    }

    private string NormalizeLanguageCode(string languageCode)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
            return "en";
            
        return languageCode.ToLowerInvariant().Trim();
    }

    private string GetLanguageName(string languageCode)
    {
        return languageCode switch
        {
            "en" => "English",
            "es" => "Spanish",
            "fr" => "French",
            "de" => "German",
            "ro" => "Romanian",
            _ => languageCode.ToUpperInvariant()
        };
    }

    private string GetNativeLanguageName(string languageCode)
    {
        return languageCode switch
        {
            "en" => "English",
            "es" => "Español",
            "fr" => "Français",
            "de" => "Deutsch",
            "it" => "Italiano",
            "pt" => "Português",
            "nl" => "Nederlands",
            "pl" => "Polski",
            "cs" => "Čeština",
            "hu" => "Magyar",
            "ro" => "Română",
            "he" => "עברית",
            "ar" => "العربية",
            _ => languageCode.ToUpperInvariant()
        };
    }

    public async Task<Dictionary<string, string>> GetFrontendTranslationsAsync(string languageCode, string category = "ui")
    {
        try
        {
            var normalizedCode = NormalizeLanguageCode(languageCode);
            var result = new Dictionary<string, string>();
            
            if (_fallbackStrings.TryGetValue(normalizedCode, out var languageStrings))
            {
                foreach (var kvp in languageStrings)
                {
                    if (kvp.Key.StartsWith(category + "."))
                    {
                        // Remove category prefix for frontend
                        var key = kvp.Key.Substring(category.Length + 1);
                        result[key] = kvp.Value;
                    }
                }
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting frontend translations for language '{Language}' and category '{Category}'", languageCode, category);
            return new Dictionary<string, string>();
        }
    }

    public async Task<Dictionary<string, string>> GetAllFrontendTranslationsAsync(string languageCode)
    {
        var categories = new[] { "ui", "officer", "messaging", "social", "kinder", "notification", "neurospark", "groups", "seer", "system" };
        var result = new Dictionary<string, string>();
        
        foreach (var category in categories)
        {
            var categoryTranslations = await GetFrontendTranslationsAsync(languageCode, category);
            foreach (var kvp in categoryTranslations)
            {
                result[$"{category}.{kvp.Key}"] = kvp.Value;
            }
        }
        
        return result;
    }

    public async Task<Dictionary<string, Dictionary<string, string>>> GetMultiCategoryTranslationsAsync(string languageCode, string[] categories)
    {
        var result = new Dictionary<string, Dictionary<string, string>>();
        
        foreach (var category in categories)
        {
            result[category] = await GetFrontendTranslationsAsync(languageCode, category);
        }
        
        return result;
    }

    public async Task<Dictionary<string, string>> GetMobileTranslationsAsync(string languageCode, string platform = "react-native")
    {
        var categories = new[] { "ui", "mobile", "notifications" };
        var result = new Dictionary<string, string>();
        
        foreach (var category in categories)
        {
            var categoryTranslations = await GetFrontendTranslationsAsync(languageCode, category);
            foreach (var kvp in categoryTranslations)
            {
                result[$"{category}.{kvp.Key}"] = kvp.Value;
            }
        }
        
        // Add mobile-specific translations
        var mobileSpecific = await GetFrontendTranslationsAsync(languageCode, "mobile");
        foreach (var kvp in mobileSpecific)
        {
            result[kvp.Key] = kvp.Value;
        }
        
        return result;
    }

    public async Task<Dictionary<string, string>> GetMicroserviceTranslationsAsync(string languageCode, string microservice)
    {
        return await GetFrontendTranslationsAsync(languageCode, microservice);
    }
}
