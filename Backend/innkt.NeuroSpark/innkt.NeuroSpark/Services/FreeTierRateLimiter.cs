using innkt.NeuroSpark.Models.XAI;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Caching.Memory;

namespace innkt.NeuroSpark.Services;

public class FreeTierRateLimiter : IFreeTierRateLimiter
{
    private readonly SemaphoreSlim _requestSemaphore;
    private readonly IDailyUsageTracker _usageTracker;
    private readonly XAIConfiguration _config;
    private readonly ILogger<FreeTierRateLimiter> _logger;
    private readonly IMemoryCache _cache;

    public FreeTierRateLimiter(IDailyUsageTracker usageTracker, IOptions<XAIConfiguration> config, ILogger<FreeTierRateLimiter> logger, IMemoryCache cache)
    {
        _usageTracker = usageTracker;
        _config = config.Value;
        _logger = logger;
        _cache = cache;
        _requestSemaphore = new SemaphoreSlim(_config.RateLimits.MaxRequestsPerMinute, _config.RateLimits.MaxRequestsPerMinute);
    }

    public async Task<bool> TryAcquireRequestAsync()
    {
        // Check daily limit first
        if (!await _usageTracker.CanMakeRequestAsync())
        {
            _logger.LogWarning("Daily request limit exceeded");
            return false;
        }

        // Check minute limit
        if (!await _requestSemaphore.WaitAsync(TimeSpan.FromSeconds(1)))
        {
            _logger.LogWarning("Minute rate limit exceeded");
            return false;
        }

        // Check hourly limit
        if (!await CheckHourlyLimitAsync())
        {
            _logger.LogWarning("Hourly rate limit exceeded");
            _requestSemaphore.Release();
            return false;
        }

        return true;
    }

    public void ReleaseRequest()
    {
        _requestSemaphore.Release();
    }

    private async Task<bool> CheckHourlyLimitAsync()
    {
        var currentHour = DateTime.UtcNow.Hour;
        var cacheKey = $"xai_hourly_{currentHour}";
        
        var hourlyCount = await _cache.GetOrCreateAsync<int>(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return Task.FromResult(0);
        });

        if (hourlyCount >= _config.RateLimits.MaxRequestsPerHour)
        {
            return false;
        }

        // Increment counter
        _cache.Set(cacheKey, hourlyCount + 1, TimeSpan.FromHours(1));
        return true;
    }
}
