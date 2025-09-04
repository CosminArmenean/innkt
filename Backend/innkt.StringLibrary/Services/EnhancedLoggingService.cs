using Microsoft.Extensions.Logging;

namespace innkt.StringLibrary.Services;

/// <summary>
/// Enhanced logging service that integrates with localization for better user experience
/// </summary>
public class EnhancedLoggingService : IEnhancedLoggingService
{
    private readonly ILogger<EnhancedLoggingService> _logger;
    private readonly ILocalizationService _localizationService;

    public EnhancedLoggingService(ILogger<EnhancedLoggingService> logger, ILocalizationService localizationService)
    {
        _logger = logger;
        _localizationService = localizationService;
    }

    public void LogInformation(string messageKey, params object[] args)
    {
        var localizedMessage = _localizationService.GetStringAsync(messageKey).Result;
        var formattedMessage = string.Format(localizedMessage, args);
        
        _logger.LogInformation(formattedMessage);
        
        // Also log the original key for debugging
        _logger.LogDebug("Localized message key: {MessageKey} -> {LocalizedMessage}", messageKey, localizedMessage);
    }

    public void LogWarning(string messageKey, params object[] args)
    {
        var localizedMessage = _localizationService.GetStringAsync(messageKey).Result;
        var formattedMessage = string.Format(localizedMessage, args);
        
        _logger.LogWarning(formattedMessage);
        
        // Also log the original key for debugging
        _logger.LogDebug("Localized message key: {MessageKey} -> {LocalizedMessage}", messageKey, localizedMessage);
    }

    public void LogError(string messageKey, params object[] args)
    {
        var localizedMessage = _localizationService.GetStringAsync(messageKey).Result;
        var formattedMessage = string.Format(localizedMessage, args);
        
        _logger.LogError(formattedMessage);
        
        // Also log the original key for debugging
        _logger.LogDebug("Localized message key: {MessageKey} -> {LocalizedMessage}", messageKey, localizedMessage);
    }

    public void LogError(Exception exception, string messageKey, params object[] args)
    {
        var localizedMessage = _localizationService.GetStringAsync(messageKey).Result;
        var formattedMessage = string.Format(localizedMessage, args);
        
        _logger.LogError(exception, formattedMessage);
        
        // Also log the original key for debugging
        _logger.LogDebug("Localized message key: {MessageKey} -> {LocalizedMessage}", messageKey, localizedMessage);
    }

    public void LogDebug(string messageKey, params object[] args)
    {
        var localizedMessage = _localizationService.GetStringAsync(messageKey).Result;
        var formattedMessage = string.Format(localizedMessage, args);
        
        _logger.LogDebug(formattedMessage);
    }

    public void LogCritical(string messageKey, params object[] args)
    {
        var localizedMessage = _localizationService.GetStringAsync(messageKey).Result;
        var formattedMessage = string.Format(localizedMessage, args);
        
        _logger.LogCritical(formattedMessage);
        
        // Also log the original key for debugging
        _logger.LogDebug("Localized message key: {MessageKey} -> {LocalizedMessage}", messageKey, localizedMessage);
    }

    public void LogTrace(string messageKey, params object[] args)
    {
        var localizedMessage = _localizationService.GetStringAsync(messageKey).Result;
        var formattedMessage = string.Format(localizedMessage, args);
        
        _logger.LogTrace(formattedMessage);
    }

    public async Task<string> GetLocalizedMessageAsync(string messageKey, string? defaultValue = null)
    {
        var userLanguage = GetUserLanguage();
        return await _localizationService.GetStringAsync(messageKey, userLanguage, defaultValue);
    }

    public async Task<string> GetLocalizedMessageAsync(string messageKey, string languageCode, string? defaultValue = null)
    {
        return await _localizationService.GetStringAsync(messageKey, languageCode, defaultValue);
    }

    public void SetUserLanguage(string languageCode)
    {
        _localizationService.SetCurrentLanguage(languageCode);
    }

    public string GetUserLanguage()
    {
        return _localizationService.GetCurrentLanguage();
    }
}
