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
[Authorize]
public class UserVerificationController : ControllerBase
{
    private readonly IUserVerificationService _verificationService;
    private readonly IEnhancedLoggingService _logger;
    private readonly ILocalizationService _localization;

    public UserVerificationController(IUserVerificationService verificationService, IEnhancedLoggingService logger, ILocalizationService localization)
    {
        _verificationService = verificationService;
        _logger = logger;
        _localization = localization;
    }

    [HttpPost("submit")]
    public async Task<ActionResult<UserVerificationResponseDto>> SubmitVerification([FromBody] UserVerificationRequestDto request)
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

            var response = await _verificationService.SubmitVerificationRequestAsync(userId, request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Verification.CreditCardInvalid, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Verification.CreditCardFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpGet("status")]
    public async Task<ActionResult<UserVerificationStatusDto>> GetVerificationStatus()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var status = await _verificationService.GetVerificationStatusAsync(userId);
            return Ok(status);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Verification.VerificationPending, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Verification.VerificationFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("approve")]
    [Authorize(Roles = "Admin,Verifier")] // Only admins and verifiers can approve
    public async Task<ActionResult> ApproveVerification([FromBody] ApproveVerificationDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _verificationService.ApproveVerificationAsync(request.UserId, request.VerificationMethod);
            if (success)
            {
                var message = await _localization.GetStringAsync(AppStrings.Verification.VerificationApproved);
                return Ok(new { message });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Verification.VerificationFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Verification.VerificationFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Verification.VerificationFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("reject")]
    [Authorize(Roles = "Admin,Verifier")] // Only admins and verifiers can reject
    public async Task<ActionResult> RejectVerification([FromBody] RejectVerificationDto request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _verificationService.RejectVerificationAsync(request.UserId, request.VerificationMethod, request.Reason);
            if (success)
            {
                var message = await _localization.GetStringAsync(AppStrings.Verification.VerificationRejected);
                return Ok(new { message });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Verification.VerificationFailed);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Verification.VerificationFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Verification.VerificationFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpGet("is-verified")]
    public async Task<ActionResult> IsUserVerified()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var isVerified = await _verificationService.IsUserVerifiedAsync(userId);
            return Ok(new { isVerified });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Verification.VerificationPending, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Verification.VerificationFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpGet("method")]
    public async Task<ActionResult> GetVerificationMethod()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                var authMessage = await _localization.GetStringAsync(AppStrings.Auth.UserNotAuthenticated);
                return Unauthorized(authMessage);
            }

            var method = await _verificationService.GetVerificationMethodAsync(userId);
            return Ok(new { method });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Verification.VerificationFailed, ex);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Verification.VerificationFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }
}

// Additional DTOs for the controller
public class ApproveVerificationDto
{
    public string UserId { get; set; } = string.Empty;
    public string VerificationMethod { get; set; } = string.Empty;
}

public class RejectVerificationDto
{
    public string UserId { get; set; } = string.Empty;
    public string VerificationMethod { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
