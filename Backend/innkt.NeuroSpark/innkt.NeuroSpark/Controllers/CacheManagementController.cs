using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CacheManagementController : ControllerBase
{
    private readonly IRedisService _redisService;
    private readonly IImageProcessingService _imageProcessingService;
    private readonly IQrCodeService _qrCodeService;
    private readonly ILogger<CacheManagementController> _logger;

    public CacheManagementController(
        IRedisService redisService,
        IImageProcessingService imageProcessingService,
        IQrCodeService qrCodeService,
        ILogger<CacheManagementController> logger)
    {
        _redisService = redisService;
        _imageProcessingService = imageProcessingService;
        _qrCodeService = qrCodeService;
        _logger = logger;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetCacheOverview()
    {
        try
        {
            var overview = new
            {
                RedisHealth = await GetRedisHealthAsync(),
                ImageProcessingStats = await _imageProcessingService.GetCacheStatisticsAsync(),
                QrCodeStats = await _qrCodeService.GetQrCodeCacheStatisticsAsync(),
                Timestamp = DateTime.UtcNow
            };
            
            return Ok(overview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache overview");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpGet("image-processing/stats")]
    public async Task<IActionResult> GetImageProcessingCacheStats()
    {
        try
        {
            var stats = await _imageProcessingService.GetCacheStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting image processing cache statistics");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpGet("qrcode/stats")]
    public async Task<IActionResult> GetQrCodeCacheStats()
    {
        try
        {
            var stats = await _qrCodeService.GetQrCodeCacheStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting QR code cache statistics");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("image-processing/clear")]
    public async Task<IActionResult> ClearImageProcessingCache()
    {
        try
        {
            var keys = await _redisService.GetKeysAsync("profile_processing:*");
            var backgroundRemovalKeys = await _redisService.GetKeysAsync("background_removal:*");
            var enhancementKeys = await _redisService.GetKeysAsync("image_enhancement:*");
            var cropKeys = await _redisService.GetKeysAsync("square_crop:*");
            var imageKeys = await _redisService.GetKeysAsync("processed_image:*");
            
            var allKeys = keys.Concat(backgroundRemovalKeys).Concat(enhancementKeys).Concat(cropKeys).Concat(imageKeys);
            var deletedCount = 0;
            
            foreach (var key in allKeys)
            {
                if (await _redisService.DeleteAsync(key))
                {
                    deletedCount++;
                }
            }
            
            _logger.LogInformation("Cleared {Count} image processing cache keys", deletedCount);
            return Ok(new { Message = $"Cleared {deletedCount} image processing cache keys" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing image processing cache");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("qrcode/clear")]
    public async Task<IActionResult> ClearQrCodeCache()
    {
        try
        {
            var qrCodeKeys = await _redisService.GetKeysAsync("qr_code:*");
            var kidPairingKeys = await _redisService.GetKeysAsync("kid_pairing_qr:*");
            var groupInvitationKeys = await _redisService.GetKeysAsync("group_invitation_qr:*");
            var imageKeys = await _redisService.GetKeysAsync("qr_image:*");
            
            var allKeys = qrCodeKeys.Concat(kidPairingKeys).Concat(groupInvitationKeys).Concat(imageKeys);
            var deletedCount = 0;
            
            foreach (var key in allKeys)
            {
                if (await _redisService.DeleteAsync(key))
                {
                    deletedCount++;
                }
            }
            
            _logger.LogInformation("Cleared {Count} QR code cache keys", deletedCount);
            return Ok(new { Message = $"Cleared {deletedCount} QR code cache keys" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing QR code cache");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("clear-all")]
    public async Task<IActionResult> ClearAllCache()
    {
        try
        {
            var result = await _redisService.ClearCacheAsync();
            
            if (result)
            {
                _logger.LogInformation("All cache cleared successfully");
                return Ok(new { Message = "All cache cleared successfully" });
            }
            else
            {
                _logger.LogWarning("Failed to clear all cache");
                return BadRequest(new { Error = "Failed to clear all cache" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing all cache");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpGet("keys/{pattern}")]
    public async Task<IActionResult> GetCacheKeys(string pattern)
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
            _logger.LogError(ex, "Error getting cache keys for pattern {Pattern}", pattern);
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpGet("performance")]
    public async Task<IActionResult> GetCachePerformance()
    {
        try
        {
            var performance = new
            {
                CacheSize = await _redisService.GetCacheSizeAsync(),
                RedisStats = await _redisService.GetCacheStatsAsync(),
                Timestamp = DateTime.UtcNow
            };
            
            return Ok(performance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache performance metrics");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    private async Task<object> GetRedisHealthAsync()
    {
        try
        {
            var cacheSize = await _redisService.GetCacheSizeAsync();
            var stats = await _redisService.GetCacheStatsAsync();
            
            return new
            {
                Status = "Healthy",
                CacheSize = cacheSize,
                Statistics = stats
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            return new { Status = "Unhealthy", Error = ex.Message };
        }
    }
}


