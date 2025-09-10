using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.DTOs;
using System.Security.Claims;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(ICommentService commentService, ILogger<CommentsController> logger)
    {
        _commentService = commentService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new comment on a post
    /// </summary>
    [HttpPost("post/{postId}")]
    public async Task<ActionResult<CommentResponse>> CreateComment(Guid postId, [FromBody] CreateCommentRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _commentService.CreateCommentAsync(postId, userId, request);
            return CreatedAtAction(nameof(GetComment), new { id = comment.Id }, comment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment for post {PostId}", postId);
            return StatusCode(500, "An error occurred while creating the comment");
        }
    }

    /// <summary>
    /// Get a specific comment by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CommentResponse>> GetComment(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _commentService.GetCommentByIdAsync(id, userId);
            
            if (comment == null)
                return NotFound("Comment not found");
                
            return Ok(comment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comment {CommentId}", id);
            return StatusCode(500, "An error occurred while retrieving the comment");
        }
    }

    /// <summary>
    /// Get comments for a specific post
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
            var comments = await _commentService.GetPostCommentsAsync(postId, page, pageSize, currentUserId);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments for post {PostId}", postId);
            return StatusCode(500, "An error occurred while retrieving comments");
        }
    }

    /// <summary>
    /// Update a comment
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CommentResponse>> UpdateComment(Guid id, [FromBody] UpdateCommentRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var comment = await _commentService.UpdateCommentAsync(id, userId, request);
            return Ok(comment);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can only update your own comments");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Comment not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating comment {CommentId}", id);
            return StatusCode(500, "An error occurred while updating the comment");
        }
    }

    /// <summary>
    /// Delete a comment
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteComment(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _commentService.DeleteCommentAsync(id, userId);
            
            if (!success)
                return NotFound("Comment not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can only delete your own comments");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {CommentId}", id);
            return StatusCode(500, "An error occurred while deleting the comment");
        }
    }

    /// <summary>
    /// Like a comment
    /// </summary>
    [HttpPost("{id}/like")]
    public async Task<ActionResult> LikeComment(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _commentService.LikeCommentAsync(id, userId);
            
            if (!success)
                return BadRequest("Unable to like comment");
                
            return Ok(new { message = "Comment liked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking comment {CommentId}", id);
            return StatusCode(500, "An error occurred while liking the comment");
        }
    }

    /// <summary>
    /// Unlike a comment
    /// </summary>
    [HttpDelete("{id}/like")]
    public async Task<ActionResult> UnlikeComment(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _commentService.UnlikeCommentAsync(id, userId);
            
            if (!success)
                return BadRequest("Unable to unlike comment");
                
            return Ok(new { message = "Comment unliked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking comment {CommentId}", id);
            return StatusCode(500, "An error occurred while unliking the comment");
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
