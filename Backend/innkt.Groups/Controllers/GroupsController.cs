using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly ILogger<GroupsController> _logger;

    public GroupsController(IGroupService groupService, ILogger<GroupsController> logger)
    {
        _groupService = groupService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new group
    /// </summary>
    [HttpPost]
    [RequirePermission("create_group")]
    public async Task<ActionResult<GroupResponse>> CreateGroup([FromBody] CreateGroupRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var group = await _groupService.CreateGroupAsync(userId, request);
            return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating group for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while creating the group");
        }
    }

    /// <summary>
    /// Create a new educational group
    /// </summary>
    [HttpPost("educational/{userId}")]
    [RequirePermission("create_group")]
    public async Task<ActionResult<GroupResponse>> CreateEducationalGroup(Guid userId, [FromBody] CreateEducationalGroupRequest request)
    {
        try
        {
            var group = await _groupService.CreateEducationalGroupAsync(userId, request);
            return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating educational group for user {UserId}", userId);
            return StatusCode(500, "An error occurred while creating the educational group");
        }
    }

    /// <summary>
    /// Create a new family group
    /// </summary>
    [HttpPost("family/{userId}")]
    [RequirePermission("create_group")]
    public async Task<ActionResult<GroupResponse>> CreateFamilyGroup(Guid userId, [FromBody] CreateFamilyGroupRequest request)
    {
        try
        {
            var group = await _groupService.CreateFamilyGroupAsync(userId, request);
            return CreatedAtAction(nameof(GetGroup), new { id = group.Id }, group);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating family group for user {UserId}", userId);
            return StatusCode(500, "An error occurred while creating the family group");
        }
    }

    /// <summary>
    /// Get a specific group by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<GroupResponse>> GetGroup(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var group = await _groupService.GetGroupByIdAsync(id, userId);
            
            if (group == null)
                return NotFound("Group not found");
                
            return Ok(group);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting group {GroupId}", id);
            return StatusCode(500, "An error occurred while retrieving the group");
        }
    }

    /// <summary>
    /// Get groups that a user belongs to
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<GroupListResponse>> GetUserGroups(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var groups = await _groupService.GetUserGroupsAsync(userId, page, pageSize, currentUserId);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting groups for user {UserId}", userId);
            return StatusCode(500, "An error occurred while retrieving groups");
        }
    }

    /// <summary>
    /// Get public groups
    /// </summary>
    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<ActionResult<GroupListResponse>> GetPublicGroups(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20,
        [FromQuery] string? currentUserId = null)
    {
        try
        {
            // Parse currentUserId if provided
            Guid? userId = null;
            if (!string.IsNullOrEmpty(currentUserId) && Guid.TryParse(currentUserId, out var parsedUserId))
            {
                userId = parsedUserId;
            }
            
            var groups = await _groupService.GetPublicGroupsAsync(page, pageSize, userId);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting public groups");
            return StatusCode(500, "An error occurred while retrieving public groups");
        }
    }

    /// <summary>
    /// Update a group
    /// </summary>
    [HttpPut("{id}")]
    [RequirePermission("update_group", "id")]
    public async Task<ActionResult<GroupResponse>> UpdateGroup(Guid id, [FromBody] UpdateGroupRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var group = await _groupService.UpdateGroupAsync(id, userId, request);
            return Ok(group);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can only update groups you own or moderate");
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Group not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating group {GroupId}", id);
            return StatusCode(500, "An error occurred while updating the group");
        }
    }

    /// <summary>
    /// Delete a group
    /// </summary>
    [HttpDelete("{id}")]
    [RequireRole("owner", "id")]
    public async Task<ActionResult> DeleteGroup(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.DeleteGroupAsync(id, userId);
            
            if (!success)
                return NotFound("Group not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You can only delete groups you own");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting group {GroupId}", id);
            return StatusCode(500, "An error occurred while deleting the group");
        }
    }

    /// <summary>
    /// Join a group
    /// </summary>
    [HttpPost("{id}/join")]
    public async Task<ActionResult> JoinGroup(Guid id, [FromBody] JoinGroupRequest? request = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.JoinGroupAsync(id, userId, request?.Message);
            
            if (!success)
                return BadRequest("Unable to join group");
                
            return Ok(new { message = "Successfully joined group" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining group {GroupId}", id);
            return StatusCode(500, "An error occurred while joining the group");
        }
    }

    /// <summary>
    /// Leave a group
    /// </summary>
    [HttpPost("{id}/leave")]
    public async Task<ActionResult> LeaveGroup(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.LeaveGroupAsync(id, userId);
            
            if (!success)
                return BadRequest("Unable to leave group");
                
            return Ok(new { message = "Successfully left group" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving group {GroupId}", id);
            return StatusCode(500, "An error occurred while leaving the group");
        }
    }

    /// <summary>
    /// Get group members
    /// </summary>
    [HttpGet("{id}/members")]
    public async Task<ActionResult<GroupMemberListResponse>> GetGroupMembers(
        Guid id, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var members = await _groupService.GetGroupMembersAsync(id, page, pageSize, currentUserId);
            return Ok(members);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting members for group {GroupId}", id);
            return StatusCode(500, "An error occurred while retrieving group members");
        }
    }

    /// <summary>
    /// Search groups
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<GroupListResponse>> SearchGroups([FromQuery] SearchGroupsRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var groups = await _groupService.SearchGroupsAsync(request, currentUserId);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching groups");
            return StatusCode(500, "An error occurred while searching groups");
        }
    }

    /// <summary>
    /// Get trending groups
    /// </summary>
    [HttpGet("trending")]
    public async Task<ActionResult<GroupListResponse>> GetTrendingGroups(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var groups = await _groupService.GetTrendingGroupsAsync(page, pageSize, currentUserId);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending groups");
            return StatusCode(500, "An error occurred while retrieving trending groups");
        }
    }

    /// <summary>
    /// Get recommended groups for user
    /// </summary>
    [HttpGet("recommended")]
    public async Task<ActionResult<GroupListResponse>> GetRecommendedGroups(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var groups = await _groupService.GetRecommendedGroupsAsync(userId, page, pageSize);
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommended groups for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while retrieving recommended groups");
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

    // Group Rules Management
    [HttpPost("{groupId}/rules")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult<GroupRuleResponse>> CreateGroupRule(Guid groupId, [FromBody] CreateGroupRuleRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var rule = await _groupService.CreateGroupRuleAsync(groupId, currentUserId, request);
            return Ok(rule);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating group rule for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while creating the group rule");
        }
    }

    [HttpGet("{groupId}/rules")]
    public async Task<ActionResult<List<GroupRuleResponse>>> GetGroupRules(Guid groupId)
    {
        try
        {
            var rules = await _groupService.GetGroupRulesAsync(groupId);
            return Ok(rules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting group rules for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving group rules");
        }
    }

    [HttpGet("{groupId}/rules/{ruleId}")]
    public async Task<ActionResult<GroupRuleResponse>> GetGroupRule(Guid groupId, Guid ruleId)
    {
        try
        {
            var rule = await _groupService.GetGroupRuleAsync(groupId, ruleId);
            if (rule == null)
                return NotFound("Group rule not found");
            
            return Ok(rule);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting group rule {RuleId} for group {GroupId}", ruleId, groupId);
            return StatusCode(500, "An error occurred while retrieving the group rule");
        }
    }

    [HttpPut("{groupId}/rules/{ruleId}")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult<GroupRuleResponse>> UpdateGroupRule(Guid groupId, Guid ruleId, [FromBody] UpdateGroupRuleRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var rule = await _groupService.UpdateGroupRuleAsync(groupId, ruleId, currentUserId, request);
            if (rule == null)
                return NotFound("Group rule not found");
            
            return Ok(rule);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating group rule {RuleId} for group {GroupId}", ruleId, groupId);
            return StatusCode(500, "An error occurred while updating the group rule");
        }
    }

    [HttpDelete("{groupId}/rules/{ruleId}")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult> DeleteGroupRule(Guid groupId, Guid ruleId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _groupService.DeleteGroupRuleAsync(groupId, ruleId, currentUserId);
            if (!success)
                return NotFound("Group rule not found");
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting group rule {RuleId} for group {GroupId}", ruleId, groupId);
            return StatusCode(500, "An error occurred while deleting the group rule");
        }
    }

    [HttpPut("{groupId}/rules/{ruleId}/toggle")]
    [RequirePermission("groups.manage")]
    public async Task<ActionResult<GroupRuleResponse>> ToggleGroupRule(Guid groupId, Guid ruleId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var rule = await _groupService.ToggleGroupRuleAsync(groupId, ruleId, currentUserId);
            if (rule == null)
                return NotFound("Group rule not found");
            
            return Ok(rule);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling group rule {RuleId} for group {GroupId}", ruleId, groupId);
            return StatusCode(500, "An error occurred while toggling the group rule");
        }
    }
}
