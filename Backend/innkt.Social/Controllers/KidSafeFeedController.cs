using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.DTOs;
using System.Security.Claims;

namespace innkt.Social.Controllers;

/// <summary>
/// Kid-safe feed controller with comprehensive content filtering and educational prioritization
/// Provides safe, age-appropriate content feeds for child accounts
/// </summary>
[ApiController]
[Route("api/v1/kid-safe-feed")]
[Authorize]
public class KidSafeFeedController : ControllerBase
{
    private readonly IKidSafeFeedService _kidSafeFeedService;
    private readonly IKidSafetyService _kidSafetyService;
    private readonly IContentFilteringService _contentFilteringService;
    private readonly ILogger<KidSafeFeedController> _logger;

    public KidSafeFeedController(
        IKidSafeFeedService kidSafeFeedService,
        IKidSafetyService kidSafetyService,
        IContentFilteringService contentFilteringService,
        ILogger<KidSafeFeedController> logger)
    {
        _kidSafeFeedService = kidSafeFeedService;
        _kidSafetyService = kidSafetyService;
        _contentFilteringService = contentFilteringService;
        _logger = logger;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return Guid.Empty;
    }

    /// <summary>
    /// Get kid-safe feed with comprehensive filtering and educational prioritization
    /// </summary>
    [HttpGet("{kidAccountId}")]
    public async Task<ActionResult<KidSafeFeedResponse>> GetKidSafeFeed(
        Guid kidAccountId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 15)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Verify access - user must be the kid or the parent
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null)
            {
                return NotFound($"Kid account with ID {kidAccountId} not found");
            }

            if (kidAccount.UserId != currentUserId && kidAccount.ParentId != currentUserId)
            {
                return Forbid("Access denied to kid-safe feed");
            }

            // Check if kid can access platform
            var canAccess = await _kidSafetyService.CanKidAccessPlatformAsync(kidAccountId);
            if (!canAccess)
            {
                return Ok(new KidSafeFeedResponse
                {
                    FeedItems = new List<FeedItem>(),
                    Message = "Platform access is currently restricted. Please check with your parent.",
                    IsRestricted = true,
                    RestrictionReason = "Time limit exceeded or outside allowed hours"
                });
            }

            _logger.LogInformation("Getting kid-safe feed for account {KidAccountId}, page {Page}, size {PageSize}", 
                kidAccountId, page, pageSize);

            var feedItems = await _kidSafeFeedService.GetKidSafeFeedAsync(kidAccountId, page, pageSize);
            var metrics = await _kidSafeFeedService.GetFeedMetricsAsync(kidAccountId);

            return Ok(new KidSafeFeedResponse
            {
                FeedItems = feedItems,
                Metrics = metrics,
                Page = page,
                PageSize = pageSize,
                HasMore = feedItems.Count == pageSize,
                Message = "Safe feed loaded successfully",
                IsRestricted = false
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting kid-safe feed for account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while loading the kid-safe feed");
        }
    }

    /// <summary>
    /// Get educational content feed for learning-focused experience
    /// </summary>
    [HttpGet("{kidAccountId}/educational")]
    public async Task<ActionResult<EducationalFeedResponse>> GetEducationalFeed(
        Guid kidAccountId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? subject = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Verify access
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null || (kidAccount.UserId != currentUserId && kidAccount.ParentId != currentUserId))
            {
                return Forbid("Access denied to educational feed");
            }

            var educationalPosts = await _kidSafeFeedService.GetEducationalFeedAsync(kidAccountId, page, pageSize);
            var suggestions = await _kidSafeFeedService.GetEducationalContentSuggestionsAsync(kidAccountId, 5);

            return Ok(new EducationalFeedResponse
            {
                EducationalPosts = educationalPosts,
                Suggestions = suggestions,
                Page = page,
                PageSize = pageSize,
                HasMore = educationalPosts.Count == pageSize,
                RecommendedSubjects = GetRecommendedSubjects(kidAccount.Age),
                LearningTips = GetLearningTips(kidAccount.Age)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting educational feed for account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while loading the educational feed");
        }
    }

    /// <summary>
    /// Get safe user suggestions based on parent network and educational connections
    /// </summary>
    [HttpGet("{kidAccountId}/safe-suggestions")]
    public async Task<ActionResult<List<SafeUserSuggestion>>> GetSafeUserSuggestions(
        Guid kidAccountId,
        [FromQuery] int limit = 5)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Verify access
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null || (kidAccount.UserId != currentUserId && kidAccount.ParentId != currentUserId))
            {
                return Forbid("Access denied to safe user suggestions");
            }

            var suggestions = await _kidSafeFeedService.GetSafeUserSuggestionsAsync(kidAccountId, limit);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting safe user suggestions for account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while getting safe user suggestions");
        }
    }

    /// <summary>
    /// Check if specific content is safe for kid account
    /// </summary>
    [HttpPost("{kidAccountId}/content-safety-check")]
    public async Task<ActionResult<ContentSafetyResponse>> CheckContentSafety(
        Guid kidAccountId,
        [FromBody] ContentSafetyCheckRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Verify access
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null || (kidAccount.UserId != currentUserId && kidAccount.ParentId != currentUserId))
            {
                return Forbid("Access denied to content safety check");
            }

            var isSafe = await _contentFilteringService.IsContentSafeForKidAsync(
                request.Content, kidAccountId, request.MediaUrls);

            var safetyResult = await _contentFilteringService.AnalyzeContentSafetyAsync(
                request.Content, request.MediaUrls, kidAccount.Age);

            var educationalResult = await _contentFilteringService.AnalyzeEducationalValueAsync(
                request.Content, kidAccount.Age);

            return Ok(new ContentSafetyResponse
            {
                IsSafe = isSafe,
                SafetyScore = safetyResult.SafetyScore,
                EducationalScore = educationalResult.EducationalScore,
                IsEducational = educationalResult.IsEducational,
                DetectedIssues = safetyResult.DetectedIssues,
                EducationalTopics = educationalResult.EducationalTopics,
                Recommendations = safetyResult.Recommendations,
                AgeAppropriate = safetyResult.AgeAppropriateness.IsAppropriate,
                RequiresParentReview = safetyResult.RequiresHumanReview
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking content safety for account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while checking content safety");
        }
    }

    /// <summary>
    /// Report inappropriate content discovered in kid feed
    /// </summary>
    [HttpPost("{kidAccountId}/report-content")]
    public async Task<ActionResult<ReportContentResponse>> ReportInappropriateContent(
        Guid kidAccountId,
        [FromBody] ReportContentRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Verify the requesting user is the kid themselves
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null || kidAccount.UserId != currentUserId)
            {
                return Forbid("Only the kid can report inappropriate content");
            }

            var success = await _kidSafeFeedService.ReportInappropriateContentAsync(
                kidAccountId, request.PostId, request.Reason);

            if (success)
            {
                return Ok(new ReportContentResponse
                {
                    Success = true,
                    Message = "Thank you for reporting this content. Your parents and our safety team have been notified.",
                    ReportId = Guid.NewGuid(), // Generate report tracking ID
                    NextSteps = new[]
                    {
                        "Your parents will be notified about this report",
                        "Our safety team will review the content",
                        "We'll improve our filters to prevent similar content"
                    }
                });
            }

            return BadRequest("Failed to report content. Please try again.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reporting content for account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while reporting the content");
        }
    }

    /// <summary>
    /// Get feed metrics and analytics for parent dashboard
    /// </summary>
    [HttpGet("{kidAccountId}/metrics")]
    public async Task<ActionResult<KidFeedMetrics>> GetFeedMetrics(Guid kidAccountId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Verify access (parent only)
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            if (kidAccount == null || kidAccount.ParentId != currentUserId)
            {
                return Forbid("Access denied to feed metrics");
            }

            var metrics = await _kidSafeFeedService.GetFeedMetricsAsync(kidAccountId);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting feed metrics for account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while getting feed metrics");
        }
    }

    // Helper methods
    private List<string> GetRecommendedSubjects(int age)
    {
        return age switch
        {
            <= 8 => new List<string> { "Basic Math", "Reading", "Science Experiments", "Art & Creativity" },
            <= 12 => new List<string> { "Mathematics", "Science", "History", "Language Arts", "Geography" },
            <= 15 => new List<string> { "Advanced Math", "Biology", "Chemistry", "Literature", "Social Studies" },
            _ => new List<string> { "STEM", "Advanced Sciences", "Philosophy", "Critical Thinking", "Research Skills" }
        };
    }

    private List<string> GetLearningTips(int age)
    {
        return age switch
        {
            <= 8 => new List<string> 
            { 
                "Ask questions about everything you see!",
                "Try to explain what you learned to someone else",
                "Use your imagination to make learning fun"
            },
            <= 12 => new List<string>
            {
                "Take notes of interesting facts",
                "Connect new learning to things you already know",
                "Practice what you learn through games and activities"
            },
            <= 15 => new List<string>
            {
                "Research topics that interest you deeply",
                "Discuss ideas with friends and family",
                "Apply your learning to real-world situations"
            },
            _ => new List<string>
            {
                "Develop critical thinking skills",
                "Question assumptions and seek evidence",
                "Share your knowledge to help others learn"
            }
        };
    }
}

