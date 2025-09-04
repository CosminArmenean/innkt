namespace innkt.NeuroSpark.Services;

public interface IAuditLogger
{
    Task LogRequestAsync(AuditRequest request);
    Task LogResponseAsync(AuditResponse response);
    Task LogSecurityEventAsync(SecurityEvent securityEvent);
    Task LogUserActionAsync(UserAction userAction);
    Task<IEnumerable<AuditLogEntry>> GetAuditLogsAsync(DateTime from, DateTime to, string? userId = null, string? eventType = null);
    Task<IEnumerable<SecurityEvent>> GetSecurityEventsAsync(DateTime from, DateTime to, string? severity = null);
}

public class AuditRequest
{
    public string RequestId { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string? QueryString { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
    public string? Body { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string SessionId { get; set; } = string.Empty;
    public string CorrelationId { get; set; } = string.Empty;
}

public class AuditResponse
{
    public string RequestId { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
    public string? Body { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public TimeSpan ResponseTime { get; set; }
    public string? ErrorMessage { get; set; }
}

public class SecurityEvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString();
    public string EventType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // Low, Medium, High, Critical
    public string Description { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public Dictionary<string, object> Details { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string RequestId { get; set; } = string.Empty;
    public bool RequiresImmediateAction { get; set; }
    public string? RecommendedAction { get; set; }
}

public class UserAction
{
    public string ActionId { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Resource { get; set; } = string.Empty;
    public string ResourceId { get; set; } = string.Empty;
    public Dictionary<string, object> Parameters { get; set; } = new();
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string RequestId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
}

public class AuditLogEntry
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}


