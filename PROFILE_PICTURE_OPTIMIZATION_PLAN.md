# 🚀 Profile Picture Optimization Plan for Change Streams & Posts

## 🎯 **Current Situation Analysis**

### ✅ **What's Already Working:**
- **UserSnapshot caching** in MongoDB posts (1-hour expiry)
- **Change Stream notifications** working but missing profile pictures
- **Officer Service integration** for profile data
- **Distributed Redis cache** available for caching

### ❌ **Current Issues:**
- **Missing profile pictures** in Change Stream notifications
- **No efficient caching layer** for user profiles across requests
- **N+1 queries** to Officer service for user data
- **Stale user data** in posts when profiles update

## 🛠 **Proposed Solution: Multi-Layer Caching Strategy**

### **Layer 1: In-Memory Cache (Fastest)**
```csharp
// Hot cache for frequently accessed users (last 1000 users)
private readonly MemoryCache _userProfileMemoryCache;
```
- **Expiry:** 5 minutes
- **Size:** 1000 most recent users
- **Use case:** Real-time notifications, frequent API calls

### **Layer 2: Redis Distributed Cache (Fast)**
```csharp
// Persistent cache across service restarts
private readonly IDistributedCache _distributedCache;
```
- **Expiry:** 1 hour
- **Size:** Unlimited (Redis manages)
- **Use case:** Cross-service sharing, service restarts

### **Layer 3: MongoDB UserSnapshot (Persistent)**
```csharp
// Already exists - cached with posts
public class UserSnapshot {
    public string AvatarUrl { get; set; }
    public DateTime CacheExpiry { get; set; }
}
```
- **Expiry:** 1 hour (already implemented)
- **Use case:** Post display, feed generation

### **Layer 4: Officer Service (Source of Truth)**
```csharp
// Only called when all caches miss
await _officerService.GetUserByIdAsync(userId);
```
- **Use case:** Cache refresh, new users

## 📋 **Implementation Plan**

### **Phase 1: Enhanced User Profile Cache Service** ⭐
```csharp
public interface IUserProfileCacheService
{
    Task<CachedUserProfile?> GetUserProfileAsync(Guid userId);
    Task<Dictionary<Guid, CachedUserProfile>> GetUserProfilesBatchAsync(IEnumerable<Guid> userIds);
    Task RefreshUserProfileAsync(Guid userId);
    Task InvalidateUserProfileAsync(Guid userId);
    Task WarmUpCacheAsync(IEnumerable<Guid> userIds);
}
```

### **Phase 2: Smart Batch Loading**
- **Batch API calls** to Officer service (get 50 users at once)
- **Background cache warming** for active users
- **Intelligent prefetching** based on followers/following

### **Phase 3: Change Stream Enhancement**
- **Enrich notifications** with cached profile data
- **Fallback mechanism** if profile cache misses
- **Real-time profile updates** via separate Change Stream

### **Phase 4: Profile Update Propagation**
- **Listen for profile updates** from Officer service
- **Cascade updates** to all cached layers
- **Update existing posts** with new profile pictures

## 🔧 **Technical Implementation**

### **1. Enhanced UserProfileCacheService**
```csharp
public class UserProfileCacheService : IUserProfileCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly IOfficerService _officerService;
    private readonly ILogger<UserProfileCacheService> _logger;
    
    private const int MEMORY_CACHE_SIZE = 1000;
    private const int MEMORY_CACHE_EXPIRY_MINUTES = 5;
    private const int DISTRIBUTED_CACHE_EXPIRY_HOURS = 1;
    private const int BATCH_SIZE = 50;

    public async Task<CachedUserProfile?> GetUserProfileAsync(Guid userId)
    {
        // Layer 1: Memory Cache (fastest)
        var cacheKey = $"user_profile_{userId}";
        if (_memoryCache.TryGetValue(cacheKey, out CachedUserProfile? cached))
        {
            return cached;
        }

        // Layer 2: Redis Cache
        var distributedCached = await GetFromDistributedCacheAsync(userId);
        if (distributedCached != null)
        {
            // Store in memory cache for next time
            _memoryCache.Set(cacheKey, distributedCached, TimeSpan.FromMinutes(MEMORY_CACHE_EXPIRY_MINUTES));
            return distributedCached;
        }

        // Layer 3: Officer Service (source of truth)
        return await RefreshUserProfileAsync(userId);
    }

    public async Task<Dictionary<Guid, CachedUserProfile>> GetUserProfilesBatchAsync(IEnumerable<Guid> userIds)
    {
        var result = new Dictionary<Guid, CachedUserProfile>();
        var uncachedUsers = new List<Guid>();

        // Check memory cache first
        foreach (var userId in userIds)
        {
            var cacheKey = $"user_profile_{userId}";
            if (_memoryCache.TryGetValue(cacheKey, out CachedUserProfile? cached))
            {
                result[userId] = cached;
            }
            else
            {
                uncachedUsers.Add(userId);
            }
        }

        // Check Redis for uncached users
        var stillUncached = await CheckDistributedCacheAsync(uncachedUsers, result);

        // Batch load from Officer service for remaining users
        if (stillUncached.Any())
        {
            await BatchLoadFromOfficerServiceAsync(stillUncached, result);
        }

        return result;
    }
}
```

