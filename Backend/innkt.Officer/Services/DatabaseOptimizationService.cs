using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using innkt.Officer.Data;
using System.Diagnostics;

namespace innkt.Officer.Services
{
    public interface IDatabaseOptimizationService
    {
        Task<QueryPerformanceStats> AnalyzeQueryPerformanceAsync();
        Task<List<SlowQuery>> GetSlowQueriesAsync(int limit = 10);
        Task<DatabaseStats> GetDatabaseStatsAsync();
        Task OptimizeDatabaseAsync();
        Task CreateIndexesAsync();
        Task UpdateStatisticsAsync();
        Task VacuumDatabaseAsync();
        Task<ConnectionPoolStats> GetConnectionPoolStatsAsync();
    }

    public class DatabaseOptimizationService : IDatabaseOptimizationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DatabaseOptimizationService> _logger;
        private readonly ICacheService _cacheService;

        public DatabaseOptimizationService(
            ApplicationDbContext context,
            ILogger<DatabaseOptimizationService> logger,
            ICacheService cacheService)
        {
            _context = context;
            _logger = logger;
            _cacheService = cacheService;
        }

        public async Task<QueryPerformanceStats> AnalyzeQueryPerformanceAsync()
        {
            try
            {
                var stats = new QueryPerformanceStats
                {
                    AnalysisTime = DateTime.UtcNow,
                    TotalQueries = 0,
                    AverageExecutionTime = 0,
                    SlowQueries = 0,
                    FastQueries = 0,
                    QueryTypes = new Dictionary<string, int>()
                };

                // This would typically query database performance views
                // For PostgreSQL: pg_stat_statements
                // For SQL Server: sys.dm_exec_query_stats
                // For now, we'll return mock data

                _logger.LogInformation("Query performance analysis completed");
                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing query performance");
                return new QueryPerformanceStats();
            }
        }

        public async Task<List<SlowQuery>> GetSlowQueriesAsync(int limit = 10)
        {
            try
            {
                var slowQueries = new List<SlowQuery>();

                // This would typically query database performance views
                // For PostgreSQL: pg_stat_statements
                // For SQL Server: sys.dm_exec_query_stats
                // For now, we'll return mock data

                _logger.LogInformation($"Retrieved {slowQueries.Count} slow queries");
                return slowQueries;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting slow queries");
                return new List<SlowQuery>();
            }
        }

