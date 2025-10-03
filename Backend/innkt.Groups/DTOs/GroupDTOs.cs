using System.ComponentModel.DataAnnotations;

namespace innkt.Groups.DTOs;

public class CreateGroupRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [MaxLength(500)]
    public string? AvatarUrl { get; set; }
    
    [MaxLength(500)]
    public string? CoverImageUrl { get; set; }
    
    public bool IsPublic { get; set; } = true;
}

public class UpdateGroupRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [MaxLength(500)]
    public string? AvatarUrl { get; set; }
    
    [MaxLength(500)]
    public string? CoverImageUrl { get; set; }
    
    public bool IsPublic { get; set; } = true;
}

public class GroupResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public Guid OwnerId { get; set; }
    public bool IsPublic { get; set; }
    public bool IsVerified { get; set; }
    public int MembersCount { get; set; }
    public int PostsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CurrentUserRole { get; set; }
    public bool IsCurrentUserMember { get; set; }
    public UserBasicInfo? Owner { get; set; }
    public List<string> Tags { get; set; } = new();
    public string? Category { get; set; }
    public string GroupType { get; set; } = "general";
    
    // Frontend-compatible properties
    public int memberCount => MembersCount;
    public int postCount => PostsCount;
    public bool isMember => IsCurrentUserMember;
    public string memberRole => CurrentUserRole ?? "guest";
    public string type => GroupType; // Use GroupType instead of IsPublic
    public string avatar => AvatarUrl ?? "";
    public string coverImage => CoverImageUrl ?? "";
    public List<GroupRuleResponse> rules { get; set; } = new();
    public List<GroupMemberResponse> admins { get; set; } = new();
    public List<GroupMemberResponse> moderators { get; set; } = new();
}

public class GroupListResponse
{
    public List<GroupResponse> Groups { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class JoinGroupRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [MaxLength(500)]
    public string? Message { get; set; }
}

public class LeaveGroupRequest
{
    [Required]
    public Guid GroupId { get; set; }
}

public class InviteUserRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    [MaxLength(500)]
    public string? Message { get; set; }
}

public class RespondToInvitationRequest
{
    [Required]
    public Guid InvitationId { get; set; }
    
    [Required]
    public string Action { get; set; } = string.Empty; // "accept" or "reject"
}

public class GroupMemberResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public bool IsActive { get; set; }
    public UserBasicInfo? User { get; set; }
}