### **2. Change Stream Notification Enhancement**
```csharp
private async Task HandleNewPostAsync(MongoPost post)
{
    // Get cached user profile efficiently
    var userProfile = await _userProfileCacheService.GetUserProfileAsync(post.UserId);
    
    // Enrich the post notification with profile data
    var enrichedPost = new MongoPost
    {
        PostId = post.PostId,
        UserId = post.UserId,
        Content = post.Content,
        PostType = post.PostType,
        CreatedAt = post.CreatedAt,
        UserSnapshot = userProfile != null ? ConvertToUserSnapshot(userProfile) : await CreateFallbackUserSnapshot(post.UserId)
    };

    var followerIds = await GetFollowerIdsAsync(post.UserId);
    await NotifyNewPostAsync(enrichedPost, followerIds);
}
```

### **3. Background Cache Warming**
```csharp
public class UserProfileCacheWarmupService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Warm up cache for active users
                var activeUserIds = await GetActiveUserIdsAsync();
                await _userProfileCacheService.WarmUpCacheAsync(activeUserIds);
                
                // Wait 10 minutes before next warmup
                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cache warmup");
            }
        }
    }
}
```

## 📊 **Performance Benefits**

### **Before Optimization:**
- **Every Change Stream notification:** 1 API call to Officer service
- **Feed loading (20 posts):** Up to 20 API calls
- **Response time:** 500ms - 2s per request
- **Officer service load:** High

### **After Optimization:**
- **Change Stream notifications:** 0 API calls (cache hit ~95%)
- **Feed loading:** 0-2 API calls (batch loading for cache misses)
- **Response time:** 50-200ms per request
- **Officer service load:** Reduced by 90%

## 🎯 **Cache Hit Rate Targets**

- **Memory Cache:** 80% hit rate
- **Redis Cache:** 95% hit rate  
- **Combined:** 99% hit rate
- **Officer Service calls:** Reduced by 90%

## 🔄 **Cache Invalidation Strategy**

### **Profile Update Events:**
```csharp
// When Officer service updates a profile
public async Task OnProfileUpdated(Guid userId, UserProfileUpdatedEvent eventData)
{
    // 1. Invalidate all cache layers
    await _userProfileCacheService.InvalidateUserProfileAsync(userId);
    
    // 2. Refresh with new data
    var newProfile = await _userProfileCacheService.RefreshUserProfileAsync(userId);
    
    // 3. Update existing posts (background job)
    await _mongoPostService.RefreshUserCacheAsync(userId);
    
    // 4. Notify connected users of profile change
    await _realtimeService.NotifyUserProfileUpdatedAsync(userId, newProfile);
}
```

## 🚀 **Rollout Plan**

### **Step 1:** Implement UserProfileCacheService
### **Step 2:** Update Change Stream handlers
### **Step 3:** Add background cache warming
### **Step 4:** Implement profile update propagation
### **Step 5:** Monitor and optimize cache hit rates

## 📈 **Monitoring & Metrics**

```csharp
// Cache performance metrics
public class CacheMetrics
{
    public int MemoryCacheHits { get; set; }
    public int MemoryCacheMisses { get; set; }
    public int RedisCacheHits { get; set; }
    public int RedisCacheMisses { get; set; }
    public int OfficerServiceCalls { get; set; }
    public double AverageResponseTime { get; set; }
    
    public double MemoryCacheHitRate => (double)MemoryCacheHits / (MemoryCacheHits + MemoryCacheMisses);
    public double RedisCacheHitRate => (double)RedisCacheHits / (RedisCacheHits + RedisCacheMisses);
}
```

This plan will ensure **profile pictures appear instantly in Change Stream notifications** while **minimizing Officer service calls by 90%**! 🎉
