using System.Collections.Concurrent;
using System.Diagnostics;

namespace innkt.NeuroSpark.Services;

public class PerformanceMonitor : IPerformanceMonitor
{
    private readonly ILogger<PerformanceMonitor> _logger;
    private readonly ConcurrentDictionary<string, MetricValue> _metrics;
    private readonly ConcurrentDictionary<string, CounterValue> _counters;
    private readonly ConcurrentDictionary<string, CategoryMetrics> _categories;
    private readonly DateTime _startTime;
    private readonly Stopwatch _stopwatch;
    private long _totalRequests;
    private long _totalErrors;
    private readonly object _lockObject = new object();

    public PerformanceMonitor(ILogger<PerformanceMonitor> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _metrics = new ConcurrentDictionary<string, MetricValue>();
        _counters = new ConcurrentDictionary<string, CounterValue>();
        _categories = new ConcurrentDictionary<string, CategoryMetrics>();
        _startTime = DateTime.UtcNow;
        _stopwatch = Stopwatch.StartNew();
        
        _logger.LogInformation("Performance monitor initialized");
    }

    public void RecordMetric(string metricName, double value, string? category = null)
    {
        try
        {
            var metric = _metrics.AddOrUpdate(metricName,
                new MetricValue
                {
                    Name = metricName,
                    Value = value,
                    Min = value,
                    Max = value,
                    Average = value,
                    Count = 1,
                    LastUpdated = DateTime.UtcNow
                },
                (key, existing) =>
                {
                    existing.Value = value;
                    existing.Min = Math.Min(existing.Min, value);
                    existing.Max = Math.Max(existing.Max, value);
                    existing.Count++;
                    existing.Average = ((existing.Average * (existing.Count - 1)) + value) / existing.Count;
                    existing.LastUpdated = DateTime.UtcNow;
                    return existing;
                });

            // Update category metrics if specified
            if (!string.IsNullOrEmpty(category))
            {
                UpdateCategoryMetric(category, metricName, value);
            }

            _logger.LogDebug("Recorded metric {MetricName}: {Value} (Category: {Category})", metricName, value, category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording metric {MetricName}", metricName);
        }
    }

    public void RecordTiming(string operationName, TimeSpan duration, string? category = null)
    {
        try
        {
            var metricName = $"{operationName}_duration";
            RecordMetric(metricName, duration.TotalMilliseconds, category);
            
            // Also record as a counter for operation count
            IncrementCounter($"{operationName}_count", 1, category);
            
            _logger.LogDebug("Recorded timing for {OperationName}: {Duration}ms (Category: {Category})", 
                operationName, duration.TotalMilliseconds, category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording timing for {OperationName}", operationName);
        }
    }

    public void IncrementCounter(string counterName, int increment = 1, string? category = null)
    {
        try
        {
            var counter = _counters.AddOrUpdate(counterName,
                new CounterValue
                {
                    Name = counterName,
                    Value = increment,
                    LastUpdated = DateTime.UtcNow
                },
                (key, existing) =>
                {
                    existing.Value += increment;
                    existing.LastUpdated = DateTime.UtcNow;
                    return existing;
                });

            // Update category counters if specified
            if (!string.IsNullOrEmpty(category))
            {
                UpdateCategoryCounter(category, counterName, increment);
            }

            // Special handling for request counters
            if (counterName.Contains("request", StringComparison.OrdinalIgnoreCase))
            {
                Interlocked.Add(ref _totalRequests, increment);
            }

            // Special handling for error counters
            if (counterName.Contains("error", StringComparison.OrdinalIgnoreCase))
            {
                Interlocked.Add(ref _totalErrors, increment);
            }

            _logger.LogDebug("Incremented counter {CounterName} by {Increment} (Category: {Category})", 
                counterName, increment, category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing counter {CounterName}", counterName);
        }
    }

    public async Task<PerformanceStats> GetPerformanceStatsAsync()
    {
        try
        {
            var uptime = _stopwatch.Elapsed;
            var requestsPerSecond = uptime.TotalSeconds > 0 ? _totalRequests / uptime.TotalSeconds : 0;
            var errorRate = _totalRequests > 0 ? (double)_totalErrors / _totalRequests * 100 : 0;

            var stats = new PerformanceStats
            {
                StartTime = _startTime,
                Uptime = uptime,
                TotalRequests = _totalRequests,
                ErrorCount = (int)_totalErrors,
                ErrorRate = errorRate,
                RequestsPerSecond = requestsPerSecond,
                LastUpdated = DateTime.UtcNow
            };

            // Calculate average response time from timing metrics
            var timingMetrics = _metrics.Values
                .Where(m => m.Name.EndsWith("_duration"))
                .ToList();

            if (timingMetrics.Any())
            {
                stats.AverageResponseTime = timingMetrics.Average(m => m.Average);
            }

            // Copy categories
            foreach (var category in _categories)
            {
                stats.Categories[category.Key] = category.Value;
            }

            // Copy custom metrics
            foreach (var metric in _metrics)
            {
                if (!metric.Key.EndsWith("_duration") && !metric.Key.EndsWith("_count"))
                {
                    stats.CustomMetrics[metric.Key] = metric.Value.Value;
                }
            }

            return await Task.FromResult(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance stats");
            throw;
        }
    }

    public async Task<CategoryMetrics> GetCategoryMetricsAsync(string category)
    {
        try
        {
            if (_categories.TryGetValue(category, out var categoryMetrics))
            {
                return await Task.FromResult(categoryMetrics);
            }

            return await Task.FromResult(new CategoryMetrics { Category = category });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category metrics for {Category}", category);
            throw;
        }
    }

    public async Task ResetMetricsAsync()
    {
        try
        {
            lock (_lockObject)
            {
                _metrics.Clear();
                _counters.Clear();
                _categories.Clear();
                _totalRequests = 0;
                _totalErrors = 0;
                _stopwatch.Restart();
            }

            _logger.LogInformation("Performance metrics reset");
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting metrics");
            throw;
        }
    }

    public async Task<PerformanceExport> ExportPerformanceDataAsync()
    {
        try
        {
            var stats = await GetPerformanceStatsAsync();
            var export = new PerformanceExport
            {
                ExportTime = DateTime.UtcNow,
                Stats = stats,
                Format = "json",
                Metadata = new Dictionary<string, object>
                {
                    ["ServiceName"] = "NeuroSpark",
                    ["Version"] = "1.0.0",
                    ["ExportFormat"] = "json",
                    ["GeneratedBy"] = "PerformanceMonitor"
                }
            };

            _logger.LogInformation("Performance data exported at {ExportTime}", export.ExportTime);
            return export;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting performance data");
            throw;
        }
    }

    private void UpdateCategoryMetric(string category, string metricName, double value)
    {
        var categoryMetrics = _categories.GetOrAdd(category, _ => new CategoryMetrics
        {
            Category = category,
            LastUpdated = DateTime.UtcNow
        });

        lock (categoryMetrics)
        {
            if (categoryMetrics.Metrics.TryGetValue(metricName, out var existingMetric))
            {
                existingMetric.Value = value;
                existingMetric.Min = Math.Min(existingMetric.Min, value);
                existingMetric.Max = Math.Max(existingMetric.Max, value);
                existingMetric.Count++;
                existingMetric.Average = ((existingMetric.Average * (existingMetric.Count - 1)) + value) / existingMetric.Count;
                existingMetric.LastUpdated = DateTime.UtcNow;
            }
            else
            {
                categoryMetrics.Metrics[metricName] = new MetricValue
                {
                    Name = metricName,
                    Value = value,
                    Min = value,
                    Max = value,
                    Average = value,
                    Count = 1,
                    LastUpdated = DateTime.UtcNow
                };
            }

            categoryMetrics.TotalOperations++;
            categoryMetrics.LastUpdated = DateTime.UtcNow;
        }
    }

    private void UpdateCategoryCounter(string category, string counterName, int increment)
    {
        var categoryMetrics = _categories.GetOrAdd(category, _ => new CategoryMetrics
        {
            Category = category,
            LastUpdated = DateTime.UtcNow
        });

        lock (categoryMetrics)
        {
            if (categoryMetrics.Counters.TryGetValue(counterName, out var existingCounter))
            {
                existingCounter.Value += increment;
                existingCounter.LastUpdated = DateTime.UtcNow;
            }
            else
            {
                categoryMetrics.Counters[counterName] = new CounterValue
                {
                    Name = counterName,
                    Value = increment,
                    LastUpdated = DateTime.UtcNow
                };
            }

            categoryMetrics.LastUpdated = DateTime.UtcNow;
        }
    }
}



