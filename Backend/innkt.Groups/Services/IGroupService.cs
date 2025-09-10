using innkt.Groups.DTOs;

namespace innkt.Groups.Services;

public interface IGroupService
{
    // Group management
    Task<GroupResponse> CreateGroupAsync(Guid userId, CreateGroupRequest request);
    Task<GroupResponse?> GetGroupByIdAsync(Guid groupId, Guid? currentUserId = null);
    Task<GroupListResponse> GetUserGroupsAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<GroupListResponse> GetPublicGroupsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<GroupResponse> UpdateGroupAsync(Guid groupId, Guid userId, UpdateGroupRequest request);
    Task<bool> DeleteGroupAsync(Guid groupId, Guid userId);
    Task<bool> VerifyGroupAsync(Guid groupId, Guid adminUserId);
    
    // Group membership
    Task<bool> JoinGroupAsync(Guid groupId, Guid userId, string? message = null);
    Task<bool> LeaveGroupAsync(Guid groupId, Guid userId);
    Task<bool> IsUserMemberAsync(Guid groupId, Guid userId);
    Task<string?> GetUserRoleAsync(Guid groupId, Guid userId);
    
    // Group members
    Task<GroupMemberListResponse> GetGroupMembersAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<bool> UpdateMemberRoleAsync(Guid groupId, Guid targetUserId, string newRole, Guid adminUserId);
    Task<bool> RemoveMemberAsync(Guid groupId, Guid targetUserId, Guid adminUserId);
    
    // Group invitations
    Task<GroupInvitationResponse> InviteUserAsync(Guid groupId, Guid userId, Guid invitedUserId, string? message = null);
    Task<GroupInvitationListResponse> GetGroupInvitationsAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<GroupInvitationListResponse> GetUserInvitationsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<bool> RespondToInvitationAsync(Guid invitationId, Guid userId, string action);
    
    // Group posts
    Task<GroupPostResponse> CreateGroupPostAsync(Guid groupId, Guid userId, GroupPostRequest request);
    Task<GroupPostListResponse> GetGroupPostsAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<GroupPostResponse?> GetGroupPostByIdAsync(Guid groupPostId, Guid? currentUserId = null);
    Task<bool> PinGroupPostAsync(Guid groupPostId, Guid userId);
    Task<bool> UnpinGroupPostAsync(Guid groupPostId, Guid userId);
    Task<bool> DeleteGroupPostAsync(Guid groupPostId, Guid userId);
    
    // Group settings
    Task<GroupSettingsResponse> GetGroupSettingsAsync(Guid groupId, Guid userId);
    Task<GroupSettingsResponse> UpdateGroupSettingsAsync(Guid groupId, Guid userId, UpdateGroupSettingsRequest request);
    
    // Search and discovery
    Task<GroupListResponse> SearchGroupsAsync(SearchGroupsRequest request, Guid? currentUserId = null);
    Task<GroupListResponse> GetTrendingGroupsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null);
    Task<GroupListResponse> GetRecommendedGroupsAsync(Guid userId, int page = 1, int pageSize = 20);
}
