using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Text;

namespace innkt.NeuroSpark.Services
{
    public class ThreatDetectionService : IThreatDetectionService
    {
        private readonly IRedisService _redisService;
        private readonly ILogger<ThreatDetectionService> _logger;
        private readonly Dictionary<string, ThreatPattern> _threatPatterns;
        private readonly Dictionary<string, List<double>> _userBehaviorBaselines;

        public ThreatDetectionService(IRedisService redisService, ILogger<ThreatDetectionService> logger)
        {
            _redisService = redisService;
            _logger = logger;
            _threatPatterns = InitializeThreatPatterns();
            _userBehaviorBaselines = new Dictionary<string, List<double>>();
        }

        public async Task<ThreatAnalysisResult> AnalyzeRequestAsync(ThreatAnalysisRequest request)
        {
            try
            {
                var result = new ThreatAnalysisResult
                {
                    RequestId = Guid.NewGuid().ToString(),
                    ThreatLevel = ThreatLevel.Low,
                    RiskScore = 0.0,
                    RequiresImmediateAction = false
                };

                // Analyze IP address
                var ipAnalysis = AnalyzeIpAddress(request.IpAddress);
                result.Indicators.AddRange(ipAnalysis);

                // Analyze user agent
                var userAgentAnalysis = AnalyzeUserAgent(request.UserAgent);
                result.Indicators.AddRange(userAgentAnalysis);

                // Analyze endpoint patterns
                var endpointAnalysis = AnalyzeEndpoint(request.Endpoint, request.Method);
                result.Indicators.AddRange(endpointAnalysis);

                // Analyze request frequency
                var frequencyAnalysis = await AnalyzeRequestFrequencyAsync(request);
                result.Indicators.AddRange(frequencyAnalysis);

                // Analyze behavioral patterns
                var behavioralAnalysis = await AnalyzeBehavioralPatternsAsync(request);
                result.Indicators.AddRange(behavioralAnalysis);

                // Calculate overall risk score
                result.RiskScore = CalculateRiskScore(result.Indicators);
                result.ThreatLevel = DetermineThreatLevel(result.RiskScore);
                result.RequiresImmediateAction = result.ThreatLevel >= ThreatLevel.High;

                // Generate recommendations
                result.Recommendations = GenerateRecommendations(result.Indicators, result.RiskScore);

                // Store analysis result
                await StoreThreatAnalysisAsync(result);

                _logger.LogInformation("Threat analysis completed for request {RequestId}. Risk score: {RiskScore}, Threat level: {ThreatLevel}",
                    result.RequestId, result.RiskScore, result.ThreatLevel);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during threat analysis for request from {IpAddress}", request.IpAddress);
                throw;
            }
        }

        public async Task<AnomalyDetectionResult> DetectAnomaliesAsync(AnomalyDetectionRequest request)
        {
            try
            {
                var result = new AnomalyDetectionResult
                {
                    AnalysisId = Guid.NewGuid().ToString(),
                    Anomalies = new List<Anomaly>(),
                    AnomalyScore = 0.0,
                    IsAnomalous = false
                };

                // Get user behavior baseline
                var baseline = await GetUserBehaviorBaselineAsync(request.UserId, request.IpAddress);

                // Analyze request patterns
                var requestPatterns = await AnalyzeRequestPatternsAsync(request);
                result.Anomalies.AddRange(requestPatterns);

                // Analyze temporal patterns
                var temporalPatterns = await AnalyzeTemporalPatternsAsync(request);
                result.Anomalies.AddRange(temporalPatterns);

                // Analyze network patterns
                var networkPatterns = await AnalyzeNetworkPatternsAsync(request);
                result.Anomalies.AddRange(networkPatterns);

                // Calculate anomaly score
                result.AnomalyScore = CalculateAnomalyScore(result.Anomalies);
                result.IsAnomalous = result.AnomalyScore > 0.7; // Threshold for anomaly detection

                // Identify patterns
                result.Patterns = IdentifyAnomalyPatterns(result.Anomalies);

                _logger.LogInformation("Anomaly detection completed for user {UserId}. Anomaly score: {AnomalyScore}, Is anomalous: {IsAnomalous}",
                    request.UserId, result.AnomalyScore, result.IsAnomalous);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during anomaly detection for user {UserId}", request.UserId);
                throw;
            }
        }

