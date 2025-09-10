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
}
