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
    Task<GroupPostListResponse> GetGroupPostsAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null, Guid? topicId = null);
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
    
    // Enhanced group creation
    Task<GroupResponse> CreateEducationalGroupAsync(Guid userId, CreateEducationalGroupRequest request);
    Task<GroupResponse> CreateFamilyGroupAsync(Guid userId, CreateFamilyGroupRequest request);
    
    // Subgroups
    Task<SubgroupResponse> CreateSubgroupAsync(Guid userId, CreateSubgroupRequest request);
    Task<SubgroupResponse?> GetSubgroupByIdAsync(Guid subgroupId, Guid? currentUserId = null);
    Task<List<SubgroupResponse>> GetGroupSubgroupsAsync(Guid groupId, Guid? currentUserId = null, bool includeInactive = false);
    Task<SubgroupResponse> UpdateSubgroupAsync(Guid subgroupId, Guid userId, CreateSubgroupRequest request);
    Task<bool> DeleteSubgroupAsync(Guid subgroupId, Guid userId);
    Task<bool> AddSubgroupMemberAsync(Guid subgroupId, Guid userId, AddSubgroupMemberRequest request);
    Task<bool> RemoveSubgroupMemberAsync(Guid subgroupId, Guid memberId, Guid userId);
    
    // Roles
    Task<GroupRoleResponse> CreateGroupRoleAsync(Guid userId, CreateGroupRoleRequest request);
    Task<GroupRoleResponse?> GetGroupRoleByIdAsync(Guid roleId, Guid? currentUserId = null);
    Task<List<GroupRoleResponse>> GetGroupRolesAsync(Guid groupId, Guid? currentUserId = null);
    Task<GroupRoleResponse> UpdateGroupRoleAsync(Guid roleId, Guid userId, UpdateGroupRoleRequest request);
    Task<bool> DeleteGroupRoleAsync(Guid roleId, Guid userId);
    Task<bool> AssignRoleToMemberAsync(Guid roleId, Guid userId, AssignRoleRequest request);
    Task<bool> RemoveRoleFromMemberAsync(Guid roleId, Guid memberId, Guid userId);
    Task<List<GroupMemberResponse>> GetRoleMembersAsync(Guid roleId, Guid? currentUserId = null);
    
    // Topics
    Task<TopicResponse> CreateTopicAsync(Guid userId, CreateTopicRequest request);
    Task<TopicResponse?> GetTopicByIdAsync(Guid topicId, Guid? currentUserId = null);
    Task<List<TopicResponse>> GetGroupTopicsAsync(Guid groupId, Guid? currentUserId = null, Guid? subgroupId = null, string? status = null);
    Task<TopicResponse> UpdateTopicStatusAsync(Guid topicId, Guid userId, string status);
    Task<bool> DeleteTopicAsync(Guid topicId, Guid userId);
    Task<TopicPostListResponse> GetTopicPostsAsync(Guid topicId, Guid? currentUserId = null, int page = 1, int pageSize = 20);
    Task<TopicPostResponse> CreateTopicPostAsync(Guid topicId, Guid userId, CreateTopicPostRequest request);
    Task<TopicPostResponse?> GetTopicPostByIdAsync(Guid postId, Guid? currentUserId = null);
    
    // Polls
    Task<PollResponse> CreatePollAsync(Guid userId, CreatePollRequest request);
    Task<PollResponse?> GetPollByIdAsync(Guid pollId, Guid? currentUserId = null);
    Task<List<PollResponse>> GetGroupPollsAsync(Guid groupId, Guid? currentUserId = null, Guid? topicId = null, bool? isActive = null);
    Task<PollResponse> VotePollAsync(Guid pollId, Guid userId, VotePollRequest request);
    Task<PollResultsResponse> GetPollResultsAsync(Guid pollId, Guid? currentUserId = null);
    Task<PollResponse> UpdatePollAsync(Guid pollId, Guid userId, UpdatePollRequest request);
    Task<bool> DeletePollAsync(Guid pollId, Guid userId);
    Task<PollVoteResponse?> GetUserVoteAsync(Guid pollId, Guid userId);
    
    // Documentation
    Task<DocumentationResponse> CreateDocumentationAsync(Guid userId, CreateDocumentationRequest request);
    Task<DocumentationResponse?> GetGroupDocumentationAsync(Guid groupId, Guid? currentUserId = null);
    Task<DocumentationResponse> UpdateDocumentationAsync(Guid documentationId, Guid userId, UpdateDocumentationRequest request);
    Task<bool> DeleteDocumentationAsync(Guid documentationId, Guid userId);
    Task<DocumentationSearchResponse> SearchDocumentationAsync(Guid userId, DocumentationSearchRequest request);
    Task<DocumentationAnswerResponse> AskDocumentationQuestionAsync(Guid userId, DocumentationQuestionRequest request);
    
    // Group Rules
    Task<GroupRuleResponse> CreateGroupRuleAsync(Guid groupId, Guid userId, CreateGroupRuleRequest request);
    Task<List<GroupRuleResponse>> GetGroupRulesAsync(Guid groupId);
    Task<GroupRuleResponse?> GetGroupRuleAsync(Guid groupId, Guid ruleId);
    Task<GroupRuleResponse?> UpdateGroupRuleAsync(Guid groupId, Guid ruleId, Guid userId, UpdateGroupRuleRequest request);
    Task<bool> DeleteGroupRuleAsync(Guid groupId, Guid ruleId, Guid userId);
    Task<GroupRuleResponse?> ToggleGroupRuleAsync(Guid groupId, Guid ruleId, Guid userId);
    
    // File Management
    Task<FileResponse> CreateFileAsync(Guid userId, CreateFileRequest request, string filePath);
    Task<FileResponse?> GetFileByIdAsync(Guid fileId, Guid? currentUserId = null);
    Task<FileListResponse> GetGroupFilesAsync(Guid groupId, Guid? currentUserId = null, int page = 1, int pageSize = 20, string? category = null, Guid? topicId = null);
    Task<FileResponse> UpdateFileAsync(Guid fileId, Guid userId, UpdateFileRequest request);
    Task<bool> DeleteFileAsync(Guid fileId, Guid userId);
    Task<bool> IncrementFileDownloadCountAsync(Guid fileId);
    Task<FilePermissionResponse> SetFilePermissionAsync(Guid fileId, Guid userId, FilePermissionRequest request);
    Task<List<FilePermissionResponse>> GetFilePermissionsAsync(Guid fileId, Guid userId);
}
