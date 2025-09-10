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

    public GroupService(GroupsDbContext context, ILogger<GroupService> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
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
            Role = "owner"
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
        // Implementation would go here
        return new GroupMemberListResponse();
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

    public async Task<GroupPostResponse> CreateGroupPostAsync(Guid groupId, Guid userId, GroupPostRequest request)
    {
        // Implementation would go here
        return new GroupPostResponse();
    }

    public async Task<GroupPostListResponse> GetGroupPostsAsync(Guid groupId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        // Implementation would go here
        return new GroupPostListResponse();
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
}
