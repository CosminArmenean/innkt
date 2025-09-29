using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TopicsController : ControllerBase
{
    private readonly ITopicService _topicService;
    private readonly ILogger<TopicsController> _logger;

    public TopicsController(ITopicService topicService, ILogger<TopicsController> logger)
    {
        _topicService = topicService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new topic
    /// </summary>
    [HttpPost]
    [RequirePermission("create_topic", "GroupId")]
    public async Task<ActionResult<TopicResponse>> CreateTopic([FromBody] CreateTopicRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var topic = await _topicService.CreateTopicAsync(userId, request);
            return CreatedAtAction(nameof(GetTopic), new { id = topic.Id }, topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating topic for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the topic");
        }
    }

    /// <summary>
    /// Get a specific topic by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TopicResponse>> GetTopic(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var topic = await _topicService.GetTopicByIdAsync(id, userId);
            
            if (topic == null)
                return NotFound("Topic not found");
                
            return Ok(topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting topic {TopicId}", id);
            return StatusCode(500, "An error occurred while retrieving the topic");
        }
    }

    /// <summary>
    /// Get topics for a group
    /// </summary>
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<List<TopicResponse>>> GetGroupTopics(
        Guid groupId,
        [FromQuery] Guid? subgroupId = null,
        [FromQuery] string? status = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var topics = await _topicService.GetGroupTopicsAsync(groupId, userId, subgroupId, status);
            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting topics for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving topics");
        }
    }

    /// <summary>
    /// Update topic status (pause, resume, archive)
    /// </summary>
    [HttpPut("{id}/status")]
    [RequirePermission("moderate_content")]
    public async Task<ActionResult<TopicResponse>> UpdateTopicStatus(Guid id, [FromBody] UpdateTopicStatusRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var topic = await _topicService.UpdateTopicStatusAsync(id, userId, request);
            return Ok(topic);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update this topic");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Topic not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating topic status {TopicId}", id);
            return StatusCode(500, "An error occurred while updating the topic status");
        }
    }

    /// <summary>
    /// Delete a topic
    /// </summary>
    [HttpDelete("{id}")]
    [RequirePermission("moderate_content")]
    public async Task<ActionResult> DeleteTopic(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _topicService.DeleteTopicAsync(id, userId);
            
            if (!success)
                return NotFound("Topic not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to delete this topic");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting topic {TopicId}", id);
            return StatusCode(500, "An error occurred while deleting the topic");
        }
    }

    /// <summary>
    /// Get posts for a topic
    /// </summary>
    [HttpGet("{id}/posts")]
    public async Task<ActionResult<TopicPostListResponse>> GetTopicPosts(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var posts = await _topicService.GetTopicPostsAsync(id, userId, page, pageSize);
            return Ok(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for topic {TopicId}", id);
            return StatusCode(500, "An error occurred while retrieving topic posts");
        }
    }

    /// <summary>
    /// Create a post in a topic
    /// </summary>
    [HttpPost("{id}/posts")]
    [RequirePermission("post_in_topic")]
    public async Task<ActionResult<TopicPostResponse>> CreateTopicPost(Guid id, [FromBody] CreateTopicPostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _topicService.CreateTopicPostAsync(id, userId, request);
            return CreatedAtAction(nameof(GetTopicPost), new { id = post.Id }, post);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post in topic {TopicId}", id);
            return StatusCode(500, "An error occurred while creating the topic post");
        }
    }

    /// <summary>
    /// Get a specific topic post
    /// </summary>
    [HttpGet("posts/{id}")]
    public async Task<ActionResult<TopicPostResponse>> GetTopicPost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _topicService.GetTopicPostByIdAsync(id, userId);
            
            if (post == null)
                return NotFound("Topic post not found");
                
            return Ok(post);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting topic post {PostId}", id);
            return StatusCode(500, "An error occurred while retrieving the topic post");
        }
    }

    /// <summary>
    /// Pin a topic post
    /// </summary>
    [HttpPost("posts/{id}/pin")]
    [RequirePermission("moderate_content")]
    public async Task<ActionResult> PinTopicPost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _topicService.PinTopicPostAsync(id, userId);
            
            if (!success)
                return NotFound("Topic post not found");
                
            return Ok(new { message = "Post pinned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error pinning topic post {PostId}", id);
            return StatusCode(500, "An error occurred while pinning the post");
        }
    }

    /// <summary>
    /// Unpin a topic post
    /// </summary>
    [HttpPost("posts/{id}/unpin")]
    [RequirePermission("moderate_content")]
    public async Task<ActionResult> UnpinTopicPost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _topicService.UnpinTopicPostAsync(id, userId);
            
            if (!success)
                return NotFound("Topic post not found");
                
            return Ok(new { message = "Post unpinned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unpinning topic post {PostId}", id);
            return StatusCode(500, "An error occurred while unpinning the post");
        }
    }

    /// <summary>
    /// Delete a topic post
    /// </summary>
    [HttpDelete("posts/{id}")]
    public async Task<ActionResult> DeleteTopicPost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _topicService.DeleteTopicPostAsync(id, userId);
            
            if (!success)
                return NotFound("Topic post not found");
                
            return Ok(new { message = "Post deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting topic post {PostId}", id);
            return StatusCode(500, "An error occurred while deleting the post");
        }
    }

    /// <summary>
    /// Get topic analytics
    /// </summary>
    [HttpGet("{id}/analytics")]
    [RequirePermission("view_analytics")]
    public async Task<ActionResult<TopicAnalyticsResponse>> GetTopicAnalytics(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var analytics = await _topicService.GetTopicAnalyticsAsync(id, userId);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for topic {TopicId}", id);
            return StatusCode(500, "An error occurred while retrieving topic analytics");
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
            var topics = await _topicService.GetTrendingTopicsAsync(groupId, limit);
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
            var topics = await _topicService.GetRecentTopicsAsync(groupId, limit);
            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent topics for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving recent topics");
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

