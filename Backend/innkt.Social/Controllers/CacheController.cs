using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;

namespace innkt.Social.Controllers;

/// <summary>
/// Controller for monitoring cache performance and management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CacheController : ControllerBase
{
    private readonly IUserProfileCacheService _userProfileCache;
    private readonly ILogger<CacheController> _logger;

    public CacheController(
        IUserProfileCacheService userProfileCache,
        ILogger<CacheController> logger)
    {
        _userProfileCache = userProfileCache;
        _logger = logger;
    }

    /// <summary>
    /// Get cache performance metrics
    /// </summary>
    [HttpGet("metrics")]
    [AllowAnonymous] // For monitoring - could add API key auth in production
    public async Task<ActionResult<CacheMetrics>> GetCacheMetrics()
    {
        try
        {
            var metrics = await _userProfileCache.GetCacheMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache metrics");
            return StatusCode(500, "Error retrieving cache metrics");
        }
    }

    /// <summary>
    /// Warm up cache for specific users
    /// </summary>
    [HttpPost("warmup")]
    [AllowAnonymous] // For testing - could add auth in production
    public async Task<ActionResult> WarmUpCache([FromBody] List<Guid> userIds)
    {
        try
        {
            if (!userIds.Any() || userIds.Count > 100)
            {
                return BadRequest("Please provide 1-100 user IDs");
            }

            await _userProfileCache.WarmUpCacheAsync(userIds);
            
            _logger.LogInformation("Cache warmed up for {Count} users", userIds.Count);
            return Ok(new { Message = $"Cache warmed up for {userIds.Count} users" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error warming up cache for {Count} users", userIds.Count);
            return StatusCode(500, "Error warming up cache");
        }
    }

    /// <summary>
    /// Refresh cache for a specific user
    /// </summary>
    [HttpPost("refresh/{userId}")]
    [AllowAnonymous] // For testing - could add auth in production
    public async Task<ActionResult> RefreshUserCache(Guid userId)
    {
        try
        {
            var profile = await _userProfileCache.RefreshUserProfileAsync(userId);
            if (profile == null)
            {
                return NotFound($"User {userId} not found");
            }

            _logger.LogInformation("Refreshed cache for user {UserId}", userId);
            return Ok(new { Message = $"Cache refreshed for user {userId}", Profile = profile });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing cache for user {UserId}", userId);
            return StatusCode(500, "Error refreshing user cache");
        }
    }

    /// <summary>
    /// Invalidate cache for a specific user
    /// </summary>
    [HttpDelete("invalidate/{userId}")]
    [AllowAnonymous] // For testing - could add auth in production
    public async Task<ActionResult> InvalidateUserCache(Guid userId)
    {
        try
        {
            await _userProfileCache.InvalidateUserProfileAsync(userId);
            
            _logger.LogInformation("Invalidated cache for user {UserId}", userId);
            return Ok(new { Message = $"Cache invalidated for user {userId}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating cache for user {UserId}", userId);
            return StatusCode(500, "Error invalidating user cache");
        }
    }

    /// <summary>
    /// Get detailed cache status and recommendations
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous] // For monitoring
    public async Task<ActionResult> GetCacheStatus()
    {
        try
        {
            var metrics = await _userProfileCache.GetCacheMetricsAsync();
            
            var status = new
            {
                Metrics = metrics,
                Performance = new
                {
                    MemoryCacheEfficiency = metrics.MemoryCacheHitRate >= 80 ? "Excellent" : 
                                          metrics.MemoryCacheHitRate >= 60 ? "Good" : 
                                          metrics.MemoryCacheHitRate >= 40 ? "Fair" : "Poor",
                    
                    RedisCacheEfficiency = metrics.RedisCacheHitRate >= 95 ? "Excellent" : 
                                         metrics.RedisCacheHitRate >= 85 ? "Good" : 
                                         metrics.RedisCacheHitRate >= 70 ? "Fair" : "Poor",
                    
                    OverallEfficiency = metrics.OverallCacheHitRate >= 95 ? "Excellent" : 
                                      metrics.OverallCacheHitRate >= 85 ? "Good" : 
                                      metrics.OverallCacheHitRate >= 70 ? "Fair" : "Poor",
                    
                    AverageResponseTime = metrics.AverageResponseTimeMs < 50 ? "Excellent" :
                                        metrics.AverageResponseTimeMs < 100 ? "Good" :
                                        metrics.AverageResponseTimeMs < 200 ? "Fair" : "Poor"
                },
                Recommendations = GenerateRecommendations(metrics)
            };

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache status");
            return StatusCode(500, "Error retrieving cache status");
        }
    }

    private static List<string> GenerateRecommendations(CacheMetrics metrics)
    {
        var recommendations = new List<string>();

        if (metrics.MemoryCacheHitRate < 80)
        {
            recommendations.Add("Consider increasing memory cache expiry time or size");
        }

        if (metrics.RedisCacheHitRate < 95)
        {
            recommendations.Add("Consider increasing Redis cache expiry time");
        }

        if (metrics.OfficerServiceCalls > 100)
        {
            recommendations.Add("High number of Officer service calls - consider cache warmup strategy");
        }

        if (metrics.AverageResponseTimeMs > 100)
        {
            recommendations.Add("Response times are high - check Officer service performance");
        }

        if (recommendations.Count == 0)
        {
            recommendations.Add("Cache performance is optimal! 🎉");
        }

        return recommendations;
    }
}
