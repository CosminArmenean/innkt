using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PerformanceController : ControllerBase
{
    private readonly IPerformanceMonitor _performanceMonitor;
    private readonly IRedisConnectionPool _redisConnectionPool;
    private readonly IRateLimiter _rateLimiter;
    private readonly ILogger<PerformanceController> _logger;

    public PerformanceController(
        IPerformanceMonitor performanceMonitor,
        IRedisConnectionPool redisConnectionPool,
        IRateLimiter rateLimiter,
        ILogger<PerformanceController> logger)
    {
        _performanceMonitor = performanceMonitor ?? throw new ArgumentNullException(nameof(performanceMonitor));
        _redisConnectionPool = redisConnectionPool ?? throw new ArgumentNullException(nameof(redisConnectionPool));
        _rateLimiter = rateLimiter ?? throw new ArgumentNullException(nameof(rateLimiter));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get overall performance statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<PerformanceStats>> GetPerformanceStats()
    {
        try
        {
            var stats = await _performanceMonitor.GetPerformanceStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance stats");
            return StatusCode(500, "Error retrieving performance statistics");
        }
    }

    /// <summary>
    /// Get performance metrics for a specific category
    /// </summary>
    [HttpGet("category/{category}")]
    public async Task<ActionResult<CategoryMetrics>> GetCategoryMetrics(string category)
    {
        try
        {
            var metrics = await _performanceMonitor.GetCategoryMetricsAsync(category);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category metrics for {Category}", category);
            return StatusCode(500, "Error retrieving category metrics");
        }
    }

    /// <summary>
    /// Reset all performance metrics
    /// </summary>
    [HttpPost("reset")]
    public async Task<ActionResult> ResetMetrics()
    {
        try
        {
            await _performanceMonitor.ResetMetricsAsync();
            return Ok(new { message = "Performance metrics reset successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting performance metrics");
            return StatusCode(500, "Error resetting performance metrics");
        }
    }

    /// <summary>
    /// Export performance data
    /// </summary>
    [HttpGet("export")]
    public async Task<ActionResult<PerformanceExport>> ExportPerformanceData()
    {
        try
        {
            var export = await _performanceMonitor.ExportPerformanceDataAsync();
            return Ok(export);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting performance data");
            return StatusCode(500, "Error exporting performance data");
        }
    }

    /// <summary>
    /// Get Redis connection pool statistics
    /// </summary>
    [HttpGet("redis/pool")]
    public async Task<ActionResult<RedisPoolStats>> GetRedisPoolStats()
    {
        try
        {
            var stats = await _redisConnectionPool.GetPoolStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Redis pool stats");
            return StatusCode(500, "Error retrieving Redis pool statistics");
        }
    }

    /// <summary>
    /// Check Redis connection pool health
    /// </summary>
    [HttpGet("redis/health")]
    public async Task<ActionResult> CheckRedisPoolHealth()
    {
        try
        {
            var isHealthy = await _redisConnectionPool.IsHealthyAsync();
            if (isHealthy)
            {
                return Ok(new { status = "healthy", message = "Redis connection pool is healthy" });
            }
            else
            {
                return StatusCode(503, new { status = "unhealthy", message = "Redis connection pool is unhealthy" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking Redis pool health");
            return StatusCode(500, "Error checking Redis pool health");
        }
    }

    /// <summary>
    /// Perform Redis connection pool maintenance
    /// </summary>
    [HttpPost("redis/maintenance")]
    public async Task<ActionResult> PerformRedisMaintenance()
    {
        try
        {
            await _redisConnectionPool.PerformMaintenanceAsync();
            return Ok(new { message = "Redis connection pool maintenance completed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing Redis maintenance");
            return StatusCode(500, "Error performing Redis maintenance");
        }
    }

    /// <summary>
    /// Get rate limiting rules
    /// </summary>
    [HttpGet("ratelimit/rules")]
    public async Task<ActionResult<IEnumerable<RateLimitRule>>> GetRateLimitRules()
    {
        try
        {
            var rules = await _rateLimiter.GetRateLimitRulesAsync();
            return Ok(rules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rate limit rules");
            return StatusCode(500, "Error retrieving rate limit rules");
        }
    }

    /// <summary>
    /// Get rate limit status for an identifier and endpoint
    /// </summary>
    [HttpGet("ratelimit/status/{identifier}/{endpoint}")]
    public async Task<ActionResult<RateLimitStatus>> GetRateLimitStatus(string identifier, string endpoint)
    {
        try
        {
            var status = await _rateLimiter.GetRateLimitStatusAsync(identifier, endpoint);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rate limit status for {Identifier} on {Endpoint}", identifier, endpoint);
            return StatusCode(500, "Error retrieving rate limit status");
        }
    }

    /// <summary>
    /// Reset rate limit for an identifier and endpoint
    /// </summary>
    [HttpPost("ratelimit/reset/{identifier}/{endpoint}")]
    public async Task<ActionResult> ResetRateLimit(string identifier, string endpoint)
    {
        try
        {
            await _rateLimiter.ResetRateLimitAsync(identifier, endpoint);
            return Ok(new { message = $"Rate limit reset for {identifier} on {endpoint}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting rate limit for {Identifier} on {Endpoint}", identifier, endpoint);
            return StatusCode(500, "Error resetting rate limit");
        }
    }

    /// <summary>
    /// Update rate limiting rules
    /// </summary>
    [HttpPut("ratelimit/rules")]
    public async Task<ActionResult> UpdateRateLimitRules([FromBody] IEnumerable<RateLimitRule> rules)
    {
        try
        {
            await _rateLimiter.UpdateRateLimitRulesAsync(rules);
            return Ok(new { message = "Rate limit rules updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating rate limit rules");
            return StatusCode(500, "Error updating rate limit rules");
        }
    }

    /// <summary>
    /// Get comprehensive system health status
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult> GetSystemHealth()
    {
        try
        {
            var redisHealth = await _redisConnectionPool.IsHealthyAsync();
            var performanceStats = await _performanceMonitor.GetPerformanceStatsAsync();
            var rateLimitRules = await _rateLimiter.GetRateLimitRulesAsync();

            var healthStatus = new
            {
                timestamp = DateTime.UtcNow,
                status = redisHealth ? "healthy" : "degraded",
                services = new
                {
                    redis = new { status = redisHealth ? "healthy" : "unhealthy" },
                    performance = new { status = "healthy" },
                    rateLimiting = new { status = "healthy", ruleCount = rateLimitRules.Count() }
                },
                metrics = new
                {
                    uptime = performanceStats.Uptime,
                    totalRequests = performanceStats.TotalRequests,
                    requestsPerSecond = performanceStats.RequestsPerSecond,
                    errorRate = performanceStats.ErrorRate
                }
            };

            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system health");
            return StatusCode(500, "Error retrieving system health");
        }
    }
}



