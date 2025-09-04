using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace innkt.NeuroSpark.Services;

public class RateLimiter : IRateLimiter
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RateLimiter> _logger;
    private readonly IPerformanceMonitor _performanceMonitor;
    private readonly RateLimiterSettings _settings;
    private readonly List<RateLimitRule> _defaultRules;

    public RateLimiter(
        IConnectionMultiplexer redis,
        IOptions<RateLimiterSettings> settings,
        IPerformanceMonitor performanceMonitor,
        ILogger<RateLimiter> logger)
    {
        _redis = redis ?? throw new ArgumentNullException(nameof(redis));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _performanceMonitor = performanceMonitor ?? throw new ArgumentNullException(nameof(performanceMonitor));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Initialize default rate limiting rules
        _defaultRules = InitializeDefaultRules();
        
        _logger.LogInformation("Rate limiter initialized with {RuleCount} default rules", _defaultRules.Count);
    }

    public async Task<RateLimitResult> CheckRateLimitAsync(string identifier, string endpoint, RateLimitRule rule)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            var db = _redis.GetDatabase();
            var key = GetRateLimitKey(identifier, endpoint);
            var now = DateTime.UtcNow;
            var windowStart = now.Add(-rule.Window);

            // Get current request count from Redis
            var currentCount = await db.StringGetAsync(key);
            var requestCount = currentCount.HasValue ? int.Parse(currentCount.ToString()) : 0;

            // Check if identifier is blocked
            var blockedKey = GetBlockedKey(identifier, endpoint);
            var blockedUntil = await db.StringGetAsync(blockedKey);
            
            if (blockedUntil.HasValue && DateTime.Parse(blockedUntil.ToString()) > now)
            {
                var result = new RateLimitResult
                {
                    IsAllowed = false,
                    RemainingRequests = 0,
                    TotalRequests = requestCount,
                    ResetTime = DateTime.Parse(blockedUntil.ToString()),
                    TimeUntilReset = DateTime.Parse(blockedUntil.ToString()) - now,
                    Reason = "Rate limit exceeded, temporarily blocked",
                    AppliedRule = rule
                };

                _performanceMonitor.IncrementCounter("rate_limit_blocked", 1, "rate_limiting");
                _logger.LogWarning("Rate limit blocked for {Identifier} on {Endpoint}", identifier, endpoint);
                
                return result;
            }

            // Check if request count exceeds limit
            if (requestCount >= rule.MaxRequests)
            {
                // Block the identifier
                var blockUntil = now.Add(rule.BlockDuration);
                await db.StringSetAsync(blockedKey, blockUntil.ToString(), rule.BlockDuration);

                var result = new RateLimitResult
                {
                    IsAllowed = false,
                    RemainingRequests = 0,
                    TotalRequests = requestCount,
                    ResetTime = blockUntil,
                    TimeUntilReset = rule.BlockDuration,
                    Reason = "Rate limit exceeded",
                    AppliedRule = rule
                };

                _performanceMonitor.IncrementCounter("rate_limit_exceeded", 1, "rate_limiting");
                _logger.LogWarning("Rate limit exceeded for {Identifier} on {Endpoint}: {Count}/{Limit}", 
                    identifier, endpoint, requestCount, rule.MaxRequests);

                return result;
            }

            // Increment request count
            var newCount = requestCount + 1;
            await db.StringSetAsync(key, newCount.ToString(), rule.Window);

            var allowedResult = new RateLimitResult
            {
                IsAllowed = true,
                RemainingRequests = rule.MaxRequests - newCount,
                TotalRequests = newCount,
                ResetTime = now.Add(rule.Window),
                TimeUntilReset = rule.Window,
                AppliedRule = rule
            };

            _performanceMonitor.IncrementCounter("rate_limit_allowed", 1, "rate_limiting");
            _logger.LogDebug("Rate limit check passed for {Identifier} on {Endpoint}: {Count}/{Limit}", 
                identifier, endpoint, newCount, rule.MaxRequests);

            return allowedResult;
        }
        catch (Exception ex)
        {
            _performanceMonitor.IncrementCounter("rate_limit_error", 1, "rate_limiting");
            _logger.LogError(ex, "Error checking rate limit for {Identifier} on {Endpoint}", identifier, endpoint);
            
            // Fail open - allow request if rate limiting fails
            return new RateLimitResult
            {
                IsAllowed = true,
                RemainingRequests = int.MaxValue,
                TotalRequests = 0,
                ResetTime = DateTime.UtcNow.Add(TimeSpan.FromMinutes(1)),
                TimeUntilReset = TimeSpan.FromMinutes(1),
                Reason = "Rate limiting temporarily unavailable",
                AppliedRule = rule
            };
        }
        finally
        {
            stopwatch.Stop();
            _performanceMonitor.RecordTiming("rate_limit_check", stopwatch.Elapsed, "rate_limiting");
        }
    }

    public async Task<RateLimitStatus> GetRateLimitStatusAsync(string identifier, string endpoint)
    {
        try
        {
            var db = _redis.GetDatabase();
            var key = GetRateLimitKey(identifier, endpoint);
            var blockedKey = GetBlockedKey(identifier, endpoint);
            var now = DateTime.UtcNow;

            // Get current request count
            var currentCount = await db.StringGetAsync(key);
            var requestCount = currentCount.HasValue ? int.Parse(currentCount.ToString()) : 0;

            // Get blocked status
            var blockedUntil = await db.StringGetAsync(blockedKey);
            var isBlocked = blockedUntil.HasValue && DateTime.Parse(blockedUntil.ToString()) > now;

            // Find applicable rule
            var rule = _defaultRules.FirstOrDefault(r => r.Endpoint == endpoint) ?? new RateLimitRule
            {
                MaxRequests = 100,
                Window = TimeSpan.FromMinutes(1)
            };

            var windowStart = now.Add(-rule.Window);
            var windowEnd = now.Add(rule.Window);
            var timeUntilReset = isBlocked ? 
                (blockedUntil.HasValue ? DateTime.Parse(blockedUntil.ToString()) - now : TimeSpan.Zero) :
                rule.Window;

            return new RateLimitStatus
            {
                Identifier = identifier,
                Endpoint = endpoint,
                CurrentRequests = requestCount,
                RemainingRequests = Math.Max(0, rule.MaxRequests - requestCount),
                WindowStart = windowStart,
                WindowEnd = windowEnd,
                TimeUntilReset = timeUntilReset,
                IsBlocked = isBlocked,
                BlockedUntil = blockedUntil.HasValue ? DateTime.Parse(blockedUntil.ToString()) : null,
                BlockReason = isBlocked ? "Rate limit exceeded" : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rate limit status for {Identifier} on {Endpoint}", identifier, endpoint);
            throw;
        }
    }

    public async Task ResetRateLimitAsync(string identifier, string endpoint)
    {
        try
        {
            var db = _redis.GetDatabase();
            var key = GetRateLimitKey(identifier, endpoint);
            var blockedKey = GetBlockedKey(identifier, endpoint);

            await db.KeyDeleteAsync(key);
            await db.KeyDeleteAsync(blockedKey);

            _logger.LogInformation("Rate limit reset for {Identifier} on {Endpoint}", identifier, endpoint);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting rate limit for {Identifier} on {Endpoint}", identifier, endpoint);
            throw;
        }
    }

    public async Task<IEnumerable<RateLimitRule>> GetRateLimitRulesAsync()
    {
        return await Task.FromResult(_defaultRules.AsReadOnly());
    }

    public async Task UpdateRateLimitRulesAsync(IEnumerable<RateLimitRule> rules)
    {
        try
        {
            lock (_defaultRules)
            {
                _defaultRules.Clear();
                _defaultRules.AddRange(rules);
            }

            _logger.LogInformation("Updated rate limit rules: {RuleCount} rules", _defaultRules.Count);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rate limit rules");
            throw;
        }
    }

    private string GetRateLimitKey(string identifier, string endpoint)
    {
        return $"rate_limit:{endpoint}:{identifier}";
    }

    private string GetBlockedKey(string identifier, string endpoint)
    {
        return $"rate_limit_blocked:{endpoint}:{identifier}";
    }

    private List<RateLimitRule> InitializeDefaultRules()
    {
        return new List<RateLimitRule>
        {
            new RateLimitRule
            {
                Name = "Default API",
                Endpoint = "*",
                IdentifierType = "IP",
                MaxRequests = 1000,
                Window = TimeSpan.FromMinutes(1),
                BurstLimit = 50,
                BlockDuration = TimeSpan.FromMinutes(5),
                IsEnabled = true,
                Priority = 0
            },
            new RateLimitRule
            {
                Name = "Image Processing",
                Endpoint = "imageprocessing",
                IdentifierType = "IP",
                MaxRequests = 100,
                Window = TimeSpan.FromMinutes(1),
                BurstLimit = 10,
                BlockDuration = TimeSpan.FromMinutes(10),
                IsEnabled = true,
                Priority = 1
            },
            new RateLimitRule
            {
                Name = "QR Code Generation",
                Endpoint = "qrcode",
                IdentifierType = "IP",
                MaxRequests = 200,
                Window = TimeSpan.FromMinutes(1),
                BurstLimit = 20,
                BlockDuration = TimeSpan.FromMinutes(5),
                IsEnabled = true,
                Priority = 1
            },
            new RateLimitRule
            {
                Name = "Health Checks",
                Endpoint = "health",
                IdentifierType = "IP",
                MaxRequests = 1000,
                Window = TimeSpan.FromMinutes(1),
                BurstLimit = 100,
                BlockDuration = TimeSpan.FromMinutes(1),
                IsEnabled = true,
                Priority = 0
            }
        };
    }
}

public class RateLimiterSettings
{
    public bool EnableRateLimiting { get; set; } = true;
    public int DefaultMaxRequests { get; set; } = 100;
    public TimeSpan DefaultWindow { get; set; } = TimeSpan.FromMinutes(1);
    public TimeSpan DefaultBlockDuration { get; set; } = TimeSpan.FromMinutes(5);
    public bool FailOpen { get; set; } = true; // Allow requests if rate limiting fails
    public bool EnableLogging { get; set; } = true;
    public bool EnableMetrics { get; set; } = true;
}
