using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using System.Collections.Generic; // Added for Dictionary

namespace innkt.NeuroSpark.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThreatDetectionController : ControllerBase
    {
        private readonly IThreatDetectionService _threatDetectionService;
        private readonly ILogger<ThreatDetectionController> _logger;

        public ThreatDetectionController(IThreatDetectionService threatDetectionService, ILogger<ThreatDetectionController> logger)
        {
            _threatDetectionService = threatDetectionService;
            _logger = logger;
        }

        /// <summary>
        /// Analyze a request for potential threats
        /// </summary>
        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeRequest([FromBody] ThreatAnalysisRequest request)
        {
            try
            {
                var result = await _threatDetectionService.AnalyzeRequestAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing request for threats");
                return StatusCode(500, new { error = "Internal server error during threat analysis" });
            }
        }

        /// <summary>
        /// Detect anomalies in user behavior
        /// </summary>
        [HttpPost("anomaly/detect")]
        public async Task<IActionResult> DetectAnomalies([FromBody] AnomalyDetectionRequest request)
        {
            try
            {
                var result = await _threatDetectionService.DetectAnomaliesAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error detecting anomalies");
                return StatusCode(500, new { error = "Internal server error during anomaly detection" });
            }
        }

        /// <summary>
        /// Execute automated response actions
        /// </summary>
        [HttpPost("response/execute")]
        public async Task<IActionResult> ExecuteAutomatedResponse([FromBody] AutomatedResponseRequest request)
        {
            try
            {
                var result = await _threatDetectionService.ExecuteAutomatedResponseAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing automated response");
                return StatusCode(500, new { error = "Internal server error during automated response execution" });
            }
        }

        /// <summary>
        /// Get threat metrics for a date range
        /// </summary>
        [HttpGet("metrics")]
        public async Task<IActionResult> GetThreatMetrics([FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            try
            {
                if (from == default)
                    from = DateTime.UtcNow.AddDays(-7);
                if (to == default)
                    to = DateTime.UtcNow;

                var result = await _threatDetectionService.GetThreatMetricsAsync(from, to);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting threat metrics");
                return StatusCode(500, new { error = "Internal server error while retrieving threat metrics" });
            }
        }

        /// <summary>
        /// Get all active security incidents
        /// </summary>
        [HttpGet("incidents/active")]
        public async Task<IActionResult> GetActiveIncidents()
        {
            try
            {
                var result = await _threatDetectionService.GetActiveIncidentsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active incidents");
                return StatusCode(500, new { error = "Internal server error while retrieving active incidents" });
            }
        }

        /// <summary>
        /// Create a new security incident
        /// </summary>
        [HttpPost("incidents")]
        public async Task<IActionResult> CreateIncident([FromBody] CreateIncidentRequest request)
        {
            try
            {
                var result = await _threatDetectionService.CreateIncidentAsync(request);
                return CreatedAtAction(nameof(GetActiveIncidents), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating incident");
                return StatusCode(500, new { error = "Internal server error while creating incident" });
            }
        }

        /// <summary>
        /// Update incident status
        /// </summary>
        [HttpPut("incidents/{incidentId}/status")]
        public async Task<IActionResult> UpdateIncidentStatus(string incidentId, [FromBody] IncidentStatus status)
        {
            try
            {
                var result = await _threatDetectionService.UpdateIncidentStatusAsync(incidentId, status);
                if (result)
                {
                    return Ok(new { message = "Incident status updated successfully" });
                }
                return NotFound(new { error = "Incident not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating incident status");
                return StatusCode(500, new { error = "Internal server error while updating incident status" });
            }
        }

        /// <summary>
        /// Get all threat patterns
        /// </summary>
        [HttpGet("patterns")]
        public async Task<IActionResult> GetThreatPatterns()
        {
            try
            {
                var result = await _threatDetectionService.GetThreatPatternsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting threat patterns");
                return StatusCode(500, new { error = "Internal server error while retrieving threat patterns" });
            }
        }

        /// <summary>
        /// Update a threat pattern
        /// </summary>
        [HttpPut("patterns")]
        public async Task<IActionResult> UpdateThreatPattern([FromBody] ThreatPattern pattern)
        {
            try
            {
                var result = await _threatDetectionService.UpdateThreatPatternAsync(pattern);
                if (result)
                {
                    return Ok(new { message = "Threat pattern updated successfully" });
                }
                return NotFound(new { error = "Threat pattern not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating threat pattern");
                return StatusCode(500, new { error = "Internal server error while updating threat pattern" });
            }
        }

        /// <summary>
        /// Test endpoint for threat detection system
        /// </summary>
        [HttpGet("test")]
        public IActionResult TestThreatDetection()
        {
            return Ok(new
            {
                message = "Threat Detection System is operational",
                timestamp = DateTime.UtcNow,
                features = new[]
                {
                    "Real-time threat analysis",
                    "Machine learning-based anomaly detection",
                    "Automated response systems",
                    "Security incident management",
                    "Threat pattern recognition",
                    "Behavioral analysis",
                    "Network pattern analysis",
                    "Temporal pattern analysis"
                },
                status = "Active"
            });
        }

        /// <summary>
        /// Simulate a suspicious request for testing
        /// </summary>
        [HttpPost("test/suspicious")]
        public async Task<IActionResult> TestSuspiciousRequest()
        {
            try
            {
                var suspiciousRequest = new ThreatAnalysisRequest
                {
                    UserId = "test-user",
                    IpAddress = "192.168.1.100", // Known malicious IP from our test data
                    UserAgent = "sqlmap/1.0", // Suspicious user agent
                    Endpoint = "/api/admin/users?query=SELECT * FROM users WHERE id=1 OR 1=1", // SQL injection attempt
                    Method = "GET",
                    Headers = new Dictionary<string, string>
                    {
                        ["X-Forwarded-For"] = "10.0.0.1",
                        ["User-Agent"] = "sqlmap/1.0"
                    },
                    Timestamp = DateTime.UtcNow
                };

                var result = await _threatDetectionService.AnalyzeRequestAsync(suspiciousRequest);
                return Ok(new
                {
                    message = "Suspicious request analyzed",
                    test_request = suspiciousRequest,
                    analysis_result = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing suspicious request");
                return StatusCode(500, new { error = "Internal server error during suspicious request test" });
            }
        }

        /// <summary>
        /// Test anomaly detection with rapid-fire requests
        /// </summary>
        [HttpPost("test/anomaly")]
        public async Task<IActionResult> TestAnomalyDetection()
        {
            try
            {
                var anomalyRequest = new AnomalyDetectionRequest
                {
                    UserId = "test-user",
                    IpAddress = "127.0.0.1",
                    Endpoint = "/api/test",
                    From = DateTime.UtcNow.AddHours(-1),
                    To = DateTime.UtcNow,
                    Type = AnomalyType.Temporal
                };

                var result = await _threatDetectionService.DetectAnomaliesAsync(anomalyRequest);
                return Ok(new
                {
                    message = "Anomaly detection test completed",
                    test_request = anomalyRequest,
                    detection_result = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing anomaly detection");
                return StatusCode(500, new { error = "Internal server error during anomaly detection test" });
            }
        }

        /// <summary>
        /// Test automated response system
        /// </summary>
        [HttpPost("test/automated-response")]
        public async Task<IActionResult> TestAutomatedResponse()
        {
            try
            {
                var responseRequest = new AutomatedResponseRequest
                {
                    IncidentId = Guid.NewGuid().ToString(),
                    ThreatLevel = ThreatLevel.High,
                    Actions = new List<string> { "log_incident", "notify_admin", "temporary_block" },
                    RequireConfirmation = false,
                    Parameters = new Dictionary<string, object>
                    {
                        ["block_duration"] = 15,
                        ["notification_level"] = "high"
                    }
                };

                var result = await _threatDetectionService.ExecuteAutomatedResponseAsync(responseRequest);
                return Ok(new
                {
                    message = "Automated response test completed",
                    test_request = responseRequest,
                    response_result = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing automated response");
                return StatusCode(500, new { error = "Internal server error during automated response test" });
            }
        }
    }
}
