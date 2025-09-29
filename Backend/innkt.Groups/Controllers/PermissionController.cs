using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.Services;
using innkt.Groups.Middleware;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace innkt.Groups.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionController : ControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly ILogger<PermissionController> _logger;

    public PermissionController(IPermissionService permissionService, ILogger<PermissionController> logger)
    {
        _permissionService = permissionService;
        _logger = logger;
    }

    /// <summary>
    /// Check if user can perform a specific action
    /// </summary>
    [HttpPost("check")]
    public async Task<ActionResult<PermissionCheckResponse>> CheckPermission([FromBody] PermissionCheckRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var canPerform = await _permissionService.CanUserPerformActionAsync(
                userId, 
                request.GroupId, 
                request.Action, 
                request.TargetUserId);

            return Ok(new PermissionCheckResponse
            {
                CanPerform = canPerform,
                Action = request.Action,
                GroupId = request.GroupId,
                UserId = userId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking permission for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while checking permission");
        }
    }

    /// <summary>
    /// Get all permissions for a user in a group
    /// </summary>
    [HttpGet("user/{userId}/group/{groupId}")]
    public async Task<ActionResult<UserPermissionsResponse>> GetUserPermissions(Guid userId, Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var permissions = await _permissionService.GetUserPermissionsAsync(userId, groupId);
            
            return Ok(new UserPermissionsResponse
            {
                UserId = userId,
                GroupId = groupId,
                Permissions = permissions
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permissions for user {UserId} in group {GroupId}", userId, groupId);
            return StatusCode(500, "An error occurred while retrieving permissions");
        }
    }

    /// <summary>
    /// Check if user can access a subgroup
    /// </summary>
    [HttpPost("subgroup-access")]
    public async Task<ActionResult<SubgroupAccessResponse>> CheckSubgroupAccess([FromBody] SubgroupAccessRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var canAccess = await _permissionService.CanUserAccessSubgroupAsync(userId, request.SubgroupId);

            return Ok(new SubgroupAccessResponse
            {
                CanAccess = canAccess,
                SubgroupId = request.SubgroupId,
                UserId = userId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking subgroup access for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while checking subgroup access");
        }
    }

    /// <summary>
    /// Check if user can post in a topic
    /// </summary>
    [HttpPost("topic-posting")]
    public async Task<ActionResult<TopicPostingResponse>> CheckTopicPosting([FromBody] TopicPostingRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var canPost = await _permissionService.CanUserPostInTopicAsync(userId, request.TopicId);

            return Ok(new TopicPostingResponse
            {
                CanPost = canPost,
                TopicId = request.TopicId,
                UserId = userId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking topic posting permission for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while checking topic posting permission");
        }
    }

    /// <summary>
    /// Check if user can vote in a poll
    /// </summary>
    [HttpPost("poll-voting")]
    public async Task<ActionResult<PollVotingResponse>> CheckPollVoting([FromBody] PollVotingRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var canVote = await _permissionService.CanUserVoteInPollAsync(userId, request.PollId, request.KidId);

            return Ok(new PollVotingResponse
            {
                CanVote = canVote,
                PollId = request.PollId,
                UserId = userId,
                KidId = request.KidId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking poll voting permission for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while checking poll voting permission");
        }
    }

    /// <summary>
    /// Check if parent can act for kid
    /// </summary>
    [HttpPost("parent-kid-action")]
    public async Task<ActionResult<ParentKidActionResponse>> CheckParentKidAction([FromBody] ParentKidActionRequest request)
    {
        try
        {
            var parentId = GetCurrentUserId();
            var canAct = await _permissionService.CanParentActForKidAsync(parentId, request.KidId, request.GroupId);

            return Ok(new ParentKidActionResponse
            {
                CanAct = canAct,
                ParentId = parentId,
                KidId = request.KidId,
                GroupId = request.GroupId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking parent-kid action permission for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while checking parent-kid action permission");
        }
    }

    /// <summary>
    /// Get permission matrix for a group
    /// </summary>
    [HttpGet("matrix/group/{groupId}")]
    public async Task<ActionResult<PermissionMatrix>> GetPermissionMatrix(Guid groupId)
    {
        try
        {
            var matrix = await _permissionService.GetPermissionMatrixAsync(groupId);
            return Ok(matrix);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permission matrix for group {GroupId}", groupId);
            return StatusCode(500, "An error occurred while retrieving permission matrix");
        }
    }

    /// <summary>
    /// Validate permission matrix
    /// </summary>
    [HttpPost("matrix/validate")]
    public async Task<ActionResult<PermissionMatrixValidationResponse>> ValidatePermissionMatrix([FromBody] PermissionMatrix matrix)
    {
        try
        {
            var isValid = await _permissionService.ValidatePermissionMatrixAsync(matrix.GroupId, matrix);

            return Ok(new PermissionMatrixValidationResponse
            {
                IsValid = isValid,
                GroupId = matrix.GroupId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating permission matrix for group {GroupId}", matrix.GroupId);
            return StatusCode(500, "An error occurred while validating permission matrix");
        }
    }

    /// <summary>
    /// Check if user is in a specific role
    /// </summary>
    [HttpPost("role-check")]
    public async Task<ActionResult<RoleCheckResponse>> CheckUserRole([FromBody] RoleCheckRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isInRole = await _permissionService.IsUserInRoleAsync(userId, request.GroupId, request.RoleName);

            return Ok(new RoleCheckResponse
            {
                IsInRole = isInRole,
                UserId = userId,
                GroupId = request.GroupId,
                RoleName = request.RoleName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user role for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while checking user role");
        }
    }

    /// <summary>
    /// Check if user is in a custom role
    /// </summary>
    [HttpPost("custom-role-check")]
    public async Task<ActionResult<CustomRoleCheckResponse>> CheckUserCustomRole([FromBody] CustomRoleCheckRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isInCustomRole = await _permissionService.IsUserInCustomRoleAsync(userId, request.GroupId, request.RoleId);

            return Ok(new CustomRoleCheckResponse
            {
                IsInCustomRole = isInCustomRole,
                UserId = userId,
                GroupId = request.GroupId,
                RoleId = request.RoleId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user custom role for user {UserId}", GetCurrentUserId());
            return StatusCode(500, "An error occurred while checking user custom role");
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

// Request/Response DTOs
public class PermissionCheckRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public string Action { get; set; } = string.Empty;
    
    public Guid? TargetUserId { get; set; }
}

public class PermissionCheckResponse
{
    public bool CanPerform { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
}

public class UserPermissionsResponse
{
    public Guid UserId { get; set; }
    public Guid GroupId { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class SubgroupAccessRequest
{
    [Required]
    public Guid SubgroupId { get; set; }
}

public class SubgroupAccessResponse
{
    public bool CanAccess { get; set; }
    public Guid SubgroupId { get; set; }
    public Guid UserId { get; set; }
}

public class TopicPostingRequest
{
    [Required]
    public Guid TopicId { get; set; }
}

public class TopicPostingResponse
{
    public bool CanPost { get; set; }
    public Guid TopicId { get; set; }
    public Guid UserId { get; set; }
}

public class PollVotingRequest
{
    [Required]
    public Guid PollId { get; set; }
    
    public Guid? KidId { get; set; }
}

public class PollVotingResponse
{
    public bool CanVote { get; set; }
    public Guid PollId { get; set; }
    public Guid UserId { get; set; }
    public Guid? KidId { get; set; }
}

public class ParentKidActionRequest
{
    [Required]
    public Guid KidId { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
}

public class ParentKidActionResponse
{
    public bool CanAct { get; set; }
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
}

public class PermissionMatrixValidationResponse
{
    public bool IsValid { get; set; }
    public Guid GroupId { get; set; }
}

public class RoleCheckRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public string RoleName { get; set; } = string.Empty;
}

public class RoleCheckResponse
{
    public bool IsInRole { get; set; }
    public Guid UserId { get; set; }
    public Guid GroupId { get; set; }
    public string RoleName { get; set; } = string.Empty;
}

public class CustomRoleCheckRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid RoleId { get; set; }
}

public class CustomRoleCheckResponse
{
    public bool IsInCustomRole { get; set; }
    public Guid UserId { get; set; }
    public Guid GroupId { get; set; }
    public Guid RoleId { get; set; }
}
