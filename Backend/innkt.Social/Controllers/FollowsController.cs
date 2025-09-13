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
}
