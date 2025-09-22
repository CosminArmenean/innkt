using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using innkt.Social.Services;
using innkt.Social.DTOs;

namespace innkt.Social.Controllers;

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
    /// Send a request to Grok AI via NeuroSpark service
    /// </summary>
    [HttpPost("ask")]
    [ProducesResponseType(typeof(GrokResponseDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<GrokResponseDto>> AskGrok([FromBody] GrokRequestDto request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var response = await _grokService.ProcessGrokRequestAsync(request, userId);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("AskGrok failed: {Message}", ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Grok AI request");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Check the status of a Grok AI request
    /// </summary>
    [HttpGet("status/{requestId}")]
    [ProducesResponseType(typeof(GrokResponseDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<GrokResponseDto>> GetGrokStatus(string requestId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var response = await _grokService.GetGrokStatusAsync(requestId, userId);
            if (response == null)
            {
                return NotFound(new { message = "Grok request not found" });
            }
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("GetGrokStatus failed: {Message}", ex.Message);
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Grok AI status for request {RequestId}", requestId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

}
