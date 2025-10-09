using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Diagnostics;
using innkt.Groups.DTOs;

namespace innkt.Groups.Services;

/// <summary>
/// Multi-layer caching service for user profiles to minimize HTTP calls to Officer/Social services
/// Layer 1: Memory Cache (5 min, 500 users) - Fastest (~1ms)
/// Layer 2: Redis Cache (1 hour) - Fast (~10-50ms)
/// Layer 3: UserService HTTP call - Slow (~2-6 seconds)
/// </summary>
public class UserProfileCacheService : IUserProfileCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
        private readonly UserService _userService; // Concrete implementation to avoid circular dependency
    private readonly ILogger<UserProfileCacheService> _logger;
    
    // Cache configuration
    private const int MEMORY_CACHE_SIZE = 500; // Smaller than Social service (Groups handles fewer users)
    private const int MEMORY_CACHE_EXPIRY_MINUTES = 5;
    private const int DISTRIBUTED_CACHE_EXPIRY_HOURS = 1;
    private const int BATCH_SIZE = 50;
    
    // Cache metrics (thread-safe counters)
    private long _memoryCacheHits = 0;
    private long _memoryCacheMisses = 0;
    private long _redisCacheHits = 0;
    private long _redisCacheMisses = 0;
    private long _userServiceCalls = 0;
    private readonly List<double> _responseTimes = new();
    private readonly object _metricsLock = new();

    public UserProfileCacheService(
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        UserService userService,
        ILogger<UserProfileCacheService> logger)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _userService = userService;
        _logger = logger;
    }

    public async Task<CachedUserProfile?> GetUserProfileAsync(Guid userId)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            // Layer 1: Memory Cache (fastest ~1ms)
            var memoryCacheKey = GetMemoryCacheKey(userId);
            if (_memoryCache.TryGetValue(memoryCacheKey, out CachedUserProfile? memoryProfile))
            {
                Interlocked.Increment(ref _memoryCacheHits);
                _logger.LogDebug("✅ Memory cache HIT for user {UserId} ({Elapsed}ms)", userId, stopwatch.ElapsedMilliseconds);
                return memoryProfile;
            }
            
            Interlocked.Increment(ref _memoryCacheMisses);
            _logger.LogDebug("❌ Memory cache MISS for user {UserId}", userId);

            // Layer 2: Redis Cache (~10-50ms)
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
                _logger.LogDebug("✅ Redis cache HIT for user {UserId} ({Elapsed}ms)", userId, stopwatch.ElapsedMilliseconds);
                return redisProfile;
            }
            
            Interlocked.Increment(ref _redisCacheMisses);
            _logger.LogDebug("❌ Redis cache MISS for user {UserId}", userId);

            // Layer 3: UserService HTTP call (~2-6 seconds)
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

        _logger.LogInformation("🔄 Batch loading {Count} user profiles", userIdsList.Count);

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
            _logger.LogInformation("✅ All {Count} profiles found in memory cache", userIdsList.Count);
            return result;
        }

        // Check Redis for uncached users
        var stillUncachedUsers = await CheckRedisForBatchAsync(uncachedUsers, result);

        // Batch load from UserService for remaining users
        if (stillUncachedUsers.Count > 0)
        {
            await BatchLoadFromUserServiceAsync(stillUncachedUsers, result);
        }

        _logger.LogInformation("✅ Batch loaded {Total} profiles: {Memory} from memory, {Redis} from Redis, {UserService} from UserService", 
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
            Interlocked.Increment(ref _userServiceCalls);
            _logger.LogInformation("🌐 Calling UserService for user {UserId}", userId);
            
            var stopwatch = Stopwatch.StartNew();
            var userInfo = await _userService.GetUserBasicInfoAsync(userId);
            stopwatch.Stop();
            
            if (userInfo == null)
            {
                _logger.LogWarning("⚠️ User {UserId} not found in UserService", userId);
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

            _logger.LogInformation("✅ Refreshed and cached profile for user {UserId} ({Elapsed}ms)", userId, stopwatch.ElapsedMilliseconds);
            return cachedProfile;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error refreshing profile for user {UserId}", userId);
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

            _logger.LogInformation("🗑️ Invalidated all cached data for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error invalidating cache for user {UserId}", userId);
        }
    }

    public async Task WarmUpCacheAsync(IEnumerable<Guid> userIds)
    {
        var userIdsList = userIds.ToList();
        _logger.LogInformation("🔥 Warming up cache for {Count} users", userIdsList.Count);

        try
        {
            // Process in batches to avoid overwhelming the UserService
            var batches = userIdsList.Chunk(BATCH_SIZE);
            
            foreach (var batch in batches)
            {
                var profiles = await GetUserProfilesBatchAsync(batch);
                _logger.LogDebug("✅ Warmed up {Count} profiles in batch", profiles.Count);
                
                // Small delay between batches to be nice to the UserService
                await Task.Delay(100);
            }

            _logger.LogInformation("✅ Cache warmup completed for {Count} users", userIdsList.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during cache warmup");
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
                OfficerServiceCalls = (int)_userServiceCalls,
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
            var cachedData = await _distributedCache.GetStringAsync(redisCacheKey);
            
            if (!string.IsNullOrEmpty(cachedData))
            {
                return JsonSerializer.Deserialize<CachedUserProfile>(cachedData);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId} from Redis cache", userId);
        }
        
        return null;
    }

    private async Task<List<Guid>> CheckRedisForBatchAsync(List<Guid> userIds, Dictionary<Guid, CachedUserProfile> result)
    {
        var stillUncachedUsers = new List<Guid>();
        
        foreach (var userId in userIds)
        {
            var redisProfile = await GetFromRedisAsync(userId);
            if (redisProfile != null)
            {
                result[userId] = redisProfile;
                
                // Also store in memory cache
                var memoryCacheOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(MEMORY_CACHE_EXPIRY_MINUTES),
                    Priority = CacheItemPriority.High,
                    Size = 1
                };
                _memoryCache.Set(GetMemoryCacheKey(userId), redisProfile, memoryCacheOptions);
                
                Interlocked.Increment(ref _redisCacheHits);
            }
            else
            {
                stillUncachedUsers.Add(userId);
                Interlocked.Increment(ref _redisCacheMisses);
            }
        }
        
        return stillUncachedUsers;
    }

    private async Task BatchLoadFromUserServiceAsync(List<Guid> userIds, Dictionary<Guid, CachedUserProfile> result)
    {
        try
        {
            Interlocked.Add(ref _userServiceCalls, userIds.Count);
            _logger.LogInformation("🌐 Batch calling UserService for {Count} users", userIds.Count);
            
            var stopwatch = Stopwatch.StartNew();
            var users = await _userService.GetUsersBasicInfoAsync(userIds);
            stopwatch.Stop();
            
            _logger.LogInformation("✅ UserService batch call completed in {Elapsed}ms for {Count} users", 
                stopwatch.ElapsedMilliseconds, users.Count);
            
            foreach (var user in users)
            {
                var cachedProfile = new CachedUserProfile
                {
                    UserId = user.Id,
                    DisplayName = user.DisplayName,
                    Username = user.Username,
                    AvatarUrl = user.AvatarUrl,
                    IsVerified = user.IsVerified,
                    IsActive = true,
                    LastUpdated = DateTime.UtcNow
                };
                
                result[user.Id] = cachedProfile;
                await StoreInAllCachesAsync(user.Id, cachedProfile);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error batch loading from UserService");
        }
    }

    private async Task StoreInAllCachesAsync(Guid userId, CachedUserProfile profile)
    {
        try
        {
            // Store in memory cache
            var memoryCacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(MEMORY_CACHE_EXPIRY_MINUTES),
                Priority = CacheItemPriority.High,
                Size = 1
            };
            _memoryCache.Set(GetMemoryCacheKey(userId), profile, memoryCacheOptions);

            // Store in Redis cache
            var redisCacheKey = GetRedisCacheKey(userId);
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(DISTRIBUTED_CACHE_EXPIRY_HOURS)
            };
            
            var jsonData = JsonSerializer.Serialize(profile);
            await _distributedCache.SetStringAsync(redisCacheKey, jsonData, options);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing user {UserId} in caches", userId);
        }
    }

    private static string GetMemoryCacheKey(Guid userId) => $"user:profile:memory:{userId}";
    private static string GetRedisCacheKey(Guid userId) => $"InNKT:Groups:user:profile:{userId}";
}

