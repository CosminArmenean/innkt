using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceAuthController : ControllerBase
{
    private readonly IServiceAuthService _authService;
    private readonly ILogger<ServiceAuthController> _logger;

    public ServiceAuthController(
        IServiceAuthService authService,
        ILogger<ServiceAuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpGet("credentials")]
    public async Task<IActionResult> GetServiceCredentials()
    {
        try
        {
            var credentials = await _authService.GetServiceCredentialsAsync();
            
            if (credentials.IsAuthenticated)
            {
                return Ok(new
                {
                    ServiceId = credentials.ServiceId,
                    ExpiresAt = credentials.ExpiresAt,
                    Timestamp = DateTime.UtcNow
                });
            }
            else
            {
                return Unauthorized(new { Error = "Failed to get service credentials" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting service credentials");
            return StatusCode(500, new { Error = "Internal server error" });
        }
    }

    [HttpPost("generate-token")]
    public async Task<IActionResult> GenerateServiceToken()
    {
        try
        {
            var token = await _authService.GenerateServiceTokenAsync();
            
            return Ok(new
            {
                Token = token,
                TokenType = "Service",
                ExpiresIn = "24 hours",
                GeneratedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating service token");
            return StatusCode(500, new { Error = "Internal server error" });
        }
    }

    [HttpPost("validate-signature")]
    public async Task<IActionResult> ValidateSignature([FromBody] SignatureValidationRequest request)
    {
        try
        {
            var isValid = await _authService.ValidateServiceSignatureAsync(request.Payload, request.Signature);
            
            return Ok(new
            {
                IsValid = isValid,
                ValidatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating signature");
            return StatusCode(500, new { Error = "Internal server error" });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetAuthStatus()
    {
        try
        {
            var credentials = await _authService.GetServiceCredentialsAsync();
            
            var status = new
            {
                ServiceId = credentials.ServiceId,
                IsAuthenticated = credentials.IsAuthenticated,
                ExpiresAt = credentials.ExpiresAt,
                IsExpired = credentials.ExpiresAt <= DateTime.UtcNow,
                Timestamp = DateTime.UtcNow
            };
            
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting authentication status");
            return StatusCode(500, new { Error = "Internal server error" });
        }
    }

    [HttpPost("test-connection")]
    public async Task<IActionResult> TestOfficerConnection()
    {
        try
        {
            // Generate a test token and try to validate it
            var testToken = await _authService.GenerateServiceTokenAsync();
            var authResult = await _authService.AuthenticateServiceAsync(testToken);
            
            var connectionStatus = new
            {
                OfficerServiceReachable = authResult.IsAuthenticated,
                TestTokenGenerated = !string.IsNullOrEmpty(testToken),
                LastTested = DateTime.UtcNow,
                Details = authResult.IsAuthenticated ? "Connection successful" : authResult.ErrorMessage
            };
            
            return Ok(connectionStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing Officer service connection");
            return StatusCode(500, new { Error = "Connection test failed", Details = ex.Message });
        }
    }
}

public class SignatureValidationRequest
{
    public string Payload { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
}