// Request/Response DTOs
public class KidSafeFeedResponse
{
    public List<FeedItem> FeedItems { get; set; } = new();
    public KidFeedMetrics? Metrics { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRestricted { get; set; }
    public string? RestrictionReason { get; set; }
}

public class EducationalFeedResponse
{
    public List<Models.MongoDB.MongoPost> EducationalPosts { get; set; } = new();
    public List<EducationalContentSuggestion> Suggestions { get; set; } = new();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasMore { get; set; }
    public List<string> RecommendedSubjects { get; set; } = new();
    public List<string> LearningTips { get; set; } = new();
}

public class ContentSafetyCheckRequest
{
    public string Content { get; set; } = string.Empty;
    public List<string>? MediaUrls { get; set; }
}

public class ContentSafetyResponse
{
    public bool IsSafe { get; set; }
    public double SafetyScore { get; set; }
    public double EducationalScore { get; set; }
    public bool IsEducational { get; set; }
    public List<string> DetectedIssues { get; set; } = new();
    public List<string> EducationalTopics { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public bool AgeAppropriate { get; set; }
    public bool RequiresParentReview { get; set; }
}

public class ReportContentRequest
{
    public Guid PostId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ReportContentResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid ReportId { get; set; }
    public string[] NextSteps { get; set; } = Array.Empty<string>();
}
