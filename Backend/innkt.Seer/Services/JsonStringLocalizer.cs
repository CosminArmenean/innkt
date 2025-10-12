using Microsoft.Extensions.Localization;
using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;

namespace innkt.Seer.Services;

/// <summary>
/// JSON-based string localizer
/// </summary>
public class JsonStringLocalizer : IStringLocalizer
{
    private readonly ConcurrentDictionary<string, Dictionary<string, string>> _cache = new();
    private readonly string _resourcesPath;
    private readonly ILogger<JsonStringLocalizer> _logger;

    public JsonStringLocalizer(string resourcesPath, ILogger<JsonStringLocalizer> logger)
    {
        _resourcesPath = resourcesPath;
        _logger = logger;
    }

    public LocalizedString this[string name]
    {
        get
        {
            var value = GetString(name);
            return new LocalizedString(name, value ?? name, value == null);
        }
    }

    public LocalizedString this[string name, params object[] arguments]
    {
        get
        {
            var format = GetString(name);
            var value = string.Format(format ?? name, arguments);
            return new LocalizedString(name, value, format == null);
        }
    }

    public IEnumerable<LocalizedString> GetAllStrings(bool includeParentCultures)
    {
        var culture = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;
        var translations = GetTranslations(culture);
        
        foreach (var kvp in translations)
        {
            yield return new LocalizedString(kvp.Key, kvp.Value, false);
        }
    }

    private string? GetString(string name)
    {
        var culture = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName;
        var translations = GetTranslations(culture);
        
        return GetValueFromPath(translations, name);
    }

    private Dictionary<string, string> GetTranslations(string culture)
    {
        return _cache.GetOrAdd(culture, _ =>
        {
            var filePath = Path.Combine(_resourcesPath, $"{culture}.json");
            
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("Translation file not found: {FilePath}", filePath);
                
                // Fallback to English
                filePath = Path.Combine(_resourcesPath, "en.json");
                if (!File.Exists(filePath))
                {
                    return new Dictionary<string, string>();
                }
            }

            try
            {
                var json = File.ReadAllText(filePath);
                var deserialized = JsonSerializer.Deserialize<Dictionary<string, object>>(json);
                return FlattenDictionary(deserialized ?? new Dictionary<string, object>());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading translation file: {FilePath}", filePath);
                return new Dictionary<string, string>();
            }
        });
    }

    private string? GetValueFromPath(Dictionary<string, string> translations, string path)
    {
        if (translations.TryGetValue(path, out var value))
        {
            return value;
        }

        return null;
    }

    private Dictionary<string, string> FlattenDictionary(Dictionary<string, object> nested, string prefix = "")
    {
        var result = new Dictionary<string, string>();

        foreach (var kvp in nested)
        {
            var key = string.IsNullOrEmpty(prefix) ? kvp.Key : $"{prefix}.{kvp.Key}";

            if (kvp.Value is JsonElement element)
            {
                if (element.ValueKind == JsonValueKind.Object)
                {
                    var childDict = JsonSerializer.Deserialize<Dictionary<string, object>>(element.GetRawText());
                    if (childDict != null)
                    {
                        foreach (var child in FlattenDictionary(childDict, key))
                        {
                            result[child.Key] = child.Value;
                        }
                    }
                }
                else if (element.ValueKind == JsonValueKind.String)
                {
                    result[key] = element.GetString() ?? key;
                }
            }
            else if (kvp.Value is string stringValue)
            {
                result[key] = stringValue;
            }
        }

        return result;
    }
}
