using innkt.Groups.Models;
using innkt.Groups.Data;
using Microsoft.EntityFrameworkCore;

namespace innkt.Groups.Services;

public class PermissionService : IPermissionService
{
    private readonly GroupsDbContext _context;
    private readonly ILogger<PermissionService> _logger;

    public PermissionService(GroupsDbContext context, ILogger<PermissionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> CanUserPerformActionAsync(Guid userId, Guid groupId, string action, Guid? targetUserId = null)
    {
        try
        {
            // Get user's role in the group
            var userRole = await GetUserRoleInGroupAsync(userId, groupId);
            if (userRole == null) return false;

            // Get group type for specific permissions
            var group = await _context.Groups
                .FirstOrDefaultAsync(g => g.Id == groupId);
            
            if (group == null) return false;

            // Check basic role permissions
            var hasBasicPermission = await CheckBasicRolePermissionAsync(userRole, action, group.GroupType);
            if (!hasBasicPermission) return false;

            // Check custom role permissions if user has assigned role
            if (userRole.AssignedRoleId.HasValue)
            {
                var customRole = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
                
                if (customRole != null)
                {
                    var hasCustomPermission = await CheckCustomRolePermissionAsync(customRole, action);
                    if (!hasCustomPermission) return false;
                }
            }

            // Check educational group specific permissions
            if (group.GroupType == "educational")
            {
                return await CheckEducationalPermissionsAsync(userId, groupId, action, targetUserId);
            }

            // Check family group specific permissions
            if (group.GroupType == "family")
            {
                return await CheckFamilyPermissionsAsync(userId, groupId, action, targetUserId);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user permission for action {Action} in group {GroupId}", action, groupId);
            return false;
        }
    }

    public async Task<bool> CanUserAccessSubgroupAsync(Guid userId, Guid subgroupId)
    {
        try
        {
            var subgroup = await _context.Subgroups
                .Include(s => s.Group)
                .FirstOrDefaultAsync(s => s.Id == subgroupId);
            
            if (subgroup == null) return false;

            // Check if user is member of the main group
            var isGroupMember = await _context.GroupMembers
                .AnyAsync(m => m.GroupId == subgroup.GroupId && m.UserId == userId && m.IsActive);

            if (!isGroupMember) return false;

            // Check if user has access to this specific subgroup
            var subgroupMember = await _context.SubgroupMembers
                .Include(sm => sm.GroupMember)
                .FirstOrDefaultAsync(sm => sm.SubgroupId == subgroupId && 
                                         sm.GroupMember.UserId == userId && 
                                         sm.IsActive);

            if (subgroupMember != null) return true;

            // Check if user has role that can access all subgroups
            var userRole = await GetUserRoleInGroupAsync(userId, subgroup.GroupId);
            if (userRole?.AssignedRoleId.HasValue == true)
            {
                var role = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
                
                return role?.CanAccessAllSubgroups == true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking subgroup access for user {UserId} in subgroup {SubgroupId}", userId, subgroupId);
            return false;
        }
    }

    public async Task<bool> CanUserManageRoleAsync(Guid userId, Guid groupId, Guid roleId)
    {
        try
        {
            var userRole = await GetUserRoleInGroupAsync(userId, groupId);
            if (userRole == null) return false;

            // Only owners, admins, and users with role management permissions can manage roles
            if (userRole.Role == "owner" || userRole.Role == "admin") return true;

            if (userRole.AssignedRoleId.HasValue)
            {
                var customRole = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
                
                return customRole?.CanManageRoles == true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking role management permission for user {UserId} in group {GroupId}", userId, groupId);
            return false;
        }
    }

    public async Task<bool> CanUserCreateTopicAsync(Guid userId, Guid groupId, Guid? subgroupId = null)
    {
        try
        {
            var userRole = await GetUserRoleInGroupAsync(userId, groupId);
            if (userRole == null) return false;

            // Check if user can create topics
            if (userRole.Role == "owner" || userRole.Role == "admin") return true;

            if (userRole.AssignedRoleId.HasValue)
            {
                var customRole = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
                
                return customRole?.CanCreateTopics == true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking topic creation permission for user {UserId} in group {GroupId}", userId, groupId);
            return false;
        }
    }

    public async Task<bool> CanUserModerateTopicAsync(Guid userId, Guid topicId)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);
            
            if (topic == null) return false;

            return await CanUserPerformActionAsync(userId, topic.GroupId, "moderate_topic");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking topic moderation permission for user {UserId} in topic {TopicId}", userId, topicId);
            return false;
        }
    }

    public async Task<bool> CanUserPostInTopicAsync(Guid userId, Guid topicId)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);
            
            if (topic == null) return false;

            var userRole = await GetUserRoleInGroupAsync(userId, topic.GroupId);
            if (userRole == null) return false;

            // Check topic-specific permissions
            if (topic.IsAnnouncementOnly)
            {
                // Only admins and roles with announcement permissions can post
                if (userRole.Role == "owner" || userRole.Role == "admin") return true;
                
                if (userRole.AssignedRoleId.HasValue)
                {
                    var customRole = await _context.GroupRoles
                        .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
                    
                    return customRole?.CanPostAnnouncements == true;
                }
                return false;
            }

            // Check if user can post based on topic settings
            if (topic.AllowMemberPosts && userRole.CanPost) return true;
            if (topic.AllowRolePosts && userRole.AssignedRoleId.HasValue) return true;

            // Check educational group specific permissions
            if (topic.Group.GroupType == "educational")
            {
                if (topic.AllowParentPosts && userRole.ParentId.HasValue) return true;
                if (topic.AllowKidPosts && userRole.KidId.HasValue) return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking topic posting permission for user {UserId} in topic {TopicId}", userId, topicId);
            return false;
        }
    }

