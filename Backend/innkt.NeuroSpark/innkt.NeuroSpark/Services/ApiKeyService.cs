using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.Security.Cryptography;
using System.Text;

namespace innkt.NeuroSpark.Services;

public class ApiKeyService : IApiKeyService
{
    private readonly ILogger<ApiKeyService> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly ApiKeyServiceSettings _settings;
    private readonly string _apiKeysKey = "apikeys:";
    private readonly string _userApiKeysKey = "userapikeys:";
    private readonly string _apiKeyUsageKey = "apikeyusage:";

    public ApiKeyService(
        ILogger<ApiKeyService> logger,
        IConnectionMultiplexer redis,
        IOptions<ApiKeyServiceSettings> settings)
    {
        _logger = logger;
        _redis = redis;
        _settings = settings.Value;
    }

    public async Task<ApiKey> GenerateApiKeyAsync(string userId, string name, string[] scopes, DateTime? expiresAt = null)
    {
        try
        {
            // Generate a secure random API key
            var apiKeyValue = GenerateSecureApiKey();
            var keyHash = HashApiKey(apiKeyValue);
            
            var apiKey = new ApiKey
            {
                UserId = userId,
                Name = name,
                KeyHash = keyHash,
                Scopes = scopes,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var db = _redis.GetDatabase();
            
            // Store the API key
            var serialized = System.Text.Json.JsonSerializer.Serialize(apiKey);
            await db.StringSetAsync($"{_apiKeysKey}{apiKey.Id}", serialized, 
                expiresAt.HasValue ? expiresAt.Value - DateTime.UtcNow : null);
            
            // Add to user's API keys list
            await db.SetAddAsync($"{_userApiKeysKey}{userId}", apiKey.Id);
            
            // Store the actual API key value temporarily (this should be returned to user)
            var tempKey = $"tempkey:{apiKey.Id}";
            await db.StringSetAsync(tempKey, apiKeyValue, TimeSpan.FromMinutes(5));
            
            _logger.LogInformation("Generated API key {ApiKeyId} for user {UserId} with scopes: {Scopes}", 
                apiKey.Id, userId, string.Join(", ", scopes));
            
            // Set the actual key value for return (this is the only time the user sees it)
            apiKey.KeyHash = apiKeyValue; // Temporarily store the actual key for return
            
            return apiKey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate API key for user {UserId}", userId);
            throw;
        }
    }

    public async Task<bool> ValidateApiKeyAsync(string apiKey, string[] requiredScopes)
    {
        var result = await ValidateApiKeyWithDetailsAsync(apiKey, requiredScopes);
        return result.IsValid;
    }

    public async Task<ApiKeyValidationResult> ValidateApiKeyWithDetailsAsync(string apiKey, string[] requiredScopes)
    {
        try
        {
            var db = _redis.GetDatabase();
            var keyHash = HashApiKey(apiKey);
            
            // Find the API key by hash
            var apiKeyId = await FindApiKeyByHashAsync(keyHash);
            if (string.IsNullOrEmpty(apiKeyId))
            {
                return new ApiKeyValidationResult
                {
                    IsValid = false,
                    Error = ApiKeyValidationError.InvalidKey,
                    ErrorMessage = "Invalid API key"
                };
            }
            
            // Get the API key details
            var apiKeyData = await GetApiKeyAsync(apiKeyId);
            if (apiKeyData == null)
            {
                return new ApiKeyValidationResult
                {
                    IsValid = false,
                    Error = ApiKeyValidationError.KeyNotFound,
                    ErrorMessage = "API key not found"
                };
            }
            
            // Check if key is active
            if (!apiKeyData.IsActive)
            {
                return new ApiKeyValidationResult
                {
                    IsValid = false,
                    Error = ApiKeyValidationError.Revoked,
                    ErrorMessage = "API key has been revoked"
                };
            }
            
            // Check if key has expired
            if (apiKeyData.ExpiresAt.HasValue && apiKeyData.ExpiresAt.Value < DateTime.UtcNow)
            {
                return new ApiKeyValidationResult
                {
                    IsValid = false,
                    Error = ApiKeyValidationError.Expired,
                    ErrorMessage = "API key has expired"
                };
            }
            
            // Check if user exists (this would typically check against a user service)
            // For now, we'll assume the user exists if we have a valid API key
            
            // Check scopes
            if (!HasRequiredScopes(apiKeyData.Scopes, requiredScopes))
            {
                return new ApiKeyValidationResult
                {
                    IsValid = false,
                    Error = ApiKeyValidationError.InsufficientScopes,
                    ErrorMessage = "Insufficient scopes for this operation"
                };
            }
            
            // Update last used timestamp
            await UpdateLastUsedAsync(apiKeyId);
            
            // Log usage
            await LogApiKeyUsageAsync(apiKeyId, true, null);
            
            return new ApiKeyValidationResult
            {
                IsValid = true,
                UserId = apiKeyData.UserId,
                GrantedScopes = apiKeyData.Scopes,
                Error = ApiKeyValidationError.None
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating API key");
            return new ApiKeyValidationResult
            {
                IsValid = false,
                Error = ApiKeyValidationError.InvalidKey,
                ErrorMessage = "Error validating API key"
            };
        }
    }

    public async Task<bool> RevokeApiKeyAsync(string apiKeyId, string userId)
    {
        try
        {
            var db = _redis.GetDatabase();
            
            // Get the API key to verify ownership
            var apiKey = await GetApiKeyAsync(apiKeyId);
            if (apiKey == null || apiKey.UserId != userId)
            {
                return false;
            }
            
            // Mark as inactive
            apiKey.IsActive = false;
            var serialized = System.Text.Json.JsonSerializer.Serialize(apiKey);
            await db.StringSetAsync($"{_apiKeysKey}{apiKeyId}", serialized);
            
            _logger.LogInformation("Revoked API key {ApiKeyId} for user {UserId}", apiKeyId, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to revoke API key {ApiKeyId}", apiKeyId);
            return false;
        }
    }

    public async Task<IEnumerable<ApiKey>> GetUserApiKeysAsync(string userId)
    {
        try
        {
            var db = _redis.GetDatabase();
            var apiKeyIds = await db.SetMembersAsync($"{_userApiKeysKey}{userId}");
            var apiKeys = new List<ApiKey>();
            
            foreach (var id in apiKeyIds)
            {
                var apiKey = await GetApiKeyAsync(id.ToString());
                if (apiKey != null)
                {
                    // Don't expose the actual key hash
                    apiKey.KeyHash = "[HIDDEN]";
                    apiKeys.Add(apiKey);
                }
            }
            
            return apiKeys.OrderByDescending(k => k.CreatedAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get API keys for user {UserId}", userId);
            return Enumerable.Empty<ApiKey>();
        }
    }

    public async Task<ApiKey?> GetApiKeyAsync(string apiKeyId)
    {
        try
        {
            var db = _redis.GetDatabase();
            var serialized = await db.StringGetAsync($"{_apiKeysKey}{apiKeyId}");
            
            if (serialized.IsNull)
                return null;
            
            return System.Text.Json.JsonSerializer.Deserialize<ApiKey>(serialized!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get API key {ApiKeyId}", apiKeyId);
            return null;
        }
    }

    public async Task<bool> UpdateApiKeyScopesAsync(string apiKeyId, string userId, string[] newScopes)
    {
        try
        {
            var apiKey = await GetApiKeyAsync(apiKeyId);
            if (apiKey == null || apiKey.UserId != userId)
            {
                return false;
            }
            
            apiKey.Scopes = newScopes;
            var db = _redis.GetDatabase();
            var serialized = System.Text.Json.JsonSerializer.Serialize(apiKey);
            await db.StringSetAsync($"{_apiKeysKey}{apiKeyId}", serialized);
            
            _logger.LogInformation("Updated scopes for API key {ApiKeyId}: {Scopes}", 
                apiKeyId, string.Join(", ", newScopes));
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update scopes for API key {ApiKeyId}", apiKeyId);
            return false;
        }
    }

    public async Task<bool> ExtendApiKeyExpiryAsync(string apiKeyId, string userId, DateTime newExpiry)
    {
        try
        {
            var apiKey = await GetApiKeyAsync(apiKeyId);
            if (apiKey == null || apiKey.UserId != userId)
            {
                return false;
            }
            
            apiKey.ExpiresAt = newExpiry;
            var db = _redis.GetDatabase();
            var serialized = System.Text.Json.JsonSerializer.Serialize(apiKey);
            await db.StringSetAsync($"{_apiKeysKey}{apiKeyId}", serialized, 
                newExpiry - DateTime.UtcNow);
            
            _logger.LogInformation("Extended expiry for API key {ApiKeyId} to {NewExpiry}", 
                apiKeyId, newExpiry);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extend expiry for API key {ApiKeyId}", apiKeyId);
            return false;
        }
    }

    public async Task<ApiKeyUsageStats> GetApiKeyUsageStatsAsync(string apiKeyId, DateTime from, DateTime to)
    {
        try
        {
            var db = _redis.GetDatabase();
            var usageKey = $"{_apiKeyUsageKey}{apiKeyId}";
            var usageData = await db.ListRangeAsync(usageKey);
            
            var stats = new ApiKeyUsageStats
            {
                ApiKeyId = apiKeyId,
                From = from,
                To = to,
                EndpointUsage = new Dictionary<string, int>(),
                ErrorCounts = new Dictionary<string, int>()
            };
            
            foreach (var data in usageData)
            {
                try
                {
                    var usage = System.Text.Json.JsonSerializer.Deserialize<ApiKeyUsage>(data!);
                    if (usage != null && usage.Timestamp >= from && usage.Timestamp <= to)
                    {
                        stats.TotalRequests++;
                        if (usage.Success)
                            stats.SuccessfulRequests++;
                        else
                            stats.FailedRequests++;
                        
                        // Track endpoint usage
                        if (stats.EndpointUsage.ContainsKey(usage.Endpoint))
                            stats.EndpointUsage[usage.Endpoint]++;
                        else
                            stats.EndpointUsage[usage.Endpoint] = 1;
                        
                        // Track errors
                        if (!usage.Success && !string.IsNullOrEmpty(usage.ErrorMessage))
                        {
                            if (stats.ErrorCounts.ContainsKey(usage.ErrorMessage))
                                stats.ErrorCounts[usage.ErrorMessage]++;
                            else
                                stats.ErrorCounts[usage.ErrorMessage] = 1;
                        }
                        
                        // Update last used
                        if (usage.Timestamp > stats.LastUsed)
                            stats.LastUsed = usage.Timestamp;
                    }
                }
                catch
                {
                    // Skip invalid entries
                    continue;
                }
            }
            
            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get usage stats for API key {ApiKeyId}", apiKeyId);
            return new ApiKeyUsageStats
            {
                ApiKeyId = apiKeyId,
                From = from,
                To = to
            };
        }
    }

    private string GenerateSecureApiKey()
    {
        var bytes = new byte[_settings.KeyLength];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(bytes);
        }
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    private string HashApiKey(string apiKey)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(apiKey));
            return Convert.ToBase64String(hashBytes);
        }
    }

    private async Task<string?> FindApiKeyByHashAsync(string keyHash)
    {
        // This is a simplified implementation. In production, you'd want to index by hash
        // For now, we'll search through all API keys (not efficient for large datasets)
        var db = _redis.GetDatabase();
        var pattern = $"{_apiKeysKey}*";
        var keys = db.Multiplexer.GetServer(db.Multiplexer.GetEndPoints().First()).Keys(pattern: pattern);
        
        foreach (var key in keys)
        {
            var serialized = await db.StringGetAsync(key);
            if (!serialized.IsNull)
            {
                var apiKey = System.Text.Json.JsonSerializer.Deserialize<ApiKey>(serialized!);
                if (apiKey?.KeyHash == keyHash)
                {
                    return apiKey.Id;
                }
            }
        }
        
        return null;
    }

    private bool HasRequiredScopes(string[] grantedScopes, string[] requiredScopes)
    {
        if (requiredScopes.Length == 0)
            return true;
        
        return requiredScopes.All(required => grantedScopes.Contains(required));
    }

    private async Task UpdateLastUsedAsync(string apiKeyId)
    {
        try
        {
            var apiKey = await GetApiKeyAsync(apiKeyId);
            if (apiKey != null)
            {
                apiKey.LastUsedAt = DateTime.UtcNow;
                var db = _redis.GetDatabase();
                var serialized = System.Text.Json.JsonSerializer.Serialize(apiKey);
                await db.StringSetAsync($"{_apiKeysKey}{apiKeyId}", serialized);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update last used for API key {ApiKeyId}", apiKeyId);
        }
    }

    private async Task LogApiKeyUsageAsync(string apiKeyId, bool success, string? errorMessage)
    {
        try
        {
            var usage = new ApiKeyUsage
            {
                ApiKeyId = apiKeyId,
                Timestamp = DateTime.UtcNow,
                Success = success,
                ErrorMessage = errorMessage,
                Endpoint = "unknown" // This should be set by the calling code
            };
            
            var db = _redis.GetDatabase();
            var serialized = System.Text.Json.JsonSerializer.Serialize(usage);
            var usageKey = $"{_apiKeyUsageKey}{apiKeyId}";
            
            await db.ListRightPushAsync(usageKey, serialized);
            await db.KeyExpireAsync(usageKey, TimeSpan.FromDays(_settings.UsageRetentionDays));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log API key usage for {ApiKeyId}", apiKeyId);
        }
    }
}

public class ApiKeyUsage
{
    public string ApiKeyId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public TimeSpan? ResponseTime { get; set; }
}

public class ApiKeyServiceSettings
{
    public int KeyLength { get; set; } = 32;
    public int UsageRetentionDays { get; set; } = 90;
    public bool EnableUsageTracking { get; set; } = true;
}



