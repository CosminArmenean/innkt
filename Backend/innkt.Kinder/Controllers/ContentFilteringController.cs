using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using innkt.Kinder.Data;
using innkt.Kinder.Models;

namespace innkt.Kinder.Controllers;

[ApiController]
[Route("api/kinder/content")]
[Authorize]
public class ContentFilteringController : ControllerBase
{
    private readonly KinderDbContext _context;
    private readonly ILogger<ContentFilteringController> _logger;

    public ContentFilteringController(KinderDbContext context, ILogger<ContentFilteringController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get content filters for a kid account
    /// </summary>
    [HttpGet("filters/{kidAccountId}")]
    public async Task<ActionResult<ContentFilter>> GetContentFilters(Guid kidAccountId)
    {
        try
        {
            var filter = await _context.Set<ContentFilter>()
                .FirstOrDefaultAsync(cf => cf.KidAccountId == kidAccountId && cf.IsActive);

            if (filter == null)
            {
                // Return default filter
                return Ok(new ContentFilter
                {
                    KidAccountId = kidAccountId,
                    FilterLevel = "moderate",
                    BlockedKeywords = Array.Empty<string>(),
                    AllowedCategories = new[] { "educational", "family_friendly", "social" },
                    IsActive = true
                });
            }

            return Ok(filter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting content filters");
            return StatusCode(500, new { error = "Failed to get filters" });
        }
    }

    /// <summary>
    /// Update content filters for a kid account
    /// </summary>
    [HttpPost("filters/{kidAccountId}")]
    public async Task<ActionResult<ContentFilter>> UpdateContentFilters(
        Guid kidAccountId,
        [FromBody] UpdateContentFilterRequest request)
    {
        try
        {
            var filter = await _context.Set<ContentFilter>()
                .FirstOrDefaultAsync(cf => cf.KidAccountId == kidAccountId && cf.IsActive)
                ?? new ContentFilter { KidAccountId = kidAccountId };

            filter.FilterLevel = request.FilterLevel;
            filter.BlockedKeywords = request.BlockedKeywords;
            filter.AllowedCategories = request.AllowedCategories;
            filter.UpdatedAt = DateTime.UtcNow;

            if (filter.Id == Guid.Empty)
                _context.Set<ContentFilter>().Add(filter);
            else
                _context.Set<ContentFilter>().Update(filter);

            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Content filters updated for kid {KidAccountId}", kidAccountId);
            return Ok(filter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating content filters");
            return StatusCode(500, new { error = "Failed to update filters" });
        }
    }

    /// <summary>
    /// Check if content is safe for a kid
    /// </summary>
    [HttpPost("check-safety")]
    [AllowAnonymous]
    public async Task<ActionResult<ContentSafetyResponse>> CheckContentSafety([FromBody] CheckContentSafetyRequest request)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == request.KidAccountId && k.IsActive);

            if (kidAccount == null)
                return NotFound(new { error = "Kid account not found" });

            var filter = await _context.Set<ContentFilter>()
                .FirstOrDefaultAsync(cf => cf.KidAccountId == request.KidAccountId && cf.IsActive);

            // Check blocked keywords
            bool hasBlockedKeywords = false;
            List<string> foundKeywords = new();

            if (filter != null && filter.BlockedKeywords.Any())
            {
                var contentLower = request.Content.ToLower();
                foreach (var keyword in filter.BlockedKeywords)
                {
                    if (contentLower.Contains(keyword.ToLower()))
                    {
                        hasBlockedKeywords = true;
                        foundKeywords.Add(keyword);
                    }
                }
            }

            // Check content type against allowed categories
            bool isAllowedCategory = filter == null 
                || !filter.AllowedCategories.Any() 
                || filter.AllowedCategories.Contains(request.ContentCategory);

            // Calculate safety score
            double safetyScore = 100.0;
            if (hasBlockedKeywords) safetyScore -= 50.0;
            if (!isAllowedCategory) safetyScore -= 30.0;

            bool isSafe = safetyScore >= kidAccount.MinContentSafetyScore * 100;

            return Ok(new ContentSafetyResponse
            {
                IsSafe = isSafe,
                SafetyScore = safetyScore,
                BlockedKeywordsFound = foundKeywords,
                Reason = !isSafe 
                    ? (hasBlockedKeywords ? "Contains blocked keywords" : "Category not allowed")
                    : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking content safety");
            return StatusCode(500, new { error = "Failed to check content safety" });
        }
    }
}

#region Request/Response Models

public class UpdateContentFilterRequest
{
    public string FilterLevel { get; set; } = "moderate"; // strict, moderate, relaxed
    public string[] BlockedKeywords { get; set; } = Array.Empty<string>();
    public string[] AllowedCategories { get; set; } = Array.Empty<string>();
}

public class CheckContentSafetyRequest
{
    public Guid KidAccountId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string ContentCategory { get; set; } = "general";
}

public class ContentSafetyResponse
{
    public bool IsSafe { get; set; }
    public double SafetyScore { get; set; }
    public List<string> BlockedKeywordsFound { get; set; } = new();
    public string? Reason { get; set; }
}

// ContentFilter model
public class ContentFilter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid KidAccountId { get; set; }
    public string FilterLevel { get; set; } = "moderate";
    public string[] BlockedKeywords { get; set; } = Array.Empty<string>();
    public string[] AllowedCategories { get; set; } = Array.Empty<string>();
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

#endregion

