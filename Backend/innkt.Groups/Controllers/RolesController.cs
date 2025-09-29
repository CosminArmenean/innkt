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
public class RolesController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(IGroupService groupService, ILogger<RolesController> logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new group role
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<GroupRoleResponse>> CreateRole([FromBody] CreateGroupRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = await _groupService.CreateGroupRoleAsync(userId, request);
            return CreatedAtAction(nameof(GetRole), new { id = role.Id }, role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the role");
        }
    }

    /// <summary>
    /// Get a specific role by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<GroupRoleResponse>> GetRole(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = await _groupService.GetGroupRoleByIdAsync(id, userId);
            
            if (role == null)
                return NotFound("Role not found");
                
            return Ok(role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role {RoleId}", id);
            return StatusCode(500, "An error occurred while retrieving the role");
        }
    }

    /// <summary>
    /// Get roles for a group
    /// </summary>
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<List<GroupRoleResponse>>> GetGroupRoles(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var roles = await _groupService.GetGroupRolesAsync(groupId, userId);
            return Ok(roles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving roles");
        }
    }

    /// <summary>
    /// Update a role
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<GroupRoleResponse>> UpdateRole(Guid id, [FromBody] UpdateGroupRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = await _groupService.UpdateGroupRoleAsync(id, userId, request);
            return Ok(role);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update this role");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Role not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role {RoleId}", id);
            return StatusCode(500, "An error occurred while updating the role");
        }
    }

    /// <summary>
    /// Delete a role
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteRole(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.DeleteGroupRoleAsync(id, userId);
            
            if (!success)
                return NotFound("Role not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to delete this role");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {RoleId}", id);
            return StatusCode(500, "An error occurred while deleting the role");
        }
    }

    /// <summary>
    /// Assign role to a member
    /// </summary>
    [HttpPost("{id}/assign")]
    public async Task<ActionResult> AssignRole(Guid id, [FromBody] AssignRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.AssignRoleToMemberAsync(id, userId, request);
            
            if (!success)
                return BadRequest("Unable to assign role to member");
                
            return Ok(new { message = "Role assigned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role {RoleId}", id);
            return StatusCode(500, "An error occurred while assigning the role");
        }
    }

    /// <summary>
    /// Remove role from a member
    /// </summary>
    [HttpDelete("{id}/assign/{memberId}")]
    public async Task<ActionResult> RemoveRoleAssignment(Guid id, Guid memberId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.RemoveRoleFromMemberAsync(id, memberId, userId);
            
            if (!success)
                return BadRequest("Unable to remove role from member");
                
            return Ok(new { message = "Role removed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing role assignment {RoleId}", id);
            return StatusCode(500, "An error occurred while removing the role assignment");
        }
    }

    /// <summary>
    /// Get members with a specific role
    /// </summary>
    [HttpGet("{id}/members")]
    public async Task<ActionResult<List<GroupMemberResponse>>> GetRoleMembers(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var members = await _groupService.GetRoleMembersAsync(id, userId);
            return Ok(members);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting members for role {RoleId}", id);
            return StatusCode(500, "An error occurred while retrieving role members");
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

