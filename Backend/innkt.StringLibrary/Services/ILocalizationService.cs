namespace innkt.StringLibrary.Services;

/// <summary>
/// Service for managing localized strings and internationalization
/// </summary>
public interface ILocalizationService
{
    /// <summary>
    /// Gets a localized string by key and language code
    /// </summary>
    /// <param name="key">The string key</param>
    /// <param name="languageCode">The language code (e.g., "en", "es", "fr", "de", "ro")</param>
    /// <param name="defaultValue">Default value if string not found</param>
    /// <returns>The localized string or default value</returns>
    Task<string> GetStringAsync(string key, string languageCode, string? defaultValue = null);
    
    /// <summary>
    /// Gets a localized string by key using the current user's language preference
    /// </summary>
    /// <param name="key">The string key</param>
    /// <param name="defaultValue">Default value if string not found</param>
    /// <returns>The localized string or default value</returns>
    Task<string> GetStringAsync(string key, string? defaultValue = null);
    
    /// <summary>
    /// Gets multiple localized strings by keys
    /// </summary>
    /// <param name="keys">Array of string keys</param>
    /// <param name="languageCode">The language code</param>
    /// <returns>Dictionary of key-value pairs</returns>
    Task<Dictionary<string, string>> GetStringsAsync(string[] keys, string languageCode);
    
    /// <summary>
    /// Gets all strings for a specific category and language
    /// </summary>
    /// <param name="category">The category name</param>
    /// <param name="languageCode">The language code</param>
    /// <returns>Dictionary of key-value pairs</returns>
    Task<Dictionary<string, string>> GetStringsByCategoryAsync(string category, string languageCode);
    
    /// <summary>
    /// Adds or updates a localized string
    /// </summary>
    /// <param name="key">The string key</param>
    /// <param name="languageCode">The language code</param>
    /// <param name="value">The localized value</param>
    /// <param name="description">Optional description</param>
    /// <param name="category">Optional category</param>
    /// <returns>True if successful</returns>
    Task<bool> SetStringAsync(string key, string languageCode, string value, string? description = null, string? category = null);
    
    /// <summary>
    /// Gets all supported languages
    /// </summary>
    /// <returns>List of supported languages</returns>
    Task<List<Models.Language>> GetSupportedLanguagesAsync();
    
    /// <summary>
    /// Gets the default language
    /// </summary>
    /// <returns>The default language</returns>
    Task<Models.Language?> GetDefaultLanguageAsync();
    
    /// <summary>
    /// Checks if a language is supported
    /// </summary>
    /// <param name="languageCode">The language code to check</param>
    /// <returns>True if supported</returns>
    Task<bool> IsLanguageSupportedAsync(string languageCode);
    
    /// <summary>
    /// Gets the current user's preferred language
    /// </summary>
    /// <returns>The current language code</returns>
    string GetCurrentLanguage();
    
    /// <summary>
    /// Sets the current user's preferred language
    /// </summary>
    /// <param name="languageCode">The language code to set</param>
    void SetCurrentLanguage(string languageCode);
    
    /// <summary>
    /// Clears the localization cache for a specific language
    /// </summary>
    /// <param name="languageCode">The language code</param>
    Task ClearCacheAsync(string languageCode);
    
    /// <summary>
    /// Clears all localization caches
    /// </summary>
    Task ClearAllCachesAsync();
}




