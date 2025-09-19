using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Diagnostics;
using innkt.Social.DTOs;

namespace innkt.Social.Services;

/// <summary>
/// Multi-layer caching service for user profiles to minimize Officer service calls
/// Layer 1: Memory Cache (5 min, 1000 users) - Fastest
/// Layer 2: Redis Cache (1 hour) - Fast
/// Layer 3: Officer Service - Source of truth
/// </summary>
public class UserProfileCacheService : IUserProfileCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly IOfficerService _officerService;
    private readonly ILogger<UserProfileCacheService> _logger;
    
    // Cache configuration
    private const int MEMORY_CACHE_SIZE = 1000;
    private const int MEMORY_CACHE_EXPIRY_MINUTES = 5;
    private const int DISTRIBUTED_CACHE_EXPIRY_HOURS = 1;
    private const int BATCH_SIZE = 50;
    
    // Cache metrics (thread-safe counters)
    private long _memoryCacheHits = 0;
    private long _memoryCacheMisses = 0;
    private long _redisCacheHits = 0;
    private long _redisCacheMisses = 0;
    private long _officerServiceCalls = 0;
    private readonly List<double> _responseTimes = new();
    private readonly object _metricsLock = new();

    public UserProfileCacheService(
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        IOfficerService officerService,
        ILogger<UserProfileCacheService> logger)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _officerService = officerService;
        _logger = logger;
    }

    public async Task<CachedUserProfile?> GetUserProfileAsync(Guid userId)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            // Layer 1: Memory Cache (fastest)
            var memoryCacheKey = GetMemoryCacheKey(userId);
            if (_memoryCache.TryGetValue(memoryCacheKey, out CachedUserProfile? memoryProfile))
            {
                Interlocked.Increment(ref _memoryCacheHits);
                _logger.LogDebug("Memory cache HIT for user {UserId}", userId);
                return memoryProfile;
            }
            
            Interlocked.Increment(ref _memoryCacheMisses);
            _logger.LogDebug("Memory cache MISS for user {UserId}", userId);

            // Layer 2: Redis Cache
            var redisProfile = await GetFromRedisAsync(userId);
            if (redisProfile != null)
            {
                // Store in memory cache for next time
                var memoryCacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(MEMORY_CACHE_EXPIRY_MINUTES),
                    Priority = CacheItemPriority.High,
                    Size = 1
                };
                _memoryCache.Set(memoryCacheKey, redisProfile, memoryCacheOptions);
                
                Interlocked.Increment(ref _redisCacheHits);
                _logger.LogDebug("Redis cache HIT for user {UserId}", userId);
                return redisProfile;
            }
            
            Interlocked.Increment(ref _redisCacheMisses);
            _logger.LogDebug("Redis cache MISS for user {UserId}", userId);

            // Layer 3: Officer Service (source of truth)
            return await RefreshUserProfileAsync(userId);
        }
        finally
        {
            stopwatch.Stop();
            lock (_metricsLock)
            {
                _responseTimes.Add(stopwatch.Elapsed.TotalMilliseconds);
                // Keep only last 1000 response times for average calculation
                if (_responseTimes.Count > 1000)
                {
                    _responseTimes.RemoveAt(0);
                }
            }
        }
    }

    public async Task<Dictionary<Guid, CachedUserProfile>> GetUserProfilesBatchAsync(IEnumerable<Guid> userIds)
    {
        var userIdsList = userIds.ToList();
        var result = new Dictionary<Guid, CachedUserProfile>();
        var uncachedUsers = new List<Guid>();

        _logger.LogDebug("Batch loading {Count} user profiles", userIdsList.Count);

        // Check memory cache first for all users
        foreach (var userId in userIdsList)
        {
            var memoryCacheKey = GetMemoryCacheKey(userId);
            if (_memoryCache.TryGetValue(memoryCacheKey, out CachedUserProfile? cached))
            {
                result[userId] = cached;
                Interlocked.Increment(ref _memoryCacheHits);
            }
            else
            {
                uncachedUsers.Add(userId);
                Interlocked.Increment(ref _memoryCacheMisses);
            }
        }

        if (uncachedUsers.Count == 0)
        {
            _logger.LogDebug("All {Count} profiles found in memory cache", userIdsList.Count);
            return result;
        }

        // Check Redis for uncached users
        var stillUncachedUsers = await CheckRedisForBatchAsync(uncachedUsers, result);

        // Batch load from Officer service for remaining users
        if (stillUncachedUsers.Count > 0)
        {
            await BatchLoadFromOfficerServiceAsync(stillUncachedUsers, result);
        }

        _logger.LogDebug("Batch loaded {Total} profiles: {Memory} from memory, {Redis} from Redis, {Officer} from Officer service", 
            userIdsList.Count, 
            userIdsList.Count - uncachedUsers.Count,
            uncachedUsers.Count - stillUncachedUsers.Count,
            stillUncachedUsers.Count);

        return result;
    }

    public async Task<CachedUserProfile?> RefreshUserProfileAsync(Guid userId)
    {
        try
        {
            Interlocked.Increment(ref _officerServiceCalls);
            _logger.LogDebug("Calling Officer service for user {UserId}", userId);
            
            var userInfo = await _officerService.GetUserByIdAsync(userId);
            if (userInfo == null)
            {
                _logger.LogWarning("User {UserId} not found in Officer service", userId);
                return null;
            }

            var cachedProfile = new CachedUserProfile
            {
                UserId = userInfo.Id,
                DisplayName = userInfo.DisplayName,
                Username = userInfo.Username,
                AvatarUrl = userInfo.AvatarUrl,
                IsVerified = userInfo.IsVerified,
                IsActive = true,
                LastUpdated = DateTime.UtcNow
            };

            // Store in both cache layers
            await StoreInAllCachesAsync(userId, cachedProfile);

            _logger.LogDebug("Refreshed and cached profile for user {UserId}", userId);
            return cachedProfile;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing profile for user {UserId}", userId);
            return null;
        }
    }

    public async Task InvalidateUserProfileAsync(Guid userId)
    {
        try
        {
            // Remove from memory cache
            var memoryCacheKey = GetMemoryCacheKey(userId);
            _memoryCache.Remove(memoryCacheKey);

            // Remove from Redis cache
            var redisCacheKey = GetRedisCacheKey(userId);
            await _distributedCache.RemoveAsync(redisCacheKey);

            _logger.LogInformation("Invalidated all cached data for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating cache for user {UserId}", userId);
        }
    }

    public async Task WarmUpCacheAsync(IEnumerable<Guid> userIds)
    {
        var userIdsList = userIds.ToList();
        _logger.LogInformation("Warming up cache for {Count} users", userIdsList.Count);

        try
        {
            // Process in batches to avoid overwhelming the Officer service
            var batches = userIdsList.Chunk(BATCH_SIZE);
            
            foreach (var batch in batches)
            {
                var profiles = await GetUserProfilesBatchAsync(batch);
                _logger.LogDebug("Warmed up {Count} profiles in batch", profiles.Count);
                
                // Small delay between batches to be nice to the Officer service
                await Task.Delay(100);
            }

            _logger.LogInformation("Cache warmup completed for {Count} users", userIdsList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during cache warmup");
        }
    }

    public async Task<CacheMetrics> GetCacheMetricsAsync()
    {
        await Task.CompletedTask; // Make it async for future enhancements
        
        lock (_metricsLock)
        {
            return new CacheMetrics
            {
                MemoryCacheHits = (int)_memoryCacheHits,
                MemoryCacheMisses = (int)_memoryCacheMisses,
                RedisCacheHits = (int)_redisCacheHits,
                RedisCacheMisses = (int)_redisCacheMisses,
                OfficerServiceCalls = (int)_officerServiceCalls,
                AverageResponseTimeMs = _responseTimes.Count > 0 ? _responseTimes.Average() : 0
            };
        }
    }

    // Private helper methods
    private async Task<CachedUserProfile?> GetFromRedisAsync(Guid userId)
    {
        try
        {
            var redisCacheKey = GetRedisCacheKey(userId);
            var cachedJson = await _distributedCache.GetStringAsync(redisCacheKey);
            
            if (!string.IsNullOrEmpty(cachedJson))
            {
                return JsonSerializer.Deserialize<CachedUserProfile>(cachedJson);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error getting profile from Redis for user {UserId}", userId);
        }
        
        return null;
    }

    private async Task<List<Guid>> CheckRedisForBatchAsync(List<Guid> userIds, Dictionary<Guid, CachedUserProfile> result)
    {
        var stillUncached = new List<Guid>();

        foreach (var userId in userIds)
        {
            var redisProfile = await GetFromRedisAsync(userId);
            if (redisProfile != null)
            {
                result[userId] = redisProfile;
                
                // Also store in memory cache
                var memoryCacheKey = GetMemoryCacheKey(userId);
                var memoryCacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(MEMORY_CACHE_EXPIRY_MINUTES),
                    Priority = CacheItemPriority.High,
                    Size = 1
                };
                _memoryCache.Set(memoryCacheKey, redisProfile, memoryCacheOptions);
                
                Interlocked.Increment(ref _redisCacheHits);
            }
            else
            {
                stillUncached.Add(userId);
                Interlocked.Increment(ref _redisCacheMisses);
            }
        }

        return stillUncached;
    }

    private async Task BatchLoadFromOfficerServiceAsync(List<Guid> userIds, Dictionary<Guid, CachedUserProfile> result)
    {
        try
        {
            // Process in batches
            var batches = userIds.Chunk(BATCH_SIZE);
            
            foreach (var batch in batches)
            {
                Interlocked.Add(ref _officerServiceCalls, batch.Length);
                
                // TODO: Implement batch API in Officer service for better performance
                // For now, call individually but in parallel
                var batchTasks = batch.Select(async userId =>
                {
                    var userInfo = await _officerService.GetUserByIdAsync(userId);
                    if (userInfo != null)
                    {
                        var cachedProfile = new CachedUserProfile
                        {
                            UserId = userInfo.Id,
                            DisplayName = userInfo.DisplayName,
                            Username = userInfo.Username,
                            AvatarUrl = userInfo.AvatarUrl,
                            IsVerified = userInfo.IsVerified,
                            IsActive = true,
                            LastUpdated = DateTime.UtcNow
                        };

                        result[userId] = cachedProfile;
                        
                        // Store in both cache layers (don't await to avoid blocking)
                        _ = Task.Run(() => StoreInAllCachesAsync(userId, cachedProfile));
                        
                        return cachedProfile;
                    }
                    return null;
                }).ToArray();

                await Task.WhenAll(batchTasks);
                
                // Small delay between batches
                if (batches.Count() > 1)
                {
                    await Task.Delay(50);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error batch loading from Officer service");
        }
    }

    private async Task StoreInAllCachesAsync(Guid userId, CachedUserProfile profile)
    {
        try
        {
            // Store in memory cache
            var memoryCacheKey = GetMemoryCacheKey(userId);
            var memoryCacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(MEMORY_CACHE_EXPIRY_MINUTES),
                Priority = CacheItemPriority.High,
                Size = 1
            };
            _memoryCache.Set(memoryCacheKey, profile, memoryCacheOptions);

            // Store in Redis cache
            var redisCacheKey = GetRedisCacheKey(userId);
            var profileJson = JsonSerializer.Serialize(profile);
            var distributedCacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(DISTRIBUTED_CACHE_EXPIRY_HOURS)
            };
            await _distributedCache.SetStringAsync(redisCacheKey, profileJson, distributedCacheOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error storing profile in cache for user {UserId}", userId);
        }
    }

    private static string GetMemoryCacheKey(Guid userId) => $"user_profile_mem_{userId}";
    private static string GetRedisCacheKey(Guid userId) => $"user_profile_redis_{userId}";
}
