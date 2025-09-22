using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/grok")]
[Authorize]
public class GrokController : ControllerBase
{
    private readonly IGrokService _grokService;
    private readonly ILogger<GrokController> _logger;

    public GrokController(IGrokService grokService, ILogger<GrokController> logger)
    {
        _grokService = grokService;
        _logger = logger;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            _logger.LogWarning("Unauthorized access: User ID claim not found or invalid.");
            throw new UnauthorizedAccessException("User ID not found in token.");
        }
        return userId;
    }

    /// <summary>
    /// Process a Grok AI request from Social Service
    /// </summary>
    [HttpPost("process")]
    [ProducesResponseType(typeof(GrokResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<GrokResponse>> ProcessGrokRequest([FromBody] GrokRequest request)
    {
        try
        {
            _logger.LogInformation("🤖 Processing Grok request from Social Service: {RequestId}", request.RequestId);

            var response = await _grokService.ProcessGrokMentionAsync(
                request.UserQuestion, 
                Guid.Parse(request.PostId), 
                Guid.Parse(request.UserId), 
                request.PostContent
            );

            _logger.LogInformation("✅ Grok request {RequestId} processed successfully", request.RequestId);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("ProcessGrokRequest failed: {Message}", ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("ProcessGrokRequest failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Grok request {RequestId}", request.RequestId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Process a Grok AI request from internal services (requires service authentication)
    /// </summary>
    [HttpPost("internal/process")]
    [Authorize(AuthenticationSchemes = "ServiceAuth")]
    [ProducesResponseType(typeof(GrokResponse), 200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<GrokResponse>> ProcessGrokRequestInternal([FromBody] GrokRequest request)
    {
        try
        {
            _logger.LogInformation("🤖 Processing internal Grok request: {RequestId}", request.RequestId);

            // Parse GUIDs with error handling
            if (!Guid.TryParse(request.PostId, out var postId))
            {
                _logger.LogWarning("Invalid PostId format: {PostId}", request.PostId);
                return BadRequest(new { message = "Invalid PostId format" });
            }
            
            if (!Guid.TryParse(request.UserId, out var userId))
            {
                _logger.LogWarning("Invalid UserId format: {UserId}", request.UserId);
                return BadRequest(new { message = "Invalid UserId format" });
            }

            var response = await _grokService.ProcessGrokMentionAsync(
                request.UserQuestion, 
                postId, 
                userId, 
                request.PostContent
            );

            _logger.LogInformation("✅ Internal Grok request {RequestId} processed successfully", request.RequestId);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("ProcessGrokRequestInternal failed: {Message}", ex.Message);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing internal Grok request {RequestId}", request.RequestId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Health check for Grok service
    /// </summary>
    [HttpGet("health")]
    [ProducesResponseType(200)]
    public ActionResult GetHealth()
    {
        return Ok(new { 
            service = "Grok AI Service", 
            status = "healthy", 
            timestamp = DateTime.UtcNow 
        });
    }
}

// Request/Response models
public class GrokRequest
{
    public string PostContent { get; set; } = string.Empty;
    public string UserQuestion { get; set; } = string.Empty;
    public string PostId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
}

public class GrokResponse
{
    public string Id { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}