        public async Task<AutomatedResponseResult> ExecuteAutomatedResponseAsync(AutomatedResponseRequest request)
        {
            try
            {
                var result = new AutomatedResponseResult
                {
                    ResponseId = Guid.NewGuid().ToString(),
                    Actions = new List<ResponseAction>(),
                    Success = true
                };

                foreach (var action in request.Actions)
                {
                    var responseAction = new ResponseAction
                    {
                        Action = action,
                        ExecutedAt = DateTime.UtcNow
                    };

                    try
                    {
                        var actionResult = await ExecuteResponseActionAsync(action, request);
                        responseAction.Executed = true;
                        responseAction.Result = actionResult;
                    }
                    catch (Exception ex)
                    {
                        responseAction.Executed = false;
                        responseAction.Result = $"Error: {ex.Message}";
                        result.Success = false;
                        result.Errors.Add($"Failed to execute action {action}: {ex.Message}");
                    }

                    result.Actions.Add(responseAction);
                }

                // Log automated response execution
                _logger.LogInformation("Automated response executed for incident {IncidentId}. Success: {Success}, Actions executed: {ActionCount}",
                    request.IncidentId, result.Success, result.Actions.Count(a => a.Executed));

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during automated response execution for incident {IncidentId}", request.IncidentId);
                throw;
            }
        }

        public async Task<ThreatMetrics> GetThreatMetricsAsync(DateTime from, DateTime to)
        {
            try
            {
                var metrics = new ThreatMetrics
                {
                    GeneratedAt = DateTime.UtcNow
                };

                // Get threat data from Redis
                var threatData = await GetThreatDataFromRedisAsync(from, to);
                
                metrics.TotalThreats = threatData.Count;
                metrics.HighThreats = threatData.Count(t => t.ThreatLevel >= ThreatLevel.High);
                metrics.MediumThreats = threatData.Count(t => t.ThreatLevel == ThreatLevel.Medium);
                metrics.LowThreats = threatData.Count(t => t.ThreatLevel == ThreatLevel.Low);
                
                if (threatData.Any())
                {
                    metrics.AverageRiskScore = threatData.Average(t => t.RiskScore);
                }

                // Generate trends
                metrics.Trends = GenerateThreatTrends(threatData, from, to);
                
                // Categorize threats by type
                metrics.ThreatsByType = threatData
                    .GroupBy(t => t.Indicators.FirstOrDefault()?.Type ?? "Unknown")
                    .ToDictionary(g => g.Key, g => g.Count());

                return metrics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting threat metrics from {From} to {To}", from, to);
                throw;
            }
        }

        public async Task<List<SecurityIncident>> GetActiveIncidentsAsync()
        {
            try
            {
                var incidents = await _redisService.GetAsync<List<SecurityIncident>>("security:incidents:active");
                return incidents ?? new List<SecurityIncident>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active security incidents");
                return new List<SecurityIncident>();
            }
        }

        public async Task<SecurityIncident> CreateIncidentAsync(CreateIncidentRequest request)
        {
            try
            {
                var incident = new SecurityIncident
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = request.Title,
                    Description = request.Description,
                    Status = IncidentStatus.Open,
                    Severity = request.Severity,
                    AssignedTo = request.AssignedTo,
                    CreatedAt = DateTime.UtcNow,
                    Tags = request.Tags,
                    Metadata = request.Metadata
                };

                // Store incident in Redis
                await _redisService.SetAsync($"security:incident:{incident.Id}", incident, TimeSpan.FromDays(30));
                
                // Add to active incidents list
                var activeIncidents = await GetActiveIncidentsAsync();
                activeIncidents.Add(incident);
                await _redisService.SetAsync("security:incidents:active", activeIncidents, TimeSpan.FromDays(30));

                _logger.LogInformation("Security incident created: {IncidentId} - {Title} (Severity: {Severity})",
                    incident.Id, incident.Title, incident.Severity);

                return incident;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating security incident: {Title}", request.Title);
                throw;
            }
        }