        public async Task<DatabaseStats> GetDatabaseStatsAsync()
        {
            try
            {
                var stats = new DatabaseStats
                {
                    AnalysisTime = DateTime.UtcNow,
                    TotalTables = 0,
                    TotalIndexes = 0,
                    TotalSize = 0,
                    IndexSize = 0,
                    TableStats = new List<TableStats>(),
                    IndexStats = new List<IndexStats>()
                };

                // Get table statistics
                var tables = await _context.Database.GetDbConnection().QueryAsync<TableStats>(@"
                    SELECT 
                        schemaname as SchemaName,
                        tablename as TableName,
                        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as Size,
                        pg_total_relation_size(schemaname||'.'||tablename) as SizeBytes,
                        n_tup_ins as Inserts,
                        n_tup_upd as Updates,
                        n_tup_del as Deletes,
                        n_live_tup as LiveTuples,
                        n_dead_tup as DeadTuples
                    FROM pg_stat_user_tables
                    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                ");

                stats.TableStats = tables.ToList();
                stats.TotalTables = stats.TableStats.Count;
                stats.TotalSize = stats.TableStats.Sum(t => t.SizeBytes);

                // Get index statistics
                var indexes = await _context.Database.GetDbConnection().QueryAsync<IndexStats>(@"
                    SELECT 
                        schemaname as SchemaName,
                        indexname as IndexName,
                        tablename as TableName,
                        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as Size,
                        pg_relation_size(schemaname||'.'||indexname) as SizeBytes,
                        idx_scan as Scans,
                        idx_tup_read as TuplesRead,
                        idx_tup_fetch as TuplesFetched
                    FROM pg_stat_user_indexes
                    ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
                ");

                stats.IndexStats = indexes.ToList();
                stats.TotalIndexes = stats.IndexStats.Count;
                stats.IndexSize = stats.IndexStats.Sum(i => i.SizeBytes);

                _logger.LogInformation("Database statistics retrieved successfully");
                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting database statistics");
                return new DatabaseStats();
            }
        }

        public async Task OptimizeDatabaseAsync()
        {
            try
            {
                _logger.LogInformation("Starting database optimization");

                // Update statistics
                await UpdateStatisticsAsync();

                // Create missing indexes
                await CreateIndexesAsync();

                // Vacuum database
                await VacuumDatabaseAsync();

                _logger.LogInformation("Database optimization completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing database");
                throw;
            }
        }

        public async Task CreateIndexesAsync()
        {
            try
            {
                _logger.LogInformation("Creating database indexes");

                var indexes = new[]
                {
                    // User indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_verified ON users(is_verified)",
                    
                    // Post indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_id ON posts(author_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at ON posts(created_at)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_group_id ON posts(group_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_is_public ON posts(is_public)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_likes_count ON posts(likes_count)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_comments_count ON posts(comments_count)",
                    
                    // Follow indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_id ON follows(following_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_created_at ON follows(created_at)",
                    
                    // Group indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_name ON groups(name)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_category ON groups(category)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_is_private ON groups(is_private)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_created_at ON groups(created_at)",
                    
                    // Group member indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_user_id ON group_members(user_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_role ON group_members(role)",
                    
                    // Comment indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id ON comments(post_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_id ON comments(author_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at ON comments(created_at)",
                    
                    // Like indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_post_id ON likes(post_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_user_id ON likes(user_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_created_at ON likes(created_at)",
                    
                    // Notification indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)",
                    
                    // Full-text search indexes
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_fts ON posts USING gin(to_tsvector('english', content))",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_bio_fts ON users USING gin(to_tsvector('english', bio))",
                    "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_description_fts ON groups USING gin(to_tsvector('english', description))"
                };

                foreach (var index in indexes)
                {
                    try
                    {
                        await _context.Database.ExecuteSqlRawAsync(index);
                        _logger.LogDebug($"Created index: {index}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Failed to create index: {index}");
                    }
                }

                _logger.LogInformation("Database indexes creation completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating database indexes");
                throw;
            }
        }

        public async Task UpdateStatisticsAsync()
        {
            try
            {
                _logger.LogInformation("Updating database statistics");

                await _context.Database.ExecuteSqlRawAsync("ANALYZE");
                
                _logger.LogInformation("Database statistics updated");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating database statistics");
                throw;
            }
        }

        public async Task VacuumDatabaseAsync()
        {
            try
            {
                _logger.LogInformation("Starting database vacuum");

                // Vacuum analyze for better performance
                await _context.Database.ExecuteSqlRawAsync("VACUUM ANALYZE");
                
                _logger.LogInformation("Database vacuum completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error vacuuming database");
                throw;
            }
        }

        public async Task<ConnectionPoolStats> GetConnectionPoolStatsAsync()
        {
            try
            {
                var stats = new ConnectionPoolStats
                {
                    AnalysisTime = DateTime.UtcNow,
                    ActiveConnections = 0,
                    IdleConnections = 0,
                    TotalConnections = 0,
                    MaxConnections = 0,
                    ConnectionWaitTime = 0
                };

                // This would typically query connection pool statistics
                // For now, we'll return mock data

                _logger.LogInformation("Connection pool statistics retrieved");
                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connection pool statistics");
                return new ConnectionPoolStats();
            }
        }

        // Utility methods for query optimization
        public async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, int maxRetries = 3)
        {
            var retryCount = 0;
            while (retryCount < maxRetries)
            {
                try
                {
                    return await operation();
                }
                catch (Exception ex) when (retryCount < maxRetries - 1)
                {
                    retryCount++;
                    _logger.LogWarning(ex, $"Operation failed, retrying ({retryCount}/{maxRetries})");
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, retryCount))); // Exponential backoff
                }
            }
            throw new InvalidOperationException($"Operation failed after {maxRetries} retries");
        }

        public async Task<T> ExecuteWithTimeoutAsync<T>(Func<Task<T>> operation, TimeSpan timeout)
        {
            using var cts = new CancellationTokenSource(timeout);
            try
            {
                return await operation();
            }
            catch (OperationCanceledException)
            {
                throw new TimeoutException($"Operation timed out after {timeout.TotalSeconds} seconds");
            }
        }

        public async Task<T> ExecuteWithMetricsAsync<T>(Func<Task<T>> operation, string operationName)
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                var result = await operation();
                stopwatch.Stop();
                
                _logger.LogInformation($"Operation '{operationName}' completed in {stopwatch.ElapsedMilliseconds}ms");
                return result;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                _logger.LogError(ex, $"Operation '{operationName}' failed after {stopwatch.ElapsedMilliseconds}ms");
                throw;
            }
        }
    }

    // Data models for database optimization
    public class QueryPerformanceStats
    {
        public DateTime AnalysisTime { get; set; }
        public int TotalQueries { get; set; }
        public double AverageExecutionTime { get; set; }
        public int SlowQueries { get; set; }
        public int FastQueries { get; set; }
        public Dictionary<string, int> QueryTypes { get; set; } = new();
    }

    public class SlowQuery
    {
        public string Query { get; set; } = string.Empty;
        public double ExecutionTime { get; set; }
        public int CallCount { get; set; }
        public long TotalTime { get; set; }
        public DateTime LastExecuted { get; set; }
    }

    public class DatabaseStats
    {
        public DateTime AnalysisTime { get; set; }
        public int TotalTables { get; set; }
        public int TotalIndexes { get; set; }
        public long TotalSize { get; set; }
        public long IndexSize { get; set; }
        public List<TableStats> TableStats { get; set; } = new();
        public List<IndexStats> IndexStats { get; set; } = new();
    }

    public class TableStats
    {
        public string SchemaName { get; set; } = string.Empty;
        public string TableName { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public long Inserts { get; set; }
        public long Updates { get; set; }
        public long Deletes { get; set; }
        public long LiveTuples { get; set; }
        public long DeadTuples { get; set; }
    }

    public class IndexStats
    {
        public string SchemaName { get; set; } = string.Empty;
        public string IndexName { get; set; } = string.Empty;
        public string TableName { get; set; } = string.Empty;
        public string Size { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public long Scans { get; set; }
        public long TuplesRead { get; set; }
        public long TuplesFetched { get; set; }
    }

    public class ConnectionPoolStats
    {
        public DateTime AnalysisTime { get; set; }
        public int ActiveConnections { get; set; }
        public int IdleConnections { get; set; }
        public int TotalConnections { get; set; }
        public int MaxConnections { get; set; }
        public double ConnectionWaitTime { get; set; }
    }
}
