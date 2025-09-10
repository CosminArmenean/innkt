using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;
using System.Collections.Concurrent;

namespace innkt.Officer.Services
{
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key);
        Task SetAsync<T>(string key, T value, TimeSpan? expiry = null);
        Task<bool> RemoveAsync(string key);
        Task<bool> ExistsAsync(string key);
        Task<long> IncrementAsync(string key, long value = 1);
        Task<long> DecrementAsync(string key, long value = 1);
        Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null);
        Task<List<T>> GetListAsync<T>(string key);
        Task SetListAsync<T>(string key, List<T> values, TimeSpan? expiry = null);
        Task AddToListAsync<T>(string key, T value, TimeSpan? expiry = null);
        Task RemoveFromListAsync<T>(string key, T value);
        Task<Dictionary<string, T>> GetHashAsync<T>(string key);
        Task SetHashAsync<T>(string key, Dictionary<string, T> values, TimeSpan? expiry = null);
        Task SetHashFieldAsync<T>(string key, string field, T value, TimeSpan? expiry = null);
        Task<T?> GetHashFieldAsync<T>(string key, string field);
        Task<bool> RemoveHashFieldAsync(string key, string field);
        Task<List<string>> GetKeysAsync(string pattern);
        Task<bool> ExpireAsync(string key, TimeSpan expiry);
        Task<TimeSpan?> GetExpiryAsync(string key);
        Task FlushDatabaseAsync();
        Task<CacheStats> GetStatsAsync();
    }

    public class CacheService : ICacheService
    {
        private readonly IDatabase _database;
        private readonly ILogger<CacheService> _logger;
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _semaphores;
        private readonly JsonSerializerOptions _jsonOptions;

        // Cache key prefixes (Identity only)
        public const string USER_PREFIX = "user:";
        public const string SESSION_PREFIX = "session:";
        public const string NOTIFICATION_PREFIX = "notification:";
        public const string VERIFICATION_PREFIX = "verification:";
        public const string MFA_PREFIX = "mfa:";
        public const string KID_ACCOUNT_PREFIX = "kid:";
        public const string JOINT_ACCOUNT_PREFIX = "joint:";

        // Cache expiry times
        public static readonly TimeSpan USER_CACHE_EXPIRY = TimeSpan.FromMinutes(30);
        public static readonly TimeSpan SESSION_CACHE_EXPIRY = TimeSpan.FromHours(24);
        public static readonly TimeSpan NOTIFICATION_CACHE_EXPIRY = TimeSpan.FromMinutes(5);
        public static readonly TimeSpan VERIFICATION_CACHE_EXPIRY = TimeSpan.FromMinutes(15);
        public static readonly TimeSpan MFA_CACHE_EXPIRY = TimeSpan.FromMinutes(10);
        public static readonly TimeSpan KID_ACCOUNT_CACHE_EXPIRY = TimeSpan.FromMinutes(20);
        public static readonly TimeSpan JOINT_ACCOUNT_CACHE_EXPIRY = TimeSpan.FromMinutes(20);

        public CacheService(IDatabase database, ILogger<CacheService> logger)
        {
            _database = database;
            _logger = logger;
            _semaphores = new ConcurrentDictionary<string, SemaphoreSlim>();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };
        }

        public async Task<T?> GetAsync<T>(string key)
        {
            try
            {
                var value = await _database.StringGetAsync(key);
                if (!value.HasValue)
                {
                    _logger.LogDebug($"Cache miss for key: {key}");
                    return default(T);
                }

                var result = JsonSerializer.Deserialize<T>(value!, _jsonOptions);
                _logger.LogDebug($"Cache hit for key: {key}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache value for key: {key}");
                return default(T);
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            try
            {
                var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
                await _database.StringSetAsync(key, serializedValue, expiry);
                _logger.LogDebug($"Cache set for key: {key} with expiry: {expiry}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting cache value for key: {key}");
            }
        }

        public async Task<bool> RemoveAsync(string key)
        {
            try
            {
                var result = await _database.KeyDeleteAsync(key);
                _logger.LogDebug($"Cache removed for key: {key}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing cache value for key: {key}");
                return false;
            }
        }

        public async Task<bool> ExistsAsync(string key)
        {
            try
            {
                return await _database.KeyExistsAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking cache existence for key: {key}");
                return false;
            }
        }

        public async Task<long> IncrementAsync(string key, long value = 1)
        {
            try
            {
                return await _database.StringIncrementAsync(key, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error incrementing cache value for key: {key}");
                return 0;
            }
        }

        public async Task<long> DecrementAsync(string key, long value = 1)
        {
            try
            {
                return await _database.StringDecrementAsync(key, value);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error decrementing cache value for key: {key}");
                return 0;
            }
        }

        public async Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
        {
            try
            {
                // Try to get from cache first
                var cachedValue = await GetAsync<T>(key);
                if (cachedValue != null)
                {
                    return cachedValue;
                }

                // Use semaphore to prevent multiple threads from executing the same factory
                var semaphore = _semaphores.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
                await semaphore.WaitAsync();

                try
                {
                    // Double-check after acquiring semaphore
                    cachedValue = await GetAsync<T>(key);
                    if (cachedValue != null)
                    {
                        return cachedValue;
                    }

                    // Execute factory and cache result
                    var value = await factory();
                    if (value != null)
                    {
                        await SetAsync(key, value, expiry);
                    }
                    return value;
                }
                finally
                {
                    semaphore.Release();
                    _semaphores.TryRemove(key, out _);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in GetOrSet for key: {key}");
                return default(T);
            }
        }

        public async Task<List<T>> GetListAsync<T>(string key)
        {
            try
            {
                var values = await _database.ListRangeAsync(key);
                var result = new List<T>();
                
                foreach (var value in values)
                {
                    if (value.HasValue)
                    {
                        var item = JsonSerializer.Deserialize<T>(value!, _jsonOptions);
                        if (item != null)
                        {
                            result.Add(item);
                        }
                    }
                }

                _logger.LogDebug($"Cache list retrieved for key: {key}, count: {result.Count}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache list for key: {key}");
                return new List<T>();
            }
        }

        public async Task SetListAsync<T>(string key, List<T> values, TimeSpan? expiry = null)
        {
            try
            {
                // Remove existing list
                await _database.KeyDeleteAsync(key);

                if (values.Count > 0)
                {
                    var serializedValues = values.Select(v => (RedisValue)JsonSerializer.Serialize(v, _jsonOptions)).ToArray();
                    await _database.ListRightPushAsync(key, serializedValues);
                    
                    if (expiry.HasValue)
                    {
                        await _database.KeyExpireAsync(key, expiry.Value);
                    }
                }

                _logger.LogDebug($"Cache list set for key: {key}, count: {values.Count}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting cache list for key: {key}");
            }
        }

        public async Task AddToListAsync<T>(string key, T value, TimeSpan? expiry = null)
        {
            try
            {
                var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
                await _database.ListRightPushAsync(key, serializedValue);
                
                if (expiry.HasValue)
                {
                    await _database.KeyExpireAsync(key, expiry.Value);
                }

                _logger.LogDebug($"Cache list item added for key: {key}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error adding to cache list for key: {key}");
            }
        }

        public async Task RemoveFromListAsync<T>(string key, T value)
        {
            try
            {
                var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
                await _database.ListRemoveAsync(key, serializedValue);
                _logger.LogDebug($"Cache list item removed for key: {key}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing from cache list for key: {key}");
            }
        }

        public async Task<Dictionary<string, T>> GetHashAsync<T>(string key)
        {
            try
            {
                var hashFields = await _database.HashGetAllAsync(key);
                var result = new Dictionary<string, T>();

                foreach (var field in hashFields)
                {
                    if (field.Value.HasValue)
                    {
                        var value = JsonSerializer.Deserialize<T>(field.Value!, _jsonOptions);
                        if (value != null)
                        {
                            result[field.Name] = value;
                        }
                    }
                }

                _logger.LogDebug($"Cache hash retrieved for key: {key}, fields: {result.Count}");
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache hash for key: {key}");
                return new Dictionary<string, T>();
            }
        }

        public async Task SetHashAsync<T>(string key, Dictionary<string, T> values, TimeSpan? expiry = null)
        {
            try
            {
                var hashFields = values.Select(kvp => new HashEntry(kvp.Key, JsonSerializer.Serialize(kvp.Value, _jsonOptions))).ToArray();
                await _database.HashSetAsync(key, hashFields);
                
                if (expiry.HasValue)
                {
                    await _database.KeyExpireAsync(key, expiry.Value);
                }

                _logger.LogDebug($"Cache hash set for key: {key}, fields: {values.Count}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting cache hash for key: {key}");
            }
        }

        public async Task SetHashFieldAsync<T>(string key, string field, T value, TimeSpan? expiry = null)
        {
            try
            {
                var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
                await _database.HashSetAsync(key, field, serializedValue);
                
                if (expiry.HasValue)
                {
                    await _database.KeyExpireAsync(key, expiry.Value);
                }

                _logger.LogDebug($"Cache hash field set for key: {key}, field: {field}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting cache hash field for key: {key}, field: {field}");
            }
        }

        public async Task<T?> GetHashFieldAsync<T>(string key, string field)
        {
            try
            {
                var value = await _database.HashGetAsync(key, field);
                if (!value.HasValue)
                {
                    return default(T);
                }

                return JsonSerializer.Deserialize<T>(value!, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache hash field for key: {key}, field: {field}");
                return default(T);
            }
        }

        public async Task<bool> RemoveHashFieldAsync(string key, string field)
        {
            try
            {
                return await _database.HashDeleteAsync(key, field);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing cache hash field for key: {key}, field: {field}");
                return false;
            }
        }

        public async Task<List<string>> GetKeysAsync(string pattern)
        {
            try
            {
                var server = _database.Multiplexer.GetServer(_database.Multiplexer.GetEndPoints().First());
                var keys = server.Keys(pattern: pattern);
                return keys.Select(k => k.ToString()).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache keys for pattern: {pattern}");
                return new List<string>();
            }
        }

        public async Task<bool> ExpireAsync(string key, TimeSpan expiry)
        {
            try
            {
                return await _database.KeyExpireAsync(key, expiry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting cache expiry for key: {key}");
                return false;
            }
        }

        public async Task<TimeSpan?> GetExpiryAsync(string key)
        {
            try
            {
                return await _database.KeyTimeToLiveAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache expiry for key: {key}");
                return null;
            }
        }

        public async Task FlushDatabaseAsync()
        {
            try
            {
                var server = _database.Multiplexer.GetServer(_database.Multiplexer.GetEndPoints().First());
                await server.FlushDatabaseAsync();
                _logger.LogInformation("Cache database flushed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error flushing cache database");
            }
        }

        public async Task<CacheStats> GetStatsAsync()
        {
            try
            {
                var server = _database.Multiplexer.GetServer(_database.Multiplexer.GetEndPoints().First());
                var info = await server.InfoAsync();
                
                // Flatten the grouped info into a dictionary
                var infoDict = info.SelectMany(g => g).ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
                
                var stats = new CacheStats
                {
                    ConnectedClients = infoDict.GetValueOrDefault("connected_clients", "0"),
                    UsedMemory = infoDict.GetValueOrDefault("used_memory_human", "0"),
                    TotalKeys = infoDict.GetValueOrDefault("db0", "0")?.Split(',').FirstOrDefault()?.Split('=').LastOrDefault() ?? "0",
                    HitRate = "0%", // Would need to calculate from keyspace_hits and keyspace_misses
                    Uptime = infoDict.GetValueOrDefault("uptime_in_seconds", "0")
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cache stats");
                return new CacheStats();
            }
        }

        // Utility methods for common cache operations (Identity only)
        public string GetUserKey(string userId) => $"{USER_PREFIX}{userId}";
        public string GetSessionKey(string sessionId) => $"{SESSION_PREFIX}{sessionId}";
        public string GetNotificationKey(string userId) => $"{NOTIFICATION_PREFIX}{userId}";
        public string GetVerificationKey(string token) => $"{VERIFICATION_PREFIX}{token}";
        public string GetMfaKey(string userId) => $"{MFA_PREFIX}{userId}";
        public string GetKidAccountKey(string userId) => $"{KID_ACCOUNT_PREFIX}{userId}";
        public string GetJointAccountKey(string accountId) => $"{JOINT_ACCOUNT_PREFIX}{accountId}";

        public void Dispose()
        {
            foreach (var semaphore in _semaphores.Values)
            {
                semaphore.Dispose();
            }
            _semaphores.Clear();
        }
    }

    public class CacheStats
    {
        public string ConnectedClients { get; set; } = "0";
        public string UsedMemory { get; set; } = "0";
        public string TotalKeys { get; set; } = "0";
        public string HitRate { get; set; } = "0%";
        public string Uptime { get; set; } = "0";
    }
}
