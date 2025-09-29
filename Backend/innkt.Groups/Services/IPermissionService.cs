using innkt.Groups.Models;
using innkt.Groups.Data;

namespace innkt.Groups.Services;

public interface IPermissionService
{
    // Permission checking
    Task<bool> CanUserPerformActionAsync(Guid userId, Guid groupId, string action, Guid? targetUserId = null);
    Task<bool> CanUserAccessSubgroupAsync(Guid userId, Guid subgroupId);
    Task<bool> CanUserManageRoleAsync(Guid userId, Guid groupId, Guid roleId);
    Task<bool> CanUserCreateTopicAsync(Guid userId, Guid groupId, Guid? subgroupId = null);
    Task<bool> CanUserModerateTopicAsync(Guid userId, Guid topicId);
    Task<bool> CanUserPostInTopicAsync(Guid userId, Guid topicId);
    Task<bool> CanUserVoteInPollAsync(Guid userId, Guid pollId, Guid? kidId = null);
    Task<bool> CanUserManageDocumentationAsync(Guid userId, Guid groupId);
    
    // Role-based permissions
    Task<List<string>> GetUserPermissionsAsync(Guid userId, Guid groupId);
    Task<bool> HasPermissionAsync(Guid userId, Guid groupId, string permission);
    Task<bool> IsUserInRoleAsync(Guid userId, Guid groupId, string roleName);
    Task<bool> IsUserInCustomRoleAsync(Guid userId, Guid groupId, Guid roleId);
    
    // Educational group specific permissions
    Task<bool> CanParentActForKidAsync(Guid parentId, Guid kidId, Guid groupId);
    Task<bool> CanKidPerformActionAsync(Guid kidId, Guid groupId, string action);
    Task<bool> CanTeacherPerformActionAsync(Guid teacherId, Guid groupId, string action);
    
    // Permission matrix
    Task<PermissionMatrix> GetPermissionMatrixAsync(Guid groupId);
    Task<bool> ValidatePermissionMatrixAsync(Guid groupId, PermissionMatrix matrix);
}
