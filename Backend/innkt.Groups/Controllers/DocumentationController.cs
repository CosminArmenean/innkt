using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentationController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly ILogger<DocumentationController> _logger;

    public DocumentationController(IGroupService groupService, ILogger<DocumentationController> logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    /// <summary>
    /// Create or update group documentation
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DocumentationResponse>> CreateDocumentation([FromBody] CreateDocumentationRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var documentation = await _groupService.CreateDocumentationAsync(userId, request);
            return CreatedAtAction(nameof(GetDocumentation), new { groupId = request.GroupId }, documentation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating documentation for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the documentation");
        }
    }

    /// <summary>
    /// Get group documentation
    /// </summary>
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<DocumentationResponse>> GetDocumentation(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var documentation = await _groupService.GetGroupDocumentationAsync(groupId, userId);
            
            if (documentation == null)
                return NotFound("Documentation not found");
                
            return Ok(documentation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting documentation for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving the documentation");
        }
    }

    /// <summary>
    /// Update group documentation
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<DocumentationResponse>> UpdateDocumentation(Guid id, [FromBody] UpdateDocumentationRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var documentation = await _groupService.UpdateDocumentationAsync(id, userId, request);
            return Ok(documentation);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update this documentation");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Documentation not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating documentation {DocumentationId}", id);
            return StatusCode(500, "An error occurred while updating the documentation");
        }
    }

    /// <summary>
    /// Delete group documentation
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDocumentation(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.DeleteDocumentationAsync(id, userId);
            
            if (!success)
                return NotFound("Documentation not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to delete this documentation");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting documentation {DocumentationId}", id);
            return StatusCode(500, "An error occurred while deleting the documentation");
        }
    }

    /// <summary>
    /// Search documentation content using @grok AI
    /// </summary>
    [HttpPost("search")]
    public async Task<ActionResult<DocumentationSearchResponse>> SearchDocumentation([FromBody] DocumentationSearchRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var results = await _groupService.SearchDocumentationAsync(userId, request);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching documentation for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while searching the documentation");
        }
    }

    /// <summary>
    /// Ask a question using @grok AI with group documentation context
    /// </summary>
    [HttpPost("ask")]
    public async Task<ActionResult<DocumentationAnswerResponse>> AskQuestion([FromBody] DocumentationQuestionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var answer = await _groupService.AskDocumentationQuestionAsync(userId, request);
            return Ok(answer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error asking question for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while processing the question");
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

