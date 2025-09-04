namespace innkt.NeuroSpark.Services;

public interface IApiKeyService
{
    Task<ApiKey> GenerateApiKeyAsync(string userId, string name, string[] scopes, DateTime? expiresAt = null);
    Task<bool> ValidateApiKeyAsync(string apiKey, string[] requiredScopes);
    Task<ApiKeyValidationResult> ValidateApiKeyWithDetailsAsync(string apiKey, string[] requiredScopes);
    Task<bool> RevokeApiKeyAsync(string apiKeyId, string userId);
    Task<IEnumerable<ApiKey>> GetUserApiKeysAsync(string userId);
    Task<ApiKey?> GetApiKeyAsync(string apiKeyId);
    Task<bool> UpdateApiKeyScopesAsync(string apiKeyId, string userId, string[] newScopes);
    Task<bool> ExtendApiKeyExpiryAsync(string apiKeyId, string userId, DateTime newExpiry);
    Task<ApiKeyUsageStats> GetApiKeyUsageStatsAsync(string apiKeyId, DateTime from, DateTime to);
}

public class ApiKey
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string KeyHash { get; set; } = string.Empty;
    public string[] Scopes { get; set; } = Array.Empty<string>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class ApiKeyValidationResult
{
    public bool IsValid { get; set; }
    public string? UserId { get; set; }
    public string[]? GrantedScopes { get; set; }
    public string? ErrorMessage { get; set; }
    public ApiKeyValidationError? Error { get; set; }
    public DateTime ValidatedAt { get; set; } = DateTime.UtcNow;
}

public enum ApiKeyValidationError
{
    None,
    InvalidKey,
    Expired,
    Revoked,
    InsufficientScopes,
    UserNotFound,
    KeyNotFound
}

public class ApiKeyUsageStats
{
    public string ApiKeyId { get; set; } = string.Empty;
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int TotalRequests { get; set; }
    public int SuccessfulRequests { get; set; }
    public int FailedRequests { get; set; }
    public double AverageResponseTime { get; set; }
    public Dictionary<string, int> EndpointUsage { get; set; } = new();
    public Dictionary<string, int> ErrorCounts { get; set; } = new();
    public DateTime LastUsed { get; set; }
}

public class ApiKeyGenerationRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string[] Scopes { get; set; } = Array.Empty<string>();
    public DateTime? ExpiresAt { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class ApiKeyUpdateRequest
{
    public string[]? Scopes { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Description { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
