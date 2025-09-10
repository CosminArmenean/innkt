using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Follow.Services;
using innkt.Follow.DTOs;
using System.Security.Claims;

namespace innkt.Follow.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowsController : ControllerBase
{
    private readonly IFollowService _followService;
    private readonly ILogger<FollowsController> _logger;

    public FollowsController(IFollowService followService, ILogger<FollowsController> logger)
    {
        _followService = followService;
        _logger = logger;
    }

    /// <summary>
    /// Follow a user
    /// </summary>
    [HttpPost("follow")]
    public async Task<ActionResult> FollowUser([FromBody] FollowUserRequest request)
    {
        try
        {
            var followerId = GetCurrentUserId();
            var success = await _followService.FollowUserAsync(followerId, request.UserId, request.Message);
            
            if (!success)
                return BadRequest("Unable to follow user");
                
            return Ok(new { message = "User followed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error following user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while following the user");
        }
    }

    /// <summary>
    /// Unfollow a user
    /// </summary>
    [HttpPost("unfollow")]
    public async Task<ActionResult> UnfollowUser([FromBody] UnfollowUserRequest request)
    {
        try
        {
            var followerId = GetCurrentUserId();
            var success = await _followService.UnfollowUserAsync(followerId, request.UserId);
            
            if (!success)
                return BadRequest("Unable to unfollow user");
                
            return Ok(new { message = "User unfollowed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unfollowing user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while unfollowing the user");
        }
    }

    /// <summary>
    /// Check if current user is following another user
    /// </summary>
    [HttpGet("check/{userId}")]
    public async Task<ActionResult<bool>> IsFollowing(Guid userId)
    {
        try
        {
            var followerId = GetCurrentUserId();
            var isFollowing = await _followService.IsFollowingAsync(followerId, userId);
            return Ok(isFollowing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking follow status for user {UserId}", userId);
            return StatusCode(500, "An error occurred while checking follow status");
        }
    }

    /// <summary>
    /// Get followers of a user
    /// </summary>
    [HttpGet("followers/{userId}")]
    public async Task<ActionResult<FollowListResponse>> GetFollowers(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var followers = await _followService.GetFollowersAsync(userId, page, pageSize, currentUserId);
            return Ok(followers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting followers for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving followers");
        }
    }

    /// <summary>
    /// Get users that a user is following
    /// </summary>
    [HttpGet("following/{userId}")]
    public async Task<ActionResult<FollowListResponse>> GetFollowing(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var following = await _followService.GetFollowingAsync(userId, page, pageSize, currentUserId);
            return Ok(following);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting following for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving following");
        }
    }

    /// <summary>
    /// Get mutual follows between two users
    /// </summary>
    [HttpGet("mutual/{userId1}/{userId2}")]
    public async Task<ActionResult<FollowListResponse>> GetMutualFollows(
        Guid userId1, 
        Guid userId2, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var mutualFollows = await _followService.GetMutualFollowsAsync(userId1, userId2, page, pageSize);
            return Ok(mutualFollows);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting mutual follows between users {UserId1} and {UserId2}", userId1, userId2);
            return StatusCode(500, "An error occurred while retrieving mutual follows");
        }
    }

    /// <summary>
    /// Get follow statistics for a user
    /// </summary>
    [HttpGet("stats/{userId}")]
    public async Task<ActionResult<FollowStatsResponse>> GetFollowStats(Guid userId)
    {
        try
        {
            var stats = await _followService.GetFollowStatsAsync(userId);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting follow stats for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving follow statistics");
        }
    }

    /// <summary>
    /// Get follow suggestions for current user
    /// </summary>
    [HttpPost("suggestions")]
    public async Task<ActionResult<FollowSuggestionListResponse>> GetFollowSuggestions([FromBody] GetFollowSuggestionsRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var suggestions = await _followService.GetFollowSuggestionsAsync(userId, request);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting follow suggestions for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while retrieving follow suggestions");
        }
    }

