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
            _logger.LogError(ex, "Failed to get user profile for ID: {UserId}", userId);
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
            _logger.LogError(ex, "Failed to get user by email: {Email}", email);
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
            _logger.LogError(ex, "Failed to update user profile for ID: {UserId}", userId);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }
}
