using innkt.NeuroSpark.Models.XAI;
using innkt.NeuroSpark.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/xai")]
[Authorize]
public class XAIUsageController : ControllerBase
{
    private readonly IDailyUsageTracker _usageTracker;
    private readonly IXAIService _xaiService;
    private readonly ILogger<XAIUsageController> _logger;

    public XAIUsageController(
        IDailyUsageTracker usageTracker, 
        IXAIService xaiService, 
        ILogger<XAIUsageController> logger)
    {
        _usageTracker = usageTracker;
        _xaiService = xaiService;
        _logger = logger;
    }

    /// <summary>
    /// Get today's usage statistics
    /// </summary>
    [HttpGet("usage/today")]
    public async Task<ActionResult<DailyUsage>> GetTodayUsage()
    {
        try
        {
            var usage = await _usageTracker.GetTodayUsageAsync();
            return Ok(usage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting today's usage");
            return StatusCode(500, new { message = "Failed to get usage data" });
        }
    }

    /// <summary>
    /// Get usage limits and remaining capacity
    /// </summary>
    [HttpGet("usage/limits")]
    public async Task<ActionResult<UsageLimits>> GetUsageLimits()
    {
        try
        {
            var todayUsage = await _usageTracker.GetTodayUsageAsync();
            var canMakeRequest = await _usageTracker.CanMakeRequestAsync();
            var canUseTokens = await _usageTracker.CanUseTokensAsync(100); // Check for 100 tokens

            return Ok(new UsageLimits
            {
                MaxRequestsPerDay = 100, // From configuration
                MaxTokensPerDay = 50000, // From configuration
                RemainingRequests = Math.Max(0, 100 - todayUsage.RequestsCount),
                RemainingTokens = Math.Max(0, 50000 - todayUsage.TokensUsed)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage limits");
            return StatusCode(500, new { message = "Failed to get usage limits" });
        }
    }

    /// <summary>
    /// Check if X.AI service is healthy
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult<object>> GetHealth()
    {
        try
        {
            var isHealthy = await _xaiService.IsHealthyAsync();
            var todayUsage = await _usageTracker.GetTodayUsageAsync();
            var canMakeRequest = await _usageTracker.CanMakeRequestAsync();

            return Ok(new
            {
                isHealthy,
                canMakeRequest,
                todayUsage = new
                {
                    requests = todayUsage.RequestsCount,
                    tokens = todayUsage.TokensUsed,
                    lastReset = todayUsage.LastReset
                },
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking X.AI health");
            return StatusCode(500, new { message = "Health check failed" });
        }
    }

    /// <summary>
    /// Reset daily usage (admin only)
    /// </summary>
    [HttpPost("usage/reset")]
    [Authorize(Roles = "Admin")] // Add admin role check
    public async Task<ActionResult> ResetDailyUsage()
    {
        try
        {
            await _usageTracker.ResetDailyUsageAsync();
            _logger.LogInformation("Daily usage reset by admin");
            return Ok(new { message = "Daily usage reset successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting daily usage");
            return StatusCode(500, new { message = "Failed to reset usage" });
        }
    }
}
