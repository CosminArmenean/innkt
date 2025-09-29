using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly ITopicAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(ITopicAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get topic analytics
    /// </summary>
    [HttpGet("topic/{topicId}")]
    [RequirePermission("view_analytics")]
    public async Task<ActionResult<TopicAnalyticsResponse>> GetTopicAnalytics(Guid topicId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var analytics = await _analyticsService.GetTopicAnalyticsAsync(topicId, userId);
            return Ok(analytics);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Topic not found");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to view topic analytics");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for topic {TopicId}", topicId);
            return StatusCode(500, "An error occurred while retrieving topic analytics");
        }
    }

    /// <summary>
    /// Get group analytics
    /// </summary>
    [HttpGet("group/{groupId}")]
    [RequirePermission("view_analytics")]
    public async Task<ActionResult<GroupAnalyticsResponse>> GetGroupAnalytics(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var analytics = await _analyticsService.GetGroupAnalyticsAsync(groupId, userId);
            return Ok(analytics);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Group not found");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to view group analytics");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving group analytics");
        }
    }

    /// <summary>
    /// Get topic trends for a group
    /// </summary>
    [HttpGet("group/{groupId}/trends")]
    [RequirePermission("view_analytics")]
    public async Task<ActionResult<List<TopicTrendResponse>>> GetTopicTrends(
        Guid groupId,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            var from = fromDate ?? DateTime.UtcNow.AddDays(-30);
            var to = toDate ?? DateTime.UtcNow;
            
            var trends = await _analyticsService.GetTopicTrendsAsync(groupId, from, to);
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting topic trends for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving topic trends");
        }
    }

    /// <summary>
    /// Get topic engagement for a group
    /// </summary>
    [HttpGet("group/{groupId}/engagement")]
    [RequirePermission("view_analytics")]
    public async Task<ActionResult<List<TopicEngagementResponse>>> GetTopicEngagement(
        Guid groupId,
        [FromQuery] int limit = 10)
    {
        try
        {
            var engagement = await _analyticsService.GetTopicEngagementAsync(groupId, limit);
            return Ok(engagement);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting topic engagement for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving topic engagement");
        }
    }

    /// <summary>
    /// Get topic performance
    /// </summary>
    [HttpGet("topic/{topicId}/performance")]
    [RequirePermission("view_analytics")]
    public async Task<ActionResult<TopicPerformanceResponse>> GetTopicPerformance(Guid topicId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var performance = await _analyticsService.GetTopicPerformanceAsync(topicId, userId);
            return Ok(performance);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Topic not found");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to view topic performance");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance for topic {TopicId}", topicId);
            return StatusCode(500, "An error occurred while retrieving topic performance");
        }
    }

    /// <summary>
    /// Get trending topics for a group
    /// </summary>
    [HttpGet("group/{groupId}/trending")]
    public async Task<ActionResult<List<TopicResponse>>> GetTrendingTopics(
        Guid groupId,
        [FromQuery] int limit = 10)
    {
        try
        {
            var topics = await _analyticsService.GetTrendingTopicsAsync(groupId, limit);
            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending topics for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving trending topics");
        }
    }

    /// <summary>
    /// Get recent topics for a group
    /// </summary>
    [HttpGet("group/{groupId}/recent")]
    public async Task<ActionResult<List<TopicResponse>>> GetRecentTopics(
        Guid groupId,
        [FromQuery] int limit = 10)
    {
        try
        {
            var topics = await _analyticsService.GetRecentTopicsAsync(groupId, limit);
            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent topics for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving recent topics");
        }
    }

    /// <summary>
    /// Get most active topics for a group
    /// </summary>
    [HttpGet("group/{groupId}/most-active")]
    public async Task<ActionResult<List<TopicResponse>>> GetMostActiveTopics(
        Guid groupId,
        [FromQuery] int limit = 10)
    {
        try
        {
            var topics = await _analyticsService.GetMostActiveTopicsAsync(groupId, limit);
            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting most active topics for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving most active topics");
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }
}
