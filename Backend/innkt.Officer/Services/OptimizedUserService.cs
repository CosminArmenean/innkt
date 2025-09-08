using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using innkt.Officer.Data;
using innkt.Officer.Models;
using innkt.Common.Models;
using System.Linq.Expressions;

namespace innkt.Officer.Services
{
    public interface IOptimizedUserService
    {
        Task<User?> GetUserByIdAsync(string userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<List<User>> GetUsersAsync(int page = 1, int pageSize = 20, string? search = null);
        Task<List<User>> GetFollowersAsync(string userId, int page = 1, int pageSize = 20);
        Task<List<User>> GetFollowingAsync(string userId, int page = 1, int pageSize = 20);
        Task<bool> FollowUserAsync(string followerId, string followingId);
        Task<bool> UnfollowUserAsync(string followerId, string followingId);
        Task<bool> IsFollowingAsync(string followerId, string followingId);
        Task<int> GetFollowersCountAsync(string userId);
        Task<int> GetFollowingCountAsync(string userId);
        Task<User> UpdateUserAsync(string userId, UserUpdateRequest request);
        Task<bool> DeleteUserAsync(string userId);
        Task<List<User>> SearchUsersAsync(string query, int page = 1, int pageSize = 20);
        Task<List<User>> GetRecommendedUsersAsync(string userId, int limit = 10);
        Task<List<User>> GetTrendingUsersAsync(int limit = 10);
        Task InvalidateUserCacheAsync(string userId);
        Task InvalidateUserRelatedCacheAsync(string userId);
    }

    public class OptimizedUserService : IOptimizedUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OptimizedUserService> _logger;
        private readonly ICacheService _cacheService;
        private readonly IDatabaseOptimizationService _dbOptimizationService;

        public OptimizedUserService(
            ApplicationDbContext context,
            ILogger<OptimizedUserService> logger,
            ICacheService cacheService,
            IDatabaseOptimizationService dbOptimizationService)
        {
            _context = context;
            _logger = logger;
            _cacheService = cacheService;
            _dbOptimizationService = dbOptimizationService;
        }

        public async Task<User?> GetUserByIdAsync(string userId)
        {
            try
            {
                var cacheKey = _cacheService.GetUserKey(userId);
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for user {userId}, fetching from database");
                        
                        var user = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Id == userId);
                        
                        if (user != null)
                        {
                            _logger.LogDebug($"User {userId} fetched from database and cached");
                        }
                        
                        return user;
                    },
                    CacheService.USER_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user by ID: {userId}");
                return null;
            }
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            try
            {
                var cacheKey = $"user:email:{email.ToLowerInvariant()}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for user email {email}, fetching from database");
                        
                        var user = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
                        
                        if (user != null)
                        {
                            _logger.LogDebug($"User with email {email} fetched from database and cached");
                        }
                        