public class GroupMemberListResponse
{
    public List<GroupMemberResponse> Members { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class GroupInvitationResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid InvitedUserId { get; set; }
    public Guid InvitedByUserId { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public GroupBasicInfo? Group { get; set; }
    public UserBasicInfo? InvitedBy { get; set; }
}

public class GroupInvitationListResponse
{
    public List<GroupInvitationResponse> Invitations { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class GroupPostRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    [MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    
    public string[] MediaUrls { get; set; } = Array.Empty<string>();
    
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    
    public string[] Mentions { get; set; } = Array.Empty<string>();
    
    [MaxLength(255)]
    public string? Location { get; set; }
    
    public bool IsAnnouncement { get; set; } = false;
}

public class GroupPostResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string[] MediaUrls { get; set; } = Array.Empty<string>();
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    public string[] Mentions { get; set; } = Array.Empty<string>();
    public string? Location { get; set; }
    public bool IsAnnouncement { get; set; }
    public bool IsPinned { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public UserBasicInfo? Author { get; set; }
    public GroupBasicInfo? Group { get; set; }
}

public class GroupPostListResponse
{
    public List<GroupPostResponse> Posts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class UpdateGroupSettingsRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    public bool AllowMemberPosts { get; set; } = true;
    public bool AllowMemberInvites { get; set; } = true;
    public bool RequireApprovalForPosts { get; set; } = false;
    public bool RequireApprovalForMembers { get; set; } = false;
    public bool AllowAnonymousPosts { get; set; } = false;
    public bool AllowFileSharing { get; set; } = true;
    public bool AllowReactions { get; set; } = true;
    public bool AllowComments { get; set; } = true;
    public int MaxMembers { get; set; } = 1000;
    public int MaxPostLength { get; set; } = 5000;
}

public class GroupSettingsResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public bool AllowMemberPosts { get; set; }
    public bool AllowMemberInvites { get; set; }
    public bool RequireApprovalForPosts { get; set; }
    public bool RequireApprovalForMembers { get; set; }
    public bool AllowAnonymousPosts { get; set; }
    public bool AllowFileSharing { get; set; }
    public bool AllowReactions { get; set; }
    public bool AllowComments { get; set; }
    public int MaxMembers { get; set; }
    public int MaxPostLength { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UserBasicInfo
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsVerified { get; set; }
}

public class GroupBasicInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsPublic { get; set; }
    public bool IsVerified { get; set; }
    public int MembersCount { get; set; }
}

public class SearchGroupsRequest
{
    [Required]
    public string Query { get; set; } = string.Empty;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? IsPublic { get; set; }
    public bool? IsVerified { get; set; }
    public int? MinMembers { get; set; }
    public int? MaxMembers { get; set; }
    public string? GroupType { get; set; } // "general", "educational", "family"
    public string? Category { get; set; }
    public bool? IsKidFriendly { get; set; }
}

// Enhanced Group DTOs
public class CreateEducationalGroupRequest : CreateGroupRequest
{
    [Required]
    [MaxLength(100)]
    public string InstitutionName { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string? Category { get; set; }
    
    [MaxLength(20)]
    public string? GradeLevel { get; set; }
    
    public bool AllowParentParticipation { get; set; } = true;
    
    public bool RequireParentApproval { get; set; } = false;
    
    public bool EnableGrokAI { get; set; } = true;
    
    public bool EnablePerpetualPhotos { get; set; } = false;
    
    public bool EnablePaperScanning { get; set; } = false;
    
    public bool EnableHomeworkTracking { get; set; } = false;
}

public class CreateFamilyGroupRequest : CreateGroupRequest
{
    public bool AllowKidPosts { get; set; } = false;
    
    public bool AllowKidVoting { get; set; } = false;
    
    public bool RequireParentApprovalForKidPosts { get; set; } = true;
    
    public bool EnableGrokAI { get; set; } = true;
}

// Subgroup DTOs
public class CreateSubgroupRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public Guid? ParentSubgroupId { get; set; }
    
    public SubgroupSettings Settings { get; set; } = new();
}

public class SubgroupResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentSubgroupId { get; set; }
    public int Level { get; set; }
    public int MembersCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<SubgroupResponse> ChildSubgroups { get; set; } = new();
}

// Role DTOs
public class CreateGroupRoleRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? Alias { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public bool ShowRealUsername { get; set; } = false;
    
    public bool CanCreateTopics { get; set; } = false;
    
    public bool CanManageMembers { get; set; } = false;
    
    public bool CanManageRoles { get; set; } = false;
    
    public bool CanManageSubgroups { get; set; } = false;
    
    public bool CanPostAnnouncements { get; set; } = false;
    
    public bool CanModerateContent { get; set; } = false;
    
    public bool CanAccessAllSubgroups { get; set; } = false;
    
    public bool CanUseGrokAI { get; set; } = true;
    
    public bool CanUsePerpetualPhotos { get; set; } = false;
    
    public bool CanUsePaperScanning { get; set; } = false;
    
    public bool CanManageFunds { get; set; } = false;
}

public class GroupRoleResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public string? Description { get; set; }
    public bool ShowRealUsername { get; set; }
    public bool CanCreateTopics { get; set; }
    public bool CanManageMembers { get; set; }
    public bool CanManageRoles { get; set; }
    public bool CanManageSubgroups { get; set; }
    public bool CanPostAnnouncements { get; set; }
    public bool CanModerateContent { get; set; }
    public bool CanAccessAllSubgroups { get; set; }
    public bool CanUseGrokAI { get; set; }
    public bool CanUsePerpetualPhotos { get; set; }
    public bool CanUsePaperScanning { get; set; }
    public bool CanManageFunds { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int MembersCount { get; set; }
}

// Additional DTOs for missing types
public class AddSubgroupMemberRequest
{
    [Required]
    public Guid UserId { get; set; }
    
    [Required]
    public Guid RoleId { get; set; }
    
    public bool IsParentAccount { get; set; } = false;
    public Guid? KidAccountId { get; set; }
}

public class UpdateGroupRoleRequest
{
    [MaxLength(50)]
    public string? Name { get; set; }
    
    [MaxLength(100)]
    public string? Alias { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public bool? CanCreateTopics { get; set; }
    
    public bool? CanManageMembers { get; set; }
    
    public bool? CanManageRoles { get; set; }
    
    public bool? CanManageSubgroups { get; set; }
    
    public bool? CanPostAnnouncements { get; set; }
    
    public bool? CanModerateContent { get; set; }
    
    public bool? CanAccessAllSubgroups { get; set; }
    
    public bool? CanUseGrokAI { get; set; }
    
    public bool? CanUsePerpetualPhotos { get; set; }
    
    public bool? CanUsePaperScanning { get; set; }
    
    public bool? CanManageFunds { get; set; }
}


public class UpdateTopicStatusRequest
{
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = string.Empty; // "active", "paused", "archived"
}

public class TopicPostListResponse
{
    public List<TopicPostResponse> Posts { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class CreateTopicPostRequest
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
    
    public List<string>? MediaUrls { get; set; }
    
    public List<string>? Hashtags { get; set; }
    
    public List<string>? Mentions { get; set; }
    
    [MaxLength(100)]
    public string? Location { get; set; }
    
    public bool IsAnnouncement { get; set; } = false;
    
    public Guid? KidId { get; set; } // If parent posting for kid
}

public class TopicPostResponse
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public Guid PostId { get; set; }
    public Guid UserId { get; set; }
    public Guid? KidId { get; set; }
    public bool IsParentPostingForKid { get; set; }
    public string Content { get; set; } = string.Empty;
    public List<string>? MediaUrls { get; set; }
    public List<string>? Hashtags { get; set; }
    public List<string>? Mentions { get; set; }
    public string? Location { get; set; }
    public bool IsAnnouncement { get; set; }
    public bool IsPinned { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public bool IsLikedByCurrentUser { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserBasicInfo? Author { get; set; }
    public TopicResponse? Topic { get; set; }
}

public class UpdatePollRequest
{
    [MaxLength(200)]
    public string? Question { get; set; }
    
    public string[]? Options { get; set; }
    
    public bool? AllowMultipleVotes { get; set; }
    
    public bool? AllowKidVoting { get; set; }
    
    public bool? AllowParentVotingForKid { get; set; }
    
    public DateTime? ExpiresAt { get; set; }
}

public class PollVoteResponse
{
    public Guid Id { get; set; }
    public Guid PollId { get; set; }
    public Guid UserId { get; set; }
    public Guid? KidId { get; set; }
    public bool IsParentVotingForKid { get; set; }
    public int SelectedOptionIndex { get; set; }
    public DateTime VotedAt { get; set; }
}

public class UpdateDocumentationRequest
{
    [MaxLength(100)]
    public string? Title { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public string? Content { get; set; }
    
    [MaxLength(50)]
    public string? Category { get; set; }
}

public class DocumentationSearchRequest
{
    [MaxLength(100)]
    public string? Query { get; set; }
    
    [MaxLength(50)]
    public string? Category { get; set; }
    
    public int Page { get; set; } = 1;
    
    public int PageSize { get; set; } = 20;
}

public class DocumentationSearchResponse
{
    public List<DocumentationResponse> Results { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
}

public class DocumentationQuestionRequest
{
    [Required]
    [MaxLength(500)]
    public string Question { get; set; } = string.Empty;
    
    public Guid? SubgroupId { get; set; }
}

public class DocumentationAnswerResponse
{
    public string Answer { get; set; } = string.Empty;
    public List<string> Sources { get; set; } = new();
    public double Confidence { get; set; }
    public DateTime AnsweredAt { get; set; }
}

// Parent-Kid Relationship DTOs
public class CreateParentKidRelationshipRequest
{
    [Required]
    public Guid ParentId { get; set; }
    
    [Required]
    public Guid KidId { get; set; }
    
    [Required]
    public Guid GroupId { get; set; }
    
    [MaxLength(100)]
    public string? RelationshipType { get; set; } = "parent";
    
    public bool CanActOnBehalf { get; set; } = true;
    
    public bool RequiresApproval { get; set; } = false;
    
    // Parent permissions
    public bool CanParentPost { get; set; } = true;
    public bool CanParentVote { get; set; } = true;
    public bool CanParentComment { get; set; } = true;
    
    // Kid permissions
    public bool CanKidPost { get; set; } = false;
    public bool CanKidVote { get; set; } = false;
    public bool CanKidComment { get; set; } = false;
}

public class AddKidToGroupRequest
{
    [Required]
    public Guid KidId { get; set; }
    
    [MaxLength(20)]
    public string? Role { get; set; } = "member";
    
    public bool CanPost { get; set; } = false;
    
    public bool CanVote { get; set; } = false;
    
    public bool CanComment { get; set; } = false;
    
    // Parent permissions
    public bool CanParentPost { get; set; } = true;
    public bool CanParentVote { get; set; } = true;
    public bool CanParentComment { get; set; } = true;
    
    // Kid permissions
    public bool CanKidPost { get; set; } = false;
    public bool CanKidVote { get; set; } = false;
    public bool CanKidComment { get; set; } = false;
}

public class TopicAnalyticsResponse
{
    public Guid TopicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public int PostsCount { get; set; }
    public List<TopicPostResponse> RecentPosts { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsAnnouncementOnly { get; set; }
    public bool AllowMemberPosts { get; set; }
    public bool AllowKidPosts { get; set; }
    public bool AllowParentPosts { get; set; }
    public bool AllowRolePosts { get; set; }
    public int TotalPosts { get; set; }
    public int TotalComments { get; set; }
    public int TotalLikes { get; set; }
    public int ActiveMembers { get; set; }
    public DateTime LastActivity { get; set; }
    public double EngagementRate { get; set; }
    public List<string> TopContributors { get; set; } = new();
    public List<string> PopularHashtags { get; set; } = new();
}

// Additional DTOs that were removed from Services
public class UpdateTopicRequest
{
    [MaxLength(100)]
    public string? Name { get; set; }
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public bool? IsAnnouncementOnly { get; set; }
    
    public bool? AllowMemberPosts { get; set; }
    
    public bool? AllowKidPosts { get; set; }
    
    public bool? AllowParentPosts { get; set; }
    
    public bool? AllowRolePosts { get; set; }
}

public class GroupAnalyticsResponse
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public int TotalTopics { get; set; }
    public int ActiveTopics { get; set; }
    public int TotalPosts { get; set; }
    public List<TopicResponse> RecentTopics { get; set; } = new();
    public List<TopicResponse> MostActiveTopics { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivity { get; set; }
}

public class TopicTrendResponse
{
    public DateTime Date { get; set; }
    public int PostsCount { get; set; }
    public int TopicsCount { get; set; }
}

public class TopicEngagementResponse
{
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int PostsCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivity { get; set; }
    public double EngagementScore { get; set; }
}

public class TopicPerformanceResponse
{
    public Guid TopicId { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public int PostsCount { get; set; }
    public double AveragePostsPerDay { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastActivity { get; set; }
    public List<TopicPostResponse> RecentPosts { get; set; } = new();
    public double PerformanceScore { get; set; }
}

public class ParentKidRelationshipResponse
{
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
    public bool CanParentPost { get; set; }
    public bool CanParentVote { get; set; }
    public bool CanParentComment { get; set; }
    public bool CanKidPost { get; set; }
    public bool CanKidVote { get; set; }
    public bool CanKidComment { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateParentKidRelationshipRequest
{
    public bool? CanParentPost { get; set; }
    public bool? CanParentVote { get; set; }
    public bool? CanParentComment { get; set; }
    public bool? CanKidPost { get; set; }
    public bool? CanKidVote { get; set; }
    public bool? CanKidComment { get; set; }
}

public class ParentActingResponse
{
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
    public string Action { get; set; } = string.Empty;
    public object? Data { get; set; }
    public DateTime Timestamp { get; set; }
    public bool Success { get; set; }
}

public class ParentKidVisualResponse
{
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
    public string ParentName { get; set; } = string.Empty;
    public string KidName { get; set; } = string.Empty;
    public string ParentAvatar { get; set; } = string.Empty;
    public string KidAvatar { get; set; } = string.Empty;
    public bool IsParentActing { get; set; }
    public ParentKidRelationshipResponse Relationship { get; set; } = new();
    public string VisualIndicator { get; set; } = string.Empty;
    public string DisplayText { get; set; } = string.Empty;
}

public class ParentKidPermissionMatrix
{
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
    public bool CanParentPost { get; set; }
    public bool CanParentVote { get; set; }
    public bool CanParentComment { get; set; }
    public bool CanKidPost { get; set; }
    public bool CanKidVote { get; set; }
    public bool CanKidComment { get; set; }
    public bool CanParentActForKid { get; set; }
    public bool CanKidActIndependently { get; set; }
    public Dictionary<string, bool> OverrideRules { get; set; } = new();
}

public class EducationalGroupSettings
{
    public Guid GroupId { get; set; }
    public bool AllowKidPosts { get; set; }
    public bool AllowKidVoting { get; set; }
    public bool RequireParentApprovalForKidPosts { get; set; }
    public bool AllowTeacherPosts { get; set; }
    public bool AllowParentPosts { get; set; }
    public bool EnableGrokAI { get; set; }
    public bool EnablePerpetualPhotos { get; set; }
    public bool EnablePaperScanning { get; set; }
    public bool EnableHomeworkTracking { get; set; }
    public bool EnableFundManagement { get; set; }
}

public class UpdateEducationalGroupSettingsRequest
{
    public bool? AllowKidPosts { get; set; }
    public bool? AllowKidVoting { get; set; }
    public bool? RequireParentApprovalForKidPosts { get; set; }
    public bool? AllowTeacherPosts { get; set; }
    public bool? AllowParentPosts { get; set; }
    public bool? EnableGrokAI { get; set; }
    public bool? EnablePerpetualPhotos { get; set; }
    public bool? EnablePaperScanning { get; set; }
    public bool? EnableHomeworkTracking { get; set; }
    public bool? EnableFundManagement { get; set; }
}

public class PollOptionResult
{
    public int OptionIndex { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public double Percentage { get; set; }
}

public class PollResultsResponse
{
    public Guid PollId { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public List<PollOptionResult> Results { get; set; } = new();
    public int TotalVotes { get; set; }
    public bool IsActive { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Topic DTOs
public class CreateTopicRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    public Guid? SubgroupId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    public bool IsAnnouncementOnly { get; set; } = false;
    
    public bool AllowMemberPosts { get; set; } = true;
    
    public bool AllowKidPosts { get; set; } = false;
    
    public bool AllowParentPosts { get; set; } = true;
    
    public bool AllowRolePosts { get; set; } = true;
}

public class TopicResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid? SubgroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsAnnouncementOnly { get; set; }
    public bool AllowMemberPosts { get; set; }
    public bool AllowKidPosts { get; set; }
    public bool AllowParentPosts { get; set; }
    public bool AllowRolePosts { get; set; }
    public int PostsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PausedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public SubgroupResponse? Subgroup { get; set; }
}

// Poll DTOs
public class CreatePollRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    public Guid? TopicId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Question { get; set; } = string.Empty;
    
    [Required]
    public string[] Options { get; set; } = Array.Empty<string>();
    
    public bool AllowMultipleVotes { get; set; } = false;
    
    public bool AllowKidVoting { get; set; } = false;
    
    public bool AllowParentVotingForKid { get; set; } = true;
    
    public DateTime ExpiresAt { get; set; }
}

public class PollResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid? TopicId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string[] Options { get; set; } = Array.Empty<string>();
    public bool AllowMultipleVotes { get; set; }
    public bool AllowKidVoting { get; set; }
    public bool AllowParentVotingForKid { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public int TotalVotes { get; set; }
    public List<PollOptionResult> OptionResults { get; set; } = new();
    public bool HasUserVoted { get; set; }
    public int? UserVoteIndex { get; set; }
}

public class VotePollRequest
{
    [Required]
    public Guid PollId { get; set; }
    
    [Required]
    public int SelectedOptionIndex { get; set; }
    
    public Guid? KidId { get; set; } // If parent voting for kid
}

// Documentation DTOs
public class CreateDocumentationRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string Category { get; set; } = "general";
}

public class DocumentationResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Enhanced Group Response with new fields
public class EnhancedGroupResponse : GroupResponse
{
    public new string GroupType { get; set; } = string.Empty;
    public new string? Category { get; set; }
    public string? InstitutionName { get; set; }
    public string? GradeLevel { get; set; }
    public bool IsKidFriendly { get; set; }
    public bool AllowParentParticipation { get; set; }
    public bool RequireParentApproval { get; set; }
    public List<SubgroupResponse> Subgroups { get; set; } = new();
    public List<GroupRoleResponse> Roles { get; set; } = new();
    public List<TopicResponse> Topics { get; set; } = new();
    public GroupSettingsResponse? Settings { get; set; }
    public DocumentationResponse? Documentation { get; set; }
}

// Parent Acting Record
public class ParentActingRecord
{
    public Guid Id { get; set; }
    public Guid ParentId { get; set; }
    public Guid KidId { get; set; }
    public Guid GroupId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string? Data { get; set; }
    public DateTime ActedAt { get; set; }
    public DateTime Timestamp { get; set; }
    public bool IsActive { get; set; } = true;
}

// Group Rules DTOs
public class CreateGroupRuleRequest
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Details { get; set; }

    public bool IsActive { get; set; } = true;
    public int Order { get; set; } = 0;
    public string? Category { get; set; }
}

public class UpdateGroupRuleRequest
{
    [MaxLength(100)]
    public string? Title { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(1000)]
    public string? Details { get; set; }

    public bool? IsActive { get; set; }
    public int? Order { get; set; }
    public string? Category { get; set; }
}

public class GroupRuleResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Details { get; set; }
    public bool IsActive { get; set; }
    public int Order { get; set; }
    public string? Category { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// File Management DTOs
public class CreateFileRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    public Guid? TopicId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string MimeType { get; set; } = string.Empty;
    
    [Required]
    public long FileSize { get; set; }
    
    [MaxLength(50)]
    public string FileCategory { get; set; } = "general";
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public bool IsPublic { get; set; } = true;
    
    public bool IsDownloadable { get; set; } = true;
    
    public Guid? KidId { get; set; }
    
    public bool IsParentUploadingForKid { get; set; } = false;
}

public class UpdateFileRequest
{
    [MaxLength(255)]
    public string? FileName { get; set; }
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public bool? IsPublic { get; set; }
    
    public bool? IsDownloadable { get; set; }
}

public class FileResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid? TopicId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileCategory { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid UploadedBy { get; set; }
    public Guid? KidId { get; set; }
    public bool IsParentUploadingForKid { get; set; }
    public bool IsPublic { get; set; }
    public bool IsDownloadable { get; set; }
    public int DownloadCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string UploadedByUsername { get; set; } = string.Empty;
    public string? TopicName { get; set; }
    public bool CanDelete { get; set; }
    public bool CanEdit { get; set; }
}

public class FileListResponse
{
    public List<FileResponse> Files { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

public class FilePermissionRequest
{
    [Required]
    public Guid FileId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = string.Empty;
    
    public bool CanView { get; set; } = true;
    public bool CanDownload { get; set; } = true;
    public bool CanDelete { get; set; } = false;
    public bool CanEdit { get; set; } = false;
}

public class FilePermissionResponse
{
    public Guid Id { get; set; }
    public Guid FileId { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool CanView { get; set; }
    public bool CanDownload { get; set; }
    public bool CanDelete { get; set; }
    public bool CanEdit { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Role Management DTOs
public class CreateRoleRequest
{
    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Alias { get; set; }

    [Required]
    public RolePermissions Permissions { get; set; } = new();

    public bool CanSeeRealUsername { get; set; } = false;
}

public class UpdateRoleRequest
{
    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Alias { get; set; }

    [Required]
    public RolePermissions Permissions { get; set; } = new();

    public bool CanSeeRealUsername { get; set; } = false;
}

public class RolePermissions
{
    public bool CanCreateTopics { get; set; } = false;
    public bool CanWritePosts { get; set; } = false;
    public bool CanVotePolls { get; set; } = false;
    public bool CanManageMembers { get; set; } = false;
    public bool CanUploadFiles { get; set; } = false;
    public bool CanViewAnalytics { get; set; } = false;
    public bool CanManageRoles { get; set; } = false;
    public bool CanManageSubgroups { get; set; } = false;
    public bool CanManageSettings { get; set; } = false;
    public bool CanModerateContent { get; set; } = false;
}

public class RoleResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid? SubgroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public RolePermissions Permissions { get; set; } = new();
    public bool CanSeeRealUsername { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AssignRoleRequest
{
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid RoleId { get; set; }

    public Guid? SubgroupId { get; set; }
    public bool IsParentAccount { get; set; } = false;
    public Guid? KidAccountId { get; set; }
}

public class RoleMemberResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string? RoleAlias { get; set; }
    public bool IsParentAccount { get; set; }
    public Guid? KidAccountId { get; set; }
    public string? KidDisplayName { get; set; }
    public DateTime JoinedAt { get; set; }
    public string Status { get; set; } = "active";
}

// Additional Subgroup DTOs
public class UpdateSubgroupRequest
{
    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    public SubgroupSettings Settings { get; set; } = new();
}

public class SubgroupSettings
{
    public bool IsPublic { get; set; } = false;
    public bool AllowParentParticipation { get; set; } = true;
    public bool RequireParentApproval { get; set; } = true;
    public bool AllowMemberPosts { get; set; } = true;
    public bool AllowFileUploads { get; set; } = true;
    public bool EnableAIIntegration { get; set; } = false;
    public bool EnablePerpetualPhoto { get; set; } = false;
    public bool EnablePaperScanning { get; set; } = false;
    public bool EnableHomeworkTracking { get; set; } = false;
    public int MaxMembers { get; set; } = 0; // 0 = unlimited
}

public class SubgroupMemberResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public bool IsParentAccount { get; set; }
    public Guid? KidAccountId { get; set; }
    public string? KidDisplayName { get; set; }
    public DateTime JoinedAt { get; set; }
    public string Status { get; set; } = "active";
}

// Topic Permission DTOs
public class TopicPermissionRequest
{
    [Required]
    public Guid TopicId { get; set; }

    [Required]
    public Guid RoleId { get; set; }

    public bool CanRead { get; set; } = true;
    public bool CanWrite { get; set; } = false;
    public bool CanVote { get; set; } = false;
    public bool CanManage { get; set; } = false;
}

public class TopicPermissionResponse
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public bool CanRead { get; set; }
    public bool CanWrite { get; set; }
    public bool CanVote { get; set; }
    public bool CanManage { get; set; }
}

// AI Integration DTOs
public class AIAnalysisRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;

    public string ContentType { get; set; } = "post"; // post, comment, homework, document
    public Guid? GroupId { get; set; }
    public Guid? TopicId { get; set; }
    public Guid? SubgroupId { get; set; }
    public string AnalysisType { get; set; } = "general"; // general, homework, moderation, translation
}

public class AIAnalysisResponse
{
    public string AnalysisId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string AnalysisType { get; set; } = string.Empty;
    public AIAnalysisResult Result { get; set; } = new();
    public DateTime AnalyzedAt { get; set; }
    public double ConfidenceScore { get; set; }
    public List<string> Suggestions { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class AIAnalysisResult
{
    public bool IsAppropriate { get; set; } = true;
    public bool IsComplete { get; set; } = true;
    public bool IsAccurate { get; set; } = true;
    public string QualityScore { get; set; } = "good"; // excellent, good, fair, poor
    public string LanguageLevel { get; set; } = "appropriate";
    public List<string> DetectedTopics { get; set; } = new();
    public List<string> DetectedKeywords { get; set; } = new();
    public string? Translation { get; set; }
    public string? Summary { get; set; }
    public List<string> Questions { get; set; } = new();
    public List<string> Answers { get; set; } = new();
}

public class HomeworkAnalysisRequest
{
    [Required]
    public string HomeworkContent { get; set; } = string.Empty;

    [Required]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string GradeLevel { get; set; } = string.Empty;

    public Guid? StudentId { get; set; }
    public Guid? AssignmentId { get; set; }
    public List<string> ExpectedTopics { get; set; } = new();
}

public class HomeworkAnalysisResponse
{
    public string AnalysisId { get; set; } = string.Empty;
    public HomeworkAnalysisResult Result { get; set; } = new();
    public DateTime AnalyzedAt { get; set; }
    public double OverallScore { get; set; }
    public List<string> Strengths { get; set; } = new();
    public List<string> AreasForImprovement { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}

public class HomeworkAnalysisResult
{
    public double CompletenessScore { get; set; }
    public double AccuracyScore { get; set; }
    public double ClarityScore { get; set; }
    public double CreativityScore { get; set; }
    public bool MeetsRequirements { get; set; }
    public List<string> MissingElements { get; set; } = new();
    public List<string> IncorrectAnswers { get; set; } = new();
    public List<string> GrammarIssues { get; set; } = new();
    public List<string> SpellingErrors { get; set; } = new();
    public string DifficultyLevel { get; set; } = "appropriate";
    public List<string> SuggestedResources { get; set; } = new();
}

public class DocumentAnalysisRequest
{
    [Required]
    public string DocumentContent { get; set; } = string.Empty;

    public string DocumentType { get; set; } = "general"; // curriculum, policy, resource, faq
    public Guid? GroupId { get; set; }
    public string Language { get; set; } = "en";
}

public class DocumentAnalysisResponse
{
    public string AnalysisId { get; set; } = string.Empty;
    public DocumentAnalysisResult Result { get; set; } = new();
    public DateTime AnalyzedAt { get; set; }
    public double RelevanceScore { get; set; }
    public List<string> KeyTopics { get; set; } = new();
    public List<string> SuggestedTags { get; set; } = new();
}

public class DocumentAnalysisResult
{
    public string DocumentType { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public List<string> KeyPoints { get; set; } = new();
    public List<string> Questions { get; set; } = new();
    public List<string> Answers { get; set; } = new();
    public string ReadingLevel { get; set; } = "appropriate";
    public bool IsUpToDate { get; set; } = true;
    public List<string> RelatedTopics { get; set; } = new();
    public List<string> SuggestedActions { get; set; } = new();
}

public class AISuggestionRequest
{
    [Required]
    public string Context { get; set; } = string.Empty;

    public string SuggestionType { get; set; } = "content"; // content, topic, resource, activity
    public Guid? GroupId { get; set; }
    public Guid? SubgroupId { get; set; }
    public string UserRole { get; set; } = "teacher";
}

public class AISuggestionResponse
{
    public string SuggestionId { get; set; } = string.Empty;
    public string SuggestionType { get; set; } = string.Empty;
    public List<string> Suggestions { get; set; } = new();
    public List<string> Resources { get; set; } = new();
    public List<string> Activities { get; set; } = new();
    public DateTime GeneratedAt { get; set; }
    public double RelevanceScore { get; set; }
}

// Homework Management DTOs
public class CreateHomeworkRequest
{
    [Required]
    [StringLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string GradeLevel { get; set; } = string.Empty;

    public DateTime? DueDate { get; set; }
    public List<string> Attachments { get; set; } = new();
    public List<Guid> AssignedToStudents { get; set; } = new();
    public List<Guid> AssignedToSubgroups { get; set; } = new();
    public HomeworkSettings Settings { get; set; } = new();
}

public class UpdateHomeworkRequest
{
    [Required]
    [StringLength(255)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public DateTime? DueDate { get; set; }
    public List<string> Attachments { get; set; } = new();
    public HomeworkSettings Settings { get; set; } = new();
}

public class HomeworkSettings
{
    public bool AllowLateSubmissions { get; set; } = true;
    public int LatePenaltyPercentage { get; set; } = 0;
    public bool RequireParentApproval { get; set; } = false;
    public bool EnableAIAnalysis { get; set; } = true;
    public bool AllowResubmission { get; set; } = true;
    public int MaxResubmissions { get; set; } = 3;
    public bool ShowProgressToParents { get; set; } = true;
    public bool EnablePeerReview { get; set; } = false;
    public string DifficultyLevel { get; set; } = "medium"; // easy, medium, hard
    public List<string> RequiredElements { get; set; } = new();
}

public class HomeworkResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid? SubgroupId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public List<string> Attachments { get; set; } = new();
    public HomeworkSettings Settings { get; set; } = new();
    public string Status { get; set; } = "active"; // active, completed, archived
    public int TotalAssigned { get; set; }
    public int CompletedCount { get; set; }
    public int PendingCount { get; set; }
    public int LateCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public UserBasicInfo? CreatedBy { get; set; }
}

public class SubmitHomeworkRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;

    public List<string> Attachments { get; set; } = new();
    public string? Notes { get; set; }
    public bool IsParentSubmission { get; set; } = false;
}

public class HomeworkSubmissionResponse
{
    public Guid Id { get; set; }
    public Guid HomeworkId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Attachments { get; set; } = new();
    public string? Notes { get; set; }
    public string Status { get; set; } = "submitted"; // submitted, reviewed, returned, resubmitted
    public double? Score { get; set; }
    public string? Grade { get; set; }
    public string? TeacherFeedback { get; set; }
    public string? AIAnalysis { get; set; }
    public bool IsLate { get; set; }
    public bool IsParentSubmission { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public UserBasicInfo? ReviewedBy { get; set; }
}

public class ReviewHomeworkRequest
{
    [Required]
    public double Score { get; set; }

    public string? Grade { get; set; }
    public string? Feedback { get; set; }
    public bool AllowResubmission { get; set; } = false;
    public List<string> Strengths { get; set; } = new();
    public List<string> AreasForImprovement { get; set; } = new();
}

public class HomeworkProgressResponse
{
    public Guid HomeworkId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public int TotalAssigned { get; set; }
    public int CompletedCount { get; set; }
    public int PendingCount { get; set; }
    public int LateCount { get; set; }
    public double CompletionPercentage { get; set; }
    public double AverageScore { get; set; }
    public List<HomeworkSubmissionResponse> RecentSubmissions { get; set; } = new();
    public List<HomeworkSubmissionResponse> LateSubmissions { get; set; } = new();
}

public class HomeworkAnalyticsResponse
{
    public Guid HomeworkId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public HomeworkAnalytics Analytics { get; set; } = new();
    public List<HomeworkSubmissionResponse> AllSubmissions { get; set; } = new();
}

public class HomeworkAnalytics
{
    public int TotalAssigned { get; set; }
    public int CompletedCount { get; set; }
    public int PendingCount { get; set; }
    public int LateCount { get; set; }
    public double CompletionRate { get; set; }
    public double AverageScore { get; set; }
    public double MedianScore { get; set; }
    public double HighestScore { get; set; }
    public double LowestScore { get; set; }
    public List<string> CommonStrengths { get; set; } = new();
    public List<string> CommonAreasForImprovement { get; set; } = new();
    public Dictionary<string, int> ScoreDistribution { get; set; } = new();
    public Dictionary<string, int> SubmissionTimeline { get; set; } = new();
}

