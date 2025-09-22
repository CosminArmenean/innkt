using innkt.NeuroSpark.Models.XAI;

namespace innkt.NeuroSpark.Services;

public interface IXAIService
{
    Task<XAIResponse> GenerateResponseAsync(string question, string context);
    Task<bool> IsHealthyAsync();
    Task<DailyUsage> GetTodayUsageAsync();
    Task<bool> CanMakeRequestAsync();
    Task<bool> CanUseTokensAsync(int requestedTokens);
    Task TrackUsageAsync(int tokensUsed);
}

public interface IDailyUsageTracker
{
    Task<bool> CanMakeRequestAsync();
    Task<bool> CanUseTokensAsync(int requestedTokens);
    Task TrackUsageAsync(int tokensUsed);
    Task<DailyUsage> GetTodayUsageAsync();
    Task ResetDailyUsageAsync();
}

public interface IFreeTierRateLimiter
{
    Task<bool> TryAcquireRequestAsync();
    void ReleaseRequest();
}

public interface ISmartTokenManager
{
    Task<int> CalculateOptimalMaxTokensAsync(string question, string context);
    int EstimateTokenUsage(string question, string context);
}
