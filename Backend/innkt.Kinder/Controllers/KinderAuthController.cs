using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Kinder.Services;
using innkt.Kinder.Models;
using System.Text.Json;
using Confluent.Kafka;

namespace innkt.Kinder.Controllers;

[ApiController]
[Route("api/kinder")]
public class KinderAuthController : ControllerBase
{
    private readonly IKinderAuthService _kinderAuthService;
    private readonly ILogger<KinderAuthController> _logger;
    private readonly IProducer<string, string> _kafkaProducer;

    public KinderAuthController(
        IKinderAuthService kinderAuthService,
        ILogger<KinderAuthController> logger,
        IProducer<string, string> kafkaProducer)
    {
        _kinderAuthService = kinderAuthService;
        _logger = logger;
        _kafkaProducer = kafkaProducer;
    }

    #region QR Code & Login Code Endpoints

    /// <summary>
    /// Generate a login code and QR code for a kid account
    /// </summary>
    [HttpPost("generate-login-code")]
    [Authorize]
    public async Task<ActionResult<KidLoginCodeResponse>> GenerateLoginCode([FromBody] GenerateLoginCodeRequest request)
    {
        try
        {
            // TODO: Get parentId from JWT token
            var parentId = request.ParentId;

            var response = await _kinderAuthService.GenerateLoginCodeAsync(
                request.KidAccountId,
                parentId,
                request.ExpirationDays
            );

            // Publish event to Kafka
            await PublishLoginCodeGeneratedEventAsync(response, request.KidAccountId, parentId);

            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating login code");
            return StatusCode(500, new { error = "Failed to generate login code" });
        }
    }