        public async Task<bool> UpdateIncidentStatusAsync(string incidentId, IncidentStatus status)
        {
            try
            {
                var incident = await _redisService.GetAsync<SecurityIncident>($"security:incident:{incidentId}");
                if (incident == null)
                {
                    return false;
                }

                incident.Status = status;
                if (status == IncidentStatus.Resolved || status == IncidentStatus.Closed)
                {
                    incident.ResolvedAt = DateTime.UtcNow;
                }

                // Update incident
                await _redisService.SetAsync($"security:incident:{incidentId}", incident, TimeSpan.FromDays(30));

                // Update active incidents list if needed
                if (status == IncidentStatus.Resolved || status == IncidentStatus.Closed)
                {
                    var activeIncidents = await GetActiveIncidentsAsync();
                    var updatedIncidents = activeIncidents.Where(i => i.Id != incidentId).ToList();
                    await _redisService.SetAsync("security:incidents:active", updatedIncidents, TimeSpan.FromDays(30));
                }

                _logger.LogInformation("Security incident {IncidentId} status updated to {Status}", incidentId, status);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating incident {IncidentId} status to {Status}", incidentId, status);
                return false;
            }
        }

        public async Task<List<ThreatPattern>> GetThreatPatternsAsync()
        {
            return _threatPatterns.Values.ToList();
        }

