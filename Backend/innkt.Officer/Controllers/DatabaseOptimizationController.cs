using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Officer.Services;
using innkt.Common.Models;
using System.Security.Claims;

namespace innkt.Officer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DatabaseOptimizationController : ControllerBase
    {
        private readonly ILogger<DatabaseOptimizationController> _logger;
        private readonly IDatabaseOptimizationService _dbOptimizationService;
        private readonly ICacheService _cacheService;

        public DatabaseOptimizationController(
            ILogger<DatabaseOptimizationController> logger,
            IDatabaseOptimizationService dbOptimizationService,
            ICacheService cacheService)
        {
            _logger = logger;
            _dbOptimizationService = dbOptimizationService;
            _cacheService = cacheService;
        }

        /// <summary>
        /// Get database performance statistics
        /// </summary>
        [HttpGet("performance")]
        public async Task<ActionResult<ApiResponse<QueryPerformanceStats>>> GetQueryPerformance()
        {
            try
            {
                var stats = await _dbOptimizationService.AnalyzeQueryPerformanceAsync();

                return Ok(new ApiResponse<QueryPerformanceStats>
                {
                    Success = true,
                    Data = stats,
                    Message = "Query performance statistics retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting query performance statistics");
                return StatusCode(500, new ApiResponse<QueryPerformanceStats>
                {
                    Success = false,
                    Message = "Failed to get query performance statistics"
                });
            }
        }

        /// <summary>
        /// Get slow queries
        /// </summary>
        [HttpGet("slow-queries")]
        public async Task<ActionResult<ApiResponse<List<SlowQuery>>>> GetSlowQueries([FromQuery] int limit = 10)
        {
            try
            {
                var slowQueries = await _dbOptimizationService.GetSlowQueriesAsync(limit);

                return Ok(new ApiResponse<List<SlowQuery>>
                {
                    Success = true,
                    Data = slowQueries,
                    Message = $"Retrieved {slowQueries.Count} slow queries"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting slow queries");
                return StatusCode(500, new ApiResponse<List<SlowQuery>>
                {
                    Success = false,
                    Message = "Failed to get slow queries"
                });
            }
        }

        /// <summary>
        /// Get database statistics
        /// </summary>
        [HttpGet("stats")]
        public async Task<ActionResult<ApiResponse<DatabaseStats>>> GetDatabaseStats()
        {
            try
            {
                var stats = await _dbOptimizationService.GetDatabaseStatsAsync();

                return Ok(new ApiResponse<DatabaseStats>
                {
                    Success = true,
                    Data = stats,
                    Message = "Database statistics retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting database statistics");
                return StatusCode(500, new ApiResponse<DatabaseStats>
                {
                    Success = false,
                    Message = "Failed to get database statistics"
                });
            }
        }

        /// <summary>
        /// Get connection pool statistics
        /// </summary>
        [HttpGet("connection-pool")]
        public async Task<ActionResult<ApiResponse<ConnectionPoolStats>>> GetConnectionPoolStats()
        {
            try
            {
                var stats = await _dbOptimizationService.GetConnectionPoolStatsAsync();

                return Ok(new ApiResponse<ConnectionPoolStats>
                {
                    Success = true,
                    Data = stats,
                    Message = "Connection pool statistics retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connection pool statistics");
                return StatusCode(500, new ApiResponse<ConnectionPoolStats>
                {
                    Success = false,
                    Message = "Failed to get connection pool statistics"
                });
            }
        }

        /// <summary>
        /// Optimize database (create indexes, update statistics, vacuum)
        /// </summary>
        [HttpPost("optimize")]
        public async Task<ActionResult<ApiResponse<object>>> OptimizeDatabase()
        {
            try
            {
                await _dbOptimizationService.OptimizeDatabaseAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Database optimization completed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing database");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Database optimization failed"
                });
            }
        }

        /// <summary>
        /// Create database indexes
        /// </summary>
        [HttpPost("indexes")]
        public async Task<ActionResult<ApiResponse<object>>> CreateIndexes()
        {
            try
            {
                await _dbOptimizationService.CreateIndexesAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Database indexes created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating database indexes");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to create database indexes"
                });
            }
        }

        /// <summary>
        /// Update database statistics
        /// </summary>
        [HttpPost("statistics")]
        public async Task<ActionResult<ApiResponse<object>>> UpdateStatistics()
        {
            try
            {
                await _dbOptimizationService.UpdateStatisticsAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Database statistics updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating database statistics");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to update database statistics"
                });
            }
        }

        /// <summary>
        /// Vacuum database
        /// </summary>
        [HttpPost("vacuum")]
        public async Task<ActionResult<ApiResponse<object>>> VacuumDatabase()
        {
            try
            {
                await _dbOptimizationService.VacuumDatabaseAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Database vacuum completed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error vacuuming database");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Database vacuum failed"
                });
            }
        }

        /// <summary>
        /// Get cache statistics
        /// </summary>
        [HttpGet("cache/stats")]
        public async Task<ActionResult<ApiResponse<CacheStats>>> GetCacheStats()
        {
            try
            {
                var stats = await _cacheService.GetStatsAsync();

                return Ok(new ApiResponse<CacheStats>
                {
                    Success = true,
                    Data = stats,
                    Message = "Cache statistics retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cache statistics");
                return StatusCode(500, new ApiResponse<CacheStats>
                {
                    Success = false,
                    Message = "Failed to get cache statistics"
                });
            }
        }

        /// <summary>
        /// Get cache keys by pattern
        /// </summary>
        [HttpGet("cache/keys")]
        public async Task<ActionResult<ApiResponse<List<string>>>> GetCacheKeys([FromQuery] string pattern = "*")
        {
            try
            {
                var keys = await _cacheService.GetKeysAsync(pattern);

                return Ok(new ApiResponse<List<string>>
                {
                    Success = true,
                    Data = keys,
                    Message = $"Retrieved {keys.Count} cache keys matching pattern '{pattern}'"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache keys for pattern: {pattern}");
                return StatusCode(500, new ApiResponse<List<string>>
                {
                    Success = false,
                    Message = "Failed to get cache keys"
                });
            }
        }

        /// <summary>
        /// Remove cache key
        /// </summary>
        [HttpDelete("cache/{key}")]
        public async Task<ActionResult<ApiResponse<object>>> RemoveCacheKey(string key)
        {
            try
            {
                var removed = await _cacheService.RemoveAsync(key);

                return Ok(new ApiResponse<object>
                {
                    Success = removed,
                    Message = removed ? $"Cache key '{key}' removed successfully" : $"Cache key '{key}' not found"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error removing cache key: {key}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to remove cache key"
                });
            }
        }

        /// <summary>
        /// Flush entire cache database
        /// </summary>
        [HttpPost("cache/flush")]
        public async Task<ActionResult<ApiResponse<object>>> FlushCache()
        {
            try
            {
                await _cacheService.FlushDatabaseAsync();

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Cache database flushed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error flushing cache database");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to flush cache database"
                });
            }
        }

        /// <summary>
        /// Get cache key expiry
        /// </summary>
        [HttpGet("cache/{key}/expiry")]
        public async Task<ActionResult<ApiResponse<TimeSpan?>>> GetCacheExpiry(string key)
        {
            try
            {
                var expiry = await _cacheService.GetExpiryAsync(key);

                return Ok(new ApiResponse<TimeSpan?>
                {
                    Success = true,
                    Data = expiry,
                    Message = expiry.HasValue ? $"Cache key '{key}' expires in {expiry.Value}" : $"Cache key '{key}' has no expiry"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting cache expiry for key: {key}");
                return StatusCode(500, new ApiResponse<TimeSpan?>
                {
                    Success = false,
                    Message = "Failed to get cache expiry"
                });
            }
        }

        /// <summary>
        /// Set cache key expiry
        /// </summary>
        [HttpPost("cache/{key}/expiry")]
        public async Task<ActionResult<ApiResponse<object>>> SetCacheExpiry(string key, [FromBody] SetExpiryRequest request)
        {
            try
            {
                var success = await _cacheService.ExpireAsync(key, request.Expiry);

                return Ok(new ApiResponse<object>
                {
                    Success = success,
                    Message = success ? $"Cache key '{key}' expiry set to {request.Expiry}" : $"Cache key '{key}' not found"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error setting cache expiry for key: {key}");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to set cache expiry"
                });
            }
        }

        /// <summary>
        /// Get comprehensive database health report
        /// </summary>
        [HttpGet("health")]
        public async Task<ActionResult<ApiResponse<DatabaseHealthReport>>> GetDatabaseHealth()
        {
            try
            {
                var healthReport = new DatabaseHealthReport
                {
                    ReportTime = DateTime.UtcNow,
                    DatabaseStats = await _dbOptimizationService.GetDatabaseStatsAsync(),
                    QueryPerformance = await _dbOptimizationService.AnalyzeQueryPerformanceAsync(),
                    ConnectionPool = await _dbOptimizationService.GetConnectionPoolStatsAsync(),
                    CacheStats = await _cacheService.GetStatsAsync(),
                    SlowQueries = await _dbOptimizationService.GetSlowQueriesAsync(5)
                };

                // Calculate health score
                healthReport.HealthScore = CalculateHealthScore(healthReport);

                return Ok(new ApiResponse<DatabaseHealthReport>
                {
                    Success = true,
                    Data = healthReport,
                    Message = "Database health report generated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating database health report");
                return StatusCode(500, new ApiResponse<DatabaseHealthReport>
                {
                    Success = false,
                    Message = "Failed to generate database health report"
                });
            }
        }

        private int CalculateHealthScore(DatabaseHealthReport report)
        {
            int score = 100;

            // Deduct points for slow queries
            if (report.SlowQueries.Count > 0)
            {
                score -= Math.Min(30, report.SlowQueries.Count * 5);
            }

            // Deduct points for high connection usage
            if (report.ConnectionPool.TotalConnections > 0)
            {
                var connectionUsage = (double)report.ConnectionPool.ActiveConnections / report.ConnectionPool.MaxConnections;
                if (connectionUsage > 0.8)
                {
                    score -= 20;
                }
                else if (connectionUsage > 0.6)
                {
                    score -= 10;
                }
            }

            // Deduct points for low cache hit rate (if available)
            if (report.CacheStats.HitRate != "0%")
            {
                var hitRate = double.Parse(report.CacheStats.HitRate.Replace("%", ""));
                if (hitRate < 70)
                {
                    score -= 15;
                }
                else if (hitRate < 85)
                {
                    score -= 5;
                }
            }

            return Math.Max(0, score);
        }
    }

    public class SetExpiryRequest
    {
        public TimeSpan Expiry { get; set; }
    }

    public class DatabaseHealthReport
    {
        public DateTime ReportTime { get; set; }
        public DatabaseStats DatabaseStats { get; set; } = new();
        public QueryPerformanceStats QueryPerformance { get; set; } = new();
        public ConnectionPoolStats ConnectionPool { get; set; } = new();
        public CacheStats CacheStats { get; set; } = new();
        public List<SlowQuery> SlowQueries { get; set; } = new();
        public int HealthScore { get; set; }
    }
}
