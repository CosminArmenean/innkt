using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Services;

public class ServiceAuthService : IServiceAuthService
{
    private readonly ILogger<ServiceAuthService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IRedisService _redisService;
    private readonly HttpClient _httpClient;
    private readonly string _officerServiceUrl;
    private readonly string _serviceId;
    private readonly string _secretKey;

    public ServiceAuthService(
        ILogger<ServiceAuthService> logger,
        IConfiguration configuration,
        IRedisService redisService,
        HttpClient httpClient)
    {
        _logger = logger;
        _configuration = configuration;
        _redisService = redisService;
        _httpClient = httpClient;
        
        _officerServiceUrl = _configuration["OfficerService:BaseUrl"] ?? "https://localhost:5003";
        _serviceId = _configuration["ServiceAuth:ServiceId"] ?? "NeuroSpark";
        _secretKey = _configuration["ServiceAuth:SecretKey"] ?? "neurospark-secret-key-2025";
    }

    public async Task<ServiceAuthResult> AuthenticateServiceAsync(string serviceToken)
    {
        try
        {
            _logger.LogDebug("Authenticating service with token: {TokenPrefix}...", serviceToken[..10]);
            
            // Check cache first
            var cacheKey = $"service_auth:{serviceToken}";
            var cachedResult = await _redisService.GetAsync<ServiceAuthResult>(cacheKey);
            if (cachedResult != null && cachedResult.ExpiresAt > DateTime.UtcNow)
            {
                _logger.LogDebug("Service authentication result found in cache");
                return cachedResult;
            }

            // Validate token with Officer service
            var authResult = await ValidateTokenWithOfficerAsync(serviceToken);
            
            if (authResult.IsAuthenticated)
            {
                // Cache the result for 5 minutes
                await _redisService.SetAsync(cacheKey, authResult, TimeSpan.FromMinutes(5));
                _logger.LogInformation("Service authenticated successfully: {ServiceId}", authResult.ServiceId);
            }
            else
            {
                _logger.LogWarning("Service authentication failed: {Error}", authResult.ErrorMessage);
            }

            return authResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during service authentication");
            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "Authentication service error"
            };
        }
    }

    public async Task<ServiceAuthResult> ValidateUserTokenAsync(string userToken)
    {
        try
        {
            _logger.LogDebug("Validating user token with Officer service");
            
            // Check cache first
            var cacheKey = $"user_auth:{userToken}";
            var cachedResult = await _redisService.GetAsync<ServiceAuthResult>(cacheKey);
            if (cachedResult != null && cachedResult.ExpiresAt > DateTime.UtcNow)
            {
                _logger.LogDebug("User authentication result found in cache");
                return cachedResult;
            }

            // Validate user token with Officer service
            var authResult = await ValidateUserTokenWithOfficerAsync(userToken);
            
            if (authResult.IsAuthenticated)
            {
                // Cache the result for 10 minutes
                await _redisService.SetAsync(cacheKey, authResult, TimeSpan.FromMinutes(10));
                _logger.LogInformation("User authenticated successfully: {UserId}", authResult.UserId);
            }
            else
            {
                _logger.LogWarning("User authentication failed: {Error}", authResult.ErrorMessage);
            }

            return authResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user token validation");
            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "User authentication service error"
            };
        }
    }

    public async Task<bool> IsUserAuthorizedAsync(string userId, string operation)
    {
        try
        {
            var cacheKey = $"user_auth:{userId}:{operation}";
            var cachedResult = await _redisService.GetAsync<bool?>(cacheKey);
            if (cachedResult.HasValue)
            {
                return cachedResult.Value;
            }

            // Check authorization with Officer service
            var isAuthorized = await CheckUserAuthorizationWithOfficerAsync(userId, operation);
            
            // Cache the result for 15 minutes
            await _redisService.SetAsync(cacheKey, isAuthorized, TimeSpan.FromMinutes(15));
            
            return isAuthorized;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user authorization for user {UserId}, operation {Operation}", userId, operation);
            return false; // Fail secure
        }
    }

    public async Task<ServiceAuthResult> GetServiceCredentialsAsync()
    {
        try
        {
            var cacheKey = "service_credentials";
            var cachedCredentials = await _redisService.GetAsync<ServiceCredentials>(cacheKey);
            if (cachedCredentials != null && cachedCredentials.ValidTo > DateTime.UtcNow)
            {
                return new ServiceAuthResult
                {
                    IsAuthenticated = true,
                    ServiceId = cachedCredentials.ServiceId,
                    ExpiresAt = cachedCredentials.ValidTo
                };
            }

            // Generate new service credentials
            var credentials = new ServiceCredentials
            {
                ServiceId = _serviceId,
                SecretKey = _secretKey,
                Issuer = "NeuroSpark",
                ValidFrom = DateTime.UtcNow,
                ValidTo = DateTime.UtcNow.AddDays(30)
            };

            // Cache credentials for 1 day
            await _redisService.SetAsync(cacheKey, credentials, TimeSpan.FromDays(1));

            return new ServiceAuthResult
            {
                IsAuthenticated = true,
                ServiceId = credentials.ServiceId,
                ExpiresAt = credentials.ValidTo
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting service credentials");
            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "Failed to get service credentials"
            };
        }
    }

    public async Task<bool> ValidateServiceSignatureAsync(string payload, string signature)
    {
        try
        {
            var expectedSignature = GenerateSignature(payload, _secretKey);
            var isValid = signature.Equals(expectedSignature, StringComparison.OrdinalIgnoreCase);
            
            _logger.LogDebug("Service signature validation: {IsValid}", isValid);
            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating service signature");
            return false;
        }
    }

    public async Task<string> GenerateServiceTokenAsync()
    {
        try
        {
            var tokenData = new
            {
                ServiceId = _serviceId,
                IssuedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };

            var jsonPayload = JsonSerializer.Serialize(tokenData);
            var signature = GenerateSignature(jsonPayload, _secretKey);
            
            var token = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{jsonPayload}.{signature}"));
            
            _logger.LogDebug("Generated service token for service: {ServiceId}", _serviceId);
            return token;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating service token");
            throw;
        }
    }

    private async Task<ServiceAuthResult> ValidateTokenWithOfficerAsync(string serviceToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_officerServiceUrl}/api/serviceauth/validate");
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { Token = serviceToken }),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request);
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ServiceAuthResult>(content);
                return result ?? new ServiceAuthResult { IsAuthenticated = false };
            }

            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = $"Officer service returned: {response.StatusCode}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error communicating with Officer service for token validation");
            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "Communication error with Officer service"
            };
        }
    }

    private async Task<ServiceAuthResult> ValidateUserTokenWithOfficerAsync(string userToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_officerServiceUrl}/api/serviceauth/validateuser");
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { Token = userToken }),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request);
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ServiceAuthResult>(content);
                return result ?? new ServiceAuthResult { IsAuthenticated = false };
            }

            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = $"Officer service returned: {response.StatusCode}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error communicating with Officer service for user token validation");
            return new ServiceAuthResult
            {
                IsAuthenticated = false,
                ErrorMessage = "Communication error with Officer service"
            };
        }
    }

    private async Task<bool> CheckUserAuthorizationWithOfficerAsync(string userId, string operation)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_officerServiceUrl}/api/serviceauth/checkauthorization");
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { UserId = userId, Operation = operation }),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.SendAsync(request);
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<AuthorizationResult>(content);
                return result?.IsAuthorized ?? false;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user authorization with Officer service");
            return false;
        }
    }

    private string GenerateSignature(string payload, string secretKey)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }

    private class AuthorizationResult
    {
        public bool IsAuthorized { get; set; }
    }
}


