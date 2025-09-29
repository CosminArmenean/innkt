using innkt.Groups.DTOs;
using innkt.Groups.Models;
using innkt.Groups.Data;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace innkt.Groups.Services
{
    public class RoleManagementService : IRoleManagementService
    {
        private readonly GroupsDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<RoleManagementService> _logger;

        public RoleManagementService(
            GroupsDbContext context,
            IMapper mapper,
            ILogger<RoleManagementService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<RoleResponse>> GetGroupRolesAsync(Guid groupId)
        {
            try
            {
                var roles = await _context.GroupRoles
                    .Where(r => r.GroupId == groupId)
                    .ToListAsync();

                return roles.Select(r => _mapper.Map<RoleResponse>(r)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting group roles for group {GroupId}", groupId);
                throw;
            }
        }

        public async Task<RoleResponse?> GetRoleAsync(Guid groupId, Guid roleId)
        {
            try
            {
                var role = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == roleId && r.GroupId == groupId);

                return role != null ? _mapper.Map<RoleResponse>(role) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting role {RoleId} for group {GroupId}", roleId, groupId);
                throw;
            }
        }

        public async Task<RoleResponse> CreateRoleAsync(Guid groupId, Guid userId, CreateRoleRequest request)
        {
            try
            {
                var role = new GroupRole
                {
                    GroupId = groupId,
                    Name = request.Name,
                    Alias = request.Alias,
                    Permissions = System.Text.Json.JsonSerializer.Serialize(request.Permissions),
                    CanSeeRealUsername = request.CanSeeRealUsername,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.GroupRoles.Add(role);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Created role '{RoleName}' in group {GroupId}", role.Name, groupId);

                return _mapper.Map<RoleResponse>(role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating role for group {GroupId}", groupId);
                throw;
            }
        }

        public async Task<RoleResponse> UpdateRoleAsync(Guid groupId, Guid roleId, Guid userId, UpdateRoleRequest request)
        {
            try
            {
                var role = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == roleId && r.GroupId == groupId);

                if (role == null)
                    throw new KeyNotFoundException("Role not found");

                role.Name = request.Name;
                role.Alias = request.Alias;
                role.Permissions = System.Text.Json.JsonSerializer.Serialize(request.Permissions);
                role.CanSeeRealUsername = request.CanSeeRealUsername;
                role.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Updated role '{RoleName}' in group {GroupId}", role.Name, groupId);

                return _mapper.Map<RoleResponse>(role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error updating role {RoleId} for group {GroupId}", roleId, groupId);
                throw;
            }
        }

        public async Task DeleteRoleAsync(Guid groupId, Guid roleId, Guid userId)
        {
            try
            {
                var role = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == roleId && r.GroupId == groupId);

                if (role == null)
                    throw new KeyNotFoundException("Role not found");

                _context.GroupRoles.Remove(role);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🗑️ Deleted role '{RoleName}' from group {GroupId}", role.Name, groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error deleting role {RoleId} from group {GroupId}", roleId, groupId);
                throw;
            }
        }

        public async Task<List<RoleMemberResponse>> GetRoleMembersAsync(Guid groupId)
        {
            try
            {
                var members = await _context.GroupMembers
                    .Include(m => m.Role)
                    .Where(m => m.GroupId == groupId)
                    .ToListAsync();

                return members.Select(m => _mapper.Map<RoleMemberResponse>(m)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting role members for group {GroupId}", groupId);
                throw;
            }
        }

        public async Task<RoleMemberResponse> AssignRoleAsync(Guid groupId, Guid userId, AssignRoleRequest request)
        {
            try
            {
                var member = await _context.GroupMembers
                    .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == request.UserId);

                if (member == null)
                    throw new KeyNotFoundException("Group member not found");

                member.RoleId = request.RoleId;
                member.SubgroupId = request.SubgroupId;
                member.IsParentAccount = request.IsParentAccount;
                member.KidAccountId = request.KidAccountId;
                member.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Assigned role to user {UserId} in group {GroupId}", request.UserId, groupId);

                return _mapper.Map<RoleMemberResponse>(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error assigning role to user {UserId} in group {GroupId}", request.UserId, groupId);
                throw;
            }
        }

        public async Task RemoveRoleAsync(Guid groupId, Guid memberId, Guid userId)
        {
            try
            {
                var member = await _context.GroupMembers
                    .FirstOrDefaultAsync(m => m.Id == memberId && m.GroupId == groupId);

                if (member == null)
                    throw new KeyNotFoundException("Group member not found");

                member.RoleId = null;
                member.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Removed role from member {MemberId} in group {GroupId}", memberId, groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error removing role from member {MemberId} in group {GroupId}", memberId, groupId);
                throw;
            }
        }

        public async Task<RoleMemberResponse> UpdateMemberRoleAsync(Guid groupId, Guid memberId, Guid userId, AssignRoleRequest request)
        {
            try
            {
                var member = await _context.GroupMembers
                    .FirstOrDefaultAsync(m => m.Id == memberId && m.GroupId == groupId);

                if (member == null)
                    throw new KeyNotFoundException("Group member not found");

                member.RoleId = request.RoleId;
                member.SubgroupId = request.SubgroupId;
                member.IsParentAccount = request.IsParentAccount;
                member.KidAccountId = request.KidAccountId;
                member.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Updated role for member {MemberId} in group {GroupId}", memberId, groupId);

                return _mapper.Map<RoleMemberResponse>(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error updating role for member {MemberId} in group {GroupId}", memberId, groupId);
                throw;
            }
        }
    }
}
