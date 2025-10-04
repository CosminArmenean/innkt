using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using innkt.Social.Services;
using innkt.Social.Models;
using System.Security.Claims;
using System.Text.Json;

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
    /// Get user profile by ID (supports both GUID and username)
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
                Username = $"user_{userId.Substring(0, Math.Min(8, userId.Length))}",
                DisplayName = $"User {userId.Substring(0, Math.Min(8, userId.Length))}",
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

    /// <summary>
    /// Get user profiles by GUIDs (batch)
    /// </summary>
    [HttpPost("guid/batch")]
    public async Task<ActionResult<List<UserProfile>>> GetUserProfilesByGuidBatch([FromBody] List<Guid> userIds)
    {
        try
        {
            _logger.LogInformation("Getting user profiles for {Count} GUIDs", userIds.Count);
            
            var userProfiles = new List<UserProfile>();
            
            // Process in parallel for better performance
            var tasks = userIds.Select(async userId =>
            {
                try
                {
                    // Try to get real user data from Officer service
                    using var httpClient = new HttpClient();
                    var response = await httpClient.GetAsync($"http://localhost:5001/api/User/{userId}");
                    
                    if (response.IsSuccessStatusCode)
                    {
                        var content = await response.Content.ReadAsStringAsync();
                        var userData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content, new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                        
                        var userProfile = new UserProfile
                        {
                            Id = userData.GetProperty("id").GetString() ?? userId.ToString(),
                            Username = userData.GetProperty("username").GetString() ?? $"user_{userId.ToString().Substring(0, 8)}",
                            DisplayName = userData.GetProperty("fullName").GetString() ?? $"User {userId.ToString().Substring(0, 8)}",
                            Bio = userData.TryGetProperty("bio", out var bio) ? bio.GetString() : "Social media user",
                            Avatar = userData.TryGetProperty("profilePictureUrl", out var avatar) ? avatar.GetString() : null,
                            IsVerified = userData.TryGetProperty("isVerified", out var verified) ? verified.GetBoolean() : false,
                            FollowersCount = 0,
                            FollowingCount = 0,
                            PostsCount = 0,
                            CreatedAt = DateTime.UtcNow
                        };
                        
                        _logger.LogInformation("Successfully retrieved user profile from Officer service for {UserId}: {Username}", userId, userProfile.Username);
                        return userProfile;
                    }
                    else
                    {
                        _logger.LogWarning("Officer service returned {StatusCode} for GUID {UserId}", response.StatusCode, userId);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get user profile from Officer service for GUID {UserId}, falling back to mock data", userId);
                }
                
                // Fallback to mock data if Officer service is not available
                var userIdString = userId.ToString();
                var mockProfile = new UserProfile
                {
                    Id = userIdString,
                    Username = $"user_{userIdString.Substring(0, 8)}",
                    DisplayName = $"User {userIdString.Substring(0, 8)}",
                    Bio = "Social media user",
                    Avatar = null,
                    IsVerified = false,
                    FollowersCount = 0,
                    FollowingCount = 0,
                    PostsCount = 0,
                    CreatedAt = DateTime.UtcNow
                };
                
                _logger.LogInformation("Using mock user profile for GUID {UserId}: {Username}", userId, mockProfile.Username);
                return mockProfile;
            });
            
            var results = await Task.WhenAll(tasks);
            userProfiles.AddRange(results);
            
            _logger.LogInformation("Successfully retrieved {Count} user profiles", userProfiles.Count);
            return Ok(userProfiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user profiles for GUIDs");
            return StatusCode(500, new { error = "Failed to get user profiles" });
        }
    }

    /// <summary>
    /// Get user profile by GUID
    /// </summary>
    [HttpGet("guid/{userId}")]
    public async Task<ActionResult<UserProfile>> GetUserProfileByGuid(Guid userId)
    {
        try
        {
            _logger.LogInformation("Getting user profile for GUID: {UserId}", userId);
            
            // Try to get real user data from Officer service
            try
            {
                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync($"http://localhost:5001/api/User/{userId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var userData = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(content, new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    var userProfile = new UserProfile
                    {
                        Id = userData.GetProperty("id").GetString() ?? userId.ToString(),
                        Username = userData.GetProperty("username").GetString() ?? $"user_{userId.ToString().Substring(0, 8)}",
                        DisplayName = userData.GetProperty("fullName").GetString() ?? $"User {userId.ToString().Substring(0, 8)}",
                        Bio = userData.TryGetProperty("bio", out var bio) ? bio.GetString() : "Social media user",
                        Avatar = userData.TryGetProperty("profilePictureUrl", out var avatar) ? avatar.GetString() : null,
                        IsVerified = userData.TryGetProperty("isVerified", out var verified) ? verified.GetBoolean() : false,
                        FollowersCount = 0,
                        FollowingCount = 0,
                        PostsCount = 0,
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    _logger.LogInformation("Successfully retrieved user profile from Officer service for {UserId}: {Username}", userId, userProfile.Username);
                    return Ok(userProfile);
                }
                else
                {
                    _logger.LogWarning("Officer service returned {StatusCode} for GUID {UserId}", response.StatusCode, userId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get user profile from Officer service for GUID {UserId}, falling back to mock data", userId);
            }
            
            // Fallback to mock data if Officer service is not available
            var userIdString = userId.ToString();
            var mockProfile = new UserProfile
            {
                Id = userIdString,
                Username = $"user_{userIdString.Substring(0, 8)}",
                DisplayName = $"User {userIdString.Substring(0, 8)}",
                Bio = "Social media user",
                Avatar = null,
                IsVerified = false,
                FollowersCount = 0,
                FollowingCount = 0,
                PostsCount = 0,
                CreatedAt = DateTime.UtcNow
            };
            
            _logger.LogInformation("Using mock user profile for GUID {UserId}: {Username}", userId, mockProfile.Username);
            return Ok(mockProfile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user profile for GUID {UserId}", userId);
            return StatusCode(500, new { error = "Failed to get user profile" });
        }
    }
}
