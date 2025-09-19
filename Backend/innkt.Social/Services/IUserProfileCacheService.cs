using innkt.Social.DTOs;

namespace innkt.Social.Services;

/// <summary>
/// Multi-layer caching service for user profiles to minimize Officer service calls
/// </summary>
public interface IUserProfileCacheService
{
    /// <summary>
    /// Get a single user profile with multi-layer caching
    /// </summary>
    Task<CachedUserProfile?> GetUserProfileAsync(Guid userId);

    /// <summary>
    /// Get multiple user profiles efficiently with batch loading
    /// </summary>
    Task<Dictionary<Guid, CachedUserProfile>> GetUserProfilesBatchAsync(IEnumerable<Guid> userIds);

    /// <summary>
    /// Force refresh a user profile from Officer service and update all cache layers
    /// </summary>
    Task<CachedUserProfile?> RefreshUserProfileAsync(Guid userId);

    /// <summary>
    /// Invalidate a user profile from all cache layers
    /// </summary>
    Task InvalidateUserProfileAsync(Guid userId);

    /// <summary>
    /// Warm up cache for multiple users (background operation)
    /// </summary>
    Task WarmUpCacheAsync(IEnumerable<Guid> userIds);

    /// <summary>
    /// Get cache performance metrics
    /// </summary>
    Task<CacheMetrics> GetCacheMetricsAsync();
}

/// <summary>
/// Cache performance metrics for monitoring
/// </summary>
public class CacheMetrics
{
    public int MemoryCacheHits { get; set; }
    public int MemoryCacheMisses { get; set; }
    public int RedisCacheHits { get; set; }
    public int RedisCacheMisses { get; set; }
    public int OfficerServiceCalls { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public DateTime LastResetTime { get; set; } = DateTime.UtcNow;
    
    public double MemoryCacheHitRate => MemoryCacheHits + MemoryCacheMisses > 0 
        ? (double)MemoryCacheHits / (MemoryCacheHits + MemoryCacheMisses) * 100
        : 0;
        
    public double RedisCacheHitRate => RedisCacheHits + RedisCacheMisses > 0 
        ? (double)RedisCacheHits / (RedisCacheHits + RedisCacheMisses) * 100 
        : 0;
        
    public double OverallCacheHitRate => (MemoryCacheHits + RedisCacheHits) > 0
        ? (double)(MemoryCacheHits + RedisCacheHits) / (MemoryCacheHits + MemoryCacheMisses + RedisCacheHits + RedisCacheMisses) * 100
        : 0;
}
