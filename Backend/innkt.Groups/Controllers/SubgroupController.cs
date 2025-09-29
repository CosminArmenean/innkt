using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Groups.DTOs;
using innkt.Groups.Services;
using System.Security.Claims;

namespace innkt.Groups.Controllers
{
    [ApiController]
    [Route("api/groups/{groupId}/subgroups")]
    [Authorize]
    public class SubgroupController : ControllerBase
    {
        private readonly ISubgroupService _subgroupService;

        public SubgroupController(ISubgroupService subgroupService)
        {
            _subgroupService = subgroupService;
        }

        /// <summary>
        /// Get all subgroups for a group
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<SubgroupResponse>>> GetSubgroups(Guid groupId)
        {
            try
            {
                var subgroups = await _subgroupService.GetSubgroupsAsync(groupId);
                return Ok(subgroups);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get a specific subgroup by ID
        /// </summary>
        [HttpGet("{subgroupId}")]
        public async Task<ActionResult<SubgroupResponse>> GetSubgroup(Guid groupId, Guid subgroupId)
        {
            try
            {
                var subgroup = await _subgroupService.GetSubgroupAsync(groupId, subgroupId);
                if (subgroup == null)
                    return NotFound();

                return Ok(subgroup);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Create a new subgroup
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<SubgroupResponse>> CreateSubgroup(Guid groupId, CreateSubgroupRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var subgroup = await _subgroupService.CreateSubgroupAsync(groupId, userId, request);
                return CreatedAtAction(nameof(GetSubgroup), new { groupId, subgroupId = subgroup.Id }, subgroup);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing subgroup
        /// </summary>
        [HttpPut("{subgroupId}")]
        public async Task<ActionResult<SubgroupResponse>> UpdateSubgroup(Guid groupId, Guid subgroupId, UpdateSubgroupRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var subgroup = await _subgroupService.UpdateSubgroupAsync(groupId, subgroupId, userId, request);
                return Ok(subgroup);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a subgroup
        /// </summary>
        [HttpDelete("{subgroupId}")]
        public async Task<ActionResult> DeleteSubgroup(Guid groupId, Guid subgroupId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _subgroupService.DeleteSubgroupAsync(groupId, subgroupId, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all members of a subgroup
        /// </summary>
        [HttpGet("{subgroupId}/members")]
        public async Task<ActionResult<List<SubgroupMemberResponse>>> GetSubgroupMembers(Guid groupId, Guid subgroupId)
        {
            try
            {
                var members = await _subgroupService.GetSubgroupMembersAsync(groupId, subgroupId);
                return Ok(members);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Add a member to a subgroup
        /// </summary>
        [HttpPost("{subgroupId}/members")]
        public async Task<ActionResult<SubgroupMemberResponse>> AddSubgroupMember(Guid groupId, Guid subgroupId, AddSubgroupMemberRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var member = await _subgroupService.AddSubgroupMemberAsync(groupId, subgroupId, userId, request);
                return Ok(member);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Remove a member from a subgroup
        /// </summary>
        [HttpDelete("{subgroupId}/members/{memberId}")]
        public async Task<ActionResult> RemoveSubgroupMember(Guid groupId, Guid subgroupId, Guid memberId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _subgroupService.RemoveSubgroupMemberAsync(groupId, subgroupId, memberId, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get subgroup statistics
        /// </summary>
        [HttpGet("{subgroupId}/stats")]
        public async Task<ActionResult<object>> GetSubgroupStats(Guid groupId, Guid subgroupId)
        {
            try
            {
                var stats = await _subgroupService.GetSubgroupStatsAsync(groupId, subgroupId);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
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
}
