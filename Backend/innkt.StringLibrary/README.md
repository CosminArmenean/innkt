# INNKT String Library

A comprehensive internationalization (i18n) and localization library for the INNKT application ecosystem.

## 🌍 Features

- **Multi-language Support**: Built-in support for English, Spanish, French, German, and Romanian
- **String Constants**: Centralized string keys for consistent application messaging
- **Caching**: In-memory caching for improved performance
- **Fallback System**: Automatic fallback to default language when translations are missing
- **Enhanced Logging**: Integration with localization for user-friendly log messages
- **Extensible**: Easy to add new languages and string categories

## 🚀 Quick Start

### 1. Add Reference

Add a reference to the `innkt.StringLibrary` project in your microservice:

```xml
<ProjectReference Include="..\innkt.StringLibrary\innkt.StringLibrary.csproj" />
```

### 2. Register Services

In your `Program.cs` or `Startup.cs`:

```csharp
// Add memory cache
builder.Services.AddMemoryCache();

// Add localization services
builder.Services.AddScoped<ILocalizationService, LocalizationService>();
builder.Services.AddScoped<IEnhancedLoggingService, EnhancedLoggingService>();

// Seed initial strings (optional)
var localizationService = app.Services.GetRequiredService<ILocalizationService>();
await StringLibrarySeeder.SeedAsync(localizationService);
```

### 3. Use in Controllers/Services

```csharp
public class AuthController : ControllerBase
{
    private readonly IEnhancedLoggingService _logger;
    private readonly ILocalizationService _localization;

    public AuthController(IEnhancedLoggingService logger, ILocalizationService localization)
    {
        _logger = logger;
        _localization = localization;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            // Your login logic here
            
            // Log success with localized message
            _logger.LogInformation(AppStrings.Auth.LoginSuccess);
            
            // Return localized message
            var message = await _localization.GetStringAsync(AppStrings.Auth.LoginSuccess);
            return Ok(new { message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.LoginFailed);
            var message = await _localization.GetStringAsync(AppStrings.Auth.LoginFailed);
            return BadRequest(new { message });
        }
    }
}
```

## 📚 String Constants

Use the predefined string constants from `AppStrings` class:

```csharp
// Authentication
AppStrings.Auth.LoginSuccess
AppStrings.Auth.LoginFailed
AppStrings.Auth.RegistrationSuccess

// MFA
AppStrings.Mfa.SetupRequired
AppStrings.Mfa.VerificationSuccess

// Validation
AppStrings.Validation.Required
AppStrings.Validation.InvalidEmail

// General
AppStrings.General.Success
AppStrings.General.Error
```

## 🌐 Supported Languages

| Language | Code | Name | Native Name |
|----------|------|------|-------------|
| English | `en` | English | English |
| Spanish | `es` | Spanish | Español |
| French | `fr` | French | Français |
| German | `de` | German | Deutsch |
| Romanian | `ro` | Romanian | Română |

## 🔧 Configuration

### Language Settings

```csharp
// Set user's preferred language
_localizationService.SetCurrentLanguage("es");

// Get current language
var currentLang = _localizationService.GetCurrentLanguage();

// Check if language is supported
var isSupported = await _localizationService.IsLanguageSupportedAsync("fr");
```

### Caching

The library uses in-memory caching with configurable expiration:

```csharp
// Default cache expiration: 1 hour
private readonly TimeSpan _cacheExpiration = TimeSpan.FromHours(1);
```

## 📝 Adding New Strings

### 1. Add to Constants

```csharp
public static class NewFeature
{
    public const string WelcomeMessage = "new_feature.welcome_message";
    public const string SetupComplete = "new_feature.setup_complete";
}
```

### 2. Add to Seeder

```csharp
// In StringLibrarySeeder.cs
["new_feature.welcome_message"] = ("Welcome to the new feature!", "Welcome message for new feature", "new_feature"),
["new_feature.setup_complete"] = ("Setup completed successfully", "Message shown when setup is complete", "new_feature")
```

### 3. Add Translations

```csharp
// Spanish
["new_feature.welcome_message"] = ("¡Bienvenido a la nueva función!", "Mensaje de bienvenida para nueva función", "new_feature"),

// French
["new_feature.welcome_message"] = ("Bienvenue dans la nouvelle fonctionnalité !", "Message de bienvenu pour nouvelle fonctionnalité", "new_feature"),
```

## 🔍 API Reference

### ILocalizationService

- `GetStringAsync(string key, string? defaultValue = null)` - Get localized string for current language
- `GetStringAsync(string key, string languageCode, string? defaultValue = null)` - Get localized string for specific language
- `GetStringsAsync(string[] keys, string languageCode)` - Get multiple strings at once
- `GetStringsByCategoryAsync(string category, string languageCode)` - Get all strings in a category
- `SetStringAsync(string key, string languageCode, string value, string? description, string? category)` - Add/update string
- `GetSupportedLanguagesAsync()` - Get list of supported languages
- `SetCurrentLanguage(string languageCode)` - Set current user language
- `GetCurrentLanguage()` - Get current user language

### IEnhancedLoggingService

- `LogInformation(string messageKey, params object[] args)` - Log info with localization
- `LogWarning(string messageKey, params object[] args)` - Log warning with localization
- `LogError(string messageKey, params object[] args)` - Log error with localization
- `LogError(Exception exception, string messageKey, params object[] args)` - Log error with exception
- `GetLocalizedMessageAsync(string messageKey, string? defaultValue = null)` - Get localized message

## 🏗️ Architecture

```
innkt.StringLibrary/
├── Models/
│   ├── LocalizedString.cs      # Database model for localized strings
│   └── Language.cs             # Supported language configuration
├── Services/
│   ├── ILocalizationService.cs # Localization service interface
│   ├── LocalizationService.cs  # Localization service implementation
│   ├── IEnhancedLoggingService.cs # Enhanced logging interface
│   └── EnhancedLoggingService.cs  # Enhanced logging implementation
├── Constants/
│   └── AppStrings.cs           # String constants for the application
└── Data/
    └── StringLibrarySeeder.cs  # Data seeder for initial strings
```

## 🚀 Future Enhancements

- **Database Integration**: Store strings in database for dynamic updates
- **Admin Interface**: Web interface for managing translations
- **Auto-translation**: Integration with translation services (Google Translate, DeepL)
- **Pluralization**: Support for plural forms
- **Context-aware**: Context-sensitive translations
- **Performance Monitoring**: Cache hit/miss metrics
- **Distributed Caching**: Redis integration for multi-instance deployments

## 📋 Requirements

- .NET 9.0
- Microsoft.Extensions.Caching.Memory
- Microsoft.Extensions.Logging.Abstractions
- System.ComponentModel.Annotations

## 🤝 Contributing

1. Add new string constants to `AppStrings.cs`
2. Add translations to `StringLibrarySeeder.cs`
3. Update this README if adding new features
4. Ensure all translations are culturally appropriate

## 📄 License

This project is part of the INNKT application ecosystem.



