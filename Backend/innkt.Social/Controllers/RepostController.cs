using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.DTOs;
using innkt.Social.Models.MongoDB;
using System.Security.Claims;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/v2/reposts")]
[Authorize]
public class RepostController : ControllerBase
{
    private readonly IRepostService _repostService;
    private readonly ILogger<RepostController> _logger;

    public RepostController(IRepostService repostService, ILogger<RepostController> logger)
    {
        _repostService = repostService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new repost (simple or quote)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CreateRepostResponse>> CreateRepost([FromBody] CreateRepostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User ID not found in token");
            }

            _logger.LogInformation("Creating repost for user {UserId} on post {OriginalPostId}", userId, request.OriginalPostId);

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
            _logger.LogWarning(ex, "Invalid repost operation");
            return BadRequest(ex.Message);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid repost request");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating repost");
            return StatusCode(500, "An error occurred while creating the repost");
        }
    }

    /// <summary>
    /// Get a specific repost by ID
    /// </summary>
    [HttpGet("{repostId}")]
    public async Task<ActionResult<MongoRepost>> GetRepost(Guid repostId)
    {
        try
        {
            var repost = await _repostService.GetRepostByIdAsync(repostId);
            if (repost == null)
            {
                return NotFound("Repost not found");
            }

            // Increment view count
            await _repostService.IncrementRepostViewsAsync(repostId);

            return Ok(repost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting repost {RepostId}", repostId);
            return StatusCode(500, "An error occurred while retrieving the repost");
        }
    }

    /// <summary>
    /// Delete a repost
    /// </summary>
    [HttpDelete("{repostId}")]
    public async Task<ActionResult> DeleteRepost(Guid repostId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User ID not found in token");
            }

            var success = await _repostService.DeleteRepostAsync(repostId, userId);
            if (!success)
            {
                return NotFound("Repost not found or user not authorized to delete");
            }

            return Ok(new { Message = "Repost deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting repost {RepostId}", repostId);
            return StatusCode(500, "An error occurred while deleting the repost");
        }
    }

    /// <summary>
    /// Update quote text for a quote repost
    /// </summary>
    [HttpPut("{repostId}/quote")]
    public async Task<ActionResult> UpdateQuoteText(Guid repostId, [FromBody] UpdateRepostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User ID not found in token");
            }

            var success = await _repostService.UpdateQuoteTextAsync(repostId, userId, request.QuoteText);
            if (!success)
            {
                return NotFound("Repost not found or user not authorized to update");
            }

            return Ok(new { Message = "Quote text updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating quote text for repost {RepostId}", repostId);
            return StatusCode(500, "An error occurred while updating the quote text");
        }
    }

    /// <summary>
    /// Get user's reposts for profile page
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<RepostListResponse>> GetUserReposts(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20,
        [FromQuery] string type = "all")
    {
        try
        {
            List<MongoRepost> reposts = type.ToLower() switch
            {
                "simple" => await _repostService.GetUserSimpleRepostsAsync(userId, page, pageSize),
                "quote" => await _repostService.GetUserQuoteRepostsAsync(userId, page, pageSize),
                _ => await _repostService.GetUserRepostsAsync(userId, page, pageSize)
            };

            var response = new RepostListResponse
            {
                Reposts = reposts,
                TotalCount = reposts.Count, // TODO: Implement proper total count
                Page = page,
                PageSize = pageSize,
                HasMore = reposts.Count == pageSize
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reposts for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving user reposts");
        }
    }

    /// <summary>
    /// Get reposts of a specific post
    /// </summary>
    [HttpGet("post/{postId}")]
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

    /// <summary>
    /// Like a repost
    /// </summary>
    [HttpPost("{repostId}/like")]
    public async Task<ActionResult> LikeRepost(Guid repostId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User ID not found in token");
            }

            var success = await _repostService.LikeRepostAsync(repostId, userId);
            if (!success)
            {
                return BadRequest("Unable to like repost");
            }

            return Ok(new { Message = "Repost liked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking repost {RepostId}", repostId);
            return StatusCode(500, "An error occurred while liking the repost");
        }
    }

    /// <summary>
    /// Unlike a repost
    /// </summary>
    [HttpDelete("{repostId}/like")]
    public async Task<ActionResult> UnlikeRepost(Guid repostId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User ID not found in token");
            }

            var success = await _repostService.UnlikeRepostAsync(repostId, userId);
            if (!success)
            {
                return BadRequest("Unable to unlike repost");
            }

            return Ok(new { Message = "Repost unliked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking repost {RepostId}", repostId);
            return StatusCode(500, "An error occurred while unliking the repost");
        }
    }

    /// <summary>
    /// Check if current user can repost a specific post
    /// </summary>
    [HttpGet("can-repost/{postId}")]
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
    /// Get reposts for main feed integration
    /// </summary>
    [HttpGet("feed")]
    public async Task<ActionResult<RepostListResponse>> GetRepostsForFeed(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var reposts = userId != Guid.Empty 
                ? await _repostService.GetRepostsForFeedAsync(userId, page, pageSize)
                : await _repostService.GetPublicRepostsForFeedAsync(page, pageSize);

            var response = new RepostListResponse
            {
                Reposts = reposts,
                TotalCount = reposts.Count, // TODO: Implement proper total count
                Page = page,
                PageSize = pageSize,
                HasMore = reposts.Count == pageSize
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reposts for feed");
            return StatusCode(500, "An error occurred while retrieving reposts");
        }
    }

    /// <summary>
    /// Get current user ID from JWT token
    /// </summary>
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return Guid.Empty;
    }
}
