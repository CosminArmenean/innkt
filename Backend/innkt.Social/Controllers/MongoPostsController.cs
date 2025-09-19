using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.DTOs;
using innkt.Social.Models.MongoDB;
using System.Security.Claims;

namespace innkt.Social.Controllers;

/// <summary>
/// MongoDB-based posts controller with optimized user profile caching
/// Provides scalable social media feed functionality
/// </summary>
[ApiController]
[Route("api/v2/[controller]")]
[Authorize]
public class MongoPostsController : ControllerBase
{
    private readonly IMongoPostService _mongoPostService;
    private readonly IRealtimeService _realtimeService;
    private readonly IRepostService _repostService;
    private readonly ILogger<MongoPostsController> _logger;

    public MongoPostsController(
        IMongoPostService mongoPostService, 
        IRealtimeService realtimeService,
        IRepostService repostService,
        ILogger<MongoPostsController> logger)
    {
        _mongoPostService = mongoPostService;
        _realtimeService = realtimeService;
        _repostService = repostService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new post with automatic user profile caching
    /// </summary>
    [HttpPost]
    [AllowAnonymous] // Temporary for testing Change Streams
    public async Task<ActionResult<MongoPostResponse>> CreatePost([FromBody] CreatePostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                // For testing purposes, use a default test user
                userId = Guid.Parse("bdfc4c41-c42e-42e0-a57b-d8301a37b1fe");
                _logger.LogWarning("Using test user ID for anonymous post creation: {UserId}", userId);
            }

            _logger.LogInformation("Creating post for user {UserId}", userId);

            var mongoPost = await _mongoPostService.CreatePostAsync(request, userId);
            var response = MapToResponse(mongoPost);

            _logger.LogInformation("Created post {PostId} for user {UserId}", mongoPost.PostId, userId);
            return CreatedAtAction(nameof(GetPost), new { id = mongoPost.PostId }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post");
            return StatusCode(500, "An error occurred while creating the post");
        }
    }

    /// <summary>
    /// Get a specific post with cached user profile data
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<MongoPostResponse>> GetPost(Guid id)
    {
        try
        {
            var post = await _mongoPostService.GetPostByIdAsync(id);
            if (post == null)
            {
                return NotFound($"Post {id} not found");
            }

            var response = MapToResponse(post);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting post {PostId}", id);
            return StatusCode(500, "An error occurred while retrieving the post");
        }
    }

