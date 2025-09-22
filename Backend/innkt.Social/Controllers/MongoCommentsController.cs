using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using innkt.Social.DTOs;
using innkt.Social.Services;
using System.Security.Claims;

namespace innkt.Social.Controllers;

/// <summary>
/// MongoDB-based comments controller for efficient social media operations
/// </summary>
[ApiController]
[Route("api/mongo/comments")]
[Authorize]
public class MongoCommentsController : ControllerBase
{
    private readonly IMongoCommentService _commentService;
    private readonly ILogger<MongoCommentsController> _logger;

    public MongoCommentsController(IMongoCommentService commentService, ILogger<MongoCommentsController> logger)
    {
        _commentService = commentService;
        _logger = logger;
    }

    /// <summary>
    /// Get comments for a post
    /// </summary>
    [HttpGet("post/{postId}")]
    public async Task<ActionResult<CommentListResponse>> GetPostComments(
        Guid postId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var response = await _commentService.GetPostCommentsAsync(postId, page, pageSize, currentUserId);
            
            _logger.LogInformation("Retrieved {Count} comments for post {PostId}", response.Comments.Count, postId);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Post {PostId} not found", postId);
            return NotFound(new { error = "Post not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments for post {PostId}", postId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Create a new comment
    /// </summary>
    [HttpPost("post/{postId}")]
    public async Task<ActionResult<CommentResponse>> CreateComment(Guid postId, [FromBody] CreateCommentRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { error = "Comment content is required" });
            }

            if (request.Content.Length > 280)
            {
                return BadRequest(new { error = "Comment content cannot exceed 280 characters" });
            }

            var currentUserId = GetCurrentUserId();
            var response = await _commentService.CreateCommentAsync(postId, currentUserId, request);
            
            _logger.LogInformation("Created comment {CommentId} for post {PostId} by user {UserId}", 
                response.Id, postId, currentUserId);
            
            return CreatedAtAction(nameof(GetComment), new { commentId = response.Id }, response);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Post {PostId} not found for comment creation", postId);
            return NotFound(new { error = "Post not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment for post {PostId}", postId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get a specific comment by ID
    /// </summary>
    [HttpGet("{commentId}")]
    public async Task<ActionResult<CommentResponse>> GetComment(Guid commentId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var response = await _commentService.GetCommentByIdAsync(commentId, currentUserId);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Comment {CommentId} not found", commentId);
            return NotFound(new { error = "Comment not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comment {CommentId}", commentId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete a comment
    /// </summary>
    [HttpDelete("{commentId}")]
    public async Task<ActionResult> DeleteComment(Guid commentId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var deleted = await _commentService.DeleteCommentAsync(commentId, currentUserId);
            
            if (!deleted)
            {
                return NotFound(new { error = "Comment not found or you don't have permission to delete it" });
            }

            _logger.LogInformation("Deleted comment {CommentId} by user {UserId}", commentId, currentUserId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}
