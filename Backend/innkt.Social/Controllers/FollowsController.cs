using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowsController : ControllerBase
{
    private readonly ILogger<FollowsController> _logger;

    public FollowsController(ILogger<FollowsController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get followers for a user
    /// </summary>
    [HttpGet("user/{userId}/followers")]
    public async Task<ActionResult<object>> GetFollowers(string userId, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            _logger.LogInformation("Fetching followers for user {UserId}, page {Page}, limit {Limit}", userId, page, limit);
            
            // For now, return mock data
            // In a real implementation, this would query the database
            var mockFollowers = new[]
            {
                new { followerId = "follower1", followingId = userId, createdAt = DateTime.UtcNow.AddDays(-10) },
                new { followerId = "follower2", followingId = userId, createdAt = DateTime.UtcNow.AddDays(-5) }
            };

            return Ok(new { followers = mockFollowers, totalCount = mockFollowers.Length, hasMore = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching followers for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get users that a user is following
    /// </summary>
    [HttpGet("user/{userId}/following")]
    public async Task<ActionResult<object>> GetFollowing(string userId, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            _logger.LogInformation("Fetching following for user {UserId}, page {Page}, limit {Limit}", userId, page, limit);
            
            // For now, return mock data
            var mockFollowing = new[]
            {
                new { followerId = userId, followingId = "following1", createdAt = DateTime.UtcNow.AddDays(-12) },
                new { followerId = userId, followingId = "following2", createdAt = DateTime.UtcNow.AddDays(-7) }
            };

            return Ok(new { following = mockFollowing, totalCount = mockFollowing.Length, hasMore = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching following for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Follow a user
    /// </summary>
    [HttpPost("follow/{followingId}")]
    public async Task<ActionResult<object>> FollowUser(string followingId)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {CurrentUserId} attempting to follow {FollowingId}", currentUserId, followingId);
            
            // For now, return success
            // In a real implementation, this would update the database
            return Ok(new { message = $"User {currentUserId} followed {followingId}", success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error following user {FollowingId}", followingId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Unfollow a user
    /// </summary>
    [HttpPost("unfollow/{followingId}")]
    public async Task<ActionResult<object>> UnfollowUser(string followingId)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {CurrentUserId} attempting to unfollow {FollowingId}", currentUserId, followingId);
            
            // For now, return success
            // In a real implementation, this would update the database
            return Ok(new { message = $"User {currentUserId} unfollowed {followingId}", success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unfollowing user {FollowingId}", followingId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Search users by username or name
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<object>> SearchUsers([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        try
        {
            _logger.LogInformation("Searching users with query: {Query}, page: {Page}, limit: {Limit}", query, page, limit);
            
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            // For now, return mock data with test users
            // In a real implementation, this would query the Officer service or a user database
            var mockUsers = new[]
            {
                new { 
                    id = "4f8c8759-dfdc-423e-878e-c68036140114",
                    username = "testuser1", 
                    displayName = "Test User 1",
                    email = "testuser1@example.com",
                    avatarUrl = null,
                    isVerified = false,
                    followersCount = 150,
                    followingCount = 75,
                    postsCount = 42
                },
                new { 
                    id = "bob-uuid-1234-5678-9abc-def012345680",
                    username = "bob.smith", 
                    displayName = "Bob Smith",
                    email = "bob.smith@example.com",
                    avatarUrl = null,
                    isVerified = true,
                    followersCount = 1200,
                    followingCount = 300,
                    postsCount = 89
                },
                new { 
                    id = "alice-uuid-1234-5678-9abc-def012345681",
                    username = "alice.johnson", 
                    displayName = "Alice Johnson",
                    email = "alice.johnson@example.com",
                    avatarUrl = null,
                    isVerified = false,
                    followersCount = 850,
                    followingCount = 200,
                    postsCount = 156
                },
                new { 
                    id = "charlie-uuid-1234-5678-9abc-def012345682",
                    username = "charlie.brown", 
                    displayName = "Charlie Brown",
                    email = "charlie.brown@example.com",
                    avatarUrl = null,
                    isVerified = false,
                    followersCount = 320,
                    followingCount = 150,
                    postsCount = 67
                },
                new { 
                    id = "diana-uuid-1234-5678-9abc-def012345683",
                    username = "diana.wilson", 
                    displayName = "Diana Wilson",
                    email = "diana.wilson@example.com",
                    avatarUrl = null,
                    isVerified = true,
                    followersCount = 2100,
                    followingCount = 450,
                    postsCount = 234
                }
            };

            // Filter users based on query (case-insensitive)
            var filteredUsers = mockUsers.Where(u => 
                u.username.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                u.displayName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                u.email.Contains(query, StringComparison.OrdinalIgnoreCase)
            ).ToArray();

            // Apply pagination
            var skip = (page - 1) * limit;
            var paginatedUsers = filteredUsers.Skip(skip).Take(limit).ToArray();

            return Ok(new { 
                users = paginatedUsers, 
                totalCount = filteredUsers.Length, 
                page = page,
                limit = limit,
                hasMore = skip + limit < filteredUsers.Length
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with query: {Query}", query);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
