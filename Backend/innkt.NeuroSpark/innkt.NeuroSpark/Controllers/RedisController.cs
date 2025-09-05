using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RedisController : ControllerBase
{
    private readonly IRedisService _redisService;
    private readonly ILogger<RedisController> _logger;

    public RedisController(IRedisService redisService, ILogger<RedisController> logger)
    {
        _redisService = redisService;
        _logger = logger;
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        try
        {
            var cacheSize = await _redisService.GetCacheSizeAsync();
            var stats = await _redisService.GetCacheStatsAsync();
            
            var health = new
            {
                Status = "Healthy",
                CacheSize = cacheSize,
                Timestamp = DateTime.UtcNow,
                Statistics = stats
            };
            
            _logger.LogInformation("Redis health check completed. Cache size: {CacheSize}", cacheSize);
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            return StatusCode(500, new { Status = "Unhealthy", Error = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var stats = await _redisService.GetCacheStatsAsync();
            var cacheSize = await _redisService.GetCacheSizeAsync();
            
            var result = new
            {
                CacheSize = cacheSize,
                Statistics = stats,
                Timestamp = DateTime.UtcNow
            };
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Redis statistics");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("clear")]
    public async Task<IActionResult> ClearCache()
    {
        try
        {
            var result = await _redisService.ClearCacheAsync();
            
            if (result)
            {
                _logger.LogInformation("Redis cache cleared successfully");
                return Ok(new { Message = "Cache cleared successfully" });
            }
            else
            {
                _logger.LogWarning("Failed to clear Redis cache");
                return BadRequest(new { Error = "Failed to clear cache" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing Redis cache");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpGet("keys/{pattern?}")]
    public async Task<IActionResult> GetKeys(string pattern = "*")
    {
        try
        {
            var keys = await _redisService.GetKeysAsync(pattern);
            
            var result = new
            {
                Pattern = pattern,
                Count = keys.Length,
                Keys = keys,
                Timestamp = DateTime.UtcNow
            };
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Redis keys for pattern {Pattern}", pattern);
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpDelete("keys/{key}")]
    public async Task<IActionResult> DeleteKey(string key)
    {
        try
        {
            var result = await _redisService.DeleteAsync(key);
            
            if (result)
            {
                _logger.LogInformation("Key {Key} deleted from Redis", key);
                return Ok(new { Message = $"Key '{key}' deleted successfully" });
            }
            else
            {
                _logger.LogWarning("Key {Key} not found in Redis", key);
                return NotFound(new { Error = $"Key '{key}' not found" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting key {Key} from Redis", key);
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpGet("keys/{key}/ttl")]
    public async Task<IActionResult> GetKeyTtl(string key)
    {
        try
        {
            var ttl = await _redisService.GetTimeToLiveAsync(key);
            
            if (ttl.HasValue)
            {
                var result = new
                {
                    Key = key,
                    TTL = ttl.Value,
                    ExpiresAt = DateTime.UtcNow.Add(ttl.Value),
                    Timestamp = DateTime.UtcNow
                };
                
                return Ok(result);
            }
            else
            {
                return NotFound(new { Error = $"Key '{key}' not found or has no TTL" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting TTL for key {Key}", key);
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}



