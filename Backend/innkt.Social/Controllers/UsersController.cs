using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using innkt.Social.Services;
using innkt.Social.Models;
using System.Security.Claims;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ILogger<UsersController> _logger;

    public UsersController(ILogger<UsersController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Test endpoint to verify service calls
    /// </summary>
    [HttpGet("test")]
    public ActionResult<object> Test()
    {
        return Ok(new { message = "Social service is working!", service = "innkt.Social", port = 8081, timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get current user profile (for authentication)
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfile>> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                // For testing purposes, return a demo user profile
                userId = "demo-user-123";
            }

            // For now, return a basic profile with the user ID
            // In a real implementation, this would query the Officer service
            var userProfile = new UserProfile
            {
                Id = userId,
                Username = $"user_{userId.Substring(0, 8)}",
                DisplayName = $"User {userId.Substring(0, 8)}",
                Bio = "Social media user",
                IsVerified = false,
                FollowersCount = 0,
                FollowingCount = 0,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            return Ok(userProfile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current user profile");
            return StatusCode(500, new { error = "Failed to get current user profile" });
        }
    }

    /// <summary>
    /// Get user profile by ID
    /// </summary>
    [HttpGet("{userId}")]
    public async Task<ActionResult<UserProfile>> GetUserProfile(string userId)
    {
        try
        {
            // For now, return a basic profile with the user ID
            // In a real implementation, this would query the Officer service
            var userProfile = new UserProfile
            {
                Id = userId,
                Username = $"user_{userId.Substring(0, 8)}",
                DisplayName = $"User {userId.Substring(0, 8)}",
                Bio = "Social media user",
                IsVerified = false,
                FollowersCount = 0,
                FollowingCount = 0,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            return Ok(userProfile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user profile for {UserId}", userId);
            return StatusCode(500, new { error = "Failed to get user profile" });
        }
    }
}