    /// <summary>
    /// Get personalized feed with cached user profiles (no N+1 queries!)
    /// </summary>
    [HttpGet("feed")]
    public async Task<ActionResult<MongoFeedResponse>> GetFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("Invalid user token");
            }

            _logger.LogInformation("Getting feed for user {UserId}, page {Page}", userId, page);

            var posts = await _mongoPostService.GetFeedAsync(userId, page, pageSize);
            var response = new MongoFeedResponse
            {
                Posts = posts.Select(MapToResponse).ToList(),
                Page = page,
                PageSize = pageSize,
                HasMore = posts.Count == pageSize
            };

            _logger.LogInformation("Retrieved {Count} posts for user {UserId} feed", posts.Count, userId);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feed for user");
            return StatusCode(500, "An error occurred while retrieving the feed");
        }
    }

    /// <summary>
    /// Get public feed with trending algorithm
    /// </summary>
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<ActionResult<MongoFeedResponse>> GetPublicFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            _logger.LogInformation("Getting public feed, page {Page}", page);

            var posts = await _mongoPostService.GetPublicFeedAsync(page, pageSize);
            var response = new MongoFeedResponse
            {
                Posts = posts.Select(MapToResponse).ToList(),
                Page = page,
                PageSize = pageSize,
                HasMore = posts.Count == pageSize
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public feed");
            return StatusCode(500, "An error occurred while retrieving the public feed");
        }
    }

    /// <summary>
    /// Get user's posts with cached profile data
    /// </summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<MongoFeedResponse>> GetUserPosts(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var posts = await _mongoPostService.GetUserPostsAsync(userId, page, pageSize);
            var response = new MongoFeedResponse
            {
                Posts = posts.Select(MapToResponse).ToList(),
                Page = page,
                PageSize = pageSize,
                HasMore = posts.Count == pageSize
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving user posts");
        }
    }

    /// <summary>
    /// Like a post with real-time engagement updates
    /// </summary>
    [HttpPost("{postId}/like")]
    public async Task<ActionResult> LikePost(Guid postId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("Invalid user token");
            }

            var success = await _mongoPostService.LikePostAsync(postId, userId);
            if (!success)
            {
                return BadRequest("Could not like the post");
            }

            // Get post details for notification
            var post = await _mongoPostService.GetPostByIdAsync(postId);
            if (post != null)
            {
                // Send real-time notification
                _ = Task.Run(async () => await _realtimeService.NotifyPostLikedAsync(postId, userId, post.UserId));
            }

            return Ok(new { Message = "Post liked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking post {PostId}", postId);
            return StatusCode(500, "An error occurred while liking the post");
        }
    }

    /// <summary>
    /// Unlike a post
    /// </summary>
    [HttpDelete("{postId}/like")]
    public async Task<ActionResult> UnlikePost(Guid postId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("Invalid user token");
            }

            var success = await _mongoPostService.UnlikePostAsync(postId, userId);
            if (!success)
            {
                return BadRequest("Could not unlike the post");
            }

            return Ok(new { Message = "Post unliked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking post {PostId}", postId);
            return StatusCode(500, "An error occurred while unliking the post");
        }
    }

    /// <summary>
    /// Vote on a poll with user validation
    /// </summary>
    [HttpPost("{postId}/vote")]
    public async Task<ActionResult> VoteOnPoll(Guid postId, [FromBody] VotePollRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("Invalid user token");
            }

            var success = await _mongoPostService.VoteOnPollAsync(postId, userId, request.SelectedOption, request.OptionIndex);
            if (!success)
            {
                return BadRequest("Could not vote on poll. You may have already voted.");
            }

            return Ok(new { Message = "Vote recorded successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voting on poll {PostId}", postId);
            return StatusCode(500, "An error occurred while voting");
        }
    }

    /// <summary>
    /// Get poll results with user vote status
    /// </summary>
    [HttpGet("{postId}/poll-results")]
    [AllowAnonymous]
    public async Task<ActionResult<PollResultsResponse>> GetPollResults(Guid postId)
    {
        try
        {
            var userId = GetCurrentUserIdOrNull();
            var results = await _mongoPostService.GetPollResultsAsync(postId, userId);
            
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting poll results for post {PostId}", postId);
            return StatusCode(500, "An error occurred while retrieving poll results");
        }
    }

    /// <summary>
    /// Refresh user profile cache for posts (admin/maintenance endpoint)
    /// </summary>
    [HttpPost("refresh-user-cache/{userId}")]
    public async Task<ActionResult> RefreshUserCache(Guid userId)
    {
        try
        {
            var success = await _mongoPostService.RefreshUserCacheAsync(userId);
            if (!success)
            {
                return BadRequest("Could not refresh user cache");
            }

            return Ok(new { Message = "User cache refreshed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing user cache for {UserId}", userId);
            return StatusCode(500, "An error occurred while refreshing user cache");
        }
    }

    /// <summary>
    /// Refresh all stale user caches (maintenance endpoint)
    /// </summary>
    [HttpPost("refresh-stale-caches")]
    public async Task<ActionResult> RefreshStaleUserCaches()
    {
        try
        {
            var refreshedCount = await _mongoPostService.RefreshStaleUserCachesAsync();
            return Ok(new { Message = $"Refreshed {refreshedCount} stale user caches" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing stale user caches");
            return StatusCode(500, "An error occurred while refreshing stale caches");
        }
    }

    /// <summary>
    /// Update a post
    /// </summary>
    [HttpPut("{postId}")]
    [AllowAnonymous] // Temporary for testing
    public async Task<ActionResult<MongoPostResponse>> UpdatePost(Guid postId, [FromBody] UpdatePostRequest request)
    {
        try
        {
            var success = await _mongoPostService.UpdatePostAsync(postId, request);
            if (!success)
            {
                return NotFound($"Post with ID {postId} not found or could not be updated.");
            }

            var updatedPost = await _mongoPostService.GetPostByIdAsync(postId);
            return Ok(updatedPost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating post {PostId}", postId);
            return StatusCode(500, "An error occurred while updating the post");
        }
    }

    /// <summary>
    /// Delete a post
    /// </summary>
    [HttpDelete("{postId}")]
    [AllowAnonymous] // Temporary for testing
    public async Task<ActionResult> DeletePost(Guid postId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                userId = Guid.Parse("bdfc4c41-c42e-42e0-a57b-d8301a37b1fe"); // Test user
            }

            var success = await _mongoPostService.DeletePostAsync(postId, userId);
            if (!success)
            {
                return NotFound($"Post with ID {postId} not found or could not be deleted.");
            }

            return Ok(new { Message = "Post deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {PostId}", postId);
            return StatusCode(500, "An error occurred while deleting the post");
        }
    }

    /// <summary>
    /// Add a comment to a post
    /// </summary>
    [HttpPost("{postId}/comment")]
    [AllowAnonymous] // Temporary for testing
    public async Task<ActionResult> AddComment(Guid postId, [FromBody] CreateCommentRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                userId = Guid.Parse("bdfc4c41-c42e-42e0-a57b-d8301a37b1fe"); // Test user
            }

            var success = await _mongoPostService.AddCommentAsync(postId, userId, request.Content);
            if (!success)
            {
                return BadRequest("Could not add comment to the post");
            }

            return Ok(new { Message = "Comment added successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment to post {PostId}", postId);
            return StatusCode(500, "An error occurred while adding the comment");
        }
    }

    /// <summary>
    /// Get comments for a post
    /// </summary>
    [HttpGet("{postId}/comments")]
    [AllowAnonymous]
    public async Task<ActionResult> GetComments(Guid postId, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        try
        {
            // For now, return empty comments since we're focusing on posts
            // In a real implementation, this would query a MongoDB comments collection
            return Ok(new { comments = new object[0], totalCount = 0, hasMore = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments for post {PostId}", postId);
            return StatusCode(500, "An error occurred while retrieving comments");
        }
    }

    /// <summary>
    /// Upload media for a post
    /// </summary>
    [HttpPost("{postId}/media")]
    [AllowAnonymous] // Temporary for testing
    public async Task<ActionResult> UploadMedia(Guid postId, [FromForm] IFormFileCollection files)
    {
        try
        {
            // For now, return success without actual upload
            // In a real implementation, this would handle file upload to cloud storage
            return Ok(new { Message = "Media upload placeholder - not implemented yet" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading media for post {PostId}", postId);
            return StatusCode(500, "An error occurred while uploading media");
        }
    }

    /// <summary>
    /// Share a post
    /// </summary>
    [HttpPost("{postId}/share")]
    [AllowAnonymous] // Temporary for testing
    public async Task<ActionResult> SharePost(Guid postId, [FromBody] object shareData)
    {
        try
        {
            // For now, return success without actual sharing logic
            // In a real implementation, this would create a share record and notify users
            return Ok(new { Message = "Post share placeholder - not implemented yet" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sharing post {PostId}", postId);
            return StatusCode(500, "An error occurred while sharing the post");
        }
    }

    // Helper methods
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return Guid.Empty;
    }

    private Guid? GetCurrentUserIdOrNull()
    {
        var userId = GetCurrentUserId();
        return userId == Guid.Empty ? null : userId;
    }

    private MongoPostResponse MapToResponse(MongoPost post)
    {
        return new MongoPostResponse
        {
            Id = post.PostId,
            UserId = post.UserId,
            Content = post.Content,
            PostType = post.PostType,
            MediaUrls = post.MediaUrls,
            Hashtags = post.Hashtags,
            Mentions = post.Mentions,
            Location = post.Location,
            IsPublic = post.IsPublic,
            IsPinned = post.IsPinned,
            PollOptions = post.PollOptions,
            PollDuration = post.PollDuration,
            PollExpiresAt = post.PollExpiresAt,
            LikesCount = post.LikesCount,
            CommentsCount = post.CommentsCount,
            SharesCount = post.SharesCount,
            ViewsCount = post.ViewsCount,
            FeedScore = post.FeedScore,
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
            
            // Cached user profile data - NO additional API calls needed!
            UserProfile = post.UserSnapshot != null ? new CachedUserProfile
            {
                UserId = Guid.Parse(post.UserSnapshot.UserId),
                DisplayName = post.UserSnapshot.DisplayName,
                Username = post.UserSnapshot.Username,
                AvatarUrl = post.UserSnapshot.AvatarUrl,
                IsVerified = post.UserSnapshot.IsVerified,
                IsActive = post.UserSnapshot.IsActive,
                LastUpdated = post.UserSnapshot.LastUpdated
            } : null
        };
    }

    /// <summary>
    /// Create a repost of an existing post
    /// </summary>
    [HttpPost("{postId}/repost")]
    public async Task<ActionResult<CreateRepostResponse>> CreateRepost(Guid postId, [FromBody] CreateRepostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User ID not found in token");
            }

            // Override the original post ID with the route parameter
            request.OriginalPostId = postId;

            _logger.LogInformation("Creating repost for user {UserId} on post {PostId}", userId, postId);

            var repost = await _repostService.CreateRepostAsync(request, userId);

            var response = new CreateRepostResponse
            {
                Repost = repost,
                Message = repost.RepostType == "quote" 
                    ? "Quote repost created successfully" 
                    : "Repost created successfully"
            };

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid repost operation for post {PostId}", postId);
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid repost request for post {PostId}", postId);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating repost for post {PostId}", postId);
            return StatusCode(500, "An error occurred while creating the repost");
        }
    }

    /// <summary>
    /// Check if current user can repost a specific post
    /// </summary>
    [HttpGet("{postId}/can-repost")]
    public async Task<ActionResult<object>> CanRepost(Guid postId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User ID not found in token");
            }

            var canRepost = await _repostService.CanUserRepostAsync(userId, postId);
            var hasReposted = await _repostService.HasUserRepostedAsync(userId, postId);
            var repostCount = await _repostService.GetUserRepostCountInLastHourAsync(userId);

            return Ok(new
            {
                CanRepost = canRepost,
                HasAlreadyReposted = hasReposted,
                RepostCountLastHour = repostCount,
                MaxRepostsPerHour = 50,
                Reason = canRepost ? "Allowed" : hasReposted ? "Already reposted" : "Rate limit exceeded"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking repost eligibility for post {PostId}", postId);
            return StatusCode(500, "An error occurred while checking repost eligibility");
        }
    }

    /// <summary>
    /// Get all reposts of a specific post
    /// </summary>
    [HttpGet("{postId}/reposts")]
    public async Task<ActionResult<RepostListResponse>> GetPostReposts(
        Guid postId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var reposts = await _repostService.GetPostRepostsAsync(postId, page, pageSize);
            var totalCount = await _repostService.GetPostRepostCountAsync(postId);

            var response = new RepostListResponse
            {
                Reposts = reposts,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasMore = reposts.Count == pageSize
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reposts for post {PostId}", postId);
            return StatusCode(500, "An error occurred while retrieving post reposts");
        }
    }
}
