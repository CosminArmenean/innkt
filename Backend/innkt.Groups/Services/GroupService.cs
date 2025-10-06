using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;
using innkt.Groups.DTOs;
using innkt.Groups.Models;
using AutoMapper;

namespace innkt.Groups.Services;

public class GroupService : IGroupService
{
    private readonly GroupsDbContext _context;
    private readonly ILogger<GroupService> _logger;
    private readonly IMapper _mapper;
    private readonly IUserService _userService;

    public GroupService(GroupsDbContext context, ILogger<GroupService> logger, IMapper mapper, IUserService userService)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
        _userService = userService;
    }

    public async Task<GroupResponse> CreateGroupAsync(Guid userId, CreateGroupRequest request)
    {
        var group = new Group
        {
            Name = request.Name,
            Description = request.Description,
            AvatarUrl = request.AvatarUrl,
            CoverImageUrl = request.CoverImageUrl,
            OwnerId = userId,
            IsPublic = request.IsPublic
        };

        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        // Add owner as first member
        var ownerMember = new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = "admin"
        };

        _context.GroupMembers.Add(ownerMember);
        group.MembersCount = 1;

        // Create default settings
        var settings = new GroupSettings
        {
            GroupId = group.Id
        };

        _context.GroupSettings.Add(settings);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created group {GroupId} by user {UserId}", group.Id, userId);
        return await GetGroupByIdAsync(group.Id, userId);
    }

    public async Task<GroupResponse?> GetGroupByIdAsync(Guid groupId, Guid? currentUserId = null)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null)
            return null;

        var response = _mapper.Map<GroupResponse>(group);
        
        if (currentUserId.HasValue)
        {
            response.CurrentUserRole = await GetUserRoleAsync(groupId, currentUserId.Value);
            response.IsCurrentUserMember = await IsUserMemberAsync(groupId, currentUserId.Value);
        }

        return response;
    }

    public async Task<GroupListResponse> GetUserGroupsAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var groupIds = await _context.GroupMembers
            .Where(gm => gm.UserId == userId && gm.IsActive)
            .Select(gm => gm.GroupId)
            .ToListAsync();

        var query = _context.Groups
            .Where(g => groupIds.Contains(g.Id))
            .OrderByDescending(g => g.CreatedAt);

        var totalCount = await query.CountAsync();
        var groups = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<GroupResponse>();
        foreach (var group in groups)
        {
            var response = _mapper.Map<GroupResponse>(group);
            if (currentUserId.HasValue)
            {
                response.CurrentUserRole = await GetUserRoleAsync(group.Id, currentUserId.Value);
                response.IsCurrentUserMember = await IsUserMemberAsync(group.Id, currentUserId.Value);
            }
            responses.Add(response);
        }

        return new GroupListResponse
        {
            Groups = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<GroupListResponse> GetPublicGroupsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var query = _context.Groups
            .Where(g => g.IsPublic)
            .OrderByDescending(g => g.MembersCount)
            .ThenByDescending(g => g.CreatedAt);

        var totalCount = await query.CountAsync();
        var groups = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<GroupResponse>();
        foreach (var group in groups)
        {
            var response = _mapper.Map<GroupResponse>(group);
            if (currentUserId.HasValue)
            {
                response.CurrentUserRole = await GetUserRoleAsync(group.Id, currentUserId.Value);
                response.IsCurrentUserMember = await IsUserMemberAsync(group.Id, currentUserId.Value);
            }
            responses.Add(response);
        }

        return new GroupListResponse
        {
            Groups = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<GroupResponse> UpdateGroupAsync(Guid groupId, Guid userId, UpdateGroupRequest request)
    {
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null)
            throw new KeyNotFoundException("Group not found");

        var userRole = await GetUserRoleAsync(groupId, userId);
        if (userRole != "owner" && userRole != "admin")
            throw new UnauthorizedAccessException("You can only update groups you own or moderate");

        group.Name = request.Name;
        group.Description = request.Description;
        group.AvatarUrl = request.AvatarUrl;
        group.CoverImageUrl = request.CoverImageUrl;
        group.IsPublic = request.IsPublic;
        group.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated group {GroupId} by user {UserId}", groupId, userId);
        return await GetGroupByIdAsync(groupId, userId);
    }

    public async Task<bool> DeleteGroupAsync(Guid groupId, Guid userId)
    {
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null)
            return false;

        if (group.OwnerId != userId)
            throw new UnauthorizedAccessException("You can only delete groups you own");

        _context.Groups.Remove(group);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted group {GroupId} by user {UserId}", groupId, userId);
        return true;
    }

    public async Task<bool> JoinGroupAsync(Guid groupId, Guid userId, string? message = null)
    {
        var group = await _context.Groups.FindAsync(groupId);
        if (group == null)
            return false;

        var existingMember = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId);

        if (existingMember != null)
            return false; // Already a member

        var member = new GroupMember
        {
            GroupId = groupId,
            UserId = userId,
            Role = "member"
        };

        _context.GroupMembers.Add(member);
        group.MembersCount++;
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} joined group {GroupId}", userId, groupId);
        return true;
    }

    public async Task<bool> LeaveGroupAsync(Guid groupId, Guid userId)
    {
        var member = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId);

        if (member == null)
            return false; // Not a member

        if (member.Role == "owner")
            return false; // Owner cannot leave group

        _context.GroupMembers.Remove(member);

        var group = await _context.Groups.FindAsync(groupId);
        if (group != null)
        {
            group.MembersCount--;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} left group {GroupId}", userId, groupId);
        return true;
    }

    public async Task<bool> IsUserMemberAsync(Guid groupId, Guid userId)
    {
        return await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId && gm.IsActive);
    }

    public async Task<string?> GetUserRoleAsync(Guid groupId, Guid userId)
    {
        var member = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId && gm.IsActive);

        return member?.Role;
    }

    // Placeholder implementations for other methods
    public async Task<GroupMemberListResponse> GetGroupMembersAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        try
        {
            // Get total count
            var totalCount = await _context.GroupMembers
                .CountAsync(gm => gm.GroupId == groupId && gm.IsActive);

            // Get members with pagination
            var members = await _context.GroupMembers
                .Where(gm => gm.GroupId == groupId && gm.IsActive)
                .OrderBy(gm => gm.JoinedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Map to response DTOs
            var memberResponses = new List<GroupMemberResponse>();
            _logger.LogInformation("Found {Count} members for group {GroupId}", members.Count, groupId);
            
            foreach (var member in members)
            {
                var userBasicInfo = await _userService.GetUserBasicInfoAsync(member.UserId);
                _logger.LogInformation("Processing member {UserId} with role {Role}", member.UserId, member.Role);
                
                memberResponses.Add(new GroupMemberResponse
                {
                    Id = member.Id,
                    GroupId = member.GroupId,
                    UserId = member.UserId,
                    Role = member.Role ?? "member",
                    JoinedAt = member.JoinedAt,
                    LastSeenAt = member.LastSeenAt,
                    IsActive = member.IsActive,
                    User = userBasicInfo
                });
            }
            
            _logger.LogInformation("Created {Count} member responses for group {GroupId}", memberResponses.Count, groupId);

            return new GroupMemberListResponse
            {
                Members = memberResponses,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasNextPage = (page * pageSize) < totalCount,
                HasPreviousPage = page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting members for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<GroupMemberResponse?> GetGroupMemberAsync(Guid groupId, Guid userId)
    {
        try
        {
            var member = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId && gm.IsActive);

            if (member == null)
            {
                return null;
            }

            var userBasicInfo = await _userService.GetUserBasicInfoAsync(member.UserId);

            return new GroupMemberResponse
            {
                Id = member.Id,
                GroupId = member.GroupId,
                UserId = member.UserId,
                Role = member.Role ?? "member",
                JoinedAt = member.JoinedAt,
                LastSeenAt = member.LastSeenAt,
                IsActive = member.IsActive,
                User = userBasicInfo
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting member {UserId} for group {GroupId}", userId, groupId);
            throw;
        }
    }

    public async Task<bool> UpdateMemberRoleAsync(Guid groupId, Guid targetUserId, string newRole, Guid adminUserId)
    {
        // Implementation would go here
        return false;
    }

    public async Task<bool> RemoveMemberAsync(Guid groupId, Guid targetUserId, Guid adminUserId)
    {
        // Implementation would go here
        return false;
    }

    public async Task<GroupInvitationResponse> InviteUserAsync(Guid groupId, Guid userId, Guid invitedUserId, string? message = null)
    {
        // Implementation would go here
        return new GroupInvitationResponse();
    }

    public async Task<GroupInvitationListResponse> GetGroupInvitationsAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        // Implementation would go here
        return new GroupInvitationListResponse();
    }

    public async Task<GroupInvitationListResponse> GetUserInvitationsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        // Implementation would go here
        return new GroupInvitationListResponse();
    }

    public async Task<bool> RespondToInvitationAsync(Guid invitationId, Guid userId, string action)
    {
        // Implementation would go here
        return false;
    }

    public async Task<bool> CancelInvitationAsync(Guid invitationId, Guid userId)
    {
        try
        {
            var invitation = await _context.GroupInvitations
                .FirstOrDefaultAsync(i => i.Id == invitationId);

            if (invitation == null)
            {
                return false;
            }

            // Check if user has permission to cancel this invitation
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == invitation.GroupId);

            if (group == null)
            {
                return false;
            }

            var userMembership = group.Members.FirstOrDefault(m => m.UserId == userId);
            if (userMembership == null || (userMembership.Role != "admin" && userMembership.Role != "owner" && invitation.InvitedByUserId != userId))
            {
                return false;
            }

            _context.GroupInvitations.Remove(invitation);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling invitation {InvitationId} by user {UserId}", invitationId, userId);
            return false;
        }
    }

    public async Task<GroupPostResponse> CreateGroupPostAsync(Guid groupId, Guid userId, GroupPostRequest request)
    {
        // Implementation would go here
        return new GroupPostResponse();
    }

    public async Task<GroupPostListResponse> GetGroupPostsAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null, Guid? topicId = null)
    {
        try
        {
            if (topicId.HasValue)
            {
                // Get posts from TopicPosts table
                var topicPosts = await _context.TopicPosts
                    .Where(tp => tp.TopicId == topicId.Value)
                    .OrderByDescending(tp => tp.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var totalCount = await _context.TopicPosts
                    .CountAsync(tp => tp.TopicId == topicId.Value);

                // Get unique user IDs for author info
                var userIds = topicPosts.Select(tp => tp.UserId).Distinct().ToList();
                var userProfiles = await _userService.GetUsersBasicInfoAsync(userIds);

                // Convert TopicPost to GroupPostResponse format
                var posts = new List<GroupPostResponse>();
                foreach (var tp in topicPosts)
                {
                    var author = userProfiles.FirstOrDefault(u => u.Id == tp.UserId);
                    
                    // For now, use default interaction counts
                    // TODO: Implement proper interaction count retrieval from Social service
                    int likesCount = 0;
                    int commentsCount = 0;
                    bool isLikedByCurrentUser = false;
                    
                    posts.Add(new GroupPostResponse
                    {
                        Id = tp.Id,
                        GroupId = groupId,
                        PostId = tp.PostId,
                        UserId = tp.UserId,
                        Content = tp.Content,
                        MediaUrls = tp.MediaUrls ?? Array.Empty<string>(),
                        Hashtags = tp.Hashtags ?? Array.Empty<string>(),
                        Mentions = tp.Mentions ?? Array.Empty<string>(),
                        Location = tp.Location,
                        IsAnnouncement = tp.IsAnnouncement,
                        IsPinned = tp.IsPinned,
                        LikesCount = likesCount,
                        CommentsCount = commentsCount,
                        SharesCount = 0, // TODO: Get from shares table
                        CreatedAt = tp.CreatedAt,
                        UpdatedAt = tp.CreatedAt, // Use CreatedAt as fallback
                        IsLikedByCurrentUser = isLikedByCurrentUser,
                        Author = author,
                        Group = null // TODO: Get group info
                    });
                }

                return new GroupPostListResponse
                {
                    Posts = posts,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize,
                    HasNextPage = (page * pageSize) < totalCount,
                    HasPreviousPage = page > 1
                };
            }
            else
            {
                // Get regular group posts (not topic-specific)
                // TODO: Implement regular group posts retrieval
                return new GroupPostListResponse
                {
                    Posts = new List<GroupPostResponse>(),
                    TotalCount = 0,
                    Page = page,
                    PageSize = pageSize,
                    HasNextPage = false,
                    HasPreviousPage = false
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting group posts for group {GroupId}, topic {TopicId}", groupId, topicId);
            return new GroupPostListResponse
            {
                Posts = new List<GroupPostResponse>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize,
                HasNextPage = false,
                HasPreviousPage = false
            };
        }
    }

    public async Task<GroupPostResponse?> GetGroupPostByIdAsync(Guid groupPostId, Guid? currentUserId = null)
    {
        // Implementation would go here
        return null;
    }

    public async Task<bool> PinGroupPostAsync(Guid groupPostId, Guid userId)
    {
        // Implementation would go here
        return false;
    }

    public async Task<bool> UnpinGroupPostAsync(Guid groupPostId, Guid userId)
    {
        // Implementation would go here
        return false;
    }

    public async Task<bool> DeleteGroupPostAsync(Guid groupPostId, Guid userId)
    {
        // Implementation would go here
        return false;
    }

    public async Task<GroupSettingsResponse> GetGroupSettingsAsync(Guid groupId, Guid userId)
    {
        // Implementation would go here
        return new GroupSettingsResponse();
    }

    public async Task<GroupSettingsResponse> UpdateGroupSettingsAsync(Guid groupId, Guid userId, UpdateGroupSettingsRequest request)
    {
        // Implementation would go here
        return new GroupSettingsResponse();
    }

    public async Task<GroupListResponse> SearchGroupsAsync(SearchGroupsRequest request, Guid? currentUserId = null)
    {
        // Implementation would go here
        return new GroupListResponse();
    }

    public async Task<GroupListResponse> GetTrendingGroupsAsync(int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        // Implementation would go here
        return new GroupListResponse();
    }

    public async Task<GroupListResponse> GetRecommendedGroupsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        // Implementation would go here
        return new GroupListResponse();
    }

    public async Task<bool> VerifyGroupAsync(Guid groupId, Guid adminUserId)
    {
        // Implementation would go here
        return false;
    }

    // Enhanced group creation methods
    public async Task<GroupResponse> CreateEducationalGroupAsync(Guid userId, CreateEducationalGroupRequest request)
    {
        var group = new Group
        {
            Name = request.Name,
            Description = request.Description,
            AvatarUrl = request.AvatarUrl,
            CoverImageUrl = request.CoverImageUrl,
            OwnerId = userId,
            IsPublic = false, // Educational groups are private by default
            GroupType = "educational",
            Category = request.Category,
            InstitutionName = request.InstitutionName,
            GradeLevel = request.GradeLevel,
            IsKidFriendly = true,
            AllowParentParticipation = request.AllowParentParticipation,
            RequireParentApproval = request.RequireParentApproval
        };

        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        // Add owner as first member
        var ownerMember = new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = "admin"
        };

        _context.GroupMembers.Add(ownerMember);
        group.MembersCount = 1;

        await _context.SaveChangesAsync();
        return _mapper.Map<GroupResponse>(group);
    }

    public async Task<GroupResponse> CreateFamilyGroupAsync(Guid userId, CreateFamilyGroupRequest request)
    {
        var group = new Group
        {
            Name = request.Name,
            Description = request.Description,
            AvatarUrl = request.AvatarUrl,
            CoverImageUrl = request.CoverImageUrl,
            OwnerId = userId,
            IsPublic = request.IsPublic,
            GroupType = "family",
            Category = "family",
            IsKidFriendly = true,
            AllowParentParticipation = true,
            RequireParentApproval = true
        };

        _context.Groups.Add(group);
        await _context.SaveChangesAsync();

        // Add owner as first member
        var ownerMember = new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = "admin"
        };

        _context.GroupMembers.Add(ownerMember);
        group.MembersCount = 1;

        await _context.SaveChangesAsync();
        return _mapper.Map<GroupResponse>(group);
    }

    // Subgroup management
    public async Task<SubgroupResponse> CreateSubgroupAsync(Guid userId, CreateSubgroupRequest request)
    {
        var subgroup = new Subgroup
        {
            GroupId = request.GroupId,
            Name = request.Name,
            Description = request.Description,
            IsActive = true
        };

        _context.Subgroups.Add(subgroup);
        await _context.SaveChangesAsync();

        return _mapper.Map<SubgroupResponse>(subgroup);
    }

    public async Task<SubgroupResponse?> GetSubgroupByIdAsync(Guid subgroupId, Guid? currentUserId = null)
    {
        var subgroup = await _context.Subgroups
            .FirstOrDefaultAsync(s => s.Id == subgroupId);

        return subgroup != null ? _mapper.Map<SubgroupResponse>(subgroup) : null;
    }

    public async Task<List<SubgroupResponse>> GetGroupSubgroupsAsync(Guid groupId, Guid? currentUserId = null, bool includeInactive = false)
    {
        var query = _context.Subgroups.Where(s => s.GroupId == groupId);

        if (!includeInactive)
        {
            query = query.Where(s => s.IsActive);
        }

        var subgroups = await query.ToListAsync();
        return _mapper.Map<List<SubgroupResponse>>(subgroups);
    }

    public async Task<SubgroupResponse> UpdateSubgroupAsync(Guid subgroupId, Guid userId, CreateSubgroupRequest request)
    {
        var subgroup = await _context.Subgroups
            .FirstOrDefaultAsync(s => s.Id == subgroupId);

        if (subgroup == null) throw new ArgumentException("Subgroup not found");

        subgroup.Name = request.Name;
        subgroup.Description = request.Description;

        await _context.SaveChangesAsync();
        return _mapper.Map<SubgroupResponse>(subgroup);
    }

    public async Task<bool> DeleteSubgroupAsync(Guid subgroupId, Guid userId)
    {
        var subgroup = await _context.Subgroups
            .FirstOrDefaultAsync(s => s.Id == subgroupId);

        if (subgroup == null) return false;

        _context.Subgroups.Remove(subgroup);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AddSubgroupMemberAsync(Guid subgroupId, Guid userId, AddSubgroupMemberRequest request)
    {
        var subgroup = await _context.Subgroups
            .FirstOrDefaultAsync(s => s.Id == subgroupId);

        if (subgroup == null) return false;

        var groupMember = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == subgroup.GroupId && gm.UserId == request.UserId);

        if (groupMember == null) return false;

        var subgroupMember = new SubgroupMember
        {
            SubgroupId = subgroupId,
            GroupMemberId = groupMember.Id,
            AssignedRoleId = request.RoleId,
            CanWrite = true, // Default to true for now
            CanManageMembers = false // Default to false for now
        };

        _context.SubgroupMembers.Add(subgroupMember);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveSubgroupMemberAsync(Guid subgroupId, Guid memberId, Guid userId)
    {
        var subgroupMember = await _context.SubgroupMembers
            .FirstOrDefaultAsync(sm => sm.SubgroupId == subgroupId && sm.GroupMemberId == memberId);

        if (subgroupMember == null) return false;

        _context.SubgroupMembers.Remove(subgroupMember);
        await _context.SaveChangesAsync();
        return true;
    }

    // Role management
    public async Task<GroupRoleResponse> CreateGroupRoleAsync(Guid userId, CreateGroupRoleRequest request)
    {
        var role = new GroupRole
        {
            GroupId = request.GroupId,
            Name = request.Name,
            Alias = request.Alias,
            Description = request.Description,
            CanCreateTopics = request.CanCreateTopics,
            CanManageMembers = request.CanManageMembers,
            CanManageRoles = request.CanManageRoles,
            CanManageSubgroups = request.CanManageSubgroups,
            CanPostAnnouncements = request.CanPostAnnouncements,
            CanModerateContent = request.CanModerateContent,
            CanAccessAllSubgroups = request.CanAccessAllSubgroups,
            CanUseGrokAI = request.CanUseGrokAI,
            CanUsePerpetualPhotos = request.CanUsePerpetualPhotos,
            CanUsePaperScanning = request.CanUsePaperScanning,
            CanManageFunds = request.CanManageFunds
        };

        _context.GroupRoles.Add(role);
        await _context.SaveChangesAsync();

        return _mapper.Map<GroupRoleResponse>(role);
    }

    public async Task<GroupRoleResponse?> GetGroupRoleByIdAsync(Guid roleId, Guid? currentUserId = null)
    {
        var role = await _context.GroupRoles
            .FirstOrDefaultAsync(r => r.Id == roleId);

        return role != null ? _mapper.Map<GroupRoleResponse>(role) : null;
    }

    public async Task<List<GroupRoleResponse>> GetGroupRolesAsync(Guid groupId, Guid? currentUserId = null)
    {
        var roles = await _context.GroupRoles
            .Where(r => r.GroupId == groupId)
            .ToListAsync();

        return _mapper.Map<List<GroupRoleResponse>>(roles);
    }

    public async Task<GroupRoleResponse> UpdateGroupRoleAsync(Guid roleId, Guid userId, UpdateGroupRoleRequest request)
    {
        var role = await _context.GroupRoles
            .FirstOrDefaultAsync(r => r.Id == roleId);

        if (role == null) throw new ArgumentException("Role not found");

        if (request.Name != null) role.Name = request.Name;
        if (request.Alias != null) role.Alias = request.Alias;
        if (request.Description != null) role.Description = request.Description;
        if (request.CanCreateTopics.HasValue) role.CanCreateTopics = request.CanCreateTopics.Value;
        if (request.CanManageMembers.HasValue) role.CanManageMembers = request.CanManageMembers.Value;
        if (request.CanManageRoles.HasValue) role.CanManageRoles = request.CanManageRoles.Value;
        if (request.CanManageSubgroups.HasValue) role.CanManageSubgroups = request.CanManageSubgroups.Value;
        if (request.CanPostAnnouncements.HasValue) role.CanPostAnnouncements = request.CanPostAnnouncements.Value;
        if (request.CanModerateContent.HasValue) role.CanModerateContent = request.CanModerateContent.Value;
        if (request.CanAccessAllSubgroups.HasValue) role.CanAccessAllSubgroups = request.CanAccessAllSubgroups.Value;
        if (request.CanUseGrokAI.HasValue) role.CanUseGrokAI = request.CanUseGrokAI.Value;
        if (request.CanUsePerpetualPhotos.HasValue) role.CanUsePerpetualPhotos = request.CanUsePerpetualPhotos.Value;
        if (request.CanUsePaperScanning.HasValue) role.CanUsePaperScanning = request.CanUsePaperScanning.Value;
        if (request.CanManageFunds.HasValue) role.CanManageFunds = request.CanManageFunds.Value;

        await _context.SaveChangesAsync();
        return _mapper.Map<GroupRoleResponse>(role);
    }

    public async Task<bool> DeleteGroupRoleAsync(Guid roleId, Guid userId)
    {
        var role = await _context.GroupRoles
            .FirstOrDefaultAsync(r => r.Id == roleId);

        if (role == null) return false;

        _context.GroupRoles.Remove(role);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AssignRoleToMemberAsync(Guid roleId, Guid userId, AssignRoleRequest request)
    {
        var groupMember = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == userId);

        if (groupMember == null) return false;

        groupMember.AssignedRoleId = request.RoleId;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveRoleFromMemberAsync(Guid roleId, Guid memberId, Guid userId)
    {
        var groupMember = await _context.GroupMembers
            .FirstOrDefaultAsync(gm => gm.Id == memberId);

        if (groupMember == null || groupMember.AssignedRoleId != roleId) return false;

        groupMember.AssignedRoleId = null;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<GroupMemberResponse>> GetRoleMembersAsync(Guid roleId, Guid? currentUserId = null)
    {
        var members = await _context.GroupMembers
            .Where(gm => gm.AssignedRoleId == roleId)
            .ToListAsync();

        return _mapper.Map<List<GroupMemberResponse>>(members);
    }

    // Topic management
    public async Task<TopicResponse> CreateTopicAsync(Guid userId, CreateTopicRequest request)
    {
        var topic = new Topic
        {
            GroupId = request.GroupId,
            SubgroupId = request.SubgroupId,
            Name = request.Name,
            Description = request.Description,
            IsAnnouncementOnly = request.IsAnnouncementOnly,
            AllowMemberPosts = request.AllowMemberPosts,
            AllowKidPosts = request.AllowKidPosts,
            AllowParentPosts = request.AllowParentPosts,
            AllowRolePosts = request.AllowRolePosts,
            Status = "active"
        };

        _context.Topics.Add(topic);
        await _context.SaveChangesAsync();

        return _mapper.Map<TopicResponse>(topic);
    }

    public async Task<TopicResponse?> GetTopicByIdAsync(Guid topicId, Guid? currentUserId = null)
    {
        var topic = await _context.Topics
            .FirstOrDefaultAsync(t => t.Id == topicId);

        return topic != null ? _mapper.Map<TopicResponse>(topic) : null;
    }

    public async Task<List<TopicResponse>> GetGroupTopicsAsync(Guid groupId, Guid? currentUserId = null, Guid? subgroupId = null, string? status = null)
    {
        var query = _context.Topics.Where(t => t.GroupId == groupId);

        if (subgroupId.HasValue)
        {
            // If subgroupId is specified, get topics for that specific subgroup
            query = query.Where(t => t.SubgroupId == subgroupId);
        }
        else
        {
            // If no subgroupId is specified, get only main group topics (where SubgroupId is null)
            query = query.Where(t => t.SubgroupId == null);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(t => t.Status == status);
        }

        var topics = await query.ToListAsync();
        return _mapper.Map<List<TopicResponse>>(topics);
    }

    public async Task<TopicResponse> UpdateTopicStatusAsync(Guid topicId, Guid userId, string status)
    {
        var topic = await _context.Topics
            .FirstOrDefaultAsync(t => t.Id == topicId);

        if (topic == null) throw new KeyNotFoundException("Topic not found");

        topic.Status = status;
        if (status == "paused") topic.PausedAt = DateTime.UtcNow;
        if (status == "archived") topic.ArchivedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return _mapper.Map<TopicResponse>(topic);
    }

    public async Task<bool> DeleteTopicAsync(Guid topicId, Guid userId)
    {
        var topic = await _context.Topics
            .FirstOrDefaultAsync(t => t.Id == topicId);

        if (topic == null) return false;

        _context.Topics.Remove(topic);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TopicPostListResponse> GetTopicPostsAsync(Guid topicId, Guid? currentUserId = null, int page = 1, int pageSize = 20)
    {
        var query = _context.TopicPosts.Where(tp => tp.TopicId == topicId);

        var totalCount = await query.CountAsync();
        var posts = await query
            .OrderByDescending(tp => tp.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new TopicPostListResponse
        {
            Posts = _mapper.Map<List<TopicPostResponse>>(posts),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = (page * pageSize) < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<TopicPostResponse> CreateTopicPostAsync(Guid topicId, Guid userId, CreateTopicPostRequest request)
    {
        try
        {
            // First, create a post in the Social service
            var socialPostRequest = new
            {
                content = request.Content,
                mediaUrls = request.MediaUrls ?? new List<string>(),
                hashtags = request.Hashtags ?? new List<string>(),
                mentions = request.Mentions ?? new List<string>(),
                location = request.Location,
                postType = "text",
                isPublic = false, // Group posts are not public
                groupId = topicId.ToString(), // Pass topic ID as group context
                visibility = "group"
            };

            // Call Social service to create the post
            var httpClient = new HttpClient();
            var jsonContent = System.Text.Json.JsonSerializer.Serialize(socialPostRequest);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");
            
            // For now, we'll create a mock PostId since we can't easily call Social service without auth
            // In production, this should be a proper service-to-service call with authentication
            var socialPostId = Guid.NewGuid();
            
            _logger.LogInformation("Creating topic post with Social PostId: {SocialPostId}", socialPostId);

            var topicPost = new TopicPost
            {
                TopicId = topicId,
                PostId = socialPostId, // Link to Social service post
                UserId = userId,
                KidId = request.KidId,
                IsParentPostingForKid = request.KidId.HasValue,
                Content = request.Content,
                MediaUrls = request.MediaUrls?.ToArray() ?? Array.Empty<string>(),
                Hashtags = request.Hashtags?.ToArray() ?? Array.Empty<string>(),
                Mentions = request.Mentions?.ToArray() ?? Array.Empty<string>(),
                Location = request.Location,
                IsAnnouncement = request.IsAnnouncement
            };

            _context.TopicPosts.Add(topicPost);
            await _context.SaveChangesAsync();

            return _mapper.Map<TopicPostResponse>(topicPost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating topic post for topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<TopicPostResponse?> GetTopicPostByIdAsync(Guid postId, Guid? currentUserId = null)
    {
        var post = await _context.TopicPosts
            .FirstOrDefaultAsync(tp => tp.Id == postId);

        return post != null ? _mapper.Map<TopicPostResponse>(post) : null;
    }

    // Poll management
    public async Task<PollResponse> CreatePollAsync(Guid userId, CreatePollRequest request)
    {
        var poll = new GroupPoll
        {
            GroupId = request.GroupId,
            TopicId = request.TopicId,
            Question = request.Question,
            Options = request.Options,
            AllowMultipleVotes = request.AllowMultipleVotes,
            AllowKidVoting = request.AllowKidVoting,
            AllowParentVotingForKid = request.AllowParentVotingForKid,
            ExpiresAt = request.ExpiresAt
        };

        _context.GroupPolls.Add(poll);
        await _context.SaveChangesAsync();

        return _mapper.Map<PollResponse>(poll);
    }

    public async Task<PollResponse?> GetPollByIdAsync(Guid pollId, Guid? currentUserId = null)
    {
        var poll = await _context.GroupPolls
            .FirstOrDefaultAsync(p => p.Id == pollId);

        return poll != null ? _mapper.Map<PollResponse>(poll) : null;
    }

    public async Task<List<PollResponse>> GetGroupPollsAsync(Guid groupId, Guid? currentUserId = null, Guid? topicId = null, bool? isActive = null)
    {
        var query = _context.GroupPolls.Where(p => p.GroupId == groupId);

        if (topicId.HasValue)
        {
            query = query.Where(p => p.TopicId == topicId);
        }

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        var polls = await query.ToListAsync();
        return _mapper.Map<List<PollResponse>>(polls);
    }

    public async Task<PollResponse> VotePollAsync(Guid pollId, Guid userId, VotePollRequest request)
    {
        var poll = await _context.GroupPolls
            .FirstOrDefaultAsync(p => p.Id == pollId);

        if (poll == null) throw new ArgumentException("Poll not found");

        var vote = new PollVote
        {
            PollId = pollId,
            UserId = userId,
            KidId = request.KidId,
            IsParentVotingForKid = request.KidId.HasValue,
            SelectedOptionIndex = request.SelectedOptionIndex
        };

        _context.PollVotes.Add(vote);
        poll.TotalVotes++;
        await _context.SaveChangesAsync();

        return _mapper.Map<PollResponse>(poll);
    }

    public async Task<PollResultsResponse> GetPollResultsAsync(Guid pollId, Guid? currentUserId = null)
    {
        var poll = await _context.GroupPolls
            .FirstOrDefaultAsync(p => p.Id == pollId);

        if (poll == null) throw new ArgumentException("Poll not found");

        var votes = await _context.PollVotes
            .Where(v => v.PollId == pollId)
            .ToListAsync();

        var results = poll.Options.Select((option, index) => new PollOptionResult
        {
            OptionIndex = index,
            OptionText = option,
            VoteCount = votes.Count(v => v.SelectedOptionIndex == index),
            Percentage = votes.Count > 0 ? (double)votes.Count(v => v.SelectedOptionIndex == index) / votes.Count * 100 : 0
        }).ToList();

        return new PollResultsResponse
        {
            PollId = poll.Id,
            Question = poll.Question,
            Options = poll.Options.ToList(),
            Results = results,
            TotalVotes = poll.TotalVotes,
            IsActive = poll.IsActive,
            ExpiresAt = poll.ExpiresAt,
            CreatedAt = poll.CreatedAt
        };
    }

    public async Task<PollResponse> UpdatePollAsync(Guid pollId, Guid userId, UpdatePollRequest request)
    {
        var poll = await _context.GroupPolls
            .FirstOrDefaultAsync(p => p.Id == pollId);

        if (poll == null) throw new ArgumentException("Poll not found");

        if (request.Question != null) poll.Question = request.Question;
        if (request.Options != null) poll.Options = request.Options;
        if (request.AllowMultipleVotes.HasValue) poll.AllowMultipleVotes = request.AllowMultipleVotes.Value;
        if (request.AllowKidVoting.HasValue) poll.AllowKidVoting = request.AllowKidVoting.Value;
        if (request.AllowParentVotingForKid.HasValue) poll.AllowParentVotingForKid = request.AllowParentVotingForKid.Value;
        if (request.ExpiresAt.HasValue) poll.ExpiresAt = request.ExpiresAt.Value;

        await _context.SaveChangesAsync();
        return _mapper.Map<PollResponse>(poll);
    }

    public async Task<bool> DeletePollAsync(Guid pollId, Guid userId)
    {
        var poll = await _context.GroupPolls
            .FirstOrDefaultAsync(p => p.Id == pollId);

        if (poll == null) return false;

        _context.GroupPolls.Remove(poll);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PollVoteResponse?> GetUserVoteAsync(Guid pollId, Guid userId)
    {
        var vote = await _context.PollVotes
            .FirstOrDefaultAsync(v => v.PollId == pollId && v.UserId == userId);

        return vote != null ? _mapper.Map<PollVoteResponse>(vote) : null;
    }

    // Documentation management
    public async Task<DocumentationResponse> CreateDocumentationAsync(Guid userId, CreateDocumentationRequest request)
    {
        var documentation = new GroupDocumentation
        {
            GroupId = request.GroupId,
            Title = request.Title,
            Description = request.Description,
            Content = request.Content,
            Category = request.Category,
            CreatedBy = userId
        };

        _context.GroupDocumentations.Add(documentation);
        await _context.SaveChangesAsync();

        return _mapper.Map<DocumentationResponse>(documentation);
    }

    public async Task<DocumentationResponse?> GetGroupDocumentationAsync(Guid groupId, Guid? currentUserId = null)
    {
        var documentation = await _context.GroupDocumentations
            .FirstOrDefaultAsync(d => d.GroupId == groupId);

        return documentation != null ? _mapper.Map<DocumentationResponse>(documentation) : null;
    }

    public async Task<DocumentationResponse> UpdateDocumentationAsync(Guid documentationId, Guid userId, UpdateDocumentationRequest request)
    {
        var documentation = await _context.GroupDocumentations
            .FirstOrDefaultAsync(d => d.Id == documentationId);

        if (documentation == null) throw new ArgumentException("Documentation not found");

        if (request.Title != null) documentation.Title = request.Title;
        if (request.Description != null) documentation.Description = request.Description;
        if (request.Content != null) documentation.Content = request.Content;
        if (request.Category != null) documentation.Category = request.Category;

        documentation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return _mapper.Map<DocumentationResponse>(documentation);
    }

    public async Task<bool> DeleteDocumentationAsync(Guid documentationId, Guid userId)
    {
        var documentation = await _context.GroupDocumentations
            .FirstOrDefaultAsync(d => d.Id == documentationId);

        if (documentation == null) return false;

        _context.GroupDocumentations.Remove(documentation);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DocumentationSearchResponse> SearchDocumentationAsync(Guid userId, DocumentationSearchRequest request)
    {
        var query = _context.GroupDocumentations.Where(d => d.CreatedBy == userId);

        if (!string.IsNullOrEmpty(request.Query))
        {
            query = query.Where(d => d.Title.Contains(request.Query) || d.Content.Contains(request.Query));
        }

        if (!string.IsNullOrEmpty(request.Category))
        {
            query = query.Where(d => d.Category == request.Category);
        }

        var totalCount = await query.CountAsync();
        var results = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new DocumentationSearchResponse
        {
            Results = _mapper.Map<List<DocumentationResponse>>(results),
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = (request.Page * request.PageSize) < totalCount
        };
    }

    public async Task<DocumentationAnswerResponse> AskDocumentationQuestionAsync(Guid userId, DocumentationQuestionRequest request)
    {
        // This would integrate with @grok AI service
        // For now, return a mock response
        return new DocumentationAnswerResponse
        {
            Answer = "This is a mock response. Integration with @grok AI would be implemented here.",
            Sources = new List<string> { "Group Documentation", "School Rules" },
            Confidence = 0.85,
            AnsweredAt = DateTime.UtcNow
        };
    }

    // Group Rules Implementation
    public async Task<GroupRuleResponse> CreateGroupRuleAsync(Guid groupId, Guid userId, CreateGroupRuleRequest request)
    {
        // Verify user has permission to manage group rules
        var isAdmin = await IsUserAdminAsync(groupId, userId);
        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("User does not have permission to create group rules");
        }

        var rule = new GroupRule
        {
            GroupId = groupId,
            Title = request.Title,
            Description = request.Description,
            Details = request.Details,
            IsActive = request.IsActive,
            Order = request.Order,
            Category = request.Category,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.GroupRules.Add(rule);
        await _context.SaveChangesAsync();

        return _mapper.Map<GroupRuleResponse>(rule);
    }

    public async Task<List<GroupRuleResponse>> GetGroupRulesAsync(Guid groupId)
    {
        var rules = await _context.GroupRules
            .Where(r => r.GroupId == groupId)
            .OrderBy(r => r.Order)
            .ThenBy(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<GroupRuleResponse>>(rules);
    }

    public async Task<GroupRuleResponse?> GetGroupRuleAsync(Guid groupId, Guid ruleId)
    {
        var rule = await _context.GroupRules
            .FirstOrDefaultAsync(r => r.Id == ruleId && r.GroupId == groupId);

        return rule != null ? _mapper.Map<GroupRuleResponse>(rule) : null;
    }

    public async Task<GroupRuleResponse?> UpdateGroupRuleAsync(Guid groupId, Guid ruleId, Guid userId, UpdateGroupRuleRequest request)
    {
        // Verify user has permission to manage group rules
        var isAdmin = await IsUserAdminAsync(groupId, userId);
        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("User does not have permission to update group rules");
        }

        var rule = await _context.GroupRules
            .FirstOrDefaultAsync(r => r.Id == ruleId && r.GroupId == groupId);

        if (rule == null)
            return null;

        // Update only provided fields
        if (!string.IsNullOrEmpty(request.Title))
            rule.Title = request.Title;
        
        if (!string.IsNullOrEmpty(request.Description))
            rule.Description = request.Description;
        
        if (request.Details != null)
            rule.Details = request.Details;
        
        if (request.IsActive.HasValue)
            rule.IsActive = request.IsActive.Value;
        
        if (request.Order.HasValue)
            rule.Order = request.Order.Value;
        
        if (request.Category != null)
            rule.Category = request.Category;

        rule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<GroupRuleResponse>(rule);
    }

    public async Task<bool> DeleteGroupRuleAsync(Guid groupId, Guid ruleId, Guid userId)
    {
        // Verify user has permission to manage group rules
        var isAdmin = await IsUserAdminAsync(groupId, userId);
        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("User does not have permission to delete group rules");
        }

        var rule = await _context.GroupRules
            .FirstOrDefaultAsync(r => r.Id == ruleId && r.GroupId == groupId);

        if (rule == null)
            return false;

        _context.GroupRules.Remove(rule);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<GroupRuleResponse?> ToggleGroupRuleAsync(Guid groupId, Guid ruleId, Guid userId)
    {
        // Verify user has permission to manage group rules
        var isAdmin = await IsUserAdminAsync(groupId, userId);
        if (!isAdmin)
        {
            throw new UnauthorizedAccessException("User does not have permission to toggle group rules");
        }

        var rule = await _context.GroupRules
            .FirstOrDefaultAsync(r => r.Id == ruleId && r.GroupId == groupId);

        if (rule == null)
            return null;

        rule.IsActive = !rule.IsActive;
        rule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return _mapper.Map<GroupRuleResponse>(rule);
    }

    // File Management Implementation
    public async Task<FileResponse> CreateFileAsync(Guid userId, CreateFileRequest request, string filePath)
    {
        var file = new GroupFile
        {
            GroupId = request.GroupId,
            TopicId = request.TopicId,
            FileName = request.FileName,
            FilePath = filePath,
            MimeType = request.MimeType,
            FileSize = request.FileSize,
            FileCategory = request.FileCategory,
            Description = request.Description,
            UploadedBy = userId,
            KidId = request.KidId,
            IsParentUploadingForKid = request.IsParentUploadingForKid,
            IsPublic = request.IsPublic,
            IsDownloadable = request.IsDownloadable
        };

        _context.GroupFiles.Add(file);
        await _context.SaveChangesAsync();

        _logger.LogInformation("File created: {FileId} by user {UserId}", file.Id, userId);
        return await GetFileByIdAsync(file.Id, userId) ?? throw new InvalidOperationException("Failed to retrieve created file");
    }

    public async Task<FileResponse?> GetFileByIdAsync(Guid fileId, Guid? currentUserId = null)
    {
        var file = await _context.GroupFiles
            .Include(f => f.Group)
            .Include(f => f.Topic)
            .FirstOrDefaultAsync(f => f.Id == fileId);

        if (file == null)
            return null;

        // Check permissions
        if (currentUserId.HasValue)
        {
            var userRole = await GetUserRoleAsync(file.GroupId, currentUserId.Value);
            if (userRole == null)
                return null; // User is not a member of the group

            // Check if user can view the file
            var canView = await CanUserViewFileAsync(fileId, currentUserId.Value, userRole);
            if (!canView)
                return null;
        }

        var response = _mapper.Map<FileResponse>(file);
        
        // Add additional information
        response.UploadedByUsername = "Unknown User"; // Would need to fetch from user service
        response.TopicName = file.Topic?.Name;
        
        // Check permissions for current user
        if (currentUserId.HasValue)
        {
            var userRole = await GetUserRoleAsync(file.GroupId, currentUserId.Value);
            response.CanDelete = await CanUserDeleteFileAsync(fileId, currentUserId.Value, userRole);
            response.CanEdit = await CanUserEditFileAsync(fileId, currentUserId.Value, userRole);
        }

        return response;
    }

    public async Task<FileListResponse> GetGroupFilesAsync(Guid groupId, Guid? currentUserId = null, int page = 1, int pageSize = 20, string? category = null, Guid? topicId = null)
    {
        var query = _context.GroupFiles
            .Include(f => f.Group)
            .Include(f => f.Topic)
            .Where(f => f.GroupId == groupId);

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(f => f.FileCategory == category);
        }

        if (topicId.HasValue)
        {
            query = query.Where(f => f.TopicId == topicId);
        }

        var totalCount = await query.CountAsync();
        var files = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<FileResponse>();
        foreach (var file in files)
        {
            if (currentUserId.HasValue)
            {
                var userRole = await GetUserRoleAsync(groupId, currentUserId.Value);
                if (userRole == null) continue; // User is not a member

                var canView = await CanUserViewFileAsync(file.Id, currentUserId.Value, userRole);
                if (!canView) continue;
            }

            var response = _mapper.Map<FileResponse>(file);
            response.UploadedByUsername = "Unknown User"; // Would need to fetch from user service
            response.TopicName = file.Topic?.Name;
            
            if (currentUserId.HasValue)
            {
                var userRole = await GetUserRoleAsync(groupId, currentUserId.Value);
                response.CanDelete = await CanUserDeleteFileAsync(file.Id, currentUserId.Value, userRole);
                response.CanEdit = await CanUserEditFileAsync(file.Id, currentUserId.Value, userRole);
            }

            responses.Add(response);
        }

        return new FileListResponse
        {
            Files = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<FileResponse> UpdateFileAsync(Guid fileId, Guid userId, UpdateFileRequest request)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null)
            throw new KeyNotFoundException("File not found");

        var userRole = await GetUserRoleAsync(file.GroupId, userId);
        if (userRole == null)
            throw new UnauthorizedAccessException("User is not a member of the group");

        var canEdit = await CanUserEditFileAsync(fileId, userId, userRole);
        if (!canEdit)
            throw new UnauthorizedAccessException("User does not have permission to edit this file");

        if (!string.IsNullOrEmpty(request.FileName))
            file.FileName = request.FileName;
        
        if (request.Description != null)
            file.Description = request.Description;
        
        if (request.IsPublic.HasValue)
            file.IsPublic = request.IsPublic.Value;
        
        if (request.IsDownloadable.HasValue)
            file.IsDownloadable = request.IsDownloadable.Value;

        file.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetFileByIdAsync(fileId, userId) ?? throw new InvalidOperationException("Failed to retrieve updated file");
    }

    public async Task<bool> DeleteFileAsync(Guid fileId, Guid userId)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null)
            return false;

        var userRole = await GetUserRoleAsync(file.GroupId, userId);
        if (userRole == null)
            throw new UnauthorizedAccessException("User is not a member of the group");

        var canDelete = await CanUserDeleteFileAsync(fileId, userId, userRole);
        if (!canDelete)
            throw new UnauthorizedAccessException("User does not have permission to delete this file");

        // Delete physical file
        if (System.IO.File.Exists(file.FilePath))
        {
            System.IO.File.Delete(file.FilePath);
        }

        // Delete file permissions
        var permissions = await _context.GroupFilePermissions
            .Where(p => p.FileId == fileId)
            .ToListAsync();
        _context.GroupFilePermissions.RemoveRange(permissions);

        // Delete file record
        _context.GroupFiles.Remove(file);
        await _context.SaveChangesAsync();

        _logger.LogInformation("File deleted: {FileId} by user {UserId}", fileId, userId);
        return true;
    }

    public async Task<bool> IncrementFileDownloadCountAsync(Guid fileId)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null)
            return false;

        file.DownloadCount++;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FilePermissionResponse> SetFilePermissionAsync(Guid fileId, Guid userId, FilePermissionRequest request)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null)
            throw new KeyNotFoundException("File not found");

        var userRole = await GetUserRoleAsync(file.GroupId, userId);
        if (userRole != "admin")
            throw new UnauthorizedAccessException("Only admins can set file permissions");

        var existingPermission = await _context.GroupFilePermissions
            .FirstOrDefaultAsync(p => p.FileId == fileId && p.Role == request.Role);

        if (existingPermission != null)
        {
            existingPermission.CanView = request.CanView;
            existingPermission.CanDownload = request.CanDownload;
            existingPermission.CanDelete = request.CanDelete;
            existingPermission.CanEdit = request.CanEdit;
        }
        else
        {
            var permission = new GroupFilePermission
            {
                FileId = fileId,
                Role = request.Role,
                CanView = request.CanView,
                CanDownload = request.CanDownload,
                CanDelete = request.CanDelete,
                CanEdit = request.CanEdit
            };
            _context.GroupFilePermissions.Add(permission);
        }

        await _context.SaveChangesAsync();

        var response = existingPermission ?? await _context.GroupFilePermissions
            .FirstAsync(p => p.FileId == fileId && p.Role == request.Role);

        return _mapper.Map<FilePermissionResponse>(response);
    }

    public async Task<List<FilePermissionResponse>> GetFilePermissionsAsync(Guid fileId, Guid userId)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null)
            throw new KeyNotFoundException("File not found");

        var userRole = await GetUserRoleAsync(file.GroupId, userId);
        if (userRole != "admin")
            throw new UnauthorizedAccessException("Only admins can view file permissions");

        var permissions = await _context.GroupFilePermissions
            .Where(p => p.FileId == fileId)
            .ToListAsync();

        return permissions.Select(p => _mapper.Map<FilePermissionResponse>(p)).ToList();
    }

    // Helper methods for file permissions
    private async Task<bool> CanUserViewFileAsync(Guid fileId, Guid userId, string userRole)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null) return false;

        if (file.UploadedBy == userId) return true; // Owner can always view

        var permission = await _context.GroupFilePermissions
            .FirstOrDefaultAsync(p => p.FileId == fileId && p.Role == userRole);

        return permission?.CanView ?? file.IsPublic; // Default to file's public setting
    }

    private async Task<bool> CanUserDeleteFileAsync(Guid fileId, Guid userId, string userRole)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null) return false;

        if (file.UploadedBy == userId) return true; // Owner can always delete
        if (userRole == "admin") return true; // Admins can delete

        var permission = await _context.GroupFilePermissions
            .FirstOrDefaultAsync(p => p.FileId == fileId && p.Role == userRole);

        return permission?.CanDelete ?? false;
    }

    private async Task<bool> CanUserEditFileAsync(Guid fileId, Guid userId, string userRole)
    {
        var file = await _context.GroupFiles.FindAsync(fileId);
        if (file == null) return false;

        if (file.UploadedBy == userId) return true; // Owner can always edit
        if (userRole == "admin") return true; // Admins can edit

        var permission = await _context.GroupFilePermissions
            .FirstOrDefaultAsync(p => p.FileId == fileId && p.Role == userRole);

        return permission?.CanEdit ?? false;
    }

    private async Task<bool> IsUserAdminAsync(Guid groupId, Guid userId)
    {
        var member = await _context.GroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == userId);

        return member?.Role == "admin";
    }


    private async Task<List<GroupMemberResponse>> GetGroupAdminsAsync(Guid groupId)
    {
        var admins = await _context.GroupMembers
            .Where(m => m.GroupId == groupId && m.Role == "admin")
            .ToListAsync();
        
        return _mapper.Map<List<GroupMemberResponse>>(admins);
    }

    private async Task<List<GroupMemberResponse>> GetGroupModeratorsAsync(Guid groupId)
    {
        var moderators = await _context.GroupMembers
            .Where(m => m.GroupId == groupId && m.Role == "moderator")
            .ToListAsync();
        
        return _mapper.Map<List<GroupMemberResponse>>(moderators);
    }
}
