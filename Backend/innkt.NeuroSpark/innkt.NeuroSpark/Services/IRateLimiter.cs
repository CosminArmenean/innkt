namespace innkt.NeuroSpark.Services;

public interface IRateLimiter
{
    /// <summary>
    /// Checks if a request is allowed based on rate limiting rules
    /// </summary>
    Task<RateLimitResult> CheckRateLimitAsync(string identifier, string endpoint, RateLimitRule rule);
    
    /// <summary>
    /// Gets current rate limit status for an identifier
    /// </summary>
    Task<RateLimitStatus> GetRateLimitStatusAsync(string identifier, string endpoint);
    
    /// <summary>
    /// Resets rate limit counters for an identifier
    /// </summary>
    Task ResetRateLimitAsync(string identifier, string endpoint);
    
    /// <summary>
    /// Gets all rate limit rules
    /// </summary>
    Task<IEnumerable<RateLimitRule>> GetRateLimitRulesAsync();
    
    /// <summary>
    /// Updates rate limit rules
    /// </summary>
    Task UpdateRateLimitRulesAsync(IEnumerable<RateLimitRule> rules);
}

public class RateLimitResult
{
    public bool IsAllowed { get; set; }
    public int RemainingRequests { get; set; }
    public int TotalRequests { get; set; }
    public DateTime ResetTime { get; set; }
    public TimeSpan TimeUntilReset { get; set; }
    public string? Reason { get; set; }
    public RateLimitRule AppliedRule { get; set; } = new();
}

public class RateLimitStatus
{
    public string Identifier { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public int CurrentRequests { get; set; }
    public int RemainingRequests { get; set; }
    public DateTime WindowStart { get; set; }
    public DateTime WindowEnd { get; set; }
    public TimeSpan TimeUntilReset { get; set; }
    public bool IsBlocked { get; set; }
    public DateTime? BlockedUntil { get; set; }
    public string? BlockReason { get; set; }
}

public class RateLimitRule
{
    public string Name { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string IdentifierType { get; set; } = "IP"; // IP, User, APIKey, etc.
    public int MaxRequests { get; set; } = 100;
    public TimeSpan Window { get; set; } = TimeSpan.FromMinutes(1);
    public int BurstLimit { get; set; } = 10;
    public TimeSpan BlockDuration { get; set; } = TimeSpan.FromMinutes(5);
    public bool IsEnabled { get; set; } = true;
    public int Priority { get; set; } = 0; // Higher priority rules are applied first
    public Dictionary<string, string> Metadata { get; set; } = new();
}

public class RateLimitViolation
{
    public string Identifier { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public DateTime ViolationTime { get; set; }
    public int RequestCount { get; set; }
    public int Limit { get; set; }
    public TimeSpan Window { get; set; }
    public string? UserAgent { get; set; }
    public string? IPAddress { get; set; }
    public Dictionary<string, string> Context { get; set; } = new();
}