    public async Task<bool> CanUserVoteInPollAsync(Guid userId, Guid pollId, Guid? kidId = null)
    {
        try
        {
            var poll = await _context.GroupPolls
                .Include(p => p.Group)
                .FirstOrDefaultAsync(p => p.Id == pollId);
            
            if (poll == null) return false;

            var userRole = await GetUserRoleInGroupAsync(userId, poll.GroupId);
            if (userRole == null) return false;

            // Check if user can vote
            if (!userRole.CanVote) return false;

            // Check poll-specific permissions
            if (poll.AllowKidVoting && userRole.KidId.HasValue) return true;
            if (poll.AllowParentVotingForKid && userRole.ParentId.HasValue && kidId.HasValue) return true;
            if (userRole.Role == "owner" || userRole.Role == "admin") return true;

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking poll voting permission for user {UserId} in poll {PollId}", userId, pollId);
            return false;
        }
    }

    public async Task<bool> CanUserManageDocumentationAsync(Guid userId, Guid groupId)
    {
        try
        {
            var userRole = await GetUserRoleInGroupAsync(userId, groupId);
            if (userRole == null) return false;

            // Only owners, admins, and users with documentation permissions can manage documentation
            if (userRole.Role == "owner" || userRole.Role == "admin") return true;

            if (userRole.AssignedRoleId.HasValue)
            {
                var customRole = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
                
                return customRole?.CanUseGrokAI == true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking documentation management permission for user {UserId} in group {GroupId}", userId, groupId);
            return false;
        }
    }

    public async Task<List<string>> GetUserPermissionsAsync(Guid userId, Guid groupId)
    {
        try
        {
            var permissions = new List<string>();
            var userRole = await GetUserRoleInGroupAsync(userId, groupId);
            
            if (userRole == null) return permissions;

            // Add basic role permissions
            permissions.AddRange(GetBasicRolePermissions(userRole.Role));

            // Add custom role permissions
            if (userRole.AssignedRoleId.HasValue)
            {
                var customRole = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
                
                if (customRole != null)
                {
                    permissions.AddRange(GetCustomRolePermissions(customRole));
                }
            }

            return permissions.Distinct().ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user permissions for user {UserId} in group {GroupId}", userId, groupId);
            return new List<string>();
        }
    }

    public async Task<bool> HasPermissionAsync(Guid userId, Guid groupId, string permission)
    {
        var permissions = await GetUserPermissionsAsync(userId, groupId);
        return permissions.Contains(permission);
    }

    public async Task<bool> IsUserInRoleAsync(Guid userId, Guid groupId, string roleName)
    {
        var userRole = await GetUserRoleInGroupAsync(userId, groupId);
        return userRole?.Role == roleName;
    }

    public async Task<bool> IsUserInCustomRoleAsync(Guid userId, Guid groupId, Guid roleId)
    {
        var userRole = await GetUserRoleInGroupAsync(userId, groupId);
        return userRole?.AssignedRoleId == roleId;
    }

    public async Task<bool> CanParentActForKidAsync(Guid parentId, Guid kidId, Guid groupId)
    {
        try
        {
            // Check if parent is member of the group
            var parentMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == parentId && m.IsActive);
            
            if (parentMember == null) return false;

            // Check if kid is member of the group
            var kidMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == kidId && m.IsActive);
            
            if (kidMember == null) return false;

            // Check if parent is linked to this kid
            return parentMember.ParentId == kidId || kidMember.ParentId == parentId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking parent-kid relationship for parent {ParentId} and kid {KidId} in group {GroupId}", parentId, kidId, groupId);
            return false;
        }
    }

    public async Task<bool> CanKidPerformActionAsync(Guid kidId, Guid groupId, string action)
    {
        try
        {
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId);
            if (group?.GroupType != "educational" && group?.GroupType != "family") return false;

            var kidRole = await GetUserRoleInGroupAsync(kidId, groupId);
            if (kidRole == null) return false;

            // Check if kid has permission for this action
            return await CanUserPerformActionAsync(kidId, groupId, action);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking kid action permission for kid {KidId} in group {GroupId}", kidId, groupId);
            return false;
        }
    }

    public async Task<bool> CanTeacherPerformActionAsync(Guid teacherId, Guid groupId, string action)
    {
        try
        {
            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId);
            if (group?.GroupType != "educational") return false;

            var teacherRole = await GetUserRoleInGroupAsync(teacherId, groupId);
            if (teacherRole == null) return false;

            // Teachers have enhanced permissions in educational groups
            return await CanUserPerformActionAsync(teacherId, groupId, action);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking teacher action permission for teacher {TeacherId} in group {GroupId}", teacherId, groupId);
            return false;
        }
    }

    public async Task<PermissionMatrix> GetPermissionMatrixAsync(Guid groupId)
    {
        try
        {
            var group = await _context.Groups
                .Include(g => g.Roles)
                .FirstOrDefaultAsync(g => g.Id == groupId);
            
            if (group == null) return new PermissionMatrix();

            var matrix = new PermissionMatrix
            {
                GroupId = groupId,
                GroupType = group.GroupType,
                Roles = new List<RolePermissions>()
            };

            // Add basic roles
            matrix.Roles.AddRange(GetBasicRolePermissionsMatrix());

            // Add custom roles
            foreach (var role in group.Roles)
            {
                matrix.Roles.Add(new RolePermissions
                {
                    RoleId = role.Id,
                    RoleName = role.Name,
                    Alias = role.Alias,
                    Permissions = GetCustomRolePermissions(role)
                });
            }

            return matrix;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting permission matrix for group {GroupId}", groupId);
            return new PermissionMatrix();
        }
    }

    public async Task<bool> ValidatePermissionMatrixAsync(Guid groupId, PermissionMatrix matrix)
    {
        try
        {
            // Validate that the matrix is consistent with the group's current roles
            var currentMatrix = await GetPermissionMatrixAsync(groupId);
            
            // Check if all roles in the matrix exist
            foreach (var role in matrix.Roles)
            {
                if (role.RoleId.HasValue)
                {
                    var exists = await _context.GroupRoles
                        .AnyAsync(r => r.Id == role.RoleId.Value && r.GroupId == groupId);
                    if (!exists) return false;
                }
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating permission matrix for group {GroupId}", groupId);
            return false;
        }
    }

    // Private helper methods
    private async Task<GroupMember?> GetUserRoleInGroupAsync(Guid userId, Guid groupId)
    {
        return await _context.GroupMembers
            .Include(m => m.AssignedRole)
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId && m.IsActive);
    }

    private async Task<bool> CheckBasicRolePermissionAsync(GroupMember userRole, string action, string groupType)
    {
        var role = userRole.Role;
        
        return action switch
        {
            "create_topic" => role == "owner" || role == "admin" || role == "moderator",
            "post_in_topic" => userRole.CanPost,
            "vote_in_poll" => userRole.CanVote,
            "comment_on_post" => userRole.CanComment,
            "invite_members" => userRole.CanInvite || role == "owner" || role == "admin",
            "manage_members" => role == "owner" || role == "admin",
            "manage_roles" => role == "owner" || role == "admin",
            "manage_subgroups" => role == "owner" || role == "admin",
            "manage_documentation" => role == "owner" || role == "admin",
            "use_grok_ai" => role == "owner" || role == "admin" || role == "moderator",
            "use_perpetual_photos" => role == "owner" || role == "admin",
            "use_paper_scanning" => role == "owner" || role == "admin",
            "manage_funds" => role == "owner" || role == "admin",
            _ => false
        };
    }

    private async Task<bool> CheckCustomRolePermissionAsync(GroupRole customRole, string action)
    {
        return action switch
        {
            "create_topic" => customRole.CanCreateTopics,
            "manage_members" => customRole.CanManageMembers,
            "manage_roles" => customRole.CanManageRoles,
            "manage_subgroups" => customRole.CanManageSubgroups,
            "post_announcements" => customRole.CanPostAnnouncements,
            "moderate_content" => customRole.CanModerateContent,
            "access_all_subgroups" => customRole.CanAccessAllSubgroups,
            "use_grok_ai" => customRole.CanUseGrokAI,
            "use_perpetual_photos" => customRole.CanUsePerpetualPhotos,
            "use_paper_scanning" => customRole.CanUsePaperScanning,
            "manage_funds" => customRole.CanManageFunds,
            _ => false
        };
    }

    private async Task<bool> CheckEducationalPermissionsAsync(Guid userId, Guid groupId, string action, Guid? targetUserId)
    {
        // Educational groups have special permissions for teachers, parents, and kids
        var userRole = await GetUserRoleInGroupAsync(userId, groupId);
        if (userRole == null) return false;

        // Teachers have enhanced permissions
        if (userRole.AssignedRoleId.HasValue)
        {
            var role = await _context.GroupRoles
                .FirstOrDefaultAsync(r => r.Id == userRole.AssignedRoleId.Value);
            
            if (role?.Name.ToLower().Contains("teacher") == true)
            {
                return action switch
                {
                    "use_perpetual_photos" => role.CanUsePerpetualPhotos,
                    "use_paper_scanning" => role.CanUsePaperScanning,
                    "manage_homework" => role.CanUsePaperScanning, // Teachers can manage homework
                    _ => true // Teachers have most permissions
                };
            }
        }

        return true;
    }

    private async Task<bool> CheckFamilyPermissionsAsync(Guid userId, Guid groupId, string action, Guid? targetUserId)
    {
        // Family groups have special permissions for parents and kids
        var userRole = await GetUserRoleInGroupAsync(userId, groupId);
        if (userRole == null) return false;

        // Parents can act on behalf of kids
        if (userRole.ParentId.HasValue && targetUserId.HasValue)
        {
            return await CanParentActForKidAsync(userId, targetUserId.Value, groupId);
        }

        // Kids have limited permissions
        if (userRole.KidId.HasValue)
        {
            return action switch
            {
                "post_in_topic" => userRole.CanPost,
                "vote_in_poll" => userRole.CanVote,
                "comment_on_post" => userRole.CanComment,
                _ => false // Kids have limited permissions
            };
        }

        return true;
    }

    private List<string> GetBasicRolePermissions(string role)
    {
        return role switch
        {
            "owner" => new List<string> { "all_permissions" },
            "admin" => new List<string> { "manage_members", "manage_roles", "manage_subgroups", "manage_documentation", "use_grok_ai" },
            "moderator" => new List<string> { "moderate_content", "use_grok_ai" },
            "member" => new List<string> { "post_in_topic", "vote_in_poll", "comment_on_post" },
            _ => new List<string>()
        };
    }

    private List<string> GetCustomRolePermissions(GroupRole role)
    {
        var permissions = new List<string>();
        
        if (role.CanCreateTopics) permissions.Add("create_topic");
        if (role.CanManageMembers) permissions.Add("manage_members");
        if (role.CanManageRoles) permissions.Add("manage_roles");
        if (role.CanManageSubgroups) permissions.Add("manage_subgroups");
        if (role.CanPostAnnouncements) permissions.Add("post_announcements");
        if (role.CanModerateContent) permissions.Add("moderate_content");
        if (role.CanAccessAllSubgroups) permissions.Add("access_all_subgroups");
        if (role.CanUseGrokAI) permissions.Add("use_grok_ai");
        if (role.CanUsePerpetualPhotos) permissions.Add("use_perpetual_photos");
        if (role.CanUsePaperScanning) permissions.Add("use_paper_scanning");
        if (role.CanManageFunds) permissions.Add("manage_funds");
        
        return permissions;
    }

    private List<RolePermissions> GetBasicRolePermissionsMatrix()
    {
        return new List<RolePermissions>
        {
            new RolePermissions
            {
                RoleName = "owner",
                Permissions = new List<string> { "all_permissions" }
            },
            new RolePermissions
            {
                RoleName = "admin",
                Permissions = new List<string> { "manage_members", "manage_roles", "manage_subgroups", "manage_documentation", "use_grok_ai" }
            },
            new RolePermissions
            {
                RoleName = "moderator",
                Permissions = new List<string> { "moderate_content", "use_grok_ai" }
            },
            new RolePermissions
            {
                RoleName = "member",
                Permissions = new List<string> { "post_in_topic", "vote_in_poll", "comment_on_post" }
            }
        };
    }

}

// Permission matrix classes
public class PermissionMatrix
{
    public Guid GroupId { get; set; }
    public string GroupType { get; set; } = string.Empty;
    public List<RolePermissions> Roles { get; set; } = new();
}

public class RolePermissions
{
    public Guid? RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public List<string> Permissions { get; set; } = new();
}
