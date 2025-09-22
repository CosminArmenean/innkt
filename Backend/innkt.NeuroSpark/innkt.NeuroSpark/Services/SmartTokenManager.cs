using innkt.NeuroSpark.Models.XAI;
using Microsoft.Extensions.Options;

namespace innkt.NeuroSpark.Services;

public class SmartTokenManager : ISmartTokenManager
{
    private readonly IDailyUsageTracker _usageTracker;
    private readonly XAIConfiguration _config;
    private readonly ILogger<SmartTokenManager> _logger;

    public SmartTokenManager(IDailyUsageTracker usageTracker, IOptions<XAIConfiguration> config, ILogger<SmartTokenManager> logger)
    {
        _usageTracker = usageTracker;
        _config = config.Value;
        _logger = logger;
    }

    public async Task<int> CalculateOptimalMaxTokensAsync(string question, string context)
    {
        var todayUsage = await _usageTracker.GetTodayUsageAsync();
        var remainingTokens = _config.DailyLimits.MaxTokensPerDay - todayUsage.TokensUsed;
        var estimatedTokens = EstimateTokenUsage(question, context);
        
        // Use conservative estimate for free tier
        var maxTokens = Math.Min(
            _config.DailyLimits.MaxTokensPerRequest,
            Math.Min(remainingTokens / 2, estimatedTokens * 2) // Use max 50% of remaining
        );
        
        var finalTokens = Math.Max(maxTokens, 50); // Minimum 50 tokens
        
        _logger.LogInformation("Token calculation: remaining={Remaining}, estimated={Estimated}, final={Final}", 
            remainingTokens, estimatedTokens, finalTokens);
        
        return finalTokens;
    }

    public int EstimateTokenUsage(string question, string context)
    {
        // Rough estimation: 1 token ≈ 4 characters
        var totalLength = question.Length + context.Length;
        var estimated = totalLength / 4;
        
        // Add buffer for system message and response
        return estimated + 100; // 100 token buffer
    }
}
