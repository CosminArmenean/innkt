using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.DTOs;
using innkt.Social.Data;
using innkt.Social.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILogger<PostsController> _logger;
    private readonly SocialDbContext _context;

    public PostsController(IPostService postService, ILogger<PostsController> logger, SocialDbContext context)
    {
        _postService = postService;
        _logger = logger;
        _context = context;
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

    /// <summary>
    /// Create a comment on a post
    /// </summary>
    [HttpPost("{postId}/comments")]
    public async Task<ActionResult<CommentResponse>> CreateComment(Guid postId, [FromBody] CreateCommentRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var commentService = HttpContext.RequestServices.GetRequiredService<ICommentService>();
            var comment = await commentService.CreateCommentAsync(postId, userId, request);
            return CreatedAtAction("GetComment", "Comments", new { id = comment.Id }, comment);
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
    /// Get comments for a post
    /// </summary>
    [HttpGet("{postId}/comments")]
    public async Task<ActionResult<CommentListResponse>> GetPostComments(
        Guid postId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var commentService = HttpContext.RequestServices.GetRequiredService<ICommentService>();
            var comments = await commentService.GetPostCommentsAsync(postId, page, pageSize, currentUserId);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments for post {PostId}", postId);
            return StatusCode(500, "An error occurred while retrieving comments");
        }
    }

    /// <summary>
    /// Vote on a poll post
    /// </summary>
    [HttpPost("{postId}/vote")]
    public async Task<ActionResult> VoteOnPoll(Guid postId, [FromBody] VotePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            // Check if post exists and is a poll
            var post = await _context.Posts.FindAsync(postId);
            if (post == null)
                return NotFound("Post not found");
                
            if (post.PostType != "poll")
                return BadRequest("This post is not a poll");
                
            // Check if poll is still active
            if (post.PollExpiresAt.HasValue && post.PollExpiresAt.Value <= DateTime.UtcNow)
                return BadRequest("This poll has expired");
                
            // Check if user already voted
            var existingVote = await _context.PollVotes
                .FirstOrDefaultAsync(v => v.PostId == postId && v.UserId == userId);
                
            if (existingVote != null)
            {
                // Update existing vote
                existingVote.SelectedOption = request.SelectedOption;
                existingVote.OptionIndex = request.OptionIndex;
            }
            else
            {
                // Create new vote
                var vote = new PollVote
                {
                    PostId = postId,
                    UserId = userId,
                    SelectedOption = request.SelectedOption,
                    OptionIndex = request.OptionIndex
                };
                _context.PollVotes.Add(vote);
            }
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("User {UserId} voted on poll {PostId} with option {Option}", 
                userId, postId, request.SelectedOption);
                
            return Ok(new { message = "Vote recorded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voting on poll {PostId}", postId);
            return StatusCode(500, "An error occurred while recording your vote");
        }
    }

    /// <summary>
    /// Get poll results for a post
    /// </summary>
    [HttpGet("{postId}/poll-results")]
    public async Task<ActionResult<PollResultsResponse>> GetPollResults(Guid postId)
    {
        try
        {
            var post = await _context.Posts
                .Include(p => p.PollVotes)
                .FirstOrDefaultAsync(p => p.Id == postId);
                
            if (post == null)
                return NotFound("Post not found");
                
            if (post.PostType != "poll")
                return BadRequest("This post is not a poll");
                
            var totalVotes = post.PollVotes.Count;
            var results = new List<PollOptionResult>();
            
            if (post.PollOptions != null)
            {
                for (int i = 0; i < post.PollOptions.Length; i++)
                {
                    var option = post.PollOptions[i];
                    var voteCount = post.PollVotes.Count(v => v.OptionIndex == i);
                    var percentage = totalVotes > 0 ? (double)voteCount / totalVotes * 100 : 0;
                    
                    results.Add(new PollOptionResult
                    {
                        Option = option,
                        VoteCount = voteCount,
                        Percentage = Math.Round(percentage, 1)
                    });
                }
            }
            
            var userId = GetCurrentUserId();
            var userVote = await _context.PollVotes
                .FirstOrDefaultAsync(v => v.PostId == postId && v.UserId == userId);
            
            return Ok(new PollResultsResponse
            {
                TotalVotes = totalVotes,
                Results = results,
                IsExpired = post.PollExpiresAt.HasValue && post.PollExpiresAt.Value <= DateTime.UtcNow,
                UserVotedOptionIndex = userVote?.OptionIndex,
                ExpiresAt = post.PollExpiresAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting poll results for post {PostId}", postId);
            return StatusCode(500, "An error occurred while retrieving poll results");
        }
    }

        /// <summary>
        /// Test database connection for posts
        /// </summary>
        [HttpGet("test-db")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> TestPostsDatabase()
        {
            try
            {
                var postCount = await _context.Posts.CountAsync();
                var connectionString = _context.Database.GetConnectionString();
                var databaseName = _context.Database.GetDbConnection().Database;
                
                // Test raw SQL query to bypass Entity Framework model
                var rawQuery = await _context.Database.ExecuteSqlRawAsync("SELECT COUNT(*) FROM \"Posts\"");
                
                // Test specific columns with raw SQL
                var columnTest = await _context.Database.ExecuteSqlRawAsync("SELECT \"Id\", \"Content\" FROM \"Posts\" LIMIT 1");
                
                // Test if PollOptions column exists with raw SQL - try different approach
                try
                {
                    var pollOptionsTest = await _context.Database.ExecuteSqlRawAsync("SELECT \"PollOptions\" FROM \"Posts\" LIMIT 1");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "PollOptions column test failed");
                }
                
                return Ok(new { 
                    message = "Posts database connected", 
                    postCount = postCount,
                    connectionString = connectionString,
                    databaseName = databaseName,
                    rawQueryResult = rawQuery,
                    columnTestResult = columnTest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Posts database test failed");
                return StatusCode(500, new { message = "Posts database test failed", error = ex.Message });
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
