using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.DTOs;
using innkt.Groups.Middleware;
using System.Security.Claims;
using Confluent.Kafka;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;
    private readonly ITopicService _topicService;
    private readonly ILogger<GroupsController> _logger;
    private readonly IProducer<string, string> _kafkaProducer;

    public GroupsController(IGroupService groupService, ITopicService topicService, ILogger<GroupsController> logger, IProducer<string, string> kafkaProducer)
    {
        _groupService = groupService;
        _topicService = topicService;
        _logger = logger;
        _kafkaProducer = kafkaProducer;
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
    /// Join a group with kid account
    /// </summary>
    [HttpPost("{id}/join-with-kid")]
    public async Task<ActionResult> JoinGroupWithKid(Guid id, [FromBody] JoinGroupWithKidRequest request)
    {
        try
        {
            var parentUserId = GetCurrentUserId();
            var success = await _groupService.JoinGroupWithKidAsync(id, parentUserId, request.KidAccountId);
            
            if (!success)
                return BadRequest("Unable to join group with kid account");
                
            return Ok(new { message = "Successfully joined group with kid account" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining group {GroupId} with kid account {KidAccountId}", id, request.KidAccountId);
            return StatusCode(500, "An error occurred while joining the group with kid account");
        }
    }

    /// <summary>
    /// Join a subgroup with kid account
    /// </summary>
    [HttpPost("{id}/subgroups/{subgroupId}/join-with-kid")]
    public async Task<ActionResult> JoinSubgroupWithKid(Guid id, Guid subgroupId, [FromBody] JoinGroupWithKidRequest request)
    {
        try
        {
            var parentUserId = GetCurrentUserId();
            var success = await _groupService.JoinSubgroupWithKidAsync(id, subgroupId, parentUserId, request.KidAccountId);
            
            if (!success)
                return BadRequest("Unable to join subgroup with kid account");
                
            return Ok(new { message = "Successfully joined subgroup with kid account" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining subgroup {SubgroupId} in group {GroupId} with kid account {KidAccountId}", subgroupId, id, request.KidAccountId);
            return StatusCode(500, "An error occurred while joining the subgroup with kid account");
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
            _logger.LogInformation("Returning {Count} members for group {GroupId}", members.Members.Count, id);
            return Ok(members);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting members for group {GroupId}", id);
            return StatusCode(500, "An error occurred while retrieving group members");
        }
    }

    /// <summary>
    /// Get subgroup members
    /// </summary>
    [HttpGet("{id}/subgroups/{subgroupId}/members")]
    public async Task<ActionResult<GroupMemberListResponse>> GetSubgroupMembers(
        Guid id, 
        Guid subgroupId,
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var members = await _groupService.GetSubgroupMembersAsync(id, subgroupId, page, pageSize, currentUserId);
            _logger.LogInformation("Returning {Count} members for subgroup {SubgroupId} in group {GroupId}", members.Members.Count, subgroupId, id);
            return Ok(members);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting members for subgroup {SubgroupId} in group {GroupId}", subgroupId, id);
            return StatusCode(500, "An error occurred while retrieving subgroup members");
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

    /// <summary>
    /// Get posts for a specific group
    /// </summary>
    [HttpGet("{groupId}/posts")]
    public async Task<ActionResult<object>> GetGroupPosts(Guid groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] Guid? topicId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var posts = await _groupService.GetGroupPostsAsync(groupId, page, pageSize, userId, topicId);
            return Ok(posts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while getting group posts");
        }
    }

    /// <summary>
    /// Get polls for a specific group
    /// </summary>
    [HttpGet("{groupId}/polls")]
    public async Task<ActionResult<object>> GetGroupPolls(Guid groupId, [FromQuery] Guid? topicId = null, [FromQuery] bool? isActive = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var polls = await _groupService.GetGroupPollsAsync(groupId, userId, topicId, isActive);
            return Ok(polls);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting polls for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while getting group polls");
        }
    }

    /// <summary>
    /// Get topics for a specific group
    /// </summary>
    [HttpGet("{groupId}/topics")]
    public async Task<ActionResult<object>> GetGroupTopics(Guid groupId, [FromQuery] Guid? subgroupId = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var topics = await _groupService.GetGroupTopicsAsync(groupId, userId, subgroupId);
            return Ok(topics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting topics for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while getting group topics");
        }
    }

    /// <summary>
    /// Create a new topic in a group
    /// </summary>
    [HttpPost("{groupId}/topics")]
    [RequirePermission("create_topic")]
    public async Task<ActionResult<object>> CreateTopic(Guid groupId, [FromBody] CreateTopicRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var topic = await _groupService.CreateTopicAsync(userId, request);
            return CreatedAtAction(nameof(GetGroupTopics), new { groupId }, topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating topic for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while creating the topic");
        }
    }

    /// <summary>
    /// Get subgroups for a specific group
    /// </summary>
    [HttpGet("{groupId}/subgroups")]
    public async Task<ActionResult<object>> GetGroupSubgroups(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var subgroups = await _groupService.GetGroupSubgroupsAsync(groupId, userId);
            return Ok(subgroups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subgroups for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while getting group subgroups");
        }
    }

    /// <summary>
    /// Create a new subgroup
    /// </summary>
    [HttpPost("{groupId}/subgroups")]
    [RequirePermission("manage_subgroups")]
    public async Task<ActionResult<object>> CreateSubgroup(Guid groupId, [FromBody] CreateSubgroupRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            request.GroupId = groupId;
            var subgroup = await _groupService.CreateSubgroupAsync(userId, request);
            return CreatedAtAction(nameof(GetGroupSubgroups), new { groupId }, subgroup);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating subgroup for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while creating the subgroup");
        }
    }

    /// <summary>
    /// Update a subgroup
    /// </summary>
    [HttpPut("{groupId}/subgroups/{subgroupId}")]
    [RequirePermission("manage_subgroups")]
    public async Task<ActionResult<object>> UpdateSubgroup(Guid groupId, Guid subgroupId, [FromBody] UpdateSubgroupRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            // Convert UpdateSubgroupRequest to CreateSubgroupRequest for the service method
            var createRequest = new CreateSubgroupRequest
            {
                GroupId = groupId,
                Name = request.Name,
                Description = request.Description
            };
            var subgroup = await _groupService.UpdateSubgroupAsync(subgroupId, userId, createRequest);
            return Ok(subgroup);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating subgroup {SubgroupId} in group {GroupId}", subgroupId, groupId);
            return StatusCode(500, "An error occurred while updating the subgroup");
        }
    }

    /// <summary>
    /// Delete a subgroup
    /// </summary>
    [HttpDelete("{groupId}/subgroups/{subgroupId}")]
    [RequirePermission("manage_subgroups")]
    public async Task<ActionResult> DeleteSubgroup(Guid groupId, Guid subgroupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.DeleteSubgroupAsync(subgroupId, userId);
            if (!success)
            {
                return NotFound("Subgroup not found or you don't have permission to delete it");
            }
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting subgroup {SubgroupId} from group {GroupId}", subgroupId, groupId);
            return StatusCode(500, "An error occurred while deleting the subgroup");
        }
    }

    /// <summary>
    /// Get roles for a specific group
    /// </summary>
    [HttpGet("{groupId}/roles")]
    public async Task<ActionResult<object>> GetGroupRoles(Guid groupId)
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
            return StatusCode(500, "An error occurred while getting group roles");
        }
    }

    /// <summary>
    /// Create a new role for a group
    /// </summary>
    [HttpPost("{groupId}/roles")]
    [RequirePermission("manage_roles")]
    public async Task<ActionResult<object>> CreateGroupRole(Guid groupId, [FromBody] CreateRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = await _groupService.CreateGroupRoleAsync(userId, groupId, request);
            return CreatedAtAction(nameof(GetGroupRoles), new { groupId }, role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while creating the role");
        }
    }

    /// <summary>
    /// Update an existing role
    /// </summary>
    [HttpPut("roles/{roleId}")]
    [RequirePermission("manage_roles")]
    public async Task<ActionResult<GroupRoleResponse>> UpdateGroupRole(Guid roleId, [FromBody] UpdateRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var role = await _groupService.UpdateGroupRoleAsync(roleId, userId, request);
            if (role == null)
            {
                return NotFound("Role not found");
            }
            return Ok(role);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role {RoleId}", roleId);
            return StatusCode(500, "An error occurred while updating the role");
        }
    }

    /// <summary>
    /// Assign role to a group member
    /// </summary>
    [HttpPut("{groupId}/members/{memberId}/role")]
    [RequirePermission("manage_members")]
    public async Task<ActionResult> AssignRoleToMember(Guid groupId, Guid memberId, [FromBody] AssignRoleRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            request.GroupId = groupId;
            request.UserId = memberId; // Use UserId instead of MemberId
            await _groupService.AssignRoleToMemberAsync(request.RoleId ?? Guid.Empty, userId, request);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role to member {MemberId} in group {GroupId}", memberId, groupId);
            return StatusCode(500, "An error occurred while assigning the role");
        }
    }

    /// <summary>
    /// Create a post in a specific topic
    /// </summary>
    [HttpPost("{groupId}/topics/{topicId}/posts")]
    public async Task<ActionResult<object>> CreateTopicPost(Guid groupId, Guid topicId, [FromBody] CreateTopicPostRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var post = await _topicService.CreateTopicPostAsync(topicId, userId, request);
            return CreatedAtAction(nameof(GetGroupPosts), new { groupId }, post);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post in topic {TopicId} for group {GroupId}", topicId, groupId);
            return StatusCode(500, "An error occurred while creating the post");
        }
    }

    /// <summary>
    /// Update topic status (active/paused)
    /// </summary>
    [HttpPut("{groupId}/topics/{topicId}/status")]
    public async Task<ActionResult<TopicResponse>> UpdateTopicStatus(Guid groupId, Guid topicId, [FromBody] UpdateTopicStatusRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var updatedTopic = await _groupService.UpdateTopicStatusAsync(topicId, userId, request.Status);
            return Ok(updatedTopic);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating status for topic {TopicId} in group {GroupId}", topicId, groupId);
            return StatusCode(500, "An error occurred while updating topic status");
        }
    }

    /// <summary>
    /// Update topic settings and properties
    /// </summary>
    [HttpPut("{groupId}/topics/{topicId}")]
    [RequirePermission("manage_topics")]
    public async Task<ActionResult<TopicResponse>> UpdateTopic(Guid groupId, Guid topicId, [FromBody] UpdateTopicRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var updatedTopic = await _groupService.UpdateTopicAsync(topicId, userId, request);
            return Ok(updatedTopic);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating topic {TopicId} in group {GroupId}", topicId, groupId);
            return StatusCode(500, "An error occurred while updating topic");
        }
    }

    /// <summary>
    /// Invite a user to join the group
    /// </summary>
        [HttpPost("{groupId}/invite")]
        [RequirePermission("invite_members")]
        public async Task<ActionResult<GroupInvitationResponse>> InviteUser(Guid groupId, [FromBody] InviteUserRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var invitation = await _groupService.InviteUserAsync(groupId, userId, request.UserId, request.Message);
                
                // Get group information for Kafka event
                var group = await _groupService.GetGroupByIdAsync(groupId);
                if (group != null)
                {
                    // Send invitation event to Kafka
                    var invitationEvent = new
                    {
                        EventType = "GroupInvitation",
                        GroupId = groupId,
                        GroupName = group.Name,
                        GroupCategory = group.Category ?? "",
                        RecipientId = request.UserId,
                        SenderId = userId,
                        SubgroupId = request.SubgroupId,
                        InvitationMessage = request.Message ?? "",
                        IsEducationalGroup = group.Category?.ToLower() == "education",
                        RequiresParentApproval = group.Category?.ToLower() == "education",
                        ExpiresAt = DateTime.UtcNow.AddDays(7),
                        Timestamp = DateTime.UtcNow
                    };

                    var message = new Message<string, string>
                    {
                        Key = request.UserId.ToString(),
                        Value = System.Text.Json.JsonSerializer.Serialize(invitationEvent)
                    };

                    await _kafkaProducer.ProduceAsync("group-invitations", message);
                    _logger.LogInformation("Group invitation event sent to Kafka for user {UserId} and group {GroupName}", request.UserId, group.Name);
                }
                
                return Ok(invitation);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "User {UserId} attempted to invite user {InvitedUserId} to group {GroupId} without permission", GetCurrentUserId(), request.UserId, groupId);
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inviting user {UserId} to group {GroupId}", request.UserId, groupId);
                return StatusCode(500, "An error occurred while sending the invitation");
            }
        }

    /// <summary>
    /// Get pending invitations for a group
    /// </summary>
    [HttpGet("{groupId:guid}/invitations")]
    [RequirePermission("view_group")]
    public async Task<ActionResult<GroupInvitationListResponse>> GetGroupInvitations(Guid groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            var invitations = await _groupService.GetGroupInvitationsAsync(groupId, page, pageSize, userId);
            return Ok(invitations);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invitations for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving invitations");
        }
    }

    /// <summary>
    /// Cancel a pending invitation
    /// </summary>
    [HttpDelete("{groupId:guid}/invitations/{invitationId:guid}/cancel")]
    [RequirePermission("invite_members")]
    public async Task<ActionResult> CancelInvitation(Guid groupId, Guid invitationId)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _groupService.CancelInvitationAsync(invitationId, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "User {UserId} attempted to cancel invitation {InvitationId} for group {GroupId} without permission", GetCurrentUserId(), invitationId, groupId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling invitation {InvitationId} for group {GroupId}", invitationId, groupId);
            return StatusCode(500, "An error occurred while canceling the invitation");
        }
    }

    /// <summary>
    /// Get a specific invitation by ID (no groupId required)
    /// </summary>
    [HttpGet("invitations/{invitationId}")]
    public async Task<ActionResult<GroupInvitationResponse>> GetInvitationById(Guid invitationId)
    {
        try
        {
            var invitation = await _groupService.GetInvitationByIdAsync(invitationId);
            if (invitation == null)
            {
                return NotFound("Invitation not found");
            }
            return Ok(invitation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invitation {InvitationId}", invitationId);
            return StatusCode(500, "An error occurred while getting invitation");
        }
    }

    /// <summary>
    /// Revoke a pending invitation
    /// </summary>
    [HttpDelete("{groupId:guid}/invitations/{invitationId:guid}")]
    [RequirePermission("invite_members")]
    public async Task<ActionResult> RevokeInvitation(Guid groupId, Guid invitationId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.RevokeInvitationAsync(invitationId, userId);
            if (!success)
            {
                return NotFound("Invitation not found or already processed");
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "User {UserId} attempted to revoke invitation {InvitationId} without permission", GetCurrentUserId(), invitationId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking invitation {InvitationId} for group {GroupId}", invitationId, groupId);
            return StatusCode(500, "An error occurred while revoking the invitation");
        }
    }

    /// <summary>
    /// Update a pending invitation (revoke old and create new)
    /// </summary>
    [HttpPut("{groupId:guid}/invitations/{invitationId:guid}")]
    [RequirePermission("invite_members")]
    public async Task<ActionResult<GroupInvitationResponse>> UpdateInvitation(Guid groupId, Guid invitationId, UpdateInvitationRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var updatedInvitation = await _groupService.UpdateInvitationAsync(invitationId, userId, request);
            return Ok(updatedInvitation);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "User {UserId} attempted to update invitation {InvitationId} without permission", GetCurrentUserId(), invitationId);
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating invitation {InvitationId} for group {GroupId}", invitationId, groupId);
            return StatusCode(500, "An error occurred while updating the invitation");
        }
    }

        [HttpPost("{id}/notifications/send")]
        public async Task<ActionResult> SendGroupNotification(Guid id, [FromBody] SendGroupNotificationRequest request)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var group = await _groupService.GetGroupByIdAsync(id);
                
                if (group == null)
                {
                    return NotFound("Group not found");
                }

                // Check if user has permission to send notifications
                var member = await _groupService.GetGroupMemberAsync(id, currentUserId);
                if (member == null || (member.Role != "admin" && member.Role != "moderator"))
                {
                    return Forbid("Only admins and moderators can send group notifications");
                }

                // Get all group members
                var members = await _groupService.GetGroupMembersAsync(id);
                
                // Send notification event to Kafka for each member
                foreach (var groupMember in members.Members)
                {
                    var notificationEvent = new
                    {
                        EventType = "GroupNotification",
                        RecipientId = groupMember.UserId,
                        SenderId = currentUserId,
                        GroupId = id,
                        GroupName = group.Name,
                        NotificationType = request.Type,
                        Title = request.Title,
                        Message = request.Message,
                        IsUrgent = request.IsUrgent,
                        GroupData = request.Data ?? new Dictionary<string, object>(),
                        Timestamp = DateTime.UtcNow
                    };

                    var message = new Message<string, string>
                    {
                        Key = groupMember.UserId.ToString(),
                        Value = System.Text.Json.JsonSerializer.Serialize(notificationEvent)
                    };

                    await _kafkaProducer.ProduceAsync("group-notifications", message);
                }

                return Ok(new { message = $"Notification event sent to Kafka for {members.Members.Count} group members" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending group notification for group {GroupId}", id);
                return StatusCode(500, "An error occurred while sending group notification");
            }
        }

        /// <summary>
        /// Get user's roles in a group for role-based posting
        /// </summary>
        [HttpGet("{groupId}/user-roles")]
        public async Task<ActionResult<List<GroupRoleResponse>>> GetUserRolesInGroup(Guid groupId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var roles = await _groupService.GetUserRolesInGroupAsync(groupId, userId);
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user roles for group {GroupId}", groupId);
                return StatusCode(500, "An error occurred while retrieving user roles");
        }
    }

    // Subgroup-Role Assignment Endpoints
    /// <summary>
    /// Assign a role to a subgroup
    /// </summary>
    [HttpPost("{groupId}/subgroups/{subgroupId}/roles/{roleId}")]
    [RequirePermission("manage_roles")]
    public async Task<ActionResult<SubgroupRoleAssignmentResponse>> AssignRoleToSubgroup(Guid groupId, Guid subgroupId, Guid roleId, [FromBody] AssignRoleToSubgroupRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            request.SubgroupId = subgroupId;
            request.RoleId = roleId;
            var assignment = await _groupService.AssignRoleToSubgroupAsync(userId, request);
            return Ok(assignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role {RoleId} to subgroup {SubgroupId} in group {GroupId}", roleId, subgroupId, groupId);
            return StatusCode(500, "An error occurred while assigning the role");
        }
    }

    /// <summary>
    /// Remove a role from a subgroup
    /// </summary>
    [HttpDelete("{groupId}/subgroups/{subgroupId}/roles/{roleId}")]
    [RequirePermission("manage_roles")]
    public async Task<ActionResult> RemoveRoleFromSubgroup(Guid groupId, Guid subgroupId, Guid roleId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var request = new RemoveRoleFromSubgroupRequest
            {
                SubgroupId = subgroupId,
                RoleId = roleId
            };
            var success = await _groupService.RemoveRoleFromSubgroupAsync(userId, request);
            return success ? Ok() : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing role {RoleId} from subgroup {SubgroupId} in group {GroupId}", roleId, subgroupId, groupId);
            return StatusCode(500, "An error occurred while removing the role");
        }
    }

    /// <summary>
    /// Get subgroups with their assigned roles
    /// </summary>
    [HttpGet("{groupId}/subgroups-with-roles")]
    public async Task<ActionResult<List<SubgroupWithRolesResponse>>> GetSubgroupsWithRoles(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var subgroups = await _groupService.GetSubgroupsWithRolesAsync(groupId, userId);
            return Ok(subgroups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting subgroups with roles for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving subgroups");
        }
    }

    /// <summary>
    /// Get roles with their subgroup assignments
    /// </summary>
    [HttpGet("{groupId}/roles-with-subgroups")]
    [RequirePermission("manage_roles")]
    public async Task<ActionResult<List<RoleWithSubgroupsResponse>>> GetRolesWithSubgroups(Guid groupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var roles = await _groupService.GetRolesWithSubgroupsAsync(groupId, userId);
            return Ok(roles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles with subgroups for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving roles");
        }
    }

    /// <summary>
    /// Get role assignments for a specific subgroup
    /// </summary>
    [HttpGet("{groupId}/subgroups/{subgroupId}/role-assignments")]
    public async Task<ActionResult<List<SubgroupRoleAssignmentResponse>>> GetSubgroupRoleAssignments(Guid groupId, Guid subgroupId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var assignments = await _groupService.GetSubgroupRoleAssignmentsAsync(subgroupId, userId);
            return Ok(assignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting role assignments for subgroup {SubgroupId} in group {GroupId}", subgroupId, groupId);
            return StatusCode(500, "An error occurred while retrieving role assignments");
        }
    }

    /// <summary>
    /// Update a subgroup role assignment
    /// </summary>
    [HttpPut("{groupId}/subgroups/{subgroupId}/role-assignments/{assignmentId}")]
    [RequirePermission("manage_roles")]
    public async Task<ActionResult> UpdateSubgroupRoleAssignment(Guid groupId, Guid subgroupId, Guid assignmentId, [FromBody] UpdateSubgroupRoleAssignmentRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _groupService.UpdateSubgroupRoleAssignmentAsync(userId, assignmentId, request);
            return success ? Ok() : NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating role assignment {AssignmentId} for subgroup {SubgroupId} in group {GroupId}", assignmentId, subgroupId, groupId);
            return StatusCode(500, "An error occurred while updating the role assignment");
        }
    }
}

public class SendGroupNotificationRequest
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsUrgent { get; set; } = false;
    public Dictionary<string, object>? Data { get; set; }
}
