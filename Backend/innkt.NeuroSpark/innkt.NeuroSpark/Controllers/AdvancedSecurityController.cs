using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdvancedSecurityController : ControllerBase
{
    private readonly IAuditLogger _auditLogger;
    private readonly IApiKeyService _apiKeyService;
    private readonly IEncryptionService _encryptionService;
    private readonly ILogger<AdvancedSecurityController> _logger;

    public AdvancedSecurityController(
        IAuditLogger auditLogger,
        IApiKeyService apiKeyService,
        IEncryptionService encryptionService,
        ILogger<AdvancedSecurityController> logger)
    {
        _auditLogger = auditLogger;
        _apiKeyService = apiKeyService;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    #region Audit Logging

    [HttpPost("audit/log-request")]
    public async Task<IActionResult> LogRequest([FromBody] AuditRequestRequest request)
    {
        try
        {
            var auditRequest = new AuditRequest
            {
                UserId = request.UserId ?? "anonymous",
                UserAgent = Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown",
                IpAddress = GetClientIpAddress(),
                Method = Request.Method,
                Path = Request.Path,
                QueryString = Request.QueryString.ToString(),
                Headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()),
                Body = request.Body,
                SessionId = request.SessionId ?? Guid.NewGuid().ToString(),
                CorrelationId = request.CorrelationId ?? Guid.NewGuid().ToString()
            };

            await _auditLogger.LogRequestAsync(auditRequest);

            return Ok(new
            {
                message = "Request logged successfully",
                requestId = auditRequest.RequestId,
                timestamp = auditRequest.Timestamp
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log audit request");
            return StatusCode(500, new { error = "Failed to log request" });
        }
    }

    [HttpPost("audit/log-security-event")]
    public async Task<IActionResult> LogSecurityEvent([FromBody] SecurityEventRequest request)
    {
        try
        {
            var securityEvent = new SecurityEvent
            {
                EventType = request.EventType,
                Severity = request.Severity,
                Description = request.Description,
                UserId = request.UserId ?? "anonymous",
                IpAddress = GetClientIpAddress(),
                UserAgent = Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown",
                Details = request.Details ?? new Dictionary<string, object>(),
                RequiresImmediateAction = request.RequiresImmediateAction,
                RecommendedAction = request.RecommendedAction
            };

            await _auditLogger.LogSecurityEventAsync(securityEvent);

            return Ok(new
            {
                message = "Security event logged successfully",
                eventId = securityEvent.EventId,
                timestamp = securityEvent.Timestamp
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log security event");
            return StatusCode(500, new { error = "Failed to log security event" });
        }
    }

    [HttpGet("audit/logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] string? userId = null,
        [FromQuery] string? eventType = null)
    {
        try
        {
            var logs = await _auditLogger.GetAuditLogsAsync(from, to, userId, eventType);
            return Ok(new
            {
                logs = logs,
                count = logs.Count(),
                from = from,
                to = to
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audit logs");
            return StatusCode(500, new { error = "Failed to retrieve audit logs" });
        }
    }

    [HttpGet("audit/security-events")]
    public async Task<IActionResult> GetSecurityEvents(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] string? severity = null)
    {
        try
        {
            var events = await _auditLogger.GetSecurityEventsAsync(from, to, severity);
            return Ok(new
            {
                events = events,
                count = events.Count(),
                from = from,
                to = to
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve security events");
            return StatusCode(500, new { error = "Failed to retrieve security events" });
        }
    }

    #endregion

    #region API Key Management

    [HttpPost("apikey/generate")]
    public async Task<IActionResult> GenerateApiKey([FromBody] ApiKeyGenerationRequest request)
    {
        try
        {
            // In a real application, you'd get the user ID from the authenticated context
            var userId = request.UserId ?? "test-user";
            
            var apiKey = await _apiKeyService.GenerateApiKeyAsync(
                userId, 
                request.Name, 
                request.Scopes, 
                request.ExpiresAt);

            return Ok(new
            {
                message = "API key generated successfully",
                apiKey = new
                {
                    id = apiKey.Id,
                    name = apiKey.Name,
                    scopes = apiKey.Scopes,
                    createdAt = apiKey.CreatedAt,
                    expiresAt = apiKey.ExpiresAt,
                    key = apiKey.KeyHash // This is the actual key value
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate API key");
            return StatusCode(500, new { error = "Failed to generate API key" });
        }
    }

    [HttpPost("apikey/validate")]
    public async Task<IActionResult> ValidateApiKey([FromBody] ApiKeyValidationRequest request)
    {
        try
        {
            var result = await _apiKeyService.ValidateApiKeyWithDetailsAsync(
                request.ApiKey, 
                request.RequiredScopes);

            return Ok(new
            {
                isValid = result.IsValid,
                userId = result.UserId,
                grantedScopes = result.GrantedScopes,
                error = result.Error,
                errorMessage = result.ErrorMessage,
                validatedAt = result.ValidatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to validate API key");
            return StatusCode(500, new { error = "Failed to validate API key" });
        }
    }

    [HttpGet("apikey/user/{userId}")]
    public async Task<IActionResult> GetUserApiKeys(string userId)
    {
        try
        {
            var apiKeys = await _apiKeyService.GetUserApiKeysAsync(userId);
            return Ok(new
            {
                apiKeys = apiKeys,
                count = apiKeys.Count()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user API keys");
            return StatusCode(500, new { error = "Failed to get user API keys" });
        }
    }

    [HttpDelete("apikey/{apiKeyId}")]
    public async Task<IActionResult> RevokeApiKey(string apiKeyId, [FromQuery] string userId)
    {
        try
        {
            var success = await _apiKeyService.RevokeApiKeyAsync(apiKeyId, userId);
            if (success)
            {
                return Ok(new { message = "API key revoked successfully" });
            }
            return BadRequest(new { error = "Failed to revoke API key" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to revoke API key");
            return StatusCode(500, new { error = "Failed to revoke API key" });
        }
    }

    #endregion

    #region Encryption

    [HttpPost("encryption/encrypt")]
    public async Task<IActionResult> EncryptText([FromBody] EncryptionRequest request)
    {
        try
        {
            var encrypted = await _encryptionService.EncryptAsync(request.Text, request.KeyId);
            return Ok(new
            {
                message = "Text encrypted successfully",
                encrypted = encrypted,
                keyId = request.KeyId ?? "default"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to encrypt text");
            return StatusCode(500, new { error = "Failed to encrypt text" });
        }
    }

    [HttpPost("encryption/decrypt")]
    public async Task<IActionResult> DecryptText([FromBody] DecryptionRequest request)
    {
        try
        {
            var decrypted = await _encryptionService.DecryptAsync(request.EncryptedText, request.KeyId);
            return Ok(new
            {
                message = "Text decrypted successfully",
                decrypted = decrypted,
                keyId = request.KeyId ?? "default"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt text");
            return StatusCode(500, new { error = "Failed to decrypt text" });
        }
    }

    [HttpPost("encryption/generate-key")]
    public async Task<IActionResult> GenerateEncryptionKey([FromBody] EncryptionKeyRequest request)
    {
        try
        {
            var keyId = await _encryptionService.GenerateKeyAsync(request.KeyName, request.KeySize);
            return Ok(new
            {
                message = "Encryption key generated successfully",
                keyId = keyId,
                keyName = request.KeyName,
                keySize = request.KeySize
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate encryption key");
            return StatusCode(500, new { error = "Failed to generate encryption key" });
        }
    }

    [HttpGet("encryption/keys")]
    public async Task<IActionResult> GetEncryptionKeys()
    {
        try
        {
            var keys = await _encryptionService.GetAllKeysAsync();
            return Ok(new
            {
                keys = keys,
                count = keys.Count()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get encryption keys");
            return StatusCode(500, new { error = "Failed to get encryption keys" });
        }
    }

    #endregion

    private string GetClientIpAddress()
    {
        return Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
               Request.Headers["X-Real-IP"].FirstOrDefault() ??
               HttpContext.Connection.RemoteIpAddress?.ToString() ??
               "unknown";
    }
}

#region Request Models

public class AuditRequestRequest
{
    public string? UserId { get; set; }
    public string? Body { get; set; }
    public string? SessionId { get; set; }
    public string? CorrelationId { get; set; }
}

public class SecurityEventRequest
{
    public string EventType { get; set; } = string.Empty;
    public string Severity { get; set; } = "Medium";
    public string Description { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public Dictionary<string, object>? Details { get; set; }
    public bool RequiresImmediateAction { get; set; }
    public string? RecommendedAction { get; set; }
}

public class ApiKeyValidationRequest
{
    public string ApiKey { get; set; } = string.Empty;
    public string[] RequiredScopes { get; set; } = Array.Empty<string>();
}

public class EncryptionRequest
{
    public string Text { get; set; } = string.Empty;
    public string? KeyId { get; set; }
}

public class DecryptionRequest
{
    public string EncryptedText { get; set; } = string.Empty;
    public string? KeyId { get; set; }
}

public class EncryptionKeyRequest
{
    public string KeyName { get; set; } = string.Empty;
    public int KeySize { get; set; } = 256;
}

#endregion


