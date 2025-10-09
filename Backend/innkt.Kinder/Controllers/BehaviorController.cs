using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Kinder.Services;
using Confluent.Kafka;
using System.Text.Json;

namespace innkt.Kinder.Controllers;

[ApiController]
[Route("api/kinder/behavior")]
[Authorize]
public class BehaviorController : ControllerBase
{
    private readonly IKinderAuthService _kinderAuthService;
    private readonly ILogger<BehaviorController> _logger;
    private readonly IProducer<string, string> _kafkaProducer;

    public BehaviorController(
        IKinderAuthService kinderAuthService,
        ILogger<BehaviorController> logger,
        IProducer<string, string> kafkaProducer)
    {
        _kinderAuthService = kinderAuthService;
        _logger = logger;
        _kafkaProducer = kafkaProducer;
    }

    /// <summary>
    /// Track kid activity for behavioral scoring
    /// Called by other services (Social, Messaging, etc.)
    /// </summary>
    [HttpPost("track-activity")]
    public async Task<ActionResult> TrackActivity([FromBody] TrackActivityRequest request)
    {
        try
        {
            _logger.LogInformation("📱 Tracking activity for kid {KidAccountId}: {ActivityType}", 
                request.KidAccountId, request.ActivityType);

            // Publish to Kafka for async processing
            var eventData = new
            {
                EventType = "kid-activity-tracked",
                KidAccountId = request.KidAccountId,
                ActivityType = request.ActivityType,
                ContentType = request.ContentType,
                Metadata = request.Metadata,
                Timestamp = DateTime.UtcNow
            };

            var message = new Message<string, string>
            {
                Key = request.KidAccountId.ToString(),
                Value = JsonSerializer.Serialize(eventData)
            };

            await _kafkaProducer.ProduceAsync("kid-activity-tracked", message);

            // Update behavioral metrics based on activity
            await UpdateMetricsFromActivityAsync(request);

            return Ok(new { message = "Activity tracked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error tracking activity");
            return StatusCode(500, new { error = "Failed to track activity" });
        }
    }

    /// <summary>
    /// Get behavioral metrics for a kid
    /// </summary>
    [HttpGet("{kidAccountId}/metrics")]
    public async Task<ActionResult<BehavioralMetricsResponse>> GetMetrics(Guid kidAccountId)
    {
        try
        {
            var maturityScore = await _kinderAuthService.GetMaturityScoreAsync(kidAccountId);

            if (maturityScore == null)
            {
                return NotFound(new { error = "Maturity score not found" });
            }

            return Ok(new BehavioralMetricsResponse
            {
                KidAccountId = kidAccountId,
                TimeManagement = maturityScore.TimeManagement,
                ContentAppropriateness = maturityScore.ContentAppropriateness,
                SocialInteraction = maturityScore.SocialInteraction,
                ResponsibilityScore = maturityScore.ResponsibilityScore,
                SecurityAwareness = maturityScore.SecurityAwareness,
                OverallScore = maturityScore.BehavioralScore,
                LastUpdated = maturityScore.LastUpdated
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting behavioral metrics");
            return StatusCode(500, new { error = "Failed to get metrics" });
        }
    }

    /// <summary>
    /// Update behavioral score manually (for testing or parent input)
    /// </summary>
    [HttpPost("{kidAccountId}/update-score")]
    public async Task<ActionResult> UpdateScore(Guid kidAccountId, [FromBody] UpdateBehavioralScoreRequest request)
    {
        try
        {
            var metrics = new Services.BehavioralMetrics
            {
                TimeManagement = request.TimeManagement,
                ContentAppropriateness = request.ContentAppropriateness,
                SocialInteraction = request.SocialInteraction,
                ResponsibilityScore = request.ResponsibilityScore,
                SecurityAwareness = request.SecurityAwareness
            };

            var success = await _kinderAuthService.UpdateBehavioralMetricsAsync(kidAccountId, metrics);

            if (!success)
                return NotFound(new { error = "Kid account not found" });

            // Recalculate maturity score
            var updatedScore = await _kinderAuthService.CalculateMaturityScoreAsync(kidAccountId);

            return Ok(new { 
                message = "Behavioral score updated",
                maturityScore = updatedScore
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating behavioral score");
            return StatusCode(500, new { error = "Failed to update score" });
        }
    }

    /// <summary>
    /// Get activity history for a kid
    /// </summary>
    [HttpGet("{kidAccountId}/history")]
    public async Task<ActionResult<List<ActivityHistoryItem>>> GetHistory(
        Guid kidAccountId, 
        [FromQuery] int days = 7)
    {
        try
        {
            // TODO: Implement activity history from database
            // For now, return mock data structure
            return Ok(new List<ActivityHistoryItem>());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting activity history");
            return StatusCode(500, new { error = "Failed to get history" });
        }
    }

    #region Private Methods

    private async Task UpdateMetricsFromActivityAsync(TrackActivityRequest request)
    {
        try
        {
            var maturityScore = await _kinderAuthService.GetMaturityScoreAsync(request.KidAccountId);
            if (maturityScore == null) return;

            // Update metrics based on activity type
            switch (request.ActivityType)
            {
                case "post_created":
                case "comment_posted":
                    // Improve content appropriateness if educational
                    if (request.ContentType == "educational")
                    {
                        maturityScore.ContentAppropriateness = Math.Min(100, maturityScore.ContentAppropriateness + 0.5);
                        maturityScore.ResponsibilityScore = Math.Min(100, maturityScore.ResponsibilityScore + 0.3);
                    }
                    break;

                case "login_on_time":
                    maturityScore.TimeManagement = Math.Min(100, maturityScore.TimeManagement + 0.5);
                    break;

                case "completed_task":
                    maturityScore.ResponsibilityScore = Math.Min(100, maturityScore.ResponsibilityScore + 1.0);
                    break;

                case "positive_interaction":
                    maturityScore.SocialInteraction = Math.Min(100, maturityScore.SocialInteraction + 0.5);
                    break;

                case "security_aware_action":
                    maturityScore.SecurityAwareness = Math.Min(100, maturityScore.SecurityAwareness + 1.0);
                    break;

                case "inappropriate_content_attempt":
                    maturityScore.ContentAppropriateness = Math.Max(0, maturityScore.ContentAppropriateness - 2.0);
                    maturityScore.SecurityAwareness = Math.Max(0, maturityScore.SecurityAwareness - 1.0);
                    break;

                case "time_violation":
                    maturityScore.TimeManagement = Math.Max(0, maturityScore.TimeManagement - 1.0);
                    break;
            }

            // Save updated metrics
            var metrics = new Services.BehavioralMetrics
            {
                TimeManagement = maturityScore.TimeManagement,
                ContentAppropriateness = maturityScore.ContentAppropriateness,
                SocialInteraction = maturityScore.SocialInteraction,
                ResponsibilityScore = maturityScore.ResponsibilityScore,
                SecurityAwareness = maturityScore.SecurityAwareness
            };

            await _kinderAuthService.UpdateBehavioralMetricsAsync(request.KidAccountId, metrics);

            _logger.LogInformation("✅ Behavioral metrics updated for kid {KidAccountId}", request.KidAccountId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating metrics from activity");
        }
    }

    #endregion
}

#region Request/Response Models

public class TrackActivityRequest
{
    public Guid KidAccountId { get; set; }
    public string ActivityType { get; set; } = string.Empty; // post_created, login_on_time, etc.
    public string? ContentType { get; set; } // educational, social, entertainment
    public Dictionary<string, object>? Metadata { get; set; }
}

public class BehavioralMetricsResponse
{
    public Guid KidAccountId { get; set; }
    public double TimeManagement { get; set; }
    public double ContentAppropriateness { get; set; }
    public double SocialInteraction { get; set; }
    public double ResponsibilityScore { get; set; }
    public double SecurityAwareness { get; set; }
    public int OverallScore { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class UpdateBehavioralScoreRequest
{
    public double TimeManagement { get; set; }
    public double ContentAppropriateness { get; set; }
    public double SocialInteraction { get; set; }
    public double ResponsibilityScore { get; set; }
    public double SecurityAwareness { get; set; }
}

public class ActivityHistoryItem
{
    public Guid Id { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public DateTime Timestamp { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

#endregion

