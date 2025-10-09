using innkt.Groups.DTOs;

namespace innkt.Groups.Services;

/// <summary>
/// Wrapper service that adds caching layer to UserService
/// This service should be used instead of direct UserService calls
/// </summary>
public class CachedUserService : IUserService
{
    private readonly IUserService _innerUserService;
    private readonly IUserProfileCacheService _cacheService;
    private readonly ILogger<CachedUserService> _logger;

    public CachedUserService(
        UserService innerUserService, // Concrete UserService
        IUserProfileCacheService cacheService,
        ILogger<CachedUserService> logger)
    {
        _innerUserService = innerUserService;
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<UserBasicInfo?> GetUserBasicInfoAsync(Guid userId)
    {
        try
        {
            // Try cache first
            var cachedProfile = await _cacheService.GetUserProfileAsync(userId);
            if (cachedProfile != null)
            {
                return new UserBasicInfo
                {
                    Id = cachedProfile.UserId,
                    Username = cachedProfile.Username,
                    DisplayName = cachedProfile.DisplayName,
                    AvatarUrl = cachedProfile.AvatarUrl,
                    IsVerified = cachedProfile.IsVerified
                };
            }

            // If not in cache, this will call the HTTP service and cache it
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user basic info for {UserId} through cache", userId);
            
            // Fallback to direct service call
            return await _innerUserService.GetUserBasicInfoAsync(userId);
        }
    }

    public async Task<List<UserBasicInfo>> GetUsersBasicInfoAsync(List<Guid> userIds)
    {
        try
        {
            // Use batch caching
            var cachedProfiles = await _cacheService.GetUserProfilesBatchAsync(userIds);
            
            return cachedProfiles.Values.Select(cp => new UserBasicInfo
            {
                Id = cp.UserId,
                Username = cp.Username,
                DisplayName = cp.DisplayName,
                AvatarUrl = cp.AvatarUrl,
                IsVerified = cp.IsVerified
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting batch user info through cache for {Count} users", userIds.Count);
            
            // Fallback to direct service call
            return await _innerUserService.GetUsersBasicInfoAsync(userIds);
        }
    }
}

