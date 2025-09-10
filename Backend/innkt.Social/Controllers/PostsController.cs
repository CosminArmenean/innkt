using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.DTOs;
using System.Security.Claims;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILogger<PostsController> _logger;

    public PostsController(IPostService postService, ILogger<PostsController> logger)
    {
        _postService = postService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new post
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<PostResponse>> CreatePost([FromBody] CreatePostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _postService.CreatePostAsync(userId, request);
            return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the post");
        }
    }

    /// <summary>
    /// Get a specific post by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<PostResponse>> GetPost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _postService.GetPostByIdAsync(id, userId);
            
            if (post == null)
                return NotFound("Post not found");
                
            return Ok(post);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting post {PostId}", id);
            return StatusCode(500, "An error occurred while retrieving the post");
        }
    }

    /// <summary>
    /// Get posts by a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<PostListResponse>> GetUserPosts(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var posts = await _postService.GetUserPostsAsync(userId, page, pageSize, currentUserId);
            return Ok(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving posts");
        }
    }

    /// <summary>
    /// Get user's feed (posts from followed users)
    /// </summary>
    [HttpGet("feed")]
    public async Task<ActionResult<PostListResponse>> GetFeed([FromQuery] FeedRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var posts = await _postService.GetFeedAsync(userId, request);
            return Ok(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feed for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while retrieving the feed");
        }
    }

    /// <summary>
    /// Update a post
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<PostResponse>> UpdatePost(Guid id, [FromBody] UpdatePostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _postService.UpdatePostAsync(id, userId, request);
            return Ok(post);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can only update your own posts");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Post not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating post {PostId}", id);
            return StatusCode(500, "An error occurred while updating the post");
        }
    }

    /// <summary>
    /// Delete a post
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeletePost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _postService.DeletePostAsync(id, userId);
            
            if (!success)
                return NotFound("Post not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can only delete your own posts");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {PostId}", id);
            return StatusCode(500, "An error occurred while deleting the post");
        }
    }

    /// <summary>
    /// Like a post
    /// </summary>
    [HttpPost("{id}/like")]
    public async Task<ActionResult> LikePost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _postService.LikePostAsync(id, userId);
            
            if (!success)
                return BadRequest("Unable to like post");
                
            return Ok(new { message = "Post liked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking post {PostId}", id);
            return StatusCode(500, "An error occurred while liking the post");
        }
    }

    /// <summary>
    /// Unlike a post
    /// </summary>
    [HttpDelete("{id}/like")]
    public async Task<ActionResult> UnlikePost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _postService.UnlikePostAsync(id, userId);
            
            if (!success)
                return BadRequest("Unable to unlike post");
                
            return Ok(new { message = "Post unliked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking post {PostId}", id);
            return StatusCode(500, "An error occurred while unliking the post");
        }
    }

    /// <summary>
    /// Pin a post
    /// </summary>
    [HttpPost("{id}/pin")]
    public async Task<ActionResult> PinPost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _postService.PinPostAsync(id, userId);
            
            if (!success)
                return BadRequest("Unable to pin post");
                
            return Ok(new { message = "Post pinned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error pinning post {PostId}", id);
            return StatusCode(500, "An error occurred while pinning the post");
        }
    }

    /// <summary>
    /// Unpin a post
    /// </summary>
    [HttpDelete("{id}/pin")]
    public async Task<ActionResult> UnpinPost(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _postService.UnpinPostAsync(id, userId);
            
            if (!success)
                return BadRequest("Unable to unpin post");
                
            return Ok(new { message = "Post unpinned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unpinning post {PostId}", id);
            return StatusCode(500, "An error occurred while unpinning the post");
        }
    }

    /// <summary>
    /// Search posts
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<PostListResponse>> SearchPosts([FromQuery] SearchRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var posts = await _postService.SearchPostsAsync(request, currentUserId);
            return Ok(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching posts");
            return StatusCode(500, "An error occurred while searching posts");
        }
    }

    /// <summary>
    /// Get trending posts
    /// </summary>
    [HttpGet("trending")]
    public async Task<ActionResult<PostListResponse>> GetTrendingPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var posts = await _postService.GetTrendingPostsAsync(page, pageSize, currentUserId);
            return Ok(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending posts");
            return StatusCode(500, "An error occurred while retrieving trending posts");
        }
    }

    /// <summary>
    /// Get posts by hashtag
    /// </summary>
    [HttpGet("hashtag/{hashtag}")]
    public async Task<ActionResult<PostListResponse>> GetPostsByHashtag(
        string hashtag, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var posts = await _postService.GetPostsByHashtagAsync(hashtag, page, pageSize, currentUserId);
            return Ok(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts by hashtag {Hashtag}", hashtag);
            return StatusCode(500, "An error occurred while retrieving posts by hashtag");
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
