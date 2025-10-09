using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using innkt.Kinder.Data;
using innkt.Kinder.Models;

namespace innkt.Kinder.Controllers;

[ApiController]
[Route("api/kinder/time-restrictions")]
[Authorize]
public class TimeRestrictionsController : ControllerBase
{
    private readonly KinderDbContext _context;
    private readonly ILogger<TimeRestrictionsController> _logger;

    public TimeRestrictionsController(KinderDbContext context, ILogger<TimeRestrictionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all time restrictions for a kid account
    /// </summary>
    [HttpGet("{kidAccountId}")]
    public async Task<ActionResult<List<TimeRestriction>>> GetTimeRestrictions(Guid kidAccountId)
    {
        try
        {
            var restrictions = await _context.Set<TimeRestriction>()
                .Where(tr => tr.KidAccountId == kidAccountId && tr.IsActive)
                .OrderBy(tr => tr.DayOfWeek)
                .ThenBy(tr => tr.StartTime)
                .ToListAsync();

            return Ok(restrictions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting time restrictions");
            return StatusCode(500, new { error = "Failed to get time restrictions" });
        }
    }

    /// <summary>
    /// Create or update time restriction
    /// </summary>
    [HttpPost("{kidAccountId}")]
    public async Task<ActionResult<TimeRestriction>> CreateOrUpdateRestriction(
        Guid kidAccountId,
        [FromBody] TimeRestrictionRequest request)
    {
        try
        {
            // Verify parent access
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId);

            if (kidAccount == null)
                return NotFound(new { error = "Kid account not found" });

            // TODO: Verify parent from JWT token

            var restriction = new TimeRestriction
            {
                KidAccountId = kidAccountId,
                DayOfWeek = request.DayOfWeek,
                StartTime = TimeOnly.Parse(request.StartTime),
                EndTime = TimeOnly.Parse(request.EndTime),
                IsActive = true
            };

            _context.Set<TimeRestriction>().Add(restriction);
            await _context.SaveChangesAsync();

            _logger.LogInformation("✅ Time restriction created for kid {KidAccountId}", kidAccountId);
            return Ok(restriction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating time restriction");
            return StatusCode(500, new { error = "Failed to create time restriction" });
        }
    }

    /// <summary>
    /// Delete time restriction
    /// </summary>
    [HttpDelete("{restrictionId}")]
    public async Task<ActionResult> DeleteRestriction(Guid restrictionId)
    {
        try
        {
            var restriction = await _context.Set<TimeRestriction>()
                .FirstOrDefaultAsync(tr => tr.Id == restrictionId);

            if (restriction == null)
                return NotFound(new { error = "Restriction not found" });

            restriction.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Restriction deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting time restriction");
            return StatusCode(500, new { error = "Failed to delete restriction" });
        }
    }

    /// <summary>
    /// Check if kid can access platform right now
    /// </summary>
    [HttpGet("{kidAccountId}/check-access")]
    [AllowAnonymous] // Kids need to check before login
    public async Task<ActionResult<AccessCheckResponse>> CheckAccess(Guid kidAccountId)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId && k.IsActive);

            if (kidAccount == null)
                return NotFound(new { error = "Kid account not found" });

            var currentTime = TimeOnly.FromDateTime(DateTime.Now);
            var currentDay = (int)DateTime.Now.DayOfWeek;

            // Check time restrictions
            var restrictions = await _context.Set<TimeRestriction>()
                .Where(tr => tr.KidAccountId == kidAccountId 
                          && tr.IsActive 
                          && tr.DayOfWeek == currentDay)
                .ToListAsync();

            bool canAccess = true;
            string? reason = null;

            if (restrictions.Any())
            {
                canAccess = restrictions.Any(tr => 
                    currentTime >= tr.StartTime && currentTime <= tr.EndTime);

                if (!canAccess)
                {
                    reason = "Outside allowed time window";
                }
            }

            // Check daily usage limit (if needed)
            // TODO: Implement daily usage tracking

            return Ok(new AccessCheckResponse
            {
                CanAccess = canAccess,
                Reason = reason,
                CurrentTime = currentTime.ToString(),
                AllowedWindows = restrictions.Select(r => new TimeWindow
                {
                    StartTime = r.StartTime.ToString(),
                    EndTime = r.EndTime.ToString()
                }).ToList()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking access");
            return StatusCode(500, new { error = "Failed to check access" });
        }
    }

    /// <summary>
    /// Get daily usage for a kid
    /// </summary>
    [HttpGet("{kidAccountId}/usage-today")]
    public async Task<ActionResult<UsageResponse>> GetUsageToday(Guid kidAccountId)
    {
        try
        {
            var kidAccount = await _context.KidAccounts
                .FirstOrDefaultAsync(k => k.Id == kidAccountId);

            if (kidAccount == null)
                return NotFound(new { error = "Kid account not found" });

            // TODO: Implement actual usage tracking from session logs
            // For now, return structure
            return Ok(new UsageResponse
            {
                KidAccountId = kidAccountId,
                MinutesUsedToday = 0,
                MaxDailyMinutes = kidAccount.MaxDailyTimeMinutes,
                PercentageUsed = 0,
                CanContinue = true,
                RemainingMinutes = kidAccount.MaxDailyTimeMinutes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage");
            return StatusCode(500, new { error = "Failed to get usage" });
        }
    }

    #region Private Methods

    private async Task UpdateMetricsFromActivityAsync(TrackActivityRequest request)
    {
        // This is handled in BehaviorController.TrackActivity
        // Updates are applied automatically based on activity type
        await Task.CompletedTask;
    }

    #endregion
}

#region Request/Response Models

public class TimeRestrictionRequest
{
    public int DayOfWeek { get; set; } // 0-6 (Sunday-Saturday)
    public string StartTime { get; set; } = string.Empty; // HH:mm format
    public string EndTime { get; set; } = string.Empty; // HH:mm format
}

public class AccessCheckResponse
{
    public bool CanAccess { get; set; }
    public string? Reason { get; set; }
    public string CurrentTime { get; set; } = string.Empty;
    public List<TimeWindow> AllowedWindows { get; set; } = new();
}

public class TimeWindow
{
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}

public class UsageResponse
{
    public Guid KidAccountId { get; set; }
    public int MinutesUsedToday { get; set; }
    public int MaxDailyMinutes { get; set; }
    public double PercentageUsed { get; set; }
    public bool CanContinue { get; set; }
    public int RemainingMinutes { get; set; }
}

#endregion

// TimeRestriction model (if not in Models folder)
public class TimeRestriction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid KidAccountId { get; set; }
    public int DayOfWeek { get; set; } // 0-6
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

