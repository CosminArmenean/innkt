using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Officer.Services;
using System.Security.Claims;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/auth/username")]
public class UsernameValidationController : ControllerBase
{
    private readonly IUsernameValidationService _usernameValidationService;
    private readonly ILogger<UsernameValidationController> _logger;

    public UsernameValidationController(
        IUsernameValidationService usernameValidationService,
        ILogger<UsernameValidationController> logger)
    {
        _usernameValidationService = usernameValidationService;
        _logger = logger;
    }

    /// <summary>
    /// Check if a username is available and valid
    /// </summary>
    [HttpGet("check")]
    public async Task<ActionResult<UsernameCheckResponse>> CheckUsername([FromQuery] string username)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest(new UsernameCheckResponse
                {
                    IsValid = false,
                    IsAvailable = false,
                    Errors = new List<string> { "Username is required" }
                });
            }

            // Get current user ID for exclusion (if user is updating their own username)
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var validation = await _usernameValidationService.ValidateUsernameAsync(username, currentUserId);

            return Ok(new UsernameCheckResponse
            {
                IsValid = validation.IsValid,
                IsAvailable = validation.IsValid,
                Username = validation.Username,
                Errors = validation.Errors,
                Suggestions = validation.Suggestions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking username availability for '{Username}'", username);
            return StatusCode(500, new UsernameCheckResponse
            {
                IsValid = false,
                IsAvailable = false,
                Errors = new List<string> { "Error checking username availability" }
            });
        }
    }

    /// <summary>
    /// Validate username format only (without database check)
    /// </summary>
    [HttpGet("validate-format")]
    public ActionResult<UsernameFormatResponse> ValidateFormat([FromQuery] string username)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest(new UsernameFormatResponse
                {
                    IsValid = false,
                    Errors = new List<string> { "Username is required" }
                });
            }

            var isValid = _usernameValidationService.IsValidUsernameFormat(username);

            return Ok(new UsernameFormatResponse
            {
                IsValid = isValid,
                Username = username.Trim(),
                Errors = isValid ? new List<string>() : new List<string> { "Username format is invalid" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating username format for '{Username}'", username);
            return StatusCode(500, new UsernameFormatResponse
            {
                IsValid = false,
                Errors = new List<string> { "Error validating username format" }
            });
        }
    }
}

#region Response Models

public class UsernameCheckResponse
{
    public bool IsValid { get; set; }
    public bool IsAvailable { get; set; }
    public string Username { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}

public class UsernameFormatResponse
{
    public bool IsValid { get; set; }
    public string Username { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
}

#endregion
