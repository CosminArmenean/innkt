using StackExchange.Redis;

namespace innkt.NeuroSpark.Services;

public interface IRedisConnectionPool
{
    /// <summary>
    /// Gets a Redis connection from the pool
    /// </summary>
    IConnectionMultiplexer GetConnection();
    
    /// <summary>
    /// Gets a Redis database instance
    /// </summary>
    IDatabase GetDatabase(int database = -1);
    
    /// <summary>
    /// Gets Redis server information
    /// </summary>
    IServer GetServer(string host, int port);
    
    /// <summary>
    /// Gets connection pool statistics
    /// </summary>
    Task<RedisPoolStats> GetPoolStatsAsync();
    
    /// <summary>
    /// Checks if the connection pool is healthy
    /// </summary>
    Task<bool> IsHealthyAsync();
    
    /// <summary>
    /// Performs connection pool maintenance
    /// </summary>
    Task PerformMaintenanceAsync();
}

public class RedisPoolStats
{
    public int ActiveConnections { get; set; }
    public int IdleConnections { get; set; }
    public int TotalConnections { get; set; }
    public TimeSpan Uptime { get; set; }
    public long TotalOperations { get; set; }
    public double AverageResponseTime { get; set; }
    public int ErrorCount { get; set; }
    public DateTime LastUpdated { get; set; }
    public Dictionary<string, object> CustomMetrics { get; set; } = new();
}