    /// <summary>
    /// Dismiss a follow suggestion
    /// </summary>
    [HttpPost("suggestions/dismiss")]
    public async Task<ActionResult> DismissSuggestion([FromBody] DismissSuggestionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _followService.DismissSuggestionAsync(request.SuggestionId, userId);
            
            if (!success)
                return BadRequest("Unable to dismiss suggestion");
                
            return Ok(new { message = "Suggestion dismissed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error dismissing suggestion {SuggestionId}", request.SuggestionId);
            return StatusCode(500, "An error occurred while dismissing the suggestion");
        }
    }

    /// <summary>
    /// Mute a user
    /// </summary>
    [HttpPost("mute")]
    public async Task<ActionResult> MuteUser([FromBody] MuteUserRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _followService.MuteUserAsync(userId, request.UserId, request.Mute);
            
            if (!success)
                return BadRequest("Unable to mute/unmute user");
                
            return Ok(new { message = request.Mute ? "User muted successfully" : "User unmuted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error muting user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while muting the user");
        }
    }

    /// <summary>
    /// Block a user
    /// </summary>
    [HttpPost("block")]
    public async Task<ActionResult> BlockUser([FromBody] BlockUserRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _followService.BlockUserAsync(userId, request.UserId, request.Block);
            
            if (!success)
                return BadRequest("Unable to block/unblock user");
                
            return Ok(new { message = request.Block ? "User blocked successfully" : "User unblocked successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error blocking user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while blocking the user");
        }
    }

    /// <summary>
    /// Update follow notes
    /// </summary>
    [HttpPut("notes")]
    public async Task<ActionResult> UpdateFollowNotes([FromBody] UpdateFollowNotesRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _followService.UpdateFollowNotesAsync(userId, request.UserId, request.Notes);
            
            if (!success)
                return BadRequest("Unable to update follow notes");
                
            return Ok(new { message = "Follow notes updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating follow notes for user {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while updating follow notes");
        }
    }

    /// <summary>
    /// Get follow notifications
    /// </summary>
    [HttpGet("notifications")]
    public async Task<ActionResult<FollowNotificationListResponse>> GetFollowNotifications(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var notifications = await _followService.GetFollowNotificationsAsync(userId, page, pageSize);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting follow notifications for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while retrieving follow notifications");
        }
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPut("notifications/{notificationId}/read")]
    public async Task<ActionResult> MarkNotificationAsRead(Guid notificationId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _followService.MarkNotificationAsReadAsync(notificationId, userId);
            
            if (!success)
                return BadRequest("Unable to mark notification as read");
                
            return Ok(new { message = "Notification marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read", notificationId);
            return StatusCode(500, "An error occurred while marking notification as read");
        }
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPut("notifications/read-all")]
    public async Task<ActionResult> MarkAllNotificationsAsRead()
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _followService.MarkAllNotificationsAsReadAsync(userId);
            
            if (!success)
                return BadRequest("Unable to mark all notifications as read");
                
            return Ok(new { message = "All notifications marked as read" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while marking all notifications as read");
        }
    }

    /// <summary>
    /// Get follow timeline
    /// </summary>
    [HttpPost("timeline")]
    public async Task<ActionResult<FollowTimelineResponse>> GetFollowTimeline([FromBody] GetFollowTimelineRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var timeline = await _followService.GetFollowTimelineAsync(userId, request);
            return Ok(timeline);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting follow timeline for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while retrieving follow timeline");
        }
    }

    /// <summary>
    /// Search followers
    /// </summary>
    [HttpGet("followers/{userId}/search")]
    public async Task<ActionResult<FollowListResponse>> SearchFollowers(
        Guid userId, 
        [FromQuery] string query, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var followers = await _followService.SearchFollowersAsync(userId, query, page, pageSize);
            return Ok(followers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching followers for user {UserId} with query {Query}", userId, query);
            return StatusCode(500, "An error occurred while searching followers");
        }
    }

    /// <summary>
    /// Search following
    /// </summary>
    [HttpGet("following/{userId}/search")]
    public async Task<ActionResult<FollowListResponse>> SearchFollowing(
        Guid userId, 
        [FromQuery] string query, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var following = await _followService.SearchFollowingAsync(userId, query, page, pageSize);
            return Ok(following);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching following for user {UserId} with query {Query}", userId, query);
            return StatusCode(500, "An error occurred while searching following");
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