    /// <summary>
    /// Validate a login code
    /// </summary>
    [HttpPost("validate-login-code")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginCodeValidationResponse>> ValidateLoginCode([FromBody] ValidateLoginCodeRequest request)
    {
        try
        {
            var isValid = await _kinderAuthService.ValidateLoginCodeAsync(request.Code);

            if (!isValid)
            {
                return Ok(new LoginCodeValidationResponse
                {
                    IsValid = false,
                    Message = "Invalid, expired, or already used login code"
                });
            }

            var loginCode = await _kinderAuthService.GetLoginCodeAsync(request.Code);

            if (loginCode == null)
            {
                return Ok(new LoginCodeValidationResponse
                {
                    IsValid = false,
                    Message = "Login code not found"
                });
            }

            return Ok(new LoginCodeValidationResponse
            {
                IsValid = true,
                KidAccountId = loginCode.KidAccountId,
                UserId = loginCode.KidAccount.UserId,
                Message = "Login code validated successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating login code");
            return StatusCode(500, new { error = "Failed to validate login code" });
        }
    }

    /// <summary>
    /// Get active login codes for a kid account
    /// </summary>
    [HttpGet("{kidAccountId}/login-codes")]
    [Authorize]
    public async Task<ActionResult<List<KidLoginCode>>> GetActiveLoginCodes(Guid kidAccountId)
    {
        try
        {
            var codes = await _kinderAuthService.GetActiveLoginCodesAsync(kidAccountId);
            return Ok(codes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active login codes");
            return StatusCode(500, new { error = "Failed to get login codes" });
        }
    }

    /// <summary>
    /// Revoke a login code
    /// </summary>
    [HttpDelete("login-codes/{codeId}")]
    [Authorize]
    public async Task<ActionResult> RevokeLoginCode(Guid codeId, [FromQuery] Guid parentId)
    {
        try
        {
            var success = await _kinderAuthService.RevokeLoginCodeAsync(codeId, parentId);

            if (!success)
                return NotFound(new { error = "Login code not found" });

            return Ok(new { message = "Login code revoked successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking login code");
            return StatusCode(500, new { error = "Failed to revoke login code" });
        }
    }

    #endregion

    #region Maturity Score Endpoints

    /// <summary>
    /// Get maturity score for a kid account
    /// </summary>
    [HttpGet("{kidAccountId}/maturity-score")]
    [Authorize]
    public async Task<ActionResult<MaturityScore>> GetMaturityScore(Guid kidAccountId)
    {
        try
        {
            var score = await _kinderAuthService.GetMaturityScoreAsync(kidAccountId);

            if (score == null)
            {
                // Calculate if doesn't exist
                score = await _kinderAuthService.CalculateMaturityScoreAsync(kidAccountId);
            }

            return Ok(score);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting maturity score");
            return StatusCode(500, new { error = "Failed to get maturity score" });
        }
    }

    /// <summary>
    /// Update parent assessment for maturity score
    /// </summary>
    [HttpPost("{kidAccountId}/parent-assessment")]
    [Authorize]
    public async Task<ActionResult<MaturityScore>> UpdateParentAssessment(
        Guid kidAccountId, 
        [FromBody] ParentAssessmentRequest request)
    {
        try
        {
            // TODO: Get parentId from JWT token
            var parentId = request.ParentId;

            var score = await _kinderAuthService.UpdateParentAssessmentAsync(
                kidAccountId,
                parentId,
                request.Rating,
                request.Notes
            );

            // Publish maturity update event
            await PublishMaturityUpdateEventAsync(score);

            return Ok(score);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating parent assessment");
            return StatusCode(500, new { error = "Failed to update parent assessment" });
        }
    }

    /// <summary>
    /// Update behavioral metrics for maturity score
    /// </summary>
    [HttpPost("{kidAccountId}/behavioral-metrics")]
    [Authorize]
    public async Task<ActionResult<MaturityScore>> UpdateBehavioralMetrics(
        Guid kidAccountId,
        [FromBody] BehavioralMetrics metrics)
    {
        try
        {
            var success = await _kinderAuthService.UpdateBehavioralMetricsAsync(kidAccountId, metrics);

            if (!success)
                return NotFound(new { error = "Kid account not found" });

            var score = await _kinderAuthService.GetMaturityScoreAsync(kidAccountId);
            return Ok(score);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating behavioral metrics");
            return StatusCode(500, new { error = "Failed to update behavioral metrics" });
        }
    }

    #endregion

    #region Password Management Endpoints

    /// <summary>
    /// Set password for a kid account (parent action)
    /// </summary>
    [HttpPost("{kidAccountId}/set-password")]
    [Authorize]
    public async Task<ActionResult> SetPassword(Guid kidAccountId, [FromBody] SetPasswordRequest request)
    {
        try
        {
            // TODO: Get parentId from JWT token
            var parentId = request.ParentId;

            var success = await _kinderAuthService.SetPasswordAsync(kidAccountId, parentId, request.Password);

            if (!success)
                return NotFound(new { error = "Kid account not found" });

            // Publish password set event
            await PublishPasswordSetEventAsync(kidAccountId, parentId, true);

            return Ok(new { message = "Password set successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting password");
            return StatusCode(500, new { error = "Failed to set password" });
        }
    }

    /// <summary>
    /// Change password (kid action)
    /// </summary>
    [HttpPost("{kidAccountId}/change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword(Guid kidAccountId, [FromBody] ChangePasswordRequest request)
    {
        try
        {
            var success = await _kinderAuthService.ChangePasswordAsync(
                kidAccountId,
                request.OldPassword,
                request.NewPassword
            );

            if (!success)
                return BadRequest(new { error = "Cannot change password. Check maturity level or password settings." });

            // Publish password changed event
            await PublishPasswordChangedEventAsync(kidAccountId, false);

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new { error = "Failed to change password" });
        }
    }

    /// <summary>
    /// Revoke password access (parent action)
    /// </summary>
    [HttpPost("{kidAccountId}/revoke-password")]
    [Authorize]
    public async Task<ActionResult> RevokePassword(Guid kidAccountId, [FromBody] RevokePasswordRequest request)
    {
        try
        {
            // TODO: Get parentId from JWT token
            var parentId = request.ParentId;

            var success = await _kinderAuthService.RevokePasswordAccessAsync(kidAccountId, parentId, request.Reason);

            if (!success)
                return BadRequest(new { error = "Cannot revoke password. Check maturity level." });

            // Publish password revoked event
            await PublishPasswordRevokedEventAsync(kidAccountId, parentId, request.Reason);

            return Ok(new { message = "Password access revoked successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt");
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking password");
            return StatusCode(500, new { error = "Failed to revoke password" });
        }
    }

    /// <summary>
    /// Get password settings for a kid account
    /// </summary>
    [HttpGet("{kidAccountId}/password-settings")]
    [Authorize]
    public async Task<ActionResult<KidPasswordSettings>> GetPasswordSettings(Guid kidAccountId)
    {
        try
        {
            var settings = await _kinderAuthService.GetPasswordSettingsAsync(kidAccountId);

            if (settings == null)
                return NotFound(new { error = "Password settings not found" });

            return Ok(settings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting password settings");
            return StatusCode(500, new { error = "Failed to get password settings" });
        }
    }

    #endregion

    #region Kafka Event Publishers

    private async Task PublishLoginCodeGeneratedEventAsync(KidLoginCodeResponse response, Guid kidAccountId, Guid parentId)
    {
        try
        {
            var eventData = new
            {
                EventType = "kid-login-code-generated",
                KidAccountId = kidAccountId,
                ParentId = parentId,
                CodeId = response.CodeId,
                ExpiresAt = response.ExpiresAt,
                MaturityLevel = response.MaturityLevel,
                Timestamp = DateTime.UtcNow
            };

            var message = new Message<string, string>
            {
                Key = kidAccountId.ToString(),
                Value = JsonSerializer.Serialize(eventData)
            };

            await _kafkaProducer.ProduceAsync("kid-login-code-generated", message);
            _logger.LogInformation("📤 Published login code generated event to Kafka");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish login code generated event");
        }
    }

    private async Task PublishMaturityUpdateEventAsync(MaturityScore score)
    {
        try
        {
            var eventData = new
            {
                EventType = "kid-maturity-updated",
                KidAccountId = score.KidAccountId,
                TotalScore = score.TotalScore,
                Level = score.Level,
                PreviousLevel = score.PreviousLevel,
                Timestamp = DateTime.UtcNow
            };

            var message = new Message<string, string>
            {
                Key = score.KidAccountId.ToString(),
                Value = JsonSerializer.Serialize(eventData)
            };

            await _kafkaProducer.ProduceAsync("kid-maturity-updated", message);
            _logger.LogInformation("📤 Published maturity update event to Kafka");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish maturity update event");
        }
    }

    private async Task PublishPasswordSetEventAsync(Guid kidAccountId, Guid parentId, bool isFirstTime)
    {
        try
        {
            var eventData = new
            {
                EventType = "kid-password-set",
                KidAccountId = kidAccountId,
                ParentId = parentId,
                IsFirstTime = isFirstTime,
                Timestamp = DateTime.UtcNow
            };

            var message = new Message<string, string>
            {
                Key = kidAccountId.ToString(),
                Value = JsonSerializer.Serialize(eventData)
            };

            await _kafkaProducer.ProduceAsync("kid-password-changed", message);
            _logger.LogInformation("📤 Published password set event to Kafka");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish password set event");
        }
    }

    private async Task PublishPasswordChangedEventAsync(Guid kidAccountId, bool changedByParent)
    {
        try
        {
            var eventData = new
            {
                EventType = "kid-password-changed",
                KidAccountId = kidAccountId,
                ChangedByParent = changedByParent,
                Timestamp = DateTime.UtcNow
            };

            var message = new Message<string, string>
            {
                Key = kidAccountId.ToString(),
                Value = JsonSerializer.Serialize(eventData)
            };

            await _kafkaProducer.ProduceAsync("kid-password-changed", message);
            _logger.LogInformation("📤 Published password changed event to Kafka");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish password changed event");
        }
    }

    private async Task PublishPasswordRevokedEventAsync(Guid kidAccountId, Guid parentId, string reason)
    {
        try
        {
            var eventData = new
            {
                EventType = "kid-password-revoked",
                KidAccountId = kidAccountId,
                ParentId = parentId,
                Reason = reason,
                Timestamp = DateTime.UtcNow
            };

            var message = new Message<string, string>
            {
                Key = kidAccountId.ToString(),
                Value = JsonSerializer.Serialize(eventData)
            };

            await _kafkaProducer.ProduceAsync("kid-password-changed", message);
            _logger.LogInformation("📤 Published password revoked event to Kafka");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish password revoked event");
        }
    }

    #endregion
}

#region Request/Response Models

public class GenerateLoginCodeRequest
{
    public Guid KidAccountId { get; set; }
    public Guid ParentId { get; set; }
    public int ExpirationDays { get; set; } = 0; // 0 = use maturity-based default
}

public class ValidateLoginCodeRequest
{
    public string Code { get; set; } = string.Empty;
}

public class LoginCodeValidationResponse
{
    public bool IsValid { get; set; }
    public Guid? KidAccountId { get; set; }
    public Guid? UserId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ParentAssessmentRequest
{
    public Guid ParentId { get; set; }
    public int Rating { get; set; } // 0-5 scale
    public string? Notes { get; set; }
}

public class SetPasswordRequest
{
    public Guid ParentId { get; set; }
    public string Password { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class RevokePasswordRequest
{
    public Guid ParentId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

#endregion

