using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace innkt.NeuroSpark.Services
{
    public interface IThreatDetectionService
    {
        Task<ThreatAnalysisResult> AnalyzeRequestAsync(ThreatAnalysisRequest request);
        Task<AnomalyDetectionResult> DetectAnomaliesAsync(AnomalyDetectionRequest request);
        Task<AutomatedResponseResult> ExecuteAutomatedResponseAsync(AutomatedResponseRequest request);
        Task<ThreatMetrics> GetThreatMetricsAsync(DateTime from, DateTime to);
        Task<List<SecurityIncident>> GetActiveIncidentsAsync();
        Task<SecurityIncident> CreateIncidentAsync(CreateIncidentRequest request);
        Task<bool> UpdateIncidentStatusAsync(string incidentId, IncidentStatus status);
        Task<List<ThreatPattern>> GetThreatPatternsAsync();
        Task<bool> UpdateThreatPatternAsync(ThreatPattern pattern);
    }

    public class ThreatAnalysisRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public Dictionary<string, string> Headers { get; set; } = new();
        public object? RequestBody { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    public class ThreatAnalysisResult
    {
        public string RequestId { get; set; } = string.Empty;
        public ThreatLevel ThreatLevel { get; set; }
        public List<ThreatIndicator> Indicators { get; set; } = new();
        public double RiskScore { get; set; }
        public List<string> Recommendations { get; set; } = new();
        public bool RequiresImmediateAction { get; set; }
        public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
    }

    public class ThreatIndicator
    {
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public ThreatLevel Severity { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class AnomalyDetectionRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public AnomalyType Type { get; set; }
    }

    public class AnomalyDetectionResult
    {
        public string AnalysisId { get; set; } = string.Empty;
        public List<Anomaly> Anomalies { get; set; } = new();
        public double AnomalyScore { get; set; }
        public bool IsAnomalous { get; set; }
        public List<string> Patterns { get; set; } = new();
        public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
    }

    public class Anomaly
    {
        public string Id { get; set; } = string.Empty;
        public AnomalyType Type { get; set; }
        public string Description { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public ThreatLevel Severity { get; set; }
        public Dictionary<string, object> Metrics { get; set; } = new();
        public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
    }

    public class AutomatedResponseRequest
    {
        public string IncidentId { get; set; } = string.Empty;
        public ThreatLevel ThreatLevel { get; set; }
        public List<string> Actions { get; set; } = new();
        public bool RequireConfirmation { get; set; }
        public Dictionary<string, object> Parameters { get; set; } = new();
    }

    public class AutomatedResponseResult
    {
        public string ResponseId { get; set; } = string.Empty;
        public List<ResponseAction> Actions { get; set; } = new();
        public bool Success { get; set; }
        public List<string> Errors { get; set; } = new();
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    }

    public class ResponseAction
    {
        public string Action { get; set; } = string.Empty;
        public bool Executed { get; set; }
        public string Result { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    }

    public class ThreatMetrics
    {
        public int TotalThreats { get; set; }
        public int HighThreats { get; set; }
        public int MediumThreats { get; set; }
        public int LowThreats { get; set; }
        public double AverageRiskScore { get; set; }
        public List<ThreatTrend> Trends { get; set; } = new();
        public Dictionary<string, int> ThreatsByType { get; set; } = new();
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }

    public class ThreatTrend
    {
        public DateTime Date { get; set; }
        public int ThreatCount { get; set; }
        public double AverageRiskScore { get; set; }
    }

    public class SecurityIncident
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public IncidentStatus Status { get; set; }
        public ThreatLevel Severity { get; set; }
        public string AssignedTo { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }
        public List<string> Tags { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class CreateIncidentRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public ThreatLevel Severity { get; set; }
        public string AssignedTo { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    public class ThreatPattern
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Pattern { get; set; } = string.Empty;
        public ThreatLevel Severity { get; set; }
        public bool IsActive { get; set; }
        public List<string> Actions { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastUpdated { get; set; }
    }

    public enum ThreatLevel
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public enum AnomalyType
    {
        Behavioral = 1,
        Network = 2,
        Application = 3,
        Data = 4,
        Temporal = 5
    }

    public enum IncidentStatus
    {
        Open = 1,
        InProgress = 2,
        Resolved = 3,
        Closed = 4,
        Escalated = 5
    }
}



