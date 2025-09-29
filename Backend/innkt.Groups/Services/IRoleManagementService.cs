using innkt.Groups.DTOs;

namespace innkt.Groups.Services
{
    public interface IRoleManagementService
    {
        Task<List<RoleResponse>> GetGroupRolesAsync(Guid groupId);
        Task<RoleResponse?> GetRoleAsync(Guid groupId, Guid roleId);
        Task<RoleResponse> CreateRoleAsync(Guid groupId, Guid userId, CreateRoleRequest request);
        Task<RoleResponse> UpdateRoleAsync(Guid groupId, Guid roleId, Guid userId, UpdateRoleRequest request);
        Task DeleteRoleAsync(Guid groupId, Guid roleId, Guid userId);
        Task<List<RoleMemberResponse>> GetRoleMembersAsync(Guid groupId);
        Task<RoleMemberResponse> AssignRoleAsync(Guid groupId, Guid userId, AssignRoleRequest request);
        Task RemoveRoleAsync(Guid groupId, Guid memberId, Guid userId);
        Task<RoleMemberResponse> UpdateMemberRoleAsync(Guid groupId, Guid memberId, Guid userId, AssignRoleRequest request);
    }
}
