using innkt.NeuroSpark.Models.XAI;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace innkt.NeuroSpark.Services;

public class DailyUsageTracker : IDailyUsageTracker
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<DailyUsageTracker> _logger;
    private readonly XAIConfiguration _config;

    public DailyUsageTracker(IMemoryCache cache, ILogger<DailyUsageTracker> logger, IOptions<XAIConfiguration> config)
    {
        _cache = cache;
        _logger = logger;
        _config = config.Value;
    }

    public async Task<bool> CanMakeRequestAsync()
    {
        var todayUsage = await GetTodayUsageAsync();
        var canMake = todayUsage.RequestsCount < _config.DailyLimits.MaxRequestsPerDay;
        
        if (!canMake)
        {
            _logger.LogWarning("Daily request limit exceeded: {Requests}/{MaxRequests}", 
                todayUsage.RequestsCount, _config.DailyLimits.MaxRequestsPerDay);
        }
        
        return canMake;
    }

    public async Task<bool> CanUseTokensAsync(int requestedTokens)
    {
        var todayUsage = await GetTodayUsageAsync();
        var canUse = (todayUsage.TokensUsed + requestedTokens) <= _config.DailyLimits.MaxTokensPerDay;
        
        if (!canUse)
        {
            _logger.LogWarning("Daily token limit would be exceeded: {CurrentTokens} + {RequestedTokens} > {MaxTokens}", 
                todayUsage.TokensUsed, requestedTokens, _config.DailyLimits.MaxTokensPerDay);
        }
        
        return canUse;
    }

    public async Task TrackUsageAsync(int tokensUsed)
    {
        var today = DateTime.UtcNow.Date;
        var cacheKey = $"xai_usage_{today:yyyyMMdd}";
        
        var usage = await _cache.GetOrCreateAsync<DailyUsage>(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1);
            return Task.FromResult(new DailyUsage { Date = today });
        });
        
        usage.RequestsCount++;
        usage.TokensUsed += tokensUsed;
        
        _logger.LogInformation("X.AI Daily Usage: {Requests}/{MaxRequests} requests, {Tokens}/{MaxTokens} tokens", 
            usage.RequestsCount, _config.DailyLimits.MaxRequestsPerDay,
            usage.TokensUsed, _config.DailyLimits.MaxTokensPerDay);
    }

    public async Task<DailyUsage> GetTodayUsageAsync()
    {
        var today = DateTime.UtcNow.Date;
        var cacheKey = $"xai_usage_{today:yyyyMMdd}";
        
        return await _cache.GetOrCreateAsync<DailyUsage>(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1);
            return Task.FromResult(new DailyUsage { Date = today });
        });
    }

    public Task ResetDailyUsageAsync()
    {
        var today = DateTime.UtcNow.Date;
        var cacheKey = $"xai_usage_{today:yyyyMMdd}";
        _cache.Remove(cacheKey);
        
        _logger.LogInformation("Daily usage reset for {Date}", today);
        return Task.CompletedTask;
    }
}
