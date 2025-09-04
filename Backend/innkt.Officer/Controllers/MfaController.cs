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
public class MfaController : ControllerBase
{
    private readonly IMfaService _mfaService;
    private readonly IEnhancedLoggingService _logger;
    private readonly ILocalizationService _localization;

    public MfaController(IMfaService mfaService, IEnhancedLoggingService logger, ILocalizationService localization)
    {
        _mfaService = mfaService;
        _logger = logger;
        _localization = localization;
    }

    [HttpGet("status")]
    public async Task<ActionResult<MfaStatusDto>> GetMfaStatus()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var status = await _mfaService.GetMfaStatusAsync(userId);
            return Ok(status);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Mfa.SetupFailed);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Mfa.SetupFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("setup")]
    public async Task<ActionResult<MfaStatusDto>> SetupMfa()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            // Generate a new secret key
            var secretKey = await _mfaService.GenerateMfaSecretKeyAsync(userId);
            
            // Get the updated status with QR code URL
            var status = await _mfaService.GetMfaStatusAsync(userId);
            
            return Ok(status);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Mfa.SetupFailed);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Mfa.SetupFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("enable")]
    public async Task<ActionResult> EnableMfa([FromBody] MfaSetupDto request)
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
                return Unauthorized("User not authenticated");
            }

            var success = await _mfaService.EnableMfaAsync(userId, request.SecretKey, request.VerificationCode);
            if (success)
            {
                var message = await _localization.GetStringAsync(AppStrings.Mfa.EnableSuccess);
                return Ok(new { message });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Mfa.InvalidCode);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Mfa.EnableFailed);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Mfa.EnableFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("verify")]
    public async Task<ActionResult> VerifyMfa([FromBody] VerifyMfaDto request)
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
                return Unauthorized("User not authenticated");
            }

            var success = await _mfaService.VerifyMfaCodeAsync(userId, request.MfaCode);
            if (success)
            {
                var message = await _localization.GetStringAsync(AppStrings.Mfa.VerificationSuccess);
                return Ok(new { message });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Mfa.InvalidCode);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Mfa.VerificationFailed);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Mfa.VerificationFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("disable")]
    public async Task<ActionResult> DisableMfa([FromBody] DisableMfaDto request)
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
                return Unauthorized("User not authenticated");
            }

            var success = await _mfaService.DisableMfaAsync(userId, request.CurrentMfaCode);
            if (success)
            {
                var message = await _localization.GetStringAsync(AppStrings.Mfa.DisableSuccess);
                return Ok(new { message });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Mfa.InvalidCode);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Mfa.DisableFailed);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Mfa.DisableFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("backup-codes")]
    public async Task<ActionResult> GenerateBackupCodes()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not authenticated");
            }

            var backupCodes = await _mfaService.GenerateBackupCodesAsync(userId);
            return Ok(new { backupCodes });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Mfa.SetupFailed);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Mfa.SetupFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }

    [HttpPost("backup-verify")]
    public async Task<ActionResult> VerifyBackupCode([FromBody] VerifyMfaDto request)
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
                return Unauthorized("User not authenticated");
            }

            var success = await _mfaService.ValidateBackupCodeAsync(userId, request.MfaCode);
            if (success)
            {
                var message = await _localization.GetStringAsync(AppStrings.Mfa.BackupCodeUsed);
                return Ok(new { message });
            }

            var errorMessage = await _localization.GetStringAsync(AppStrings.Mfa.BackupCodeInvalid);
            return BadRequest(new { message = errorMessage });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(AppStrings.Mfa.VerificationFailed);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, AppStrings.Mfa.VerificationFailed);
            var message = await _localization.GetStringAsync(AppStrings.General.ServerError);
            return StatusCode(500, new { message });
        }
    }
}
