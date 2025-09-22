using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using innkt.Officer.Models.DTOs;
using innkt.Officer.Services;
using innkt.StringLibrary.Services;
using innkt.StringLibrary.Constants;
using System.Security.Claims;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEnhancedLoggingService _logger;
    private readonly ILocalizationService _localization;

    public UserController(IAuthService authService, IEnhancedLoggingService logger, ILocalizationService localization)
    {
        _authService = authService;
        _logger = logger;
        _localization = localization;
    }

    /// <summary>
    /// Get user profile by ID
    /// </summary>
    [HttpGet("{userId}")]
    public async Task<ActionResult<UserProfileDto>> GetUserProfile(string userId)
    {
        try
        {
            var userProfile = await _authService.GetUserProfileAsync(userId);
            return Ok(userProfile);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to get user profile for ID: {userId}. Error: {ex.Message}");
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Get user profile by email
    /// </summary>
    [HttpGet("by-email/{email}")]
    public async Task<ActionResult<UserProfileDto>> GetUserByEmail(string email)
    {
        try
        {
            // For now, we'll need to find the user by email first
            // This is a simplified implementation - in production you'd want a proper user lookup service
            return BadRequest(new { error = "Email lookup not implemented yet. Please use user ID instead." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to get user by email: {email}. Error: {ex.Message}");
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Get user profile by username
    /// </summary>
    [HttpGet("username/{username}")]
    public async Task<ActionResult<UserProfileDto>> GetUserByUsername(string username)
    {
        try
        {
            var userProfile = await _authService.GetUserByUsernameAsync(username);
            if (userProfile == null)
            {
                return NotFound(new { error = "User not found" });
            }
            return Ok(userProfile);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to get user by username: {username}. Error: {ex.Message}");
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    [HttpPut("{userId}")]
    public async Task<ActionResult<UserProfileDto>> UpdateUserProfile(string userId, [FromBody] UpdateUserProfileDto updateDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userProfile = await _authService.UpdateUserProfileAsync(userId, updateDto);
            return Ok(userProfile);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to update user profile for ID: {userId}. Error: {ex.Message}");
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Upload user avatar
    /// </summary>
    [HttpPost("{userId}/avatar")]
    [Authorize]
    public async Task<ActionResult<object>> UploadAvatar(string userId, IFormFile avatar)
    {
        try
        {
            if (avatar == null || avatar.Length == 0)
            {
                return BadRequest(new { error = "No file uploaded" });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
            if (!allowedTypes.Contains(avatar.ContentType.ToLower()))
            {
                return BadRequest(new { error = "Invalid file type. Only JPEG, PNG, and GIF images are allowed." });
            }

            // Validate file size (max 5MB)
            if (avatar.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { error = "File size too large. Maximum size is 5MB." });
            }

            // Generate unique filename
            var fileExtension = Path.GetExtension(avatar.FileName);
            var fileName = $"{userId}_{DateTime.UtcNow:yyyyMMddHHmmss}{fileExtension}";
            var uploadsPath = Path.Combine("wwwroot", "uploads", "profiles");
            var filePath = Path.Combine(uploadsPath, fileName);

            // Ensure directory exists
            Directory.CreateDirectory(uploadsPath);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await avatar.CopyToAsync(stream);
            }

            // Generate relative URL
            var avatarUrl = $"/uploads/profiles/{fileName}";

            // Update user profile with new avatar URL
            var updateDto = new UpdateUserProfileDto
            {
                ProfilePictureUrl = avatarUrl
            };

            await _authService.UpdateUserProfileAsync(userId, updateDto);

            // Log success without using EnhancedLoggingService
            Console.WriteLine($"Avatar uploaded successfully for user {userId}: {avatarUrl}");
            return Ok(new { avatarUrl });
        }
        catch (Exception ex)
        {
            // Log to console for debugging without using the problematic EnhancedLoggingService
            Console.WriteLine($"Failed to upload avatar for user {userId}: {ex.Message}");
            return StatusCode(500, new { error = "Failed to upload avatar. Please try again." });
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
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            var users = await _authService.SearchUsersAsync(query, page, limit);
            
            return Ok(new
            {
                users = users.Select(u => new
                {
                    id = u.Id,
                    username = u.UserName,
                    displayName = $"{u.FirstName} {u.LastName}".Trim(),
                    email = u.Email,
                    avatarUrl = u.ProfilePictureUrl,
                    isVerified = false // TODO: Add verification status
                }),
                totalCount = users.Count,
                page = page,
                limit = limit,
                hasMore = users.Count == limit
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error searching users: {ex.Message}");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
