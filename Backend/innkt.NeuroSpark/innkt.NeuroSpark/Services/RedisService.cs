using StackExchange.Redis;
using System.Text.Json;

namespace innkt.NeuroSpark.Services;

public class RedisService : IRedisService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;
    private readonly ILogger<RedisService> _logger;
    private readonly string _instanceName;

    public RedisService(IConnectionMultiplexer redis, ILogger<RedisService> logger, IConfiguration configuration)
    {
        _redis = redis;
        _database = redis.GetDatabase();
        _logger = logger;
        _instanceName = configuration["Redis:InstanceName"] ?? "NeuroSpark";
    }

    public async Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var serializedValue = JsonSerializer.Serialize(value);
            var result = await _database.StringSetAsync(fullKey, serializedValue, expiry);
            
            if (result)
            {
                _logger.LogDebug("Successfully set key {Key} in Redis", fullKey);
            }
            else
            {
                _logger.LogWarning("Failed to set key {Key} in Redis", fullKey);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting key {Key} in Redis", key);
            return false;
        }
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var value = await _database.StringGetAsync(fullKey);
            
            if (value.HasValue)
            {
                var result = JsonSerializer.Deserialize<T>(value!);
                _logger.LogDebug("Successfully retrieved key {Key} from Redis", fullKey);
                return result;
            }
            
            _logger.LogDebug("Key {Key} not found in Redis", fullKey);
            return default;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving key {Key} from Redis", key);
            return default;
        }
    }

    public async Task<bool> DeleteAsync(string key)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var result = await _database.KeyDeleteAsync(fullKey);
            
            if (result)
            {
                _logger.LogDebug("Successfully deleted key {Key} from Redis", fullKey);
            }
            else
            {
                _logger.LogDebug("Key {Key} not found in Redis for deletion", fullKey);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting key {Key} from Redis", key);
            return false;
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var result = await _database.KeyExistsAsync(fullKey);
            _logger.LogDebug("Key {Key} exists in Redis: {Exists}", fullKey, result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking existence of key {Key} in Redis", key);
            return false;
        }
    }

    public async Task<TimeSpan?> GetTimeToLiveAsync(string key)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var ttl = await _database.KeyTimeToLiveAsync(fullKey);
            _logger.LogDebug("TTL for key {Key}: {TTL}", fullKey, ttl);
            return ttl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting TTL for key {Key} from Redis", key);
            return null;
        }
    }

    public async Task<bool> SetExpiryAsync(string key, TimeSpan expiry)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var result = await _database.KeyExpireAsync(fullKey, expiry);
            
            if (result)
            {
                _logger.LogDebug("Successfully set expiry {Expiry} for key {Key} in Redis", expiry, fullKey);
            }
            else
            {
                _logger.LogWarning("Failed to set expiry for key {Key} in Redis", fullKey);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting expiry for key {Key} in Redis", key);
            return false;
        }
    }

    public async Task<long> IncrementAsync(string key, long value = 1)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var result = await _database.StringIncrementAsync(fullKey, value);
            _logger.LogDebug("Incremented key {Key} by {Value} to {Result} in Redis", fullKey, value, result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing key {Key} in Redis", key);
            return 0;
        }
    }

    public async Task<double> IncrementAsync(string key, double value = 1.0)
    {
        try
        {
            var fullKey = $"{_instanceName}:{key}";
            var result = await _database.StringIncrementAsync(fullKey, value);
            _logger.LogDebug("Incremented key {Key} by {Value} to {Result} in Redis", fullKey, value, result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing key {Key} in Redis", key);
            return 0.0;
        }
    }

    public async Task<string[]> GetKeysAsync(string pattern)
    {
        try
        {
            var fullPattern = $"{_instanceName}:{pattern}";
            var keys = new List<string>();
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            
            await foreach (var key in server.KeysAsync(pattern: fullPattern))
            {
                keys.Add(key.ToString());
            }
            
            _logger.LogDebug("Found {Count} keys matching pattern {Pattern} in Redis", keys.Count, fullPattern);
            return keys.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting keys for pattern {Pattern} from Redis", pattern);
            return Array.Empty<string>();
        }
    }

    public async Task<bool> ClearCacheAsync()
    {
        try
        {
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var keys = await GetKeysAsync("*");
            var deletedCount = 0;
            
            foreach (var key in keys)
            {
                if (await DeleteAsync(key))
                {
                    deletedCount++;
                }
            }
            
            _logger.LogInformation("Cleared {Count} keys from Redis cache", deletedCount);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing Redis cache");
            return false;
        }
    }

    public async Task<long> GetCacheSizeAsync()
    {
        try
        {
            var keys = await GetKeysAsync("*");
            var size = keys.Length;
            _logger.LogDebug("Redis cache size: {Size} keys", size);
            return size;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Redis cache size");
            return 0;
        }
    }

    public async Task<Dictionary<string, string>> GetCacheStatsAsync()
    {
        try
        {
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var info = await server.InfoAsync();
            
            var stats = new Dictionary<string, string>();
            foreach (var group in info)
            {
                foreach (var entry in group)
                {
                    stats[$"{group.Key}.{entry.Key}"] = entry.Value;
                }
            }
            
            _logger.LogDebug("Retrieved Redis cache statistics");
            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Redis cache statistics");
            return new Dictionary<string, string>();
        }
    }
}


