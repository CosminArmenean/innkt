using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using innkt.Social.Services;
using innkt.Social.DTOs;
using innkt.Social.Models;
using innkt.Social.Data;
using Microsoft.EntityFrameworkCore;

namespace innkt.Social.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowsController : ControllerBase
{
    private readonly ILogger<FollowsController> _logger;
    private readonly IFollowService _followService;
    private readonly SocialDbContext _context;
    private readonly IOfficerService _officerService;

    public FollowsController(ILogger<FollowsController> logger, IFollowService followService, SocialDbContext context, IOfficerService officerService)
    {
        _logger = logger;
        _followService = followService;
        _context = context;
        _officerService = officerService;
    }

    /// <summary>
    /// Get followers for a user
    /// </summary>
    [HttpGet("user/{userId}/followers")]
    public async Task<ActionResult<object>> GetFollowers(string userId, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            _logger.LogInformation("Fetching followers for user {UserId}, page {Page}, limit {Limit}", userId, page, limit);
            
            if (!Guid.TryParse(userId, out var userIdGuid))
            {
                return BadRequest(new { message = "Invalid user ID format" });
            }

            var result = await _followService.GetFollowersAsync(userIdGuid, page, limit);
            return Ok(new { 
                followers = result.Follows, 
                totalCount = result.TotalCount, 
                page = result.Page,
                pageSize = result.PageSize,
                hasMore = result.HasNextPage 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching followers for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get users that a user is following
    /// </summary>
    [HttpGet("user/{userId}/following")]
    public async Task<ActionResult<object>> GetFollowing(string userId, [FromQuery] int page = 1, [FromQuery] int limit = 10)
    {
        try
        {
            _logger.LogInformation("Fetching following for user {UserId}, page {Page}, limit {Limit}", userId, page, limit);
            
            if (!Guid.TryParse(userId, out var userIdGuid))
            {
                return BadRequest(new { message = "Invalid user ID format" });
            }

            var result = await _followService.GetFollowingAsync(userIdGuid, page, limit);
            return Ok(new { 
                following = result.Follows, 
                totalCount = result.TotalCount, 
                page = result.Page,
                pageSize = result.PageSize,
                hasMore = result.HasNextPage 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching following for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Follow a user
    /// </summary>
    [HttpPost("follow/{followingId}")]
    public async Task<ActionResult<object>> FollowUser(string followingId)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {CurrentUserId} attempting to follow {FollowingId}", currentUserId, followingId);
            
            if (string.IsNullOrEmpty(currentUserId) || !Guid.TryParse(currentUserId, out var currentUserIdGuid) || !Guid.TryParse(followingId, out var followingIdGuid))
            {
                return BadRequest(new { message = "Invalid user ID format" });
            }

            var success = await _followService.FollowUserAsync(currentUserIdGuid, followingIdGuid);
            
            if (success)
            {
                return Ok(new { message = $"Successfully followed user {followingId}", success = true });
            }
            else
            {
                return BadRequest(new { message = "Unable to follow user (already following or invalid request)", success = false });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error following user {FollowingId}", followingId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Unfollow a user
    /// </summary>
    [HttpPost("unfollow/{followingId}")]
    public async Task<ActionResult<object>> UnfollowUser(string followingId)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {CurrentUserId} attempting to unfollow {FollowingId}", currentUserId, followingId);
            
            if (string.IsNullOrEmpty(currentUserId) || !Guid.TryParse(currentUserId, out var currentUserIdGuid) || !Guid.TryParse(followingId, out var followingIdGuid))
            {
                return BadRequest(new { message = "Invalid user ID format" });
            }

            var success = await _followService.UnfollowUserAsync(currentUserIdGuid, followingIdGuid);
            
            if (success)
            {
                return Ok(new { message = $"Successfully unfollowed user {followingId}", success = true });
            }
            else
            {
                return BadRequest(new { message = "Unable to unfollow user (not following or invalid request)", success = false });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unfollowing user {FollowingId}", followingId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get follower count for a user
    /// </summary>
    [HttpGet("user/{userId}/followers/count")]
    public async Task<ActionResult<object>> GetFollowerCount(string userId)
    {
        try
        {
            _logger.LogInformation("Getting follower count for user {UserId}", userId);
            
            if (!Guid.TryParse(userId, out var userIdGuid))
            {
                return BadRequest(new { message = "Invalid user ID format" });
            }

            var result = await _followService.GetFollowersAsync(userIdGuid, 1, 1);
            return Ok(new { followerCount = result.TotalCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting follower count for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get following count for a user
    /// </summary>
    [HttpGet("user/{userId}/following/count")]
    public async Task<ActionResult<object>> GetFollowingCount(string userId)
    {
        try
        {
            _logger.LogInformation("Getting following count for user {UserId}", userId);
            
            if (!Guid.TryParse(userId, out var userIdGuid))
            {
                return BadRequest(new { message = "Invalid user ID format" });
            }

            var result = await _followService.GetFollowingAsync(userIdGuid, 1, 1);
            return Ok(new { followingCount = result.TotalCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting following count for user {UserId}", userId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Test database connection
    /// </summary>
    [HttpGet("test-db")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> TestDatabase()
    {
        try
        {
            var followCount = await _context.Follows.CountAsync();
            return Ok(new { message = "Database connected", followCount = followCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database test failed");
            return StatusCode(500, new { message = "Database test failed", error = ex.Message });
        }
    }

    /// <summary>
    /// Search users by username or name
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<object>> SearchUsers([FromQuery] string query, [FromQuery] int page = 1, [FromQuery] int limit = 20)
    {
        try
        {
            _logger.LogInformation("Searching users with query: {Query}, page: {Page}, limit: {Limit}", query, page, limit);
            
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Search query is required" });
            }

            // Search users using the Officer service
            var searchResult = await _officerService.SearchUsersAsync(query, page, limit);
            
            if (searchResult == null)
            {
                _logger.LogWarning("Officer service returned null for query: {Query}", query);
                return Ok(new { 
                    users = new object[0], 
                    totalCount = 0, 
                    page = page,
                    limit = limit,
                    hasMore = false
                });
            }

            _logger.LogInformation("Found {Count} users from Officer service", searchResult.Users.Count);

            // Get real follower counts for each user
            var usersWithCounts = new List<object>();
            foreach (var user in searchResult.Users)
            {
                try
                {
                    var followersResult = await _followService.GetFollowersAsync(user.Id, 1, 1);
                    var followingResult = await _followService.GetFollowingAsync(user.Id, 1, 1);
                    
                    usersWithCounts.Add(new
                    {
                        id = user.Id.ToString(),
                        username = user.Username,
                        displayName = user.DisplayName,
                        email = user.Email,
                        avatarUrl = user.AvatarUrl,
                        isVerified = user.IsVerified,
                        followersCount = followersResult.TotalCount,
                        followingCount = followingResult.TotalCount,
                        postsCount = 0 // TODO: Get real post count from PostService
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting follower counts for user {UserId}", user.Id);
                    // Add user without follower counts
                    usersWithCounts.Add(new
                    {
                        id = user.Id.ToString(),
                        username = user.Username,
                        displayName = user.DisplayName,
                        email = user.Email,
                        avatarUrl = user.AvatarUrl,
                        isVerified = user.IsVerified,
                        followersCount = 0,
                        followingCount = 0,
                        postsCount = 0
                    });
                }
            }

            return Ok(new { 
                users = usersWithCounts, 
                totalCount = searchResult.TotalCount, 
                page = page,
                limit = limit,
                hasMore = searchResult.HasMore
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users with query: {Query}", query);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get search suggestions for autocomplete
    /// </summary>
    [HttpGet("suggestions")]
    public async Task<ActionResult<string[]>> GetSearchSuggestions([FromQuery] string query, [FromQuery] int count = 10)
    {
        try
        {
            _logger.LogInformation("Getting search suggestions for query: {Query}, count: {Count}", query, count);
            
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok(new string[0]);
            }

            // Use the same mock data as the search endpoint
            var mockUsers = new[]
            {
                new { 
                    id = "4f8c8759-dfdc-423e-878e-c68036140114",
                    username = "testuser1", 
                    displayName = "Test User 1",
                    email = "testuser1@example.com"
                },
                new { 
                    id = "b1234567-1234-5678-9abc-def012345680",
                    username = "bob.smith", 
                    displayName = "Bob Smith",
                    email = "bob.smith@example.com"
                },
                new { 
                    id = "a1234567-1234-5678-9abc-def012345681",
                    username = "alice.johnson", 
                    displayName = "Alice Johnson",
                    email = "alice.johnson@example.com"
                },
                new { 
                    id = "c1234567-1234-5678-9abc-def012345682",
                    username = "charlie.brown", 
                    displayName = "Charlie Brown",
                    email = "charlie.brown@example.com"
                },
                new { 
                    id = "bdfc4c41-c42e-42e0-a57b-d8301a37b1fe",
                    username = "junior11", 
                    displayName = "Cosmin",
                    email = "junior11@example.com"
                },
                new { 
                    id = "d1234567-1234-5678-9abc-def012345683",
                    username = "diana.wilson", 
                    displayName = "Diana Wilson",
                    email = "diana.wilson@example.com"
                },
                new { 
                    id = "a1234567-1234-5678-9abc-def012345679",
                    username = "alice.johnson", 
                    displayName = "Alice Johnson",
                    email = "alice.johnson@example.com"
                }
            };

            // Get suggestions from usernames and display names
            var suggestions = new List<string>();
            
            foreach (var user in mockUsers)
            {
                // Add username if it matches
                if (user.username.Contains(query, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(user.username);
                }
                
                // Add display name if it matches
                if (user.displayName.Contains(query, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(user.displayName);
                }
            }

            // Remove duplicates and take the requested count
            var uniqueSuggestions = suggestions
                .Distinct()
                .Take(count)
                .ToArray();

            _logger.LogInformation("Found {SuggestionCount} suggestions for query: {Query}", uniqueSuggestions.Length, query);
            
            return Ok(uniqueSuggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search suggestions for query: {Query}", query);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Report a user
    /// </summary>
    [HttpPost("report/{reportedUserId}")]
    public async Task<ActionResult<object>> ReportUser(string reportedUserId, [FromBody] ReportUserRequest request)
    {
        try
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {CurrentUserId} reporting user {ReportedUserId} for reason: {Reason}", 
                currentUserId, reportedUserId, request.Reason);
            
            if (string.IsNullOrEmpty(currentUserId) || !Guid.TryParse(currentUserId, out var currentUserIdGuid) || 
                !Guid.TryParse(reportedUserId, out var reportedUserIdGuid))
            {
                return BadRequest(new { message = "Invalid user ID format" });
            }

            if (currentUserIdGuid == reportedUserIdGuid)
            {
                return BadRequest(new { message = "Cannot report yourself" });
            }

            // Check if user has already reported this user for the same reason
            var existingReport = await _context.UserReports
                .FirstOrDefaultAsync(r => r.ReporterId == currentUserIdGuid && 
                                        r.ReportedUserId == reportedUserIdGuid && 
                                        r.Reason == request.Reason);

            if (existingReport != null)
            {
                return BadRequest(new { message = "You have already reported this user for this reason" });
            }

            var report = new UserReport
            {
                ReporterId = currentUserIdGuid,
                ReportedUserId = reportedUserIdGuid,
                Reason = request.Reason,
                Description = request.Description
            };

            _context.UserReports.Add(report);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User report created successfully: {ReportId} for user {ReportedUserId}", 
                report.Id, reportedUserId);

            // TODO: Send notification to moderators/admin
            // TODO: Add to monitoring system

            return Ok(new { 
                message = "Report submitted successfully", 
                reportId = report.Id,
                success = true 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reporting user {ReportedUserId}", reportedUserId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
