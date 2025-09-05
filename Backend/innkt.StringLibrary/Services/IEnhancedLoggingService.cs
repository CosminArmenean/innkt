namespace innkt.StringLibrary.Services;

/// <summary>
/// Enhanced logging service that integrates with localization for better user experience
/// </summary>
public interface IEnhancedLoggingService
{
    /// <summary>
    /// Logs an information message with localized user-friendly text
    /// </summary>
    /// <param name="messageKey">The localization key for the message</param>
    /// <param name="args">Format arguments</param>
    void LogInformation(string messageKey, params object[] args);
    
    /// <summary>
    /// Logs a warning message with localized user-friendly text
    /// </summary>
    /// <param name="messageKey">The localization key for the message</param>
    /// <param name="args">Format arguments</param>
    void LogWarning(string messageKey, params object[] args);
    
    /// <summary>
    /// Logs an error message with localized user-friendly text
    /// </summary>
    /// <param name="messageKey">The localization key for the message</param>
    /// <param name="args">Format arguments</param>
    void LogError(string messageKey, params object[] args);
    
    /// <summary>
    /// Logs an error message with exception details and localized user-friendly text
    /// </summary>
    /// <param name="exception">The exception that occurred</param>
    /// <param name="messageKey">The localization key for the message</param>
    /// <param name="args">Format arguments</param>
    void LogError(Exception exception, string messageKey, params object[] args);
    
    /// <summary>
    /// Logs a debug message with localized user-friendly text
    /// </summary>
    /// <param name="messageKey">The localization key for the message</param>
    /// <param name="args">Format arguments</param>
    void LogDebug(string messageKey, params object[] args);
    
    /// <summary>
    /// Logs a critical message with localized user-friendly text
    /// </summary>
    /// <param name="messageKey">The localization key for the message</param>
    /// <param name="args">Format arguments</param>
    void LogCritical(string messageKey, params object[] args);
    
    /// <summary>
    /// Logs a trace message with localized user-friendly text
    /// </summary>
    /// <param name="messageKey">The localization key for the message</param>
    /// <param name="args">Format arguments</param>
    void LogTrace(string messageKey, params object[] args);
    
    /// <summary>
    /// Gets a localized message for the current user's language
    /// </summary>
    /// <param name="messageKey">The localization key</param>
    /// <param name="defaultValue">Default value if not found</param>
    /// <returns>The localized message</returns>
    Task<string> GetLocalizedMessageAsync(string messageKey, string? defaultValue = null);
    
    /// <summary>
    /// Gets a localized message for a specific language
    /// </summary>
    /// <param name="messageKey">The localization key</param>
    /// <param name="languageCode">The language code</param>
    /// <param name="defaultValue">Default value if not found</param>
    /// <returns>The localized message</returns>
    Task<string> GetLocalizedMessageAsync(string messageKey, string languageCode, string? defaultValue = null);
    
    /// <summary>
    /// Sets the current user's language preference
    /// </summary>
    /// <param name="languageCode">The language code</param>
    void SetUserLanguage(string languageCode);
    
    /// <summary>
    /// Gets the current user's language preference
    /// </summary>
    /// <returns>The current language code</returns>
    string GetUserLanguage();
}