        public async Task<bool> UpdateThreatPatternAsync(ThreatPattern pattern)
        {
            try
            {
                if (_threatPatterns.ContainsKey(pattern.Id))
                {
                    pattern.LastUpdated = DateTime.UtcNow;
                    _threatPatterns[pattern.Id] = pattern;
                    
                    // Store in Redis for persistence
                    await _redisService.SetAsync($"security:pattern:{pattern.Id}", pattern, TimeSpan.FromDays(365));
                    
                    _logger.LogInformation("Threat pattern {PatternId} updated: {Name}", pattern.Id, pattern.Name);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating threat pattern {PatternId}", pattern.Id);
                return false;
            }
        }

        #region Private Methods

        private Dictionary<string, ThreatPattern> InitializeThreatPatterns()
        {
            return new Dictionary<string, ThreatPattern>
            {
                ["sql-injection"] = new ThreatPattern
                {
                    Id = "sql-injection",
                    Name = "SQL Injection",
                    Description = "Detects SQL injection attempts in request parameters",
                    Pattern = @"(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b.*\b(from|into|where|set|table|database)\b)",
                    Severity = ThreatLevel.High,
                    IsActive = true,
                    Actions = new List<string> { "block_request", "log_incident", "notify_admin" }
                },
                ["xss"] = new ThreatPattern
                {
                    Id = "xss",
                    Name = "Cross-Site Scripting",
                    Description = "Detects XSS attempts in request parameters",
                    Pattern = @"<script[^>]*>.*?</script>|<[^>]*javascript:|<[^>]*on\w+\s*=",
                    Severity = ThreatLevel.High,
                    IsActive = true,
                    Actions = new List<string> { "block_request", "log_incident", "sanitize_input" }
                },
                ["path-traversal"] = new ThreatPattern
                {
                    Id = "path-traversal",
                    Name = "Path Traversal",
                    Description = "Detects path traversal attempts",
                    Pattern = @"\.\./|\.\.\\|%2e%2e%2f|%2e%2e%5c",
                    Severity = ThreatLevel.High,
                    IsActive = true,
                    Actions = new List<string> { "block_request", "log_incident", "restrict_path" }
                },
                ["rate-limit-bypass"] = new ThreatPattern
                {
                    Id = "rate-limit-bypass",
                    Name = "Rate Limit Bypass",
                    Description = "Detects attempts to bypass rate limiting",
                    Pattern = @"(user-agent|referer|x-forwarded-for|x-real-ip)",
                    Severity = ThreatLevel.Medium,
                    IsActive = true,
                    Actions = new List<string> { "increase_rate_limit", "log_incident", "temporary_block" }
                }
            };
        }

        private List<ThreatIndicator> AnalyzeIpAddress(string ipAddress)
        {
            var indicators = new List<ThreatIndicator>();

            // Check for private/local IP addresses
            if (IsPrivateIpAddress(ipAddress))
            {
                indicators.Add(new ThreatIndicator
                {
                    Type = "ip_private",
                    Description = "Request from private IP address",
                    Confidence = 0.3,
                    Severity = ThreatLevel.Low,
                    Metadata = new Dictionary<string, object> { ["ip"] = ipAddress }
                });
            }

            // Check for known malicious IPs (simplified - in production, use threat intelligence feeds)
            if (IsKnownMaliciousIp(ipAddress))
            {
                indicators.Add(new ThreatIndicator
                {
                    Type = "ip_malicious",
                    Description = "Request from known malicious IP address",
                    Confidence = 0.9,
                    Severity = ThreatLevel.High,
                    Metadata = new Dictionary<string, object> { ["ip"] = ipAddress }
                });
            }

            return indicators;
        }

        private List<ThreatIndicator> AnalyzeUserAgent(string userAgent)
        {
            var indicators = new List<ThreatIndicator>();

            if (string.IsNullOrEmpty(userAgent))
            {
                indicators.Add(new ThreatIndicator
                {
                    Type = "user_agent_missing",
                    Description = "Missing User-Agent header",
                    Confidence = 0.6,
                    Severity = ThreatLevel.Medium,
                    Metadata = new Dictionary<string, object> { ["user_agent"] = "missing" }
                });
            }
            else if (IsSuspiciousUserAgent(userAgent))
            {
                indicators.Add(new ThreatIndicator
                {
                    Type = "user_agent_suspicious",
                    Description = "Suspicious User-Agent detected",
                    Confidence = 0.7,
                    Severity = ThreatLevel.Medium,
                    Metadata = new Dictionary<string, object> { ["user_agent"] = userAgent }
                });
            }

            return indicators;
        }

        private List<ThreatIndicator> AnalyzeEndpoint(string endpoint, string method)
        {
            var indicators = new List<ThreatIndicator>();

            // Check for suspicious endpoint patterns
            foreach (var pattern in _threatPatterns.Values.Where(p => p.IsActive))
            {
                if (Regex.IsMatch(endpoint, pattern.Pattern, RegexOptions.IgnoreCase))
                {
                    indicators.Add(new ThreatIndicator
                    {
                        Type = $"pattern_{pattern.Id}",
                        Description = $"Matched threat pattern: {pattern.Name}",
                        Confidence = 0.8,
                        Severity = pattern.Severity,
                        Metadata = new Dictionary<string, object>
                        {
                            ["pattern_id"] = pattern.Id,
                            ["pattern_name"] = pattern.Name,
                            ["endpoint"] = endpoint,
                            ["method"] = method
                        }
                    });
                }
            }

            return indicators;
        }

        private async Task<List<ThreatIndicator>> AnalyzeRequestFrequencyAsync(ThreatAnalysisRequest request)
        {
            var indicators = new List<ThreatIndicator>();

            try
            {
                var key = $"request_frequency:{request.IpAddress}:{request.UserId}";
                var frequency = await _redisService.GetAsync<int>(key);
                if (frequency == 0) frequency = 0;

                // Increment frequency
                frequency++;
                await _redisService.SetAsync(key, frequency, TimeSpan.FromMinutes(5));

                // Check for high frequency
                if (frequency > 100) // More than 100 requests per 5 minutes
                {
                    indicators.Add(new ThreatIndicator
                    {
                        Type = "high_frequency",
                        Description = "Unusually high request frequency detected",
                        Confidence = 0.8,
                        Severity = ThreatLevel.High,
                        Metadata = new Dictionary<string, object>
                        {
                            ["frequency"] = frequency,
                            ["time_window"] = "5 minutes"
                        }
                    });
                }
                else if (frequency > 50) // More than 50 requests per 5 minutes
                {
                    indicators.Add(new ThreatIndicator
                    {
                        Type = "elevated_frequency",
                        Description = "Elevated request frequency detected",
                        Confidence = 0.6,
                        Severity = ThreatLevel.Medium,
                        Metadata = new Dictionary<string, object>
                        {
                            ["frequency"] = frequency,
                            ["time_window"] = "5 minutes"
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error analyzing request frequency for {IpAddress}", request.IpAddress);
            }

            return indicators;
        }

        private async Task<List<ThreatIndicator>> AnalyzeBehavioralPatternsAsync(ThreatAnalysisRequest request)
        {
            var indicators = new List<ThreatIndicator>();

            try
            {
                var userKey = $"user_behavior:{request.UserId}";
                var userBehavior = await _redisService.GetAsync<Dictionary<string, object>>(userKey) ?? new Dictionary<string, object>();

                // Analyze time patterns
                var hour = request.Timestamp.Hour;
                var isUnusualHour = hour < 6 || hour > 22; // Requests outside normal hours

                if (isUnusualHour)
                {
                    indicators.Add(new ThreatIndicator
                    {
                        Type = "unusual_timing",
                        Description = "Request at unusual hour",
                        Confidence = 0.5,
                        Severity = ThreatLevel.Medium,
                        Metadata = new Dictionary<string, object>
                        {
                            ["hour"] = hour,
                            ["normal_hours"] = "6:00-22:00"
                        }
                    });
                }

                // Analyze endpoint access patterns
                var endpointKey = $"endpoint_access:{request.UserId}:{request.Endpoint}";
                var endpointAccessCount = await _redisService.GetAsync<int>(endpointKey);
                if (endpointAccessCount == 0) endpointAccessCount = 0;
                endpointAccessCount++;
                await _redisService.SetAsync(endpointKey, endpointAccessCount, TimeSpan.FromHours(24));

                // Check for unusual endpoint access
                if (endpointAccessCount == 1 && IsSensitiveEndpoint(request.Endpoint))
                {
                    indicators.Add(new ThreatIndicator
                    {
                        Type = "first_time_sensitive_access",
                        Description = "First-time access to sensitive endpoint",
                        Confidence = 0.7,
                        Severity = ThreatLevel.Medium,
                        Metadata = new Dictionary<string, object>
                        {
                            ["endpoint"] = request.Endpoint,
                            ["access_count"] = endpointAccessCount
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error analyzing behavioral patterns for user {UserId}", request.UserId);
            }

            return indicators;
        }

        private double CalculateRiskScore(List<ThreatIndicator> indicators)
        {
            if (!indicators.Any())
                return 0.0;

            var totalScore = 0.0;
            var totalWeight = 0.0;

            foreach (var indicator in indicators)
            {
                var weight = GetIndicatorWeight(indicator.Type);
                var score = indicator.Confidence * GetSeverityMultiplier(indicator.Severity);
                
                totalScore += score * weight;
                totalWeight += weight;
            }

            return totalWeight > 0 ? totalScore / totalWeight : 0.0;
        }

        private ThreatLevel DetermineThreatLevel(double riskScore)
        {
            if (riskScore >= 0.8) return ThreatLevel.Critical;
            if (riskScore >= 0.6) return ThreatLevel.High;
            if (riskScore >= 0.4) return ThreatLevel.Medium;
            return ThreatLevel.Low;
        }

        private List<string> GenerateRecommendations(List<ThreatIndicator> indicators, double riskScore)
        {
            var recommendations = new List<string>();

            if (riskScore >= 0.8)
            {
                recommendations.Add("Immediate action required - block IP address");
                recommendations.Add("Investigate user account for compromise");
                recommendations.Add("Review recent activity logs");
            }
            else if (riskScore >= 0.6)
            {
                recommendations.Add("Monitor user activity closely");
                recommendations.Add("Consider temporary access restrictions");
                recommendations.Add("Review security policies");
            }
            else if (riskScore >= 0.4)
            {
                recommendations.Add("Continue monitoring");
                recommendations.Add("Review access patterns");
            }

            // Add specific recommendations based on indicators
            foreach (var indicator in indicators.Where(i => i.Severity >= ThreatLevel.Medium))
            {
                switch (indicator.Type)
                {
                    case "ip_malicious":
                        recommendations.Add("Block IP address immediately");
                        break;
                    case "high_frequency":
                        recommendations.Add("Implement rate limiting");
                        break;
                    case "pattern_sql-injection":
                    case "pattern_xss":
                        recommendations.Add("Sanitize and validate all inputs");
                        break;
                }
            }

            return recommendations.Distinct().ToList();
        }

        private async Task StoreThreatAnalysisAsync(ThreatAnalysisResult result)
        {
            try
            {
                var key = $"threat_analysis:{result.RequestId}";
                await _redisService.SetAsync(key, result, TimeSpan.FromDays(7));

                // Store in threat history
                var historyKey = "threat_history";
                var history = await _redisService.GetAsync<List<ThreatAnalysisResult>>(historyKey) ?? new List<ThreatAnalysisResult>();
                history.Add(result);
                
                // Keep only last 1000 entries
                if (history.Count > 1000)
                {
                    history = history.TakeLast(1000).ToList();
                }
                
                await _redisService.SetAsync(historyKey, history, TimeSpan.FromDays(30));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error storing threat analysis result {RequestId}", result.RequestId);
            }
        }

        private async Task<List<ThreatAnalysisResult>> GetThreatDataFromRedisAsync(DateTime from, DateTime to)
        {
            try
            {
                var history = await _redisService.GetAsync<List<ThreatAnalysisResult>>("threat_history") ?? new List<ThreatAnalysisResult>();
                return history.Where(t => t.AnalyzedAt >= from && t.AnalyzedAt <= to).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error retrieving threat data from Redis");
                return new List<ThreatAnalysisResult>();
            }
        }

        private List<ThreatTrend> GenerateThreatTrends(List<ThreatAnalysisResult> threatData, DateTime from, DateTime to)
        {
            var trends = new List<ThreatTrend>();
            var days = Enumerable.Range(0, (int)(to - from).TotalDays + 1)
                .Select(d => from.AddDays(d))
                .ToList();

            foreach (var day in days)
            {
                var dayThreats = threatData.Where(t => t.AnalyzedAt.Date == day.Date).ToList();
                trends.Add(new ThreatTrend
                {
                    Date = day,
                    ThreatCount = dayThreats.Count,
                    AverageRiskScore = dayThreats.Any() ? dayThreats.Average(t => t.RiskScore) : 0.0
                });
            }

            return trends;
        }

        private async Task<List<Anomaly>> AnalyzeRequestPatternsAsync(AnomalyDetectionRequest request)
        {
            var anomalies = new List<Anomaly>();

            try
            {
                var userKey = $"user_requests:{request.UserId}";
                var userRequests = await _redisService.GetAsync<List<string>>(userKey) ?? new List<string>();

                // Add current request
                userRequests.Add(request.Endpoint);
                if (userRequests.Count > 100) // Keep only last 100 requests
                {
                    userRequests = userRequests.TakeLast(100).ToList();
                }
                await _redisService.SetAsync(userKey, userRequests, TimeSpan.FromDays(7));

                // Analyze endpoint patterns
                var endpointGroups = userRequests.GroupBy(e => e).ToDictionary(g => g.Key, g => g.Count());
                var unusualEndpoints = endpointGroups.Where(kvp => kvp.Value > 20).ToList(); // More than 20 requests to same endpoint

                foreach (var unusual in unusualEndpoints)
                {
                    anomalies.Add(new Anomaly
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = AnomalyType.Behavioral,
                        Description = $"Unusual number of requests to endpoint: {unusual.Key}",
                        Confidence = 0.7,
                        Severity = ThreatLevel.Medium,
                        Metrics = new Dictionary<string, object>
                        {
                            ["endpoint"] = unusual.Key,
                            ["request_count"] = unusual.Value,
                            ["threshold"] = 20
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error analyzing request patterns for user {UserId}", request.UserId);
            }

            return anomalies;
        }

        private async Task<List<Anomaly>> AnalyzeTemporalPatternsAsync(AnomalyDetectionRequest request)
        {
            var anomalies = new List<Anomaly>();

            try
            {
                var timeKey = $"user_timing:{request.UserId}";
                var userTimings = await _redisService.GetAsync<List<DateTime>>(timeKey) ?? new List<DateTime>();

                // Add current request time
                userTimings.Add(DateTime.UtcNow);
                if (userTimings.Count > 100)
                {
                    userTimings = userTimings.TakeLast(100).ToList();
                }
                await _redisService.SetAsync(timeKey, userTimings, TimeSpan.FromDays(7));

                // Analyze time intervals
                if (userTimings.Count > 1)
                {
                    var intervals = new List<TimeSpan>();
                    for (int i = 1; i < userTimings.Count; i++)
                    {
                        intervals.Add(userTimings[i] - userTimings[i - 1]);
                    }

                    var avgInterval = TimeSpan.FromTicks((long)intervals.Average(i => i.Ticks));
                    var suspiciousIntervals = intervals.Where(i => i < TimeSpan.FromSeconds(1)).ToList(); // Requests less than 1 second apart

                    if (suspiciousIntervals.Count > 5) // More than 5 suspicious intervals
                    {
                        anomalies.Add(new Anomaly
                        {
                            Id = Guid.NewGuid().ToString(),
                            Type = AnomalyType.Temporal,
                            Description = "Unusual rapid-fire request pattern detected",
                            Confidence = 0.8,
                            Severity = ThreatLevel.High,
                            Metrics = new Dictionary<string, object>
                            {
                                ["suspicious_intervals"] = suspiciousIntervals.Count,
                                ["average_interval"] = avgInterval.TotalSeconds,
                                ["threshold"] = 1.0
                            }
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error analyzing temporal patterns for user {UserId}", request.UserId);
            }

            return anomalies;
        }

        private async Task<List<Anomaly>> AnalyzeNetworkPatternsAsync(AnomalyDetectionRequest request)
        {
            var anomalies = new List<Anomaly>();

            try
            {
                var networkKey = $"network_activity:{request.IpAddress}";
                var networkActivity = await _redisService.GetAsync<Dictionary<string, object>>(networkKey) ?? new Dictionary<string, object>();

                // Track unique users from this IP
                var usersKey = $"ip_users:{request.IpAddress}";
                var users = await _redisService.GetAsync<HashSet<string>>(usersKey) ?? new HashSet<string>();
                users.Add(request.UserId);
                await _redisService.SetAsync(usersKey, users, TimeSpan.FromHours(24));

                // Check for multiple users from same IP
                if (users.Count > 5) // More than 5 users from same IP
                {
                    anomalies.Add(new Anomaly
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = AnomalyType.Network,
                        Description = "Multiple users accessing from same IP address",
                        Confidence = 0.6,
                        Severity = ThreatLevel.Medium,
                        Metrics = new Dictionary<string, object>
                        {
                            ["ip_address"] = request.IpAddress,
                            ["unique_users"] = users.Count,
                            ["threshold"] = 5
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error analyzing network patterns for IP {IpAddress}", request.IpAddress);
            }

            return anomalies;
        }

        private double CalculateAnomalyScore(List<Anomaly> anomalies)
        {
            if (!anomalies.Any())
                return 0.0;

            var totalScore = 0.0;
            var totalWeight = 0.0;

            foreach (var anomaly in anomalies)
            {
                var weight = GetAnomalyWeight(anomaly.Type);
                var score = anomaly.Confidence * GetSeverityMultiplier(anomaly.Severity);
                
                totalScore += score * weight;
                totalWeight += weight;
            }

            return totalWeight > 0 ? totalScore / totalWeight : 0.0;
        }

        private List<string> IdentifyAnomalyPatterns(List<Anomaly> anomalies)
        {
            var patterns = new List<string>();

            if (anomalies.Any(a => a.Type == AnomalyType.Temporal))
                patterns.Add("rapid_fire_requests");

            if (anomalies.Any(a => a.Type == AnomalyType.Network))
                patterns.Add("multiple_users_same_ip");

            if (anomalies.Any(a => a.Type == AnomalyType.Behavioral))
                patterns.Add("unusual_endpoint_access");

            return patterns;
        }

        private async Task<string> ExecuteResponseActionAsync(string action, AutomatedResponseRequest request)
        {
            switch (action.ToLower())
            {
                case "block_request":
                    return await BlockRequestAsync(request);
                case "log_incident":
                    return await LogIncidentAsync(request);
                case "notify_admin":
                    return await NotifyAdminAsync(request);
                case "increase_rate_limit":
                    return await IncreaseRateLimitAsync(request);
                case "temporary_block":
                    return await TemporaryBlockAsync(request);
                default:
                    return $"Unknown action: {action}";
            }
        }

        private async Task<string> BlockRequestAsync(AutomatedResponseRequest request)
        {
            try
            {
                // In a real implementation, this would block the IP/user
                var blockKey = $"blocked:{request.IncidentId}";
                await _redisService.SetAsync(blockKey, DateTime.UtcNow, TimeSpan.FromHours(1));
                return "Request blocked successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error blocking request for incident {IncidentId}", request.IncidentId);
                return $"Error blocking request: {ex.Message}";
            }
        }

        private async Task<string> LogIncidentAsync(AutomatedResponseRequest request)
        {
            try
            {
                var incident = await CreateIncidentAsync(new CreateIncidentRequest
                {
                    Title = $"Automated Response: {request.ThreatLevel} Threat Detected",
                    Description = $"Automated response triggered for incident {request.IncidentId}",
                    Severity = request.ThreatLevel,
                    AssignedTo = "system",
                    Tags = new List<string> { "automated", "threat_detection" }
                });
                return $"Incident logged: {incident.Id}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging incident for automated response {IncidentId}", request.IncidentId);
                return $"Error logging incident: {ex.Message}";
            }
        }

        private async Task<string> NotifyAdminAsync(AutomatedResponseRequest request)
        {
            try
            {
                // In a real implementation, this would send notifications
                var notificationKey = $"notification:{request.IncidentId}";
                await _redisService.SetAsync(notificationKey, "Admin notification sent", TimeSpan.FromHours(24));
                return "Admin notification sent";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending admin notification for incident {IncidentId}", request.IncidentId);
                return $"Error sending notification: {ex.Message}";
            }
        }

        private async Task<string> IncreaseRateLimitAsync(AutomatedResponseRequest request)
        {
            try
            {
                // In a real implementation, this would adjust rate limiting
                var rateLimitKey = $"rate_limit_adjusted:{request.IncidentId}";
                await _redisService.SetAsync(rateLimitKey, "Rate limit increased", TimeSpan.FromMinutes(30));
                return "Rate limit increased";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adjusting rate limit for incident {IncidentId}", request.IncidentId);
                return $"Error adjusting rate limit: {ex.Message}";
            }
        }

        private async Task<string> TemporaryBlockAsync(AutomatedResponseRequest request)
        {
            try
            {
                // In a real implementation, this would temporarily block the source
                var tempBlockKey = $"temp_block:{request.IncidentId}";
                await _redisService.SetAsync(tempBlockKey, DateTime.UtcNow, TimeSpan.FromMinutes(15));
                return "Temporary block applied";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error applying temporary block for incident {IncidentId}", request.IncidentId);
                return $"Error applying temporary block: {ex.Message}";
            }
        }

        private async Task<Dictionary<string, object>> GetUserBehaviorBaselineAsync(string userId, string ipAddress)
        {
            try
            {
                var baselineKey = $"behavior_baseline:{userId}:{ipAddress}";
                var baseline = await _redisService.GetAsync<Dictionary<string, object>>(baselineKey);
                
                if (baseline == null)
                {
                    baseline = new Dictionary<string, object>
                    {
                        ["request_frequency"] = 0,
                        ["common_endpoints"] = new List<string>(),
                        ["usual_hours"] = new List<int> { 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 },
                        ["created_at"] = DateTime.UtcNow
                    };
                    await _redisService.SetAsync(baselineKey, baseline, TimeSpan.FromDays(30));
                }
                
                return baseline;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error getting behavior baseline for user {UserId}", userId);
                return new Dictionary<string, object>();
            }
        }

        private bool IsPrivateIpAddress(string ipAddress)
        {
            if (string.IsNullOrEmpty(ipAddress))
                return false;

            var parts = ipAddress.Split('.');
            if (parts.Length != 4)
                return false;

            if (!int.TryParse(parts[0], out int first) || !int.TryParse(parts[1], out int second))
                return false;

            return (first == 10) || 
                   (first == 172 && second >= 16 && second <= 31) || 
                   (first == 192 && second == 168);
        }

        private bool IsKnownMaliciousIp(string ipAddress)
        {
            // In production, this would check against threat intelligence feeds
            // For now, we'll use a simple list of known test IPs
            var knownMaliciousIps = new[] { "192.168.1.100", "10.0.0.50" };
            return knownMaliciousIps.Contains(ipAddress);
        }

        private bool IsSuspiciousUserAgent(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return false;

            var suspiciousPatterns = new[]
            {
                @"bot|crawler|spider",
                @"curl|wget|python",
                @"sqlmap|nikto|nmap",
                @"admin|root|test"
            };

            return suspiciousPatterns.Any(pattern => Regex.IsMatch(userAgent, pattern, RegexOptions.IgnoreCase));
        }

        private bool IsSensitiveEndpoint(string endpoint)
        {
            var sensitivePatterns = new[]
            {
                @"/admin",
                @"/api/admin",
                @"/user/password",
                @"/settings",
                @"/config"
            };

            return sensitivePatterns.Any(pattern => Regex.IsMatch(endpoint, pattern, RegexOptions.IgnoreCase));
        }

        private double GetIndicatorWeight(string indicatorType)
        {
            return indicatorType switch
            {
                "ip_malicious" => 1.0,
                "pattern_sql-injection" => 0.9,
                "pattern_xss" => 0.9,
                "high_frequency" => 0.8,
                "user_agent_suspicious" => 0.6,
                "unusual_timing" => 0.4,
                _ => 0.5
            };
        }

        private double GetAnomalyWeight(AnomalyType anomalyType)
        {
            return anomalyType switch
            {
                AnomalyType.Temporal => 0.8,
                AnomalyType.Network => 0.7,
                AnomalyType.Behavioral => 0.6,
                AnomalyType.Application => 0.5,
                AnomalyType.Data => 0.4,
                _ => 0.5
            };
        }

        private double GetSeverityMultiplier(ThreatLevel severity)
        {
            return severity switch
            {
                ThreatLevel.Critical => 1.0,
                ThreatLevel.High => 0.8,
                ThreatLevel.Medium => 0.6,
                ThreatLevel.Low => 0.4,
                _ => 0.5
            };
        }

        #endregion
    }
}
