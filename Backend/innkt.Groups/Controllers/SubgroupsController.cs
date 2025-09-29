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
public class SubgroupsController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly ILogger<SubgroupsController> _logger;

    public SubgroupsController(IGroupService groupService, ILogger<SubgroupsController> logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new subgroup
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SubgroupResponse>> CreateSubgroup([FromBody] CreateSubgroupRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var subgroup = await _groupService.CreateSubgroupAsync(userId, request);
            return CreatedAtAction(nameof(GetSubgroup), new { id = subgroup.Id }, subgroup);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subgroup for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the subgroup");
        }
    }

    /// <summary>
    /// Get a specific subgroup by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SubgroupResponse>> GetSubgroup(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var subgroup = await _groupService.GetSubgroupByIdAsync(id, userId);
            
            if (subgroup == null)
                return NotFound("Subgroup not found");
                
            return Ok(subgroup);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subgroup {SubgroupId}", id);
            return StatusCode(500, "An error occurred while retrieving the subgroup");
        }
    }

    /// <summary>
    /// Get subgroups for a group
    /// </summary>
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<List<SubgroupResponse>>> GetGroupSubgroups(
        Guid groupId,
        [FromQuery] bool includeInactive = false)
    {
        try
        {
            var userId = GetCurrentUserId();
            var subgroups = await _groupService.GetGroupSubgroupsAsync(groupId, userId, includeInactive);
            return Ok(subgroups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subgroups for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving subgroups");
        }
    }

    /// <summary>
    /// Update a subgroup
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SubgroupResponse>> UpdateSubgroup(Guid id, [FromBody] CreateSubgroupRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var subgroup = await _groupService.UpdateSubgroupAsync(id, userId, request);
            return Ok(subgroup);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update this subgroup");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Subgroup not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subgroup {SubgroupId}", id);
            return StatusCode(500, "An error occurred while updating the subgroup");
        }
    }

    /// <summary>
    /// Delete a subgroup
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSubgroup(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.DeleteSubgroupAsync(id, userId);
            
            if (!success)
                return NotFound("Subgroup not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to delete this subgroup");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting subgroup {SubgroupId}", id);
            return StatusCode(500, "An error occurred while deleting the subgroup");
        }
    }

    /// <summary>
    /// Add member to subgroup
    /// </summary>
    [HttpPost("{id}/members")]
    public async Task<ActionResult> AddSubgroupMember(Guid id, [FromBody] AddSubgroupMemberRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.AddSubgroupMemberAsync(id, userId, request);
            
            if (!success)
                return BadRequest("Unable to add member to subgroup");
                
            return Ok(new { message = "Member added to subgroup successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding member to subgroup {SubgroupId}", id);
            return StatusCode(500, "An error occurred while adding member to subgroup");
        }
    }

    /// <summary>
    /// Remove member from subgroup
    /// </summary>
    [HttpDelete("{id}/members/{memberId}")]
    public async Task<ActionResult> RemoveSubgroupMember(Guid id, Guid memberId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.RemoveSubgroupMemberAsync(id, memberId, userId);
            
            if (!success)
                return BadRequest("Unable to remove member from subgroup");
                
            return Ok(new { message = "Member removed from subgroup successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing member from subgroup {SubgroupId}", id);
            return StatusCode(500, "An error occurred while removing member from subgroup");
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

