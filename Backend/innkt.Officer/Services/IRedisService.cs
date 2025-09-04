using StackExchange.Redis;

namespace innkt.Officer.Services;

public interface IRedisService
{
    Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null);
    Task<T?> GetAsync<T>(string key);
    Task<bool> DeleteAsync(string key);
    Task<bool> ExistsAsync(string key);
    Task<TimeSpan?> GetTimeToLiveAsync(string key);
    Task<bool> SetExpiryAsync(string key, TimeSpan expiry);
    Task<long> IncrementAsync(string key, long value = 1);
    Task<double> IncrementAsync(string key, double value = 1.0);
    Task<string[]> GetKeysAsync(string pattern);
    Task<bool> ClearCacheAsync();
    Task<long> GetCacheSizeAsync();
    Task<Dictionary<string, string>> GetCacheStatsAsync();
}


