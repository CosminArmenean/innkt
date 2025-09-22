namespace innkt.NeuroSpark.Models.XAI;

public class XAIConfiguration
{
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.x.ai/v1/";
    public string Model { get; set; } = "grok-beta";
    public int MaxTokens { get; set; } = 500;
    public double Temperature { get; set; } = 0.7;
    public int TimeoutSeconds { get; set; } = 30;
    public string Tier { get; set; } = "free";
    public DailyLimitsConfig DailyLimits { get; set; } = new();
    public RateLimitsConfig RateLimits { get; set; } = new();
    public RetryPolicyConfig RetryPolicy { get; set; } = new();
    public bool EnableFallback { get; set; } = true;
    public bool LogAllRequests { get; set; } = true;
}

public class DailyLimitsConfig
{
    public int MaxRequestsPerDay { get; set; } = 100;
    public int MaxTokensPerDay { get; set; } = 50000;
    public int MaxTokensPerRequest { get; set; } = 500;
}

public class RateLimitsConfig
{
    public int MaxRequestsPerMinute { get; set; } = 10;
    public int MaxRequestsPerHour { get; set; } = 50;
}

public class RetryPolicyConfig
{
    public int MaxRetries { get; set; } = 2;
    public int BaseDelaySeconds { get; set; } = 2;
    public int MaxDelaySeconds { get; set; } = 10;
}

public class DailyUsage
{
    public DateTime Date { get; set; }
    public int RequestsCount { get; set; }
    public int TokensUsed { get; set; }
    public DateTime LastReset { get; set; } = DateTime.UtcNow;
}

public class UsageLimits
{
    public int MaxRequestsPerDay { get; set; }
    public int MaxTokensPerDay { get; set; }
    public int RemainingRequests { get; set; }
    public int RemainingTokens { get; set; }
}