                        return user;
                    },
                    CacheService.USER_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user by email: {email}");
                return null;
            }
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            try
            {
                var cacheKey = $"user:username:{username.ToLowerInvariant()}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for username {username}, fetching from database");
                        
                        var user = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
                        
                        if (user != null)
                        {
                            _logger.LogDebug($"User with username {username} fetched from database and cached");
                        }
                        
                        return user;
                    },
                    CacheService.USER_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user by username: {username}");
                return null;
            }
        }

        public async Task<List<User>> GetUsersAsync(int page = 1, int pageSize = 20, string? search = null)
        {
            try
            {
                var cacheKey = $"users:page:{page}:size:{pageSize}:search:{search ?? "all"}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for users list, fetching from database");
                        
                        var query = _context.Users.AsNoTracking();
                        
                        if (!string.IsNullOrWhiteSpace(search))
                        {
                            query = query.Where(u => 
                                u.Username.Contains(search) || 
                                u.DisplayName.Contains(search) || 
                                u.Bio.Contains(search));
                        }
                        
                        var users = await query
                            .OrderByDescending(u => u.CreatedAt)
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize)
                            .ToListAsync();
                        
                        _logger.LogDebug($"Users list fetched from database and cached");
                        return users;
                    },
                    CacheService.USER_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users list");
                return new List<User>();
            }
        }

        public async Task<List<User>> GetFollowersAsync(string userId, int page = 1, int pageSize = 20)
        {
            try
            {
                var cacheKey = $"followers:{userId}:page:{page}:size:{pageSize}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for followers of user {userId}, fetching from database");
                        
                        var followers = await _context.Follows
                            .AsNoTracking()
                            .Where(f => f.FollowingId == userId)
                            .Include(f => f.Follower)
                            .OrderByDescending(f => f.CreatedAt)
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize)
                            .Select(f => f.Follower)
                            .ToListAsync();
                        
                        _logger.LogDebug($"Followers of user {userId} fetched from database and cached");
                        return followers;
                    },
                    CacheService.FOLLOW_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting followers for user: {userId}");
                return new List<User>();
            }
        }

        public async Task<List<User>> GetFollowingAsync(string userId, int page = 1, int pageSize = 20)
        {
            try
            {
                var cacheKey = $"following:{userId}:page:{page}:size:{pageSize}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for following of user {userId}, fetching from database");
                        
                        var following = await _context.Follows
                            .AsNoTracking()
                            .Where(f => f.FollowerId == userId)
                            .Include(f => f.Following)
                            .OrderByDescending(f => f.CreatedAt)
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize)
                            .Select(f => f.Following)
                            .ToListAsync();
                        
                        _logger.LogDebug($"Following of user {userId} fetched from database and cached");
                        return following;
                    },
                    CacheService.FOLLOW_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting following for user: {userId}");
                return new List<User>();
            }
        }

        public async Task<bool> FollowUserAsync(string followerId, string followingId)
        {
            try
            {
                // Check if already following
                var existingFollow = await _context.Follows
                    .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
                
                if (existingFollow != null)
                {
                    return false; // Already following
                }

                // Create new follow relationship
                var follow = new Follow
                {
                    Id = Guid.NewGuid().ToString(),
                    FollowerId = followerId,
                    FollowingId = followingId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Follows.Add(follow);
                await _context.SaveChangesAsync();

                // Invalidate related caches
                await InvalidateUserRelatedCacheAsync(followerId);
                await InvalidateUserRelatedCacheAsync(followingId);

                // Update follower counts in cache
                await _cacheService.IncrementAsync($"followers_count:{followingId}");
                await _cacheService.IncrementAsync($"following_count:{followerId}");

                _logger.LogInformation($"User {followerId} started following {followingId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error following user: {followerId} -> {followingId}");
                return false;
            }
        }

        public async Task<bool> UnfollowUserAsync(string followerId, string followingId)
        {
            try
            {
                var follow = await _context.Follows
                    .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
                
                if (follow == null)
                {
                    return false; // Not following
                }

                _context.Follows.Remove(follow);
                await _context.SaveChangesAsync();

                // Invalidate related caches
                await InvalidateUserRelatedCacheAsync(followerId);
                await InvalidateUserRelatedCacheAsync(followingId);

                // Update follower counts in cache
                await _cacheService.DecrementAsync($"followers_count:{followingId}");
                await _cacheService.DecrementAsync($"following_count:{followerId}");

                _logger.LogInformation($"User {followerId} unfollowed {followingId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error unfollowing user: {followerId} -> {followingId}");
                return false;
            }
        }

        public async Task<bool> IsFollowingAsync(string followerId, string followingId)
        {
            try
            {
                var cacheKey = $"is_following:{followerId}:{followingId}";
                
                var result = await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        var exists = await _context.Follows
                            .AsNoTracking()
                            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
                        
                        return exists;
                    },
                    CacheService.FOLLOW_CACHE_EXPIRY
                );
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking follow status: {followerId} -> {followingId}");
                return false;
            }
        }

        public async Task<int> GetFollowersCountAsync(string userId)
        {
            try
            {
                var cacheKey = $"followers_count:{userId}";
                
                var count = await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        var count = await _context.Follows
                            .AsNoTracking()
                            .CountAsync(f => f.FollowingId == userId);
                        
                        return count;
                    },
                    CacheService.FOLLOW_CACHE_EXPIRY
                );
                
                return count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting followers count for user: {userId}");
                return 0;
            }
        }

        public async Task<int> GetFollowingCountAsync(string userId)
        {
            try
            {
                var cacheKey = $"following_count:{userId}";
                
                var count = await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        var count = await _context.Follows
                            .AsNoTracking()
                            .CountAsync(f => f.FollowerId == userId);
                        
                        return count;
                    },
                    CacheService.FOLLOW_CACHE_EXPIRY
                );
                
                return count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting following count for user: {userId}");
                return 0;
            }
        }

        public async Task<User> UpdateUserAsync(string userId, UserUpdateRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new ArgumentException($"User with ID {userId} not found");
                }

                // Update user properties
                if (!string.IsNullOrWhiteSpace(request.Username))
                    user.Username = request.Username;
                if (!string.IsNullOrWhiteSpace(request.DisplayName))
                    user.DisplayName = request.DisplayName;
                if (!string.IsNullOrWhiteSpace(request.Bio))
                    user.Bio = request.Bio;
                if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
                    user.AvatarUrl = request.AvatarUrl;
                if (!string.IsNullOrWhiteSpace(request.CoverImageUrl))
                    user.CoverImageUrl = request.CoverImageUrl;
                if (request.IsVerified.HasValue)
                    user.IsVerified = request.IsVerified.Value;
                if (request.IsPrivate.HasValue)
                    user.IsPrivate = request.IsPrivate.Value;

                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Invalidate user cache
                await InvalidateUserCacheAsync(userId);

                _logger.LogInformation($"User {userId} updated successfully");
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user: {userId}");
                throw;
            }
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return false;
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                // Invalidate all user-related caches
                await InvalidateUserCacheAsync(userId);
                await InvalidateUserRelatedCacheAsync(userId);

                _logger.LogInformation($"User {userId} deleted successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user: {userId}");
                return false;
            }
        }

        public async Task<List<User>> SearchUsersAsync(string query, int page = 1, int pageSize = 20)
        {
            try
            {
                var cacheKey = $"user_search:{query.GetHashCode()}:page:{page}:size:{pageSize}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for user search '{query}', fetching from database");
                        
                        var users = await _context.Users
                            .AsNoTracking()
                            .Where(u => 
                                u.Username.Contains(query) || 
                                u.DisplayName.Contains(query) || 
                                u.Bio.Contains(query))
                            .OrderByDescending(u => u.FollowersCount)
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize)
                            .ToListAsync();
                        
                        _logger.LogDebug($"User search results for '{query}' fetched from database and cached");
                        return users;
                    },
                    CacheService.SEARCH_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching users with query: {query}");
                return new List<User>();
            }
        }

        public async Task<List<User>> GetRecommendedUsersAsync(string userId, int limit = 10)
        {
            try
            {
                var cacheKey = $"user_recommendations:{userId}:limit:{limit}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for user recommendations for {userId}, fetching from database");
                        
                        // Get users that the current user is not following
                        var followingIds = await _context.Follows
                            .AsNoTracking()
                            .Where(f => f.FollowerId == userId)
                            .Select(f => f.FollowingId)
                            .ToListAsync();
                        
                        followingIds.Add(userId); // Exclude self
                        
                        var recommendations = await _context.Users
                            .AsNoTracking()
                            .Where(u => !followingIds.Contains(u.Id))
                            .OrderByDescending(u => u.FollowersCount)
                            .Take(limit)
                            .ToListAsync();
                        
                        _logger.LogDebug($"User recommendations for {userId} fetched from database and cached");
                        return recommendations;
                    },
                    CacheService.USER_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user recommendations for: {userId}");
                return new List<User>();
            }
        }

        public async Task<List<User>> GetTrendingUsersAsync(int limit = 10)
        {
            try
            {
                var cacheKey = $"trending_users:limit:{limit}";
                
                return await _cacheService.GetOrSetAsync(
                    cacheKey,
                    async () =>
                    {
                        _logger.LogDebug($"Cache miss for trending users, fetching from database");
                        
                        var trendingUsers = await _context.Users
                            .AsNoTracking()
                            .OrderByDescending(u => u.FollowersCount)
                            .ThenByDescending(u => u.CreatedAt)
                            .Take(limit)
                            .ToListAsync();
                        
                        _logger.LogDebug($"Trending users fetched from database and cached");
                        return trendingUsers;
                    },
                    CacheService.TRENDING_CACHE_EXPIRY
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending users");
                return new List<User>();
            }
        }

        public async Task InvalidateUserCacheAsync(string userId)
        {
            try
            {
                var keysToRemove = new[]
                {
                    _cacheService.GetUserKey(userId),
                    $"user:email:{userId}",
                    $"user:username:{userId}",
                    $"followers_count:{userId}",
                    $"following_count:{userId}",
                    $"is_following:{userId}:*",
                    $"user_recommendations:{userId}:*"
                };

                foreach (var key in keysToRemove)
                {
                    if (key.Contains("*"))
                    {
                        var pattern = key.Replace("*", "");
                        var matchingKeys = await _cacheService.GetKeysAsync($"{pattern}*");
                        foreach (var matchingKey in matchingKeys)
                        {
                            await _cacheService.RemoveAsync(matchingKey);
                        }
                    }
                    else
                    {
                        await _cacheService.RemoveAsync(key);
                    }
                }

                _logger.LogDebug($"User cache invalidated for user: {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error invalidating user cache for: {userId}");
            }
        }

        public async Task InvalidateUserRelatedCacheAsync(string userId)
        {
            try
            {
                var keysToRemove = new[]
                {
                    $"followers:{userId}:*",
                    $"following:{userId}:*",
                    $"user_search:*",
                    $"trending_users:*"
                };

                foreach (var key in keysToRemove)
                {
                    var pattern = key.Replace("*", "");
                    var matchingKeys = await _cacheService.GetKeysAsync($"{pattern}*");
                    foreach (var matchingKey in matchingKeys)
                    {
                        await _cacheService.RemoveAsync(matchingKey);
                    }
                }

                _logger.LogDebug($"User-related cache invalidated for user: {userId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error invalidating user-related cache for: {userId}");
            }
        }
    }

    public class UserUpdateRequest
    {
        public string? Username { get; set; }
        public string? DisplayName { get; set; }
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public bool? IsVerified { get; set; }
        public bool? IsPrivate { get; set; }
    }
}
