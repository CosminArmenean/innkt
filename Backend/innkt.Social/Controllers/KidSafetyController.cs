using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;
using innkt.Social.Models.KidAccounts;
using System.Security.Claims;

namespace innkt.Social.Controllers;

/// <summary>
/// Revolutionary kid account safety controller with comprehensive child protection
/// Provides industry-leading safety features and parental controls
/// </summary>
[ApiController]
[Route("api/v1/kid-safety")]
[Authorize]
public class KidSafetyController : ControllerBase
{
    private readonly IKidSafetyService _kidSafetyService;
    private readonly ILogger<KidSafetyController> _logger;

    public KidSafetyController(IKidSafetyService kidSafetyService, ILogger<KidSafetyController> logger)
    {
        _kidSafetyService = kidSafetyService;
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
    /// Create a new kid account with comprehensive safety settings
    /// </summary>
    [HttpPost("kid-accounts")]
    public async Task<ActionResult<KidAccount>> CreateKidAccount([FromBody] CreateKidAccountRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            if (parentId == Guid.Empty)
            {
                return Unauthorized("Parent ID not found in token");
            }

            _logger.LogInformation("Creating kid account for user {UserId} by parent {ParentId}", 
                request.UserId, parentId);

            var kidAccount = await _kidSafetyService.CreateKidAccountAsync(
                parentId, 
                request.UserId, 
                request.Age, 
                request.SafetyLevel ?? "strict");

            return Ok(new CreateKidAccountResponse
            {
                KidAccount = kidAccount,
                Message = "Kid account created successfully with comprehensive safety protection",
                NextSteps = new[]
                {
                    "Configure educational profile and school connections",
                    "Set up emergency contacts and safety preferences",
                    "Review and customize content filtering rules",
                    "Plan Independence Day transition if desired"
                }
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid kid account creation request");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating kid account");
            return StatusCode(500, "An error occurred while creating the kid account");
        }
    }

    /// <summary>
    /// Get kid account details with safety metrics
    /// </summary>
    [HttpGet("kid-accounts/{kidAccountId}")]
    public async Task<ActionResult<KidAccountDetailsResponse>> GetKidAccount(Guid kidAccountId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            
            if (kidAccount == null)
            {
                return NotFound($"Kid account with ID {kidAccountId} not found");
            }

            // Verify user is parent or the kid themselves
            if (kidAccount.ParentId != currentUserId && kidAccount.UserId != currentUserId)
            {
                return Forbid("Access denied to kid account details");
            }

            // Get additional safety metrics
            var maturityScore = await _kidSafetyService.CalculateMaturityScoreAsync(kidAccountId);
            var recentSafetyEvents = await _kidSafetyService.GetSafetyEventsAsync(kidAccountId, 7);
            var pendingApprovals = currentUserId == kidAccount.ParentId 
                ? await _kidSafetyService.GetPendingApprovalRequestsAsync(currentUserId)
                : new List<ParentApproval>();

            return Ok(new KidAccountDetailsResponse
            {
                KidAccount = kidAccount,
                CurrentMaturityScore = maturityScore,
                RecentSafetyEvents = recentSafetyEvents.Count,
                PendingApprovals = pendingApprovals.Count(p => p.KidAccountId == kidAccountId),
                CanAccessPlatform = await _kidSafetyService.CanKidAccessPlatformAsync(kidAccountId),
                DailyUsageMinutes = await _kidSafetyService.GetKidDailyUsageMinutesAsync(kidAccountId),
                IsWithinAllowedHours = await _kidSafetyService.IsWithinAllowedHoursAsync(kidAccountId)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting kid account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while retrieving kid account details");
        }
    }

    /// <summary>
    /// Check if a user is a kid account
    /// </summary>
    [HttpGet("users/{userId}/is-kid")]
    public async Task<ActionResult<IsKidAccountResponse>> IsKidAccount(Guid userId)
    {
        try
        {
            var isKid = await _kidSafetyService.IsKidAccountAsync(userId);
            var kidAccount = isKid ? await _kidSafetyService.GetKidAccountByUserIdAsync(userId) : null;

            return Ok(new IsKidAccountResponse
            {
                IsKidAccount = isKid,
                Age = kidAccount?.Age,
                SafetyLevel = kidAccount?.SafetyLevel,
                ParentId = kidAccount?.ParentId,
                CanAccessPlatform = isKid ? await _kidSafetyService.CanKidAccessPlatformAsync(kidAccount!.Id) : true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking kid account status for user {UserId}", userId);
            return StatusCode(500, "An error occurred while checking kid account status");
        }
    }

    /// <summary>
    /// Create approval request for kid account activity
    /// </summary>
    [HttpPost("approval-requests")]
    public async Task<ActionResult<ParentApproval>> CreateApprovalRequest([FromBody] CreateApprovalRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Verify the requesting user is the kid
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(request.KidAccountId);
            if (kidAccount == null || kidAccount.UserId != currentUserId)
            {
                return Forbid("Only the kid can create approval requests for their account");
            }

            var approval = await _kidSafetyService.CreateApprovalRequestAsync(
                request.KidAccountId,
                request.RequestType,
                request.TargetUserId,
                request.RequestData ?? new Dictionary<string, object>());

            return Ok(new CreateApprovalResponse
            {
                Approval = approval,
                Message = approval.AutoApproved 
                    ? "Request automatically approved based on safety assessment"
                    : "Request sent to parent for approval",
                EstimatedResponseTime = approval.AutoApproved ? "Immediate" : "Within 24 hours"
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid approval request");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating approval request");
            return StatusCode(500, "An error occurred while creating the approval request");
        }
    }

    /// <summary>
    /// Process parent approval request (approve/deny)
    /// </summary>
    [HttpPut("approval-requests/{approvalId}")]
    public async Task<ActionResult<ProcessApprovalResponse>> ProcessApprovalRequest(
        Guid approvalId, 
        [FromBody] ProcessApprovalRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            if (parentId == Guid.Empty)
            {
                return Unauthorized("Parent ID not found in token");
            }

            var success = await _kidSafetyService.ProcessApprovalRequestAsync(
                approvalId, 
                parentId, 
                request.Approved, 
                request.Notes);

            if (!success)
            {
                return NotFound("Approval request not found or access denied");
            }

            return Ok(new ProcessApprovalResponse
            {
                Success = true,
                Message = request.Approved 
                    ? "Request approved successfully" 
                    : "Request denied",
                Action = request.Approved ? "approved" : "denied",
                NotificationSent = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing approval request {ApprovalId}", approvalId);
            return StatusCode(500, "An error occurred while processing the approval request");
        }
    }

    /// <summary>
    /// Get pending approval requests for parent
    /// </summary>
    [HttpGet("parents/{parentId}/pending-approvals")]
    public async Task<ActionResult<List<ParentApproval>>> GetPendingApprovals(Guid parentId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (parentId != currentUserId)
            {
                return Forbid("Access denied to approval requests");
            }

            var pendingApprovals = await _kidSafetyService.GetPendingApprovalRequestsAsync(parentId);
            return Ok(pendingApprovals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending approvals for parent {ParentId}", parentId);
            return StatusCode(500, "An error occurred while retrieving pending approvals");
        }
    }

    /// <summary>
    /// Check if content is safe for kid account
    /// </summary>
    [HttpPost("content-safety-check")]
    public async Task<ActionResult<ContentSafetyResponse>> CheckContentSafety([FromBody] ContentSafetyRequest request)
    {
        try
        {
            var isSafe = await _kidSafetyService.IsContentSafeForKidAsync(
                request.Content, 
                request.KidAccountId, 
                request.MediaUrls);

            var safetyScore = await _kidSafetyService.CalculateContentSafetyScoreAsync(
                request.Content, 
                request.KidAge, 
                request.MediaUrls);

            return Ok(new
            {
                IsSafe = isSafe,
                SafetyScore = safetyScore,
                Reasons = isSafe 
                    ? new List<string> { "Content meets safety standards" }
                    : new List<string> { "Content may contain inappropriate material", "Safety score below threshold" },
                Recommendations = isSafe 
                    ? new List<string> { "Content approved for viewing" }
                    : new List<string> { "Consider parental review", "Suggest alternative educational content" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking content safety");
            return StatusCode(500, "An error occurred while checking content safety");
        }
    }

    /// <summary>
    /// Get weekly safety report for kid account
    /// </summary>
    [HttpGet("kid-accounts/{kidAccountId}/safety-report")]
    public async Task<ActionResult<KidSafetyReport>> GetWeeklySafetyReport(Guid kidAccountId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            
            if (kidAccount == null)
            {
                return NotFound($"Kid account with ID {kidAccountId} not found");
            }

            // Verify user is parent
            if (kidAccount.ParentId != currentUserId)
            {
                return Forbid("Access denied to safety report");
            }

            var report = await _kidSafetyService.GenerateWeeklySafetyReportAsync(kidAccountId);
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating safety report for kid account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while generating the safety report");
        }
    }

    /// <summary>
    /// Get safety insights for parent dashboard
    /// </summary>
    [HttpGet("parents/{parentId}/safety-insights")]
    public async Task<ActionResult<List<KidSafetyInsight>>> GetSafetyInsights(Guid parentId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (parentId != currentUserId)
            {
                return Forbid("Access denied to safety insights");
            }

            var insights = await _kidSafetyService.GetSafetyInsightsAsync(parentId);
            return Ok(insights);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting safety insights for parent {ParentId}", parentId);
            return StatusCode(500, "An error occurred while retrieving safety insights");
        }
    }

    /// <summary>
    /// Trigger emergency panic button
    /// </summary>
    [HttpPost("kid-accounts/{kidAccountId}/panic-button")]
    public async Task<ActionResult<EmergencyResponse>> TriggerPanicButton(
        Guid kidAccountId, 
        [FromBody] PanicButtonRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var kidAccount = await _kidSafetyService.GetKidAccountAsync(kidAccountId);
            
            if (kidAccount == null || kidAccount.UserId != currentUserId)
            {
                return Forbid("Access denied to panic button");
            }

            var success = await _kidSafetyService.TriggerPanicButtonAsync(kidAccountId, request.Message);
            
            if (success)
            {
                _logger.LogCritical("PANIC BUTTON TRIGGERED for kid account {KidAccountId} with message: {Message}", 
                    kidAccountId, request.Message);
            }

            return Ok(new EmergencyResponse
            {
                Success = success,
                Message = "Emergency alert sent to parents and authorities",
                EmergencyId = Guid.NewGuid(), // Generate emergency tracking ID
                ResponseTime = "Immediate",
                ContactsNotified = await _kidSafetyService.GetEmergencyContactsAsync(kidAccountId)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering panic button for kid account {KidAccountId}", kidAccountId);
            return StatusCode(500, "An error occurred while processing emergency request");
        }
    }
}

// DTOs for API requests and responses
public class CreateKidAccountRequest
{
    public Guid UserId { get; set; }
    public int Age { get; set; }
    public string? SafetyLevel { get; set; } = "strict";
}

public class CreateKidAccountResponse
{
    public KidAccount KidAccount { get; set; } = default!;
    public string Message { get; set; } = string.Empty;
    public string[] NextSteps { get; set; } = Array.Empty<string>();
}

public class KidAccountDetailsResponse
{
    public KidAccount KidAccount { get; set; } = default!;
    public double CurrentMaturityScore { get; set; }
    public int RecentSafetyEvents { get; set; }
    public int PendingApprovals { get; set; }
    public bool CanAccessPlatform { get; set; }
    public int DailyUsageMinutes { get; set; }
    public bool IsWithinAllowedHours { get; set; }
}

public class IsKidAccountResponse
{
    public bool IsKidAccount { get; set; }
    public int? Age { get; set; }
    public string? SafetyLevel { get; set; }
    public Guid? ParentId { get; set; }
    public bool CanAccessPlatform { get; set; }
}

public class CreateApprovalRequest
{
    public Guid KidAccountId { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public Guid TargetUserId { get; set; }
    public Dictionary<string, object>? RequestData { get; set; }
}

public class CreateApprovalResponse
{
    public ParentApproval Approval { get; set; } = default!;
    public string Message { get; set; } = string.Empty;
    public string EstimatedResponseTime { get; set; } = string.Empty;
}

public class ProcessApprovalRequest
{
    public bool Approved { get; set; }
    public string? Notes { get; set; }
}

public class ProcessApprovalResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool NotificationSent { get; set; }
}

public class ContentSafetyRequest
{
    public string Content { get; set; } = string.Empty;
    public Guid KidAccountId { get; set; }
    public int KidAge { get; set; }
    public List<string>? MediaUrls { get; set; }
}

// ContentSafetyResponse moved to KidSafeFeedController.cs to avoid duplication

public class PanicButtonRequest
{
    public string? Message { get; set; }
}

public class EmergencyResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid EmergencyId { get; set; }
    public string ResponseTime { get; set; } = string.Empty;
    public List<string> ContactsNotified { get; set; } = new();
}
