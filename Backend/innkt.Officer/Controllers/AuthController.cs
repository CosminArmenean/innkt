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
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEnhancedLoggingService _logger;
    private readonly ILocalizationService _localization;

    public AuthController(IAuthService authService, IEnhancedLoggingService logger, ILocalizationService localization)
    {
        _authService = authService;
        _logger = logger;
        _localization = localization;
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
            var errorMessage = await _localization.GetStringAsync(AppStrings.General.ServerError);
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
}



