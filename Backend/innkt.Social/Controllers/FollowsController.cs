using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.DTOs;
using System.Security.Claims;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowsController : ControllerBase
{
    private readonly IFollowService _followService;
    private readonly ILogger<FollowsController> _logger;

    public FollowsController(IFollowService followService, ILogger<FollowsController> logger)
    {
        _followService = followService;
        _logger = logger;
    }

    /// <summary>
    /// Follow a user
    /// </summary>
    [HttpPost]
    public async Task<ActionResult> FollowUser([FromBody] FollowUserRequest request)
    {
        try
        {
            var followerId = GetCurrentUserId();
            var success = await _followService.FollowUserAsync(followerId, request.UserId);
            
            if (!success)
                return BadRequest("Unable to follow user");
                
            return Ok(new { message = "User followed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error following user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while following the user");
        }
    }

    /// <summary>
    /// Unfollow a user
    /// </summary>
    [HttpDelete]
    public async Task<ActionResult> UnfollowUser([FromBody] UnfollowUserRequest request)
    {
        try
        {
            var followerId = GetCurrentUserId();
            var success = await _followService.UnfollowUserAsync(followerId, request.UserId);
            
            if (!success)
                return BadRequest("Unable to unfollow user");
                
            return Ok(new { message = "User unfollowed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unfollowing user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while unfollowing the user");
        }
    }

    /// <summary>
    /// Check if current user is following another user
    /// </summary>
    [HttpGet("check/{userId}")]
    public async Task<ActionResult<bool>> IsFollowing(Guid userId)
    {
        try
        {
            var followerId = GetCurrentUserId();
            var isFollowing = await _followService.IsFollowingAsync(followerId, userId);
            return Ok(isFollowing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking follow status for user {UserId}", userId);
            return StatusCode(500, "An error occurred while checking follow status");
        }
    }

    /// <summary>
    /// Get followers of a user
    /// </summary>
    [HttpGet("followers/{userId}")]
    public async Task<ActionResult<FollowListResponse>> GetFollowers(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var followers = await _followService.GetFollowersAsync(userId, page, pageSize);
            return Ok(followers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting followers for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving followers");
        }
    }

    /// <summary>
    /// Get users that a user is following
    /// </summary>
    [HttpGet("following/{userId}")]
    public async Task<ActionResult<FollowListResponse>> GetFollowing(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var following = await _followService.GetFollowingAsync(userId, page, pageSize);
            return Ok(following);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting following for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving following");
        }
    }

    /// <summary>
    /// Get follower count for a user
    /// </summary>
    [HttpGet("followers/{userId}/count")]
    public async Task<ActionResult<int>> GetFollowersCount(Guid userId)
    {
        try
        {
            var count = await _followService.GetFollowersCountAsync(userId);
            return Ok(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting followers count for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving followers count");
        }
    }

    /// <summary>
    /// Get following count for a user
    /// </summary>
    [HttpGet("following/{userId}/count")]
    public async Task<ActionResult<int>> GetFollowingCount(Guid userId)
    {
        try
        {
            var count = await _followService.GetFollowingCountAsync(userId);
            return Ok(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting following count for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving following count");
        }
    }

    /// <summary>
    /// Get mutual follows between two users
    /// </summary>
    [HttpGet("mutual/{userId1}/{userId2}")]
    public async Task<ActionResult<FollowListResponse>> GetMutualFollows(
        Guid userId1, 
        Guid userId2, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var mutualFollows = await _followService.GetMutualFollowsAsync(userId1, userId2, page, pageSize);
            return Ok(mutualFollows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting mutual follows between users {UserId1} and {UserId2}", userId1, userId2);
            return StatusCode(500, "An error occurred while retrieving mutual follows");
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }
}
