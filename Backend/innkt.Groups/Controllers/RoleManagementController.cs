using Microsoft.AspNetCore.Mvc;
using innkt.Groups.DTOs;
using innkt.Groups.Services;

namespace innkt.Groups.Controllers
{
    [ApiController]
    [Route("api/groups/{groupId}/roles")]
    public class RoleManagementController : ControllerBase
    {
        private readonly IRoleManagementService _roleService;

        public RoleManagementController(IRoleManagementService roleService)
        {
            _roleService = roleService;
        }

        /// <summary>
        /// Get all roles for a group
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<RoleResponse>>> GetGroupRoles(Guid groupId)
        {
            try
            {
                var roles = await _roleService.GetGroupRolesAsync(groupId);
                return Ok(roles);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific role by ID
        /// </summary>
        [HttpGet("{roleId}")]
        public async Task<ActionResult<RoleResponse>> GetRole(Guid groupId, Guid roleId)
        {
            try
            {
                var role = await _roleService.GetRoleAsync(groupId, roleId);
                if (role == null)
                    return NotFound();

                return Ok(role);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Create a new role for a group
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<RoleResponse>> CreateRole(Guid groupId, CreateRoleRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var role = await _roleService.CreateRoleAsync(groupId, userId, request);
                return CreatedAtAction(nameof(GetRole), new { groupId, roleId = role.Id }, role);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing role
        /// </summary>
        [HttpPut("{roleId}")]
        public async Task<ActionResult<RoleResponse>> UpdateRole(Guid groupId, Guid roleId, UpdateRoleRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var role = await _roleService.UpdateRoleAsync(groupId, roleId, userId, request);
                return Ok(role);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a role
        /// </summary>
        [HttpDelete("{roleId}")]
        public async Task<ActionResult> DeleteRole(Guid groupId, Guid roleId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _roleService.DeleteRoleAsync(groupId, roleId, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all members with their roles for a group
        /// </summary>
        [HttpGet("members")]
        public async Task<ActionResult<List<RoleMemberResponse>>> GetRoleMembers(Guid groupId)
        {
            try
            {
                var members = await _roleService.GetRoleMembersAsync(groupId);
                return Ok(members);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Assign a role to a user
        /// </summary>
        [HttpPost("assign")]
        public async Task<ActionResult<RoleMemberResponse>> AssignRole(Guid groupId, AssignRoleRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var member = await _roleService.AssignRoleAsync(groupId, userId, request);
                return Ok(member);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Remove a role from a user
        /// </summary>
        [HttpDelete("members/{memberId}")]
        public async Task<ActionResult> RemoveRole(Guid groupId, Guid memberId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _roleService.RemoveRoleAsync(groupId, memberId, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update a member's role
        /// </summary>
        [HttpPut("members/{memberId}")]
        public async Task<ActionResult<RoleMemberResponse>> UpdateMemberRole(Guid groupId, Guid memberId, AssignRoleRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var member = await _roleService.UpdateMemberRoleAsync(groupId, memberId, userId, request);
                return Ok(member);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private Guid GetCurrentUserId()
        {
            // This should be implemented based on your authentication system
            // For now, return a default user ID
            return Guid.Parse("550e8400-e29b-41d4-a716-446655440001");
        }
    }
}
