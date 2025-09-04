namespace innkt.NeuroSpark.Services;

public interface IPerformanceMonitor
{
    /// <summary>
    /// Records a performance metric
    /// </summary>
    void RecordMetric(string metricName, double value, string? category = null);
    
    /// <summary>
    /// Records a timing measurement
    /// </summary>
    void RecordTiming(string operationName, TimeSpan duration, string? category = null);
    
    /// <summary>
    /// Records a counter increment
    /// </summary>
    void IncrementCounter(string counterName, int increment = 1, string? category = null);
    
    /// <summary>
    /// Gets performance statistics
    /// </summary>
    Task<PerformanceStats> GetPerformanceStatsAsync();
    
    /// <summary>
    /// Gets metrics for a specific category
    /// </summary>
    Task<CategoryMetrics> GetCategoryMetricsAsync(string category);
    
    /// <summary>
    /// Resets all performance counters
    /// </summary>
    Task ResetMetricsAsync();
    
    /// <summary>
    /// Exports performance data
    /// </summary>
    Task<PerformanceExport> ExportPerformanceDataAsync();
}

public class PerformanceStats
{
    public DateTime StartTime { get; set; }
    public TimeSpan Uptime { get; set; }
    public long TotalRequests { get; set; }
    public double AverageResponseTime { get; set; }
    public double RequestsPerSecond { get; set; }
    public int ErrorCount { get; set; }
    public double ErrorRate { get; set; }
    public Dictionary<string, CategoryMetrics> Categories { get; set; } = new();
    public Dictionary<string, double> CustomMetrics { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class CategoryMetrics
{
    public string Category { get; set; } = string.Empty;
    public long TotalOperations { get; set; }
    public double AverageOperationTime { get; set; }
    public double MinOperationTime { get; set; }
    public double MaxOperationTime { get; set; }
    public int ErrorCount { get; set; }
    public double ErrorRate { get; set; }
    public Dictionary<string, MetricValue> Metrics { get; set; } = new();
    public Dictionary<string, CounterValue> Counters { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class MetricValue
{
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
    public double Min { get; set; }
    public double Max { get; set; }
    public double Average { get; set; }
    public long Count { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class CounterValue
{
    public string Name { get; set; } = string.Empty;
    public long Value { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class PerformanceExport
{
    public DateTime ExportTime { get; set; }
    public PerformanceStats Stats { get; set; } = new();
    public string Format { get; set; } = "json";
    public Dictionary<string, object> Metadata { get; set; } = new();
}


