using Microsoft.Extensions.Localization;

namespace innkt.Officer.Services;

/// <summary>
/// Factory for creating JSON string localizers
/// </summary>
public class JsonStringLocalizerFactory : IStringLocalizerFactory
{
    private readonly string _resourcesPath;
    private readonly ILoggerFactory _loggerFactory;

    public JsonStringLocalizerFactory(string resourcesPath, ILoggerFactory loggerFactory)
    {
        _resourcesPath = resourcesPath;
        _loggerFactory = loggerFactory;
    }

    public IStringLocalizer Create(Type resourceSource)
    {
        var logger = _loggerFactory.CreateLogger<JsonStringLocalizer>();
        return new JsonStringLocalizer(_resourcesPath, logger);
    }

    public IStringLocalizer Create(string baseName, string location)
    {
        var logger = _loggerFactory.CreateLogger<JsonStringLocalizer>();
        return new JsonStringLocalizer(_resourcesPath, logger);
    }
}
