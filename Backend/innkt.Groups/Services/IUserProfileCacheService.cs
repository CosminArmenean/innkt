using innkt.Groups.DTOs;

namespace innkt.Groups.Services;

/// <summary>
/// Interface for multi-layer user profile caching service
/// </summary>
public interface IUserProfileCacheService
{
    /// <summary>
    /// Get a single user profile with caching
    /// </summary>
    Task<CachedUserProfile?> GetUserProfileAsync(Guid userId);
    
    /// <summary>
    /// Get multiple user profiles in a single batch with caching
    /// </summary>
    Task<Dictionary<Guid, CachedUserProfile>> GetUserProfilesBatchAsync(IEnumerable<Guid> userIds);
    
    /// <summary>
    /// Refresh a user profile from the source and update all cache layers
    /// </summary>
    Task<CachedUserProfile?> RefreshUserProfileAsync(Guid userId);
    
    /// <summary>
    /// Invalidate cached data for a specific user
    /// </summary>
    Task InvalidateUserProfileAsync(Guid userId);
    
    /// <summary>
    /// Warm up the cache with a list of user IDs
    /// </summary>
    Task WarmUpCacheAsync(IEnumerable<Guid> userIds);
    
    /// <summary>
    /// Get cache performance metrics
    /// </summary>
    Task<CacheMetrics> GetCacheMetricsAsync();
}

/// <summary>
/// Cached user profile data
/// </summary>
public class CachedUserProfile
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Cache performance metrics
/// </summary>
public class CacheMetrics
{
    public int MemoryCacheHits { get; set; }
    public int MemoryCacheMisses { get; set; }
    public int RedisCacheHits { get; set; }
    public int RedisCacheMisses { get; set; }
    public int OfficerServiceCalls { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public double MemoryCacheHitRate => MemoryCacheHits + MemoryCacheMisses > 0 
        ? (double)MemoryCacheHits / (MemoryCacheHits + MemoryCacheMisses) * 100 
        : 0;
    public double RedisCacheHitRate => RedisCacheHits + RedisCacheMisses > 0 
        ? (double)RedisCacheHits / (RedisCacheHits + RedisCacheMisses) * 100 
        : 0;
}

