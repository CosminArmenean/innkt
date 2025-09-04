using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using innkt.StringLibrary.Models;
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
    
    // In-memory fallback strings (will be replaced with database calls)
    private readonly Dictionary<string, Dictionary<string, string>> _fallbackStrings = new()
    {
        ["en"] = new Dictionary<string, string>
        {
            ["auth.login.success"] = "Login successful",
            ["auth.login.failed"] = "Login failed",
            ["auth.login.invalid_credentials"] = "Invalid username or password",
            ["auth.login.account_locked"] = "Account is locked",
            ["auth.login.account_inactive"] = "Account is inactive",
            ["mfa.setup.required"] = "Multi-factor authentication setup required",
            ["mfa.setup.success"] = "Multi-factor authentication setup successful",
            ["mfa.verification.required"] = "MFA verification required",
            ["mfa.verification.success"] = "MFA verification successful",
            ["verification.credit_card.required"] = "Credit card verification required",
            ["verification.credit_card.success"] = "Credit card verification successful",
            ["kid_account.creation.success"] = "Kid account created successfully",
            ["kid_account.pairing.success"] = "Kid account paired successfully",
            ["general.success"] = "Operation completed successfully",
            ["general.error"] = "An error occurred",
            ["validation.required"] = "This field is required",
            ["validation.invalid_email"] = "Invalid email format"
        },
        ["es"] = new Dictionary<string, string>
        {
            ["auth.login.success"] = "Inicio de sesión exitoso",
            ["auth.login.failed"] = "Inicio de sesión fallido",
            ["auth.login.invalid_credentials"] = "Usuario o contraseña inválidos",
            ["general.success"] = "Operación completada exitosamente",
            ["general.error"] = "Ocurrió un error"
        },
        ["fr"] = new Dictionary<string, string>
        {
            ["auth.login.success"] = "Connexion réussie",
            ["auth.login.failed"] = "Échec de la connexion",
            ["auth.login.invalid_credentials"] = "Nom d'utilisateur ou mot de passe invalide",
            ["general.success"] = "Opération terminée avec succès",
            ["general.error"] = "Une erreur s'est produite"
        },
        ["de"] = new Dictionary<string, string>
        {
            ["auth.login.success"] = "Anmeldung erfolgreich",
            ["auth.login.failed"] = "Anmeldung fehlgeschlagen",
            ["auth.login.invalid_credentials"] = "Ungültiger Benutzername oder Passwort",
            ["general.success"] = "Vorgang erfolgreich abgeschlossen",
            ["general.error"] = "Ein Fehler ist aufgetreten"
        },
        ["ro"] = new Dictionary<string, string>
        {
            ["auth.login.success"] = "Autentificare reușită",
            ["auth.login.failed"] = "Autentificare eșuată",
            ["auth.login.invalid_credentials"] = "Nume de utilizator sau parolă invalidă",
            ["general.success"] = "Operațiunea a fost finalizată cu succes",
            ["general.error"] = "A apărut o eroare"
        }
    };

    public LocalizationService(IMemoryCache cache, ILogger<LocalizationService> logger)
    {
        _cache = cache;
        _logger = logger;
        
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
            "ro" => "Română",
            _ => languageCode.ToUpperInvariant()
        };
    }
}
