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
public class ParentKidController : ControllerBase
{
    private readonly IParentKidService _parentKidService;
    private readonly ILogger<ParentKidController> _logger;

    public ParentKidController(IParentKidService parentKidService, ILogger<ParentKidController> logger)
    {
        _parentKidService = parentKidService;
        _logger = logger;
    }

    /// <summary>
    /// Create a parent-kid relationship
    /// </summary>
    [HttpPost("relationship")]
    [RequirePermission("manage_kid_relationships", "GroupId")]
    public async Task<ActionResult<ParentKidRelationshipResponse>> CreateParentKidRelationship([FromBody] CreateParentKidRelationshipRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            var relationship = await _parentKidService.CreateParentKidRelationshipAsync(parentId, request.KidId, request);
            return CreatedAtAction(nameof(GetParentKidRelationship), new { parentId, kidId = request.KidId }, relationship);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to create parent-kid relationships");
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating parent-kid relationship");
            return StatusCode(500, "An error occurred while creating the relationship");
        }
    }

    /// <summary>
    /// Get a specific parent-kid relationship
    /// </summary>
    [HttpGet("relationship/{parentId}/{kidId}")]
    public async Task<ActionResult<ParentKidRelationshipResponse>> GetParentKidRelationship(Guid parentId, Guid kidId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the parent or has permission to view relationships
            if (currentUserId != parentId)
            {
                var canView = await _parentKidService.CanParentActForKidAsync(currentUserId, kidId, Guid.Empty); // This would need group context
                if (!canView)
                {
                    return Forbid("You don't have permission to view this relationship");
                }
            }

            var relationship = await _parentKidService.GetParentKidRelationshipAsync(parentId, kidId);
            
            if (relationship == null)
                return NotFound("Parent-kid relationship not found");
                
            return Ok(relationship);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            return StatusCode(500, "An error occurred while retrieving the relationship");
        }
    }

    /// <summary>
    /// Get all relationships for a parent
    /// </summary>
    [HttpGet("parent/{parentId}/relationships")]
    public async Task<ActionResult<List<ParentKidRelationshipResponse>>> GetParentRelationships(Guid parentId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the parent or has permission to view relationships
            if (currentUserId != parentId)
            {
                return Forbid("You can only view your own relationships");
            }

            var relationships = await _parentKidService.GetParentRelationshipsAsync(parentId);
            return Ok(relationships);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting parent relationships for parent {ParentId}", parentId);
            return StatusCode(500, "An error occurred while retrieving relationships");
        }
    }

    /// <summary>
    /// Get all relationships for a kid
    /// </summary>
    [HttpGet("kid/{kidId}/relationships")]
    public async Task<ActionResult<List<ParentKidRelationshipResponse>>> GetKidRelationships(Guid kidId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the kid or has permission to view relationships
            if (currentUserId != kidId)
            {
                var canView = await _parentKidService.CanParentActForKidAsync(currentUserId, kidId, Guid.Empty); // This would need group context
                if (!canView)
                {
                    return Forbid("You don't have permission to view this kid's relationships");
                }
            }

            var relationships = await _parentKidService.GetKidRelationshipsAsync(kidId);
            return Ok(relationships);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting kid relationships for kid {KidId}", kidId);
            return StatusCode(500, "An error occurred while retrieving relationships");
        }
    }

    /// <summary>
    /// Update a parent-kid relationship
    /// </summary>
    [HttpPut("relationship/{parentId}/{kidId}")]
    [RequirePermission("manage_kid_relationships")]
    public async Task<ActionResult<ParentKidRelationshipResponse>> UpdateParentKidRelationship(
        Guid parentId, 
        Guid kidId, 
        [FromBody] UpdateParentKidRelationshipRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the parent
            if (currentUserId != parentId)
            {
                return Forbid("You can only update your own relationships");
            }

            var relationship = await _parentKidService.UpdateParentKidRelationshipAsync(parentId, kidId, request);
            return Ok(relationship);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Parent-kid relationship not found");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update this relationship");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            return StatusCode(500, "An error occurred while updating the relationship");
        }
    }

    /// <summary>
    /// Delete a parent-kid relationship
    /// </summary>
    [HttpDelete("relationship/{parentId}/{kidId}")]
    [RequirePermission("manage_kid_relationships")]
    public async Task<ActionResult> DeleteParentKidRelationship(Guid parentId, Guid kidId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the parent
            if (currentUserId != parentId)
            {
                return Forbid("You can only delete your own relationships");
            }

            var success = await _parentKidService.DeleteParentKidRelationshipAsync(parentId, kidId);
            
            if (!success)
                return NotFound("Parent-kid relationship not found");
                
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to delete this relationship");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            return StatusCode(500, "An error occurred while deleting the relationship");
        }
    }

    /// <summary>
    /// Add a kid to a group
    /// </summary>
    [HttpPost("group/{groupId}/add-kid")]
    [RequirePermission("manage_kid_relationships", "groupId")]
    public async Task<ActionResult<GroupMemberResponse>> AddKidToGroup(
        Guid groupId, 
        [FromBody] AddKidToGroupRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            var membership = await _parentKidService.AddKidToGroupAsync(parentId, request.KidId, groupId, request);
            return CreatedAtAction(nameof(GetKidGroupMemberships), new { kidId = request.KidId }, membership);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to add kids to this group");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding kid to group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while adding the kid to the group");
        }
    }

    /// <summary>
    /// Remove a kid from a group
    /// </summary>
    [HttpDelete("group/{groupId}/remove-kid/{kidId}")]
    [RequirePermission("manage_kid_relationships", "groupId")]
    public async Task<ActionResult> RemoveKidFromGroup(Guid groupId, Guid kidId)
    {
        try
        {
            var parentId = GetCurrentUserId();
            var success = await _parentKidService.RemoveKidFromGroupAsync(parentId, kidId, groupId);
            
            if (!success)
                return NotFound("Kid not found in group");
                
            return Ok(new { message = "Kid removed from group successfully" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to remove kids from this group");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing kid {KidId} from group {GroupId}", kidId, groupId);
            return StatusCode(500, "An error occurred while removing the kid from the group");
        }
    }

    /// <summary>
    /// Get kid's group memberships
    /// </summary>
    [HttpGet("kid/{kidId}/memberships")]
    public async Task<ActionResult<List<GroupMemberResponse>>> GetKidGroupMemberships(Guid kidId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the kid or has permission to view memberships
            if (currentUserId != kidId)
            {
                var canView = await _parentKidService.CanParentActForKidAsync(currentUserId, kidId, Guid.Empty); // This would need group context
                if (!canView)
                {
                    return Forbid("You don't have permission to view this kid's memberships");
                }
            }

            var memberships = await _parentKidService.GetKidGroupMembershipsAsync(kidId, currentUserId);
            return Ok(memberships);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting kid group memberships for kid {KidId}", kidId);
            return StatusCode(500, "An error occurred while retrieving memberships");
        }
    }

    /// <summary>
    /// Get parent's group memberships
    /// </summary>
    [HttpGet("parent/{parentId}/memberships")]
    public async Task<ActionResult<List<GroupMemberResponse>>> GetParentGroupMemberships(Guid parentId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the parent
            if (currentUserId != parentId)
            {
                return Forbid("You can only view your own memberships");
            }

            var memberships = await _parentKidService.GetParentGroupMembershipsAsync(parentId);
            return Ok(memberships);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting parent group memberships for parent {ParentId}", parentId);
            return StatusCode(500, "An error occurred while retrieving memberships");
        }
    }

    /// <summary>
    /// Check if parent can act for kid
    /// </summary>
    [HttpPost("can-act-for-kid")]
    public async Task<ActionResult<CanActForKidResponse>> CanParentActForKid([FromBody] CanActForKidRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            var canAct = await _parentKidService.CanParentActForKidAsync(parentId, request.KidId, request.GroupId);

            return Ok(new CanActForKidResponse
            {
                CanAct = canAct,
                ParentId = parentId,
                KidId = request.KidId,
                GroupId = request.GroupId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if parent can act for kid");
            return StatusCode(500, "An error occurred while checking permissions");
        }
    }

    /// <summary>
    /// Parent acting on behalf of kid
    /// </summary>
    [HttpPost("act-for-kid")]
    [RequirePermission("parent_act_for_kid")]
    public async Task<ActionResult<ParentActingResponse>> ParentActingForKid([FromBody] ParentActingRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            var response = await _parentKidService.ParentActingForKidAsync(parentId, request.KidId, request.GroupId, request.Action, request.Data);

            return Ok(response);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to act on behalf of this kid");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error with parent acting for kid");
            return StatusCode(500, "An error occurred while processing the action");
        }
    }

    /// <summary>
    /// Get parent acting history
    /// </summary>
    [HttpGet("parent/{parentId}/acting-history")]
    public async Task<ActionResult<List<ParentActingResponse>>> GetParentActingHistory(
        Guid parentId,
        [FromQuery] Guid? kidId = null,
        [FromQuery] Guid? groupId = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user is the parent
            if (currentUserId != parentId)
            {
                return Forbid("You can only view your own acting history");
            }

            var history = await _parentKidService.GetParentActingHistoryAsync(parentId, kidId, groupId);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting parent acting history for parent {ParentId}", parentId);
            return StatusCode(500, "An error occurred while retrieving acting history");
        }
    }

    /// <summary>
    /// Get parent-kid visual information
    /// </summary>
    [HttpGet("visual/{parentId}/{kidId}/{groupId}")]
    public async Task<ActionResult<ParentKidVisualResponse>> GetParentKidVisualInfo(Guid parentId, Guid kidId, Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user has permission to view this information
            if (currentUserId != parentId && currentUserId != kidId)
            {
                var canView = await _parentKidService.CanParentActForKidAsync(currentUserId, kidId, groupId);
                if (!canView)
                {
                    return Forbid("You don't have permission to view this information");
                }
            }

            var visual = await _parentKidService.GetParentKidVisualInfoAsync(parentId, kidId, groupId);
            return Ok(visual);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Parent-kid relationship not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting parent-kid visual info: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            return StatusCode(500, "An error occurred while retrieving visual information");
        }
    }

    /// <summary>
    /// Get group parent-kid visuals
    /// </summary>
    [HttpGet("group/{groupId}/visuals")]
    public async Task<ActionResult<List<ParentKidVisualResponse>>> GetGroupParentKidVisuals(Guid groupId)
    {
        try
        {
            var visuals = await _parentKidService.GetGroupParentKidVisualsAsync(groupId);
            return Ok(visuals);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting group parent-kid visuals for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving visuals");
        }
    }

    /// <summary>
    /// Get parent-kid permission matrix
    /// </summary>
    [HttpGet("permissions/{parentId}/{kidId}/{groupId}")]
    public async Task<ActionResult<ParentKidPermissionMatrix>> GetParentKidPermissionMatrix(Guid parentId, Guid kidId, Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            
            // Check if user has permission to view this information
            if (currentUserId != parentId && currentUserId != kidId)
            {
                var canView = await _parentKidService.CanParentActForKidAsync(currentUserId, kidId, groupId);
                if (!canView)
                {
                    return Forbid("You don't have permission to view this information");
                }
            }

            var matrix = await _parentKidService.GetParentKidPermissionMatrixAsync(parentId, kidId, groupId);
            return Ok(matrix);
        }
        catch (KeyNotFoundException)
        {
            return NotFound("Parent-kid relationship not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting parent-kid permission matrix: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            return StatusCode(500, "An error occurred while retrieving permission matrix");
        }
    }

    /// <summary>
    /// Check if kid can perform action
    /// </summary>
    [HttpPost("kid-can-perform")]
    public async Task<ActionResult<KidCanPerformResponse>> CanKidPerformAction([FromBody] KidCanPerformRequest request)
    {
        try
        {
            var canPerform = await _parentKidService.CanKidPerformActionAsync(request.KidId, request.GroupId, request.Action);

            return Ok(new KidCanPerformResponse
            {
                CanPerform = canPerform,
                KidId = request.KidId,
                GroupId = request.GroupId,
                Action = request.Action
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if kid can perform action");
            return StatusCode(500, "An error occurred while checking kid permissions");
        }
    }

    /// <summary>
    /// Check if parent can override kid action
    /// </summary>
    [HttpPost("parent-can-override")]
    public async Task<ActionResult<ParentCanOverrideResponse>> CanParentOverrideKidAction([FromBody] ParentCanOverrideRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            var canOverride = await _parentKidService.CanParentOverrideKidActionAsync(parentId, request.KidId, request.GroupId, request.Action);

            return Ok(new ParentCanOverrideResponse
            {
                CanOverride = canOverride,
                ParentId = parentId,
                KidId = request.KidId,
                GroupId = request.GroupId,
                Action = request.Action
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if parent can override kid action");
            return StatusCode(500, "An error occurred while checking override permissions");
        }
    }

    /// <summary>
    /// Get educational group settings
    /// </summary>
    [HttpGet("educational/{groupId}/settings")]
    public async Task<ActionResult<EducationalGroupSettings>> GetEducationalGroupSettings(Guid groupId)
    {
        try
        {
            var settings = await _parentKidService.GetEducationalGroupSettingsAsync(groupId);
            return Ok(settings);
        }
        catch (InvalidOperationException)
        {
            return BadRequest("Group is not an educational group");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting educational group settings for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving settings");
        }
    }

    /// <summary>
    /// Update educational group settings
    /// </summary>
    [HttpPut("educational/{groupId}/settings")]
    [RequirePermission("manage_group_settings", "groupId")]
    public async Task<ActionResult<EducationalGroupSettings>> UpdateEducationalGroupSettings(
        Guid groupId, 
        [FromBody] UpdateEducationalGroupSettingsRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var settings = await _parentKidService.UpdateEducationalGroupSettingsAsync(groupId, userId, request);
            return Ok(settings);
        }
        catch (InvalidOperationException)
        {
            return BadRequest("Group is not an educational group");
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid("You don't have permission to update group settings");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating educational group settings for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while updating settings");
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

// Additional request/response DTOs
public class CanActForKidRequest
{
    [Required]
    public Guid KidId { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
}

public class CanActForKidResponse
{
    public bool CanAct { get; set; }
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
}

public class ParentActingRequest
{
    [Required]
    public Guid KidId { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public string Action { get; set; } = string.Empty;
    
    public object? Data { get; set; }
}

public class KidCanPerformRequest
{
    [Required]
    public Guid KidId { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public string Action { get; set; } = string.Empty;
}

public class KidCanPerformResponse
{
    public bool CanPerform { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public class ParentCanOverrideRequest
{
    [Required]
    public Guid KidId { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public string Action { get; set; } = string.Empty;
}

public class ParentCanOverrideResponse
{
    public bool CanOverride { get; set; }
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
    public string Action { get; set; } = string.Empty;
}
