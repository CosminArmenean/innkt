using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using innkt.Social.Services;
using System.Security.Claims;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrendingController : ControllerBase
{
    private readonly TrendingService _trendingService;
    private readonly ILogger<TrendingController> _logger;

    public TrendingController(TrendingService trendingService, ILogger<TrendingController> logger)
    {
        _trendingService = trendingService;
        _logger = logger;
    }

    /// <summary>
    /// Test endpoint to verify service calls
    /// </summary>
    [HttpGet("test")]
    public ActionResult<object> Test()
    {
        return Ok(new { message = "Trending service is working!", service = "innkt.Social.Trending", port = 8081, timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get trending topics/hashtags
    /// </summary>
    [HttpGet("topics")]
    public async Task<ActionResult<List<string>>> GetTrendingTopics([FromQuery] int count = 20)
    {
        try
        {
            var topics = await _trendingService.GetTrendingTopicsAsync(count);
            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get trending topics");
            return StatusCode(500, new { error = "Failed to get trending topics" });
        }
    }

    /// <summary>
    /// Get recommended users for the current user
    /// </summary>
    [HttpGet("recommendations/users")]
    public async Task<ActionResult<List<object>>> GetRecommendedUsers([FromQuery] int count = 10)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var recommendations = await _trendingService.GetRecommendedUsersAsync(userId, count);
            
            // Map to response format
            var response = recommendations.Select(u => new
            {
                id = u.Id,
                username = u.Username,
                displayName = u.DisplayName,
                bio = u.Bio,
                avatar = u.Avatar,
                isVerified = u.IsVerified,
                followersCount = u.FollowersCount,
                followingCount = u.FollowingCount,
                postsCount = u.PostsCount,
                createdAt = u.CreatedAt
            }).ToList();

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get recommended users");
            return StatusCode(500, new { error = "Failed to get recommended users" });
        }
    }
}
