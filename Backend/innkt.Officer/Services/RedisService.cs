using StackExchange.Redis;
using System.Text.Json;

namespace innkt.Officer.Services;

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
        _instanceName = configuration["Redis:InstanceName"] ?? "Officer";
    }

    public async Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        try
        {
            var serializedValue = JsonSerializer.Serialize(value);
            var result = await _database.StringSetAsync(key, serializedValue, expiry);
            
            if (result)
            {
                _logger.LogDebug("Successfully set key {Key} in Redis", key);
            }
            else
            {
                _logger.LogWarning("Failed to set key {Key} in Redis", key);
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
            var value = await _database.StringGetAsync(key);
            
            if (value.HasValue)
            {
                var result = JsonSerializer.Deserialize<T>(value!);
                _logger.LogDebug("Successfully retrieved key {Key} from Redis", key);
                return result;
            }
            
            _logger.LogDebug("Key {Key} not found in Redis", key);
            return default;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting key {Key} from Redis", key);
            return default;
        }
    }

    public async Task<bool> DeleteAsync(string key)
    {
        try
        {
            var result = await _database.KeyDeleteAsync(key);
            
            if (result)
            {
                _logger.LogDebug("Successfully deleted key {Key} from Redis", key);
            }
            else
            {
                _logger.LogDebug("Key {Key} not found in Redis for deletion", key);
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
            var result = await _database.KeyExistsAsync(key);
            _logger.LogDebug("Key {Key} exists in Redis: {Exists}", key, result);
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
            var ttl = await _database.KeyTimeToLiveAsync(key);
            _logger.LogDebug("TTL for key {Key}: {Ttl}", key, ttl);
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
            var result = await _database.KeyExpireAsync(key, expiry);
            _logger.LogDebug("Set expiry for key {Key} to {Expiry}: {Result}", key, expiry, result);
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
            var result = await _database.StringIncrementAsync(key, value);
            _logger.LogDebug("Incremented key {Key} by {Value} to {Result}", key, value, result);
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
            var result = await _database.StringIncrementAsync(key, value);
            _logger.LogDebug("Incremented key {Key} by {Value} to {Result}", key, value, result);
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
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var keys = server.Keys(pattern: pattern).Select(k => k.ToString()).ToArray();
            
            _logger.LogDebug("Retrieved {Count} keys matching pattern {Pattern}", keys.Length, pattern);
            return keys;
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
            var keys = server.Keys(pattern: $"{_instanceName}*").ToArray();
            
            if (keys.Length == 0)
            {
                _logger.LogInformation("No keys to clear for instance {InstanceName}", _instanceName);
                return true;
            }
            
            var deletedCount = 0;
            foreach (var key in keys)
            {
                if (await _database.KeyDeleteAsync(key))
                {
                    deletedCount++;
                }
            }
            
            _logger.LogInformation("Cleared {DeletedCount} out of {TotalCount} keys for instance {InstanceName}", 
                deletedCount, keys.Length, _instanceName);
            
            return deletedCount == keys.Length;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache for instance {InstanceName}", _instanceName);
            return false;
        }
    }

    public async Task<long> GetCacheSizeAsync()
    {
        try
        {
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            var keys = server.Keys(pattern: $"{_instanceName}*").ToArray();
            
            _logger.LogDebug("Cache size for instance {InstanceName}: {Size}", _instanceName, keys.Length);
            return keys.Length;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache size for instance {InstanceName}", _instanceName);
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
            
            _logger.LogDebug("Retrieved Redis statistics: {Count} entries", stats.Count);
            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Redis statistics");
            return new Dictionary<string, string>();
        }
    }
}


