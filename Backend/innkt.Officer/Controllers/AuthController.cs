using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using innkt.Officer.Models.DTOs;
using innkt.Officer.Services;
using innkt.StringLibrary.Services;
using innkt.StringLibrary.Constants;
using System.Security.Claims;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEnhancedLoggingService _logger;
    private readonly ILocalizationService _localization;
    private readonly IStringLocalizer _localizer;

    public AuthController(
        IAuthService authService, 
        IEnhancedLoggingService logger, 
        ILocalizationService localization,
        IStringLocalizerFactory localizerFactory)
    {
        _authService = authService;
        _logger = logger;
        _localization = localization;
        _localizer = localizerFactory.Create(typeof(AuthController));
    }

    /// <summary>
    /// Test endpoint to verify service is working
    /// </summary>
    [HttpGet("test")]
    public IActionResult Test()
    {
        return Ok(new { message = "Auth service is working", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] UserRegistrationDto registrationDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.RegisterAsync(registrationDto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.RegistrationFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Register a joint account with two linked users
    /// </summary>
    [HttpPost("register-joint")]
    public async Task<ActionResult<AuthResponseDto>> RegisterJointAccount([FromBody] JointAccountRegistrationDto jointAccountDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.RegisterJointAccountAsync(jointAccountDto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.JointAccount.CreationFailed);
            var errorMessage = _localizer["auth.register.failed"].Value;
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.LoginAsync(loginDto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            var errorMessage = _localizer["auth.login.invalid_credentials"].Value;
            return BadRequest(new { error = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.LoginFailed);
            var errorMessage = _localizer["auth.login.failed"].Value;
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Login with joint account credentials
    /// </summary>
    [HttpPost("login-joint")]
    public async Task<ActionResult<AuthResponseDto>> LoginJointAccount([FromBody] JointAccountLoginDto jointLoginDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.LoginJointAccountAsync(jointLoginDto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.LoginFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    [HttpPost("refresh-token")]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = await _authService.RefreshTokenAsync(refreshTokenDto.RefreshToken);
            return Ok(response);
        }
        catch (NotImplementedException)
        {
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServiceUnavailable);
            return StatusCode(501, new { error = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.TokenInvalid);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Change user password
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var result = await _authService.ChangePasswordAsync(userId, changePasswordDto);
            if (result)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.Auth.PasswordResetSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Auth.PasswordResetFailed);
            return BadRequest(new { error = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.PasswordResetFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Request password reset
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.ForgotPasswordAsync(forgotPasswordDto);
            if (result)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.Auth.PasswordResetSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Auth.PasswordResetFailed);
            return BadRequest(new { error = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.PasswordResetFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Reset password using reset token
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _authService.ResetPasswordAsync(resetPasswordDto);
            if (result)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.Auth.PasswordResetSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Auth.PasswordResetFailed);
            return BadRequest(new { error = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.PasswordResetFailed);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var userProfile = await _authService.GetUserProfileAsync(userId);
            return Ok(userProfile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get current user profile");
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Logout user
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var result = await _authService.LogoutAsync(userId);
            if (result)
            {
                var successMessage = await _localization.GetStringAsync(AppStrings.Auth.LogoutSuccess);
                return Ok(new { message = successMessage });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Auth.LogoutSuccess);
            return BadRequest(new { error = errorMessage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Auth.LogoutSuccess);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    [HttpPut("profile/{userId}")]
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
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update user profile for ID: {UserId}", userId);
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { error = errorMessage });
        }
    }

    [HttpPut("update-language")]
    [Authorize]
    public async Task<IActionResult> UpdateLanguagePreference([FromBody] UpdateLanguageRequest request)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = _localizer["auth.user_not_found"].Value });
            }

            // Validate language code
            var supportedLanguages = new[] { "en", "es", "fr", "de", "it", "pt", "nl", "pl", "cs", "hu", "ro", "he", "ja", "ko", "hi" };
            if (!supportedLanguages.Contains(request.PreferredLanguage))
            {
                return BadRequest(new { error = _localizer["auth.invalid_language"].Value });
            }

            // Update user's preferred language
            var result = await _authService.UpdateUserLanguagePreferenceAsync(userId, request.PreferredLanguage);
            if (result)
            {
                _logger.LogInformation($"User {userId} updated language preference to {request.PreferredLanguage}");
                return Ok(new { message = _localizer["auth.language_updated"].Value });
            }

            return StatusCode(500, new { error = _localizer["auth.language_update_failed"].Value });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating language preference");
            var errorMessage = _localizer["general.server_error"].Value;
            return StatusCode(500, new { error = errorMessage });
        }
    }
}

public class UpdateLanguageRequest
{
    public string PreferredLanguage { get; set; } = string.Empty;
}




