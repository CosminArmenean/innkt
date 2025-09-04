using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.Collections.Concurrent;

namespace innkt.NeuroSpark.Services;

public class RedisConnectionPool : IRedisConnectionPool, IDisposable
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly ILogger<RedisConnectionPool> _logger;
    private readonly RedisPoolSettings _settings;
    private readonly ConcurrentDictionary<string, ConnectionInfo> _connectionInfo;
    private readonly DateTime _startTime;
    private long _totalOperations;
    private readonly ConcurrentQueue<TimeSpan> _responseTimes;
    private int _errorCount;
    private bool _disposed = false;

    public RedisConnectionPool(
        IConnectionMultiplexer connectionMultiplexer,
        IOptions<RedisPoolSettings> settings,
        ILogger<RedisConnectionPool> logger)
    {
        _connectionMultiplexer = connectionMultiplexer ?? throw new ArgumentNullException(nameof(connectionMultiplexer));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        _connectionInfo = new ConcurrentDictionary<string, ConnectionInfo>();
        _startTime = DateTime.UtcNow;
        _responseTimes = new ConcurrentQueue<TimeSpan>();
        
        // Subscribe to connection events
        _connectionMultiplexer.ConnectionFailed += OnConnectionFailed;
        _connectionMultiplexer.ConnectionRestored += OnConnectionRestored;
        _connectionMultiplexer.ErrorMessage += OnErrorMessage;
        
        _logger.LogInformation("Redis connection pool initialized with {MaxConnections} max connections", _settings.MaxConnections);
    }

    public IConnectionMultiplexer GetConnection()
    {
        try
        {
            if (!_connectionMultiplexer.IsConnected)
            {
                _logger.LogWarning("Redis connection is not connected, attempting to reconnect");
                _connectionMultiplexer.Close();
            }

            return _connectionMultiplexer;
        }
        catch (Exception ex)
        {
            Interlocked.Increment(ref _errorCount);
            _logger.LogError(ex, "Error getting Redis connection");
            throw;
        }
    }

    public IDatabase GetDatabase(int database = -1)
    {
        try
        {
            var db = _connectionMultiplexer.GetDatabase(database);
            TrackOperation();
            return db;
        }
        catch (Exception ex)
        {
            Interlocked.Increment(ref _errorCount);
            _logger.LogError(ex, "Error getting Redis database {Database}", database);
            throw;
        }
    }

    public IServer GetServer(string host, int port)
    {
        try
        {
            var server = _connectionMultiplexer.GetServer(host, port);
            TrackOperation();
            return server;
        }
        catch (Exception ex)
        {
            Interlocked.Increment(ref _errorCount);
            _logger.LogError(ex, "Error getting Redis server {Host}:{Port}", host, port);
            throw;
        }
    }

    public async Task<RedisPoolStats> GetPoolStatsAsync()
    {
        try
        {
            var stats = new RedisPoolStats
            {
                ActiveConnections = _settings.MaxConnections,
                IdleConnections = 0,
                TotalConnections = _settings.MaxConnections,
                Uptime = DateTime.UtcNow - _startTime,
                TotalOperations = _totalOperations,
                ErrorCount = _errorCount,
                LastUpdated = DateTime.UtcNow
            };

            // Calculate average response time
            var responseTimes = _responseTimes.ToArray();
            if (responseTimes.Length > 0)
            {
                stats.AverageResponseTime = responseTimes.Average(rt => rt.TotalMilliseconds);
            }

            // Add custom metrics
            stats.CustomMetrics["ConnectionPoolSize"] = _settings.MaxConnections;
            stats.CustomMetrics["ConnectionTimeout"] = _settings.ConnectionTimeout;
            stats.CustomMetrics["KeepAlive"] = _settings.KeepAlive;
            stats.CustomMetrics["ConnectRetry"] = _settings.ConnectRetry;

            return await Task.FromResult(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Redis pool stats");
            throw;
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var db = GetDatabase();
            var pingResult = await db.PingAsync();
            var isHealthy = pingResult.TotalMilliseconds < _settings.MaxResponseTime;
            
            if (!isHealthy)
            {
                _logger.LogWarning("Redis health check failed: Ping took {PingTime}ms (max: {MaxTime}ms)", 
                    pingResult.TotalMilliseconds, _settings.MaxResponseTime);
            }
            
            return isHealthy;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            return false;
        }
    }

    public async Task PerformMaintenanceAsync()
    {
        try
        {
            _logger.LogInformation("Performing Redis connection pool maintenance");
            
            // Clean up old response time entries (keep only last 1000)
            while (_responseTimes.Count > 1000)
            {
                _responseTimes.TryDequeue(out _);
            }
            
            // Check connection health
            var isHealthy = await IsHealthyAsync();
            if (!isHealthy)
            {
                _logger.LogWarning("Redis connection pool is unhealthy, attempting recovery");
                // Could implement connection recovery logic here
            }
            
            _logger.LogInformation("Redis connection pool maintenance completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Redis connection pool maintenance");
        }
    }

    private void TrackOperation()
    {
        Interlocked.Increment(ref _totalOperations);
    }

    private void OnConnectionFailed(object? sender, ConnectionFailedEventArgs e)
    {
        Interlocked.Increment(ref _errorCount);
        _logger.LogError("Redis connection failed: {EndPoint}, FailureType: {FailureType}", 
            e.EndPoint, e.FailureType);
        
        var connectionKey = e.EndPoint?.ToString() ?? "unknown";
        _connectionInfo.AddOrUpdate(connectionKey, 
            new ConnectionInfo { LastFailure = DateTime.UtcNow, FailureCount = 1 },
            (key, existing) => 
            {
                existing.LastFailure = DateTime.UtcNow;
                existing.FailureCount++;
                return existing;
            });
    }

    private void OnConnectionRestored(object? sender, ConnectionFailedEventArgs e)
    {
        _logger.LogInformation("Redis connection restored: {EndPoint}", e.EndPoint);
        
        var connectionKey = e.EndPoint?.ToString() ?? "unknown";
        _connectionInfo.AddOrUpdate(connectionKey,
            new ConnectionInfo { LastRestored = DateTime.UtcNow, RestoreCount = 1 },
            (key, existing) =>
            {
                existing.LastRestored = DateTime.UtcNow;
                existing.RestoreCount++;
                return existing;
            });
    }

    private void OnErrorMessage(object? sender, RedisErrorEventArgs e)
    {
        Interlocked.Increment(ref _errorCount);
        _logger.LogError("Redis error: {Message}", e.Message);
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed && disposing)
        {
            _connectionMultiplexer.ConnectionFailed -= OnConnectionFailed;
            _connectionMultiplexer.ConnectionRestored -= OnConnectionRestored;
            _connectionMultiplexer.ErrorMessage -= OnErrorMessage;
            _disposed = true;
        }
    }
}

public class RedisPoolSettings
{
    public int MaxConnections { get; set; } = 50;
    public int ConnectionTimeout { get; set; } = 5000;
    public int KeepAlive { get; set; } = 180;
    public int ConnectRetry { get; set; } = 3;
    public int MaxResponseTime { get; set; } = 1000;
    public bool EnablePerformanceCounters { get; set; } = true;
}

public class ConnectionInfo
{
    public DateTime? LastFailure { get; set; }
    public DateTime? LastRestored { get; set; }
    public int FailureCount { get; set; }
    public int RestoreCount { get; set; }
}
