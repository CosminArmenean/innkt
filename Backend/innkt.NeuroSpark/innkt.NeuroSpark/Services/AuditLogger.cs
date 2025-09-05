using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace innkt.NeuroSpark.Services;

public class AuditLogger : IAuditLogger
{
    private readonly ILogger<AuditLogger> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly AuditLoggerSettings _settings;
    private readonly string _auditLogKey = "audit:logs";
    private readonly string _securityEventsKey = "audit:security_events";
    private readonly string _userActionsKey = "audit:user_actions";

    public AuditLogger(
        ILogger<AuditLogger> logger,
        IConnectionMultiplexer redis,
        IOptions<AuditLoggerSettings> settings)
    {
        _logger = logger;
        _redis = redis;
        _settings = settings.Value;
    }

    public async Task LogRequestAsync(AuditRequest request)
    {
        try
        {
            var db = _redis.GetDatabase();
            var serialized = System.Text.Json.JsonSerializer.Serialize(request);
            
            // Store in Redis with expiration
            await db.ListRightPushAsync(_auditLogKey, serialized);
            await db.KeyExpireAsync(_auditLogKey, TimeSpan.FromDays(_settings.RetentionDays));
            
            // Also log to structured logging
            _logger.LogInformation("Audit Request: {RequestId} {Method} {Path} {UserId} {IpAddress}", 
                request.RequestId, request.Method, request.Path, request.UserId, request.IpAddress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log audit request");
        }
    }

    public async Task LogResponseAsync(AuditResponse response)
    {
        try
        {
            var db = _redis.GetDatabase();
            var serialized = System.Text.Json.JsonSerializer.Serialize(response);
            
            // Store in Redis with expiration
            await db.ListRightPushAsync(_auditLogKey, serialized);
            await db.KeyExpireAsync(_auditLogKey, TimeSpan.FromDays(_settings.RetentionDays));
            
            // Log response details
            _logger.LogInformation("Audit Response: {RequestId} {StatusCode} {ResponseTime}ms", 
                response.RequestId, response.StatusCode, response.ResponseTime.TotalMilliseconds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log audit response");
        }
    }

    public async Task LogSecurityEventAsync(SecurityEvent securityEvent)
    {
        try
        {
            var db = _redis.GetDatabase();
            var serialized = System.Text.Json.JsonSerializer.Serialize(securityEvent);
            
            // Store in Redis with expiration
            await db.ListRightPushAsync(_securityEventsKey, serialized);
            await db.KeyExpireAsync(_securityEventsKey, TimeSpan.FromDays(_settings.RetentionDays));
            
            // Log security event with appropriate level
            var logLevel = securityEvent.Severity.ToLower() switch
            {
                "critical" => LogLevel.Critical,
                "high" => LogLevel.Error,
                "medium" => LogLevel.Warning,
                _ => LogLevel.Information
            };
            
            _logger.Log(logLevel, "Security Event: {EventType} {Severity} {Description} {UserId} {IpAddress}", 
                securityEvent.EventType, securityEvent.Severity, securityEvent.Description, 
                securityEvent.UserId, securityEvent.IpAddress);
            
            // If immediate action is required, log it prominently
            if (securityEvent.RequiresImmediateAction)
            {
                _logger.LogCritical("IMMEDIATE ACTION REQUIRED: {EventType} - {RecommendedAction}", 
                    securityEvent.EventType, securityEvent.RecommendedAction);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log security event");
        }
    }

    public async Task LogUserActionAsync(UserAction userAction)
    {
        try
        {
            var db = _redis.GetDatabase();
            var serialized = System.Text.Json.JsonSerializer.Serialize(userAction);
            
            // Store in Redis with expiration
            await db.ListRightPushAsync(_userActionsKey, serialized);
            await db.KeyExpireAsync(_userActionsKey, TimeSpan.FromDays(_settings.RetentionDays));
            
            // Log user action
            var logLevel = userAction.Success ? LogLevel.Information : LogLevel.Warning;
            _logger.Log(logLevel, "User Action: {Action} {Resource} {ResourceId} {UserId} {Success}", 
                userAction.Action, userAction.Resource, userAction.ResourceId, userAction.UserId, userAction.Success);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log user action");
        }
    }

    public async Task<IEnumerable<AuditLogEntry>> GetAuditLogsAsync(DateTime from, DateTime to, string? userId = null, string? eventType = null)
    {
        try
        {
            var db = _redis.GetDatabase();
            var logs = new List<AuditLogEntry>();
            
            // Get all logs from Redis
            var redisLogs = await db.ListRangeAsync(_auditLogKey);
            
            foreach (var log in redisLogs)
            {
                try
                {
                    // Try to deserialize as different types
                    if (TryDeserializeAuditLog(log, out var auditLog))
                    {
                        if (auditLog.Timestamp >= from && auditLog.Timestamp <= to &&
                            (string.IsNullOrEmpty(userId) || auditLog.UserId == userId) &&
                            (string.IsNullOrEmpty(eventType) || auditLog.EventType == eventType))
                        {
                            logs.Add(auditLog);
                        }
                    }
                }
                catch
                {
                    // Skip invalid entries
                    continue;
                }
            }
            
            return logs.OrderByDescending(l => l.Timestamp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audit logs");
            return Enumerable.Empty<AuditLogEntry>();
        }
    }

    public async Task<IEnumerable<SecurityEvent>> GetSecurityEventsAsync(DateTime from, DateTime to, string? severity = null)
    {
        try
        {
            var db = _redis.GetDatabase();
            var events = new List<SecurityEvent>();
            
            // Get all security events from Redis
            var redisEvents = await db.ListRangeAsync(_securityEventsKey);
            
            foreach (var evt in redisEvents)
            {
                try
                {
                    var securityEvent = System.Text.Json.JsonSerializer.Deserialize<SecurityEvent>(evt!);
                    if (securityEvent != null &&
                        securityEvent.Timestamp >= from && securityEvent.Timestamp <= to &&
                        (string.IsNullOrEmpty(severity) || securityEvent.Severity == severity))
                    {
                        events.Add(securityEvent);
                    }
                }
                catch
                {
                    // Skip invalid entries
                    continue;
                }
            }
            
            return events.OrderByDescending(e => e.Timestamp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve security events");
            return Enumerable.Empty<SecurityEvent>();
        }
    }

    private bool TryDeserializeAuditLog(RedisValue value, out AuditLogEntry auditLog)
    {
        auditLog = new AuditLogEntry();
        
        try
        {
            // Try to deserialize as different audit types and convert to AuditLogEntry
            var json = value.ToString();
            
            // Try as AuditRequest
            if (TryDeserialize<AuditRequest>(json, out var request))
            {
                auditLog = new AuditLogEntry
                {
                    Id = request.RequestId,
                    Timestamp = request.Timestamp,
                    EventType = "Request",
                    UserId = request.UserId,
                    Description = $"{request.Method} {request.Path}",
                    Metadata = new Dictionary<string, object>
                    {
                        ["ipAddress"] = request.IpAddress,
                        ["userAgent"] = request.UserAgent,
                        ["sessionId"] = request.SessionId
                    }
                };
                return true;
            }
            
            // Try as AuditResponse
            if (TryDeserialize<AuditResponse>(json, out var response))
            {
                auditLog = new AuditLogEntry
                {
                    Id = response.RequestId,
                    Timestamp = response.Timestamp,
                    EventType = "Response",
                    UserId = string.Empty,
                    Description = $"Response {response.StatusCode}",
                    Metadata = new Dictionary<string, object>
                    {
                        ["statusCode"] = response.StatusCode,
                        ["responseTime"] = response.ResponseTime.TotalMilliseconds,
                        ["errorMessage"] = response.ErrorMessage ?? string.Empty
                    }
                };
                return true;
            }
            
            return false;
        }
        catch
        {
            return false;
        }
    }

    private bool TryDeserialize<T>(string json, out T? result) where T : class
    {
        try
        {
            result = System.Text.Json.JsonSerializer.Deserialize<T>(json);
            return result != null;
        }
        catch
        {
            result = null;
            return false;
        }
    }
}

public class AuditLoggerSettings
{
    public int RetentionDays { get; set; } = 90;
    public bool EnableConsoleLogging { get; set; } = true;
    public bool EnableRedisLogging { get; set; } = true;
    public string LogLevel { get; set; } = "Information";
}



