using Microsoft.AspNetCore.Mvc;
using innkt.Officer.Services;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace innkt.Officer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceAuthController : ControllerBase
{
    private readonly ILogger<ServiceAuthController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IRedisService _redisService;
    private readonly string _serviceSecretKey;

    public ServiceAuthController(
        ILogger<ServiceAuthController> logger,
        IConfiguration configuration,
        IRedisService redisService)
    {
        _logger = logger;
        _configuration = configuration;
        _redisService = redisService;
        _serviceSecretKey = _configuration["ServiceAuth:SecretKey"] ?? "officer-service-secret-key-2025";
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateServiceToken([FromBody] ServiceTokenValidationRequest request)
    {
        try
        {
            _logger.LogDebug("Validating service token");
            
            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { Error = "Token is required" });
            }

            // Check cache first
            var cacheKey = $"service_validation:{request.Token}";
            var cachedResult = await _redisService.GetAsync<ServiceAuthResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogDebug("Service validation result found in cache");
                return Ok(cachedResult);
            }

            // Validate the service token
            var authResult = await ValidateServiceTokenAsync(request.Token);
            
            if (authResult.IsAuthenticated)
            {
                // Cache the result for 5 minutes
                await _redisService.SetAsync(cacheKey, authResult, TimeSpan.FromMinutes(5));
                _logger.LogInformation("Service token validated successfully: {ServiceId}", authResult.ServiceId);
            }
            else
            {
                _logger.LogWarning("Service token validation failed: {Error}", authResult.ErrorMessage);
            }

            return Ok(authResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating service token");
            return StatusCode(500, new { Error = "Internal server error" });
        }
    }

    [HttpPost("validateuser")]
    public async Task<IActionResult> ValidateUserToken([FromBody] UserTokenValidationRequest request)
    {
        try
        {
            _logger.LogDebug("Validating user token");
            
            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { Error = "Token is required" });
            }

            // Check cache first
            var cacheKey = $"user_validation:{request.Token}";
            var cachedResult = await _redisService.GetAsync<ServiceAuthResult>(cacheKey);
            if (cachedResult != null)
            {
                _logger.LogDebug("User validation result found in cache");
                return Ok(cachedResult);
            }

            // Validate the user token (this would integrate with your existing JWT validation)
            var authResult = await ValidateUserTokenAsync(request.Token);
            
            if (authResult.IsAuthenticated)
            {
                // Cache the result for 10 minutes
                await _redisService.SetAsync(cacheKey, authResult, TimeSpan.FromMinutes(10));
                _logger.LogInformation("User token validated successfully: {UserId}", authResult.UserId);
            }
            else
            {
                _logger.LogWarning("User token validation failed: {Error}", authResult.ErrorMessage);
            }

            return Ok(authResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating user token");
            return StatusCode(500, new { Error = "Internal server error" });
        }
    }

    [HttpPost("checkauthorization")]
    public async Task<IActionResult> CheckUserAuthorization([FromBody] AuthorizationCheckRequest request)
    {
        try
        {
            _logger.LogDebug("Checking user authorization for user {UserId}, operation {Operation}", request.UserId, request.Operation);
            
            if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.Operation))
            {
                return BadRequest(new { Error = "UserId and Operation are required" });
            }

            // Check cache first
            var cacheKey = $"user_auth:{request.UserId}:{request.Operation}";
            var cachedResult = await _redisService.GetAsync<bool?>(cacheKey);
            if (cachedResult.HasValue)
            {
                _logger.LogDebug("User authorization result found in cache");
                return Ok(new { IsAuthorized = cachedResult.Value });
            }

            // Check user authorization (this would integrate with your existing authorization system)
            var isAuthorized = await CheckUserAuthorizationAsync(request.UserId, request.Operation);
            
            // Cache the result for 15 minutes
            await _redisService.SetAsync(cacheKey, isAuthorized, TimeSpan.FromMinutes(15));
            
            _logger.LogInformation("User authorization check completed: {UserId} -> {Operation} = {IsAuthorized}", 
                request.UserId, request.Operation, isAuthorized);
            
            return Ok(new { IsAuthorized = isAuthorized });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user authorization");
            return StatusCode(500, new { Error = "Internal server error" });
        }
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetServiceAuthHealth()
    {
        try
        {
            var health = new
            {
                Status = "Healthy",
                Service = "Officer Service Authentication",
                Timestamp = DateTime.UtcNow,
                RedisConnected = await _redisService.GetCacheSizeAsync() >= 0
            };
            
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting service auth health");
            return StatusCode(500, new { Error = "Health check failed" });
        }
    }

    private async Task<ServiceAuthResult> ValidateServiceTokenAsync(string token)
    {
        try
        {
            // Decode the token
            var decodedToken = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = decodedToken.Split('.');
            
            if (parts.Length != 2)
            {
                return new ServiceAuthResult
                {
                    IsAuthenticated = false,
                    ErrorMessage = "Invalid token format"
                };
            }

            var payload = parts[0];
            var signature = parts[1];

            // Verify signature
            var expectedSignature = GenerateSignature(payload, _serviceSecretKey);
            if (!signature.Equals(expectedSignature, StringComparison.OrdinalIgnoreCase))
            {
                return new ServiceAuthResult
                {
                    IsAuthenticated = false,
                    ErrorMessage = "Invalid signature"
                };
            }

            // Parse payload
            var tokenData = JsonSerializer.Deserialize<ServiceTokenData>(payload);
            if (tokenData == null)
            {
                return new ServiceAuthResult
                {
                    IsAuthenticated = false,
                    ErrorMessage = "Invalid token payload"
                };
            }

            // Check expiration
            if (tokenData.ExpiresAt <= DateTime.UtcNow)
            {
                return new ServiceAuthResult
                {
                    IsAuthenticated = false,
                    ErrorMessage = "Token expired"
                };
            }

            return new ServiceAuthResult
            {
                IsAuthenticated = true,
                ServiceId = tokenData.ServiceId,
                ExpiresAt = tokenData.ExpiresAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating service token");
            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "Token validation error"
            };
        }
    }

    private async Task<ServiceAuthResult> ValidateUserTokenAsync(string token)
    {
        try
        {
            // This would integrate with your existing JWT validation
            // For now, return a placeholder implementation
            
            // TODO: Implement actual JWT validation
            var authResult = new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "User token validation not yet implemented"
            };

            return authResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating user token");
            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "User token validation error"
            };
        }
    }

    private async Task<bool> CheckUserAuthorizationAsync(string userId, string operation)
    {
        try
        {
            // This would integrate with your existing authorization system
            // For now, return a placeholder implementation
            
            // TODO: Implement actual authorization check
            _logger.LogWarning("User authorization check not yet implemented for user {UserId}, operation {Operation}", userId, operation);
            
            return false; // Fail secure
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user authorization");
            return false; // Fail secure
        }
    }

    private string GenerateSignature(string payload, string secretKey)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }
}

public class ServiceTokenValidationRequest
{
    public string Token { get; set; } = string.Empty;
}

public class UserTokenValidationRequest
{
    public string Token { get; set; } = string.Empty;
}

public class AuthorizationCheckRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Operation { get; set; } = string.Empty;
}

public class ServiceAuthResult
{
    public bool IsAuthenticated { get; set; }
    public string ServiceId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
}

public class ServiceTokenData
{
    public string ServiceId { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}


