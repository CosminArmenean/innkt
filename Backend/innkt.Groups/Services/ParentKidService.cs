using innkt.Groups.Models;
using innkt.Groups.Data;
using innkt.Groups.DTOs;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using System.ComponentModel.DataAnnotations;

namespace innkt.Groups.Services;

public interface IParentKidService
{
    // Parent-Kid relationship management
    Task<ParentKidRelationshipResponse> CreateParentKidRelationshipAsync(Guid parentId, Guid kidId, CreateParentKidRelationshipRequest request);
    Task<ParentKidRelationshipResponse?> GetParentKidRelationshipAsync(Guid parentId, Guid kidId);
    Task<List<ParentKidRelationshipResponse>> GetParentRelationshipsAsync(Guid parentId);
    Task<List<ParentKidRelationshipResponse>> GetKidRelationshipsAsync(Guid kidId);
    Task<ParentKidRelationshipResponse> UpdateParentKidRelationshipAsync(Guid parentId, Guid kidId, UpdateParentKidRelationshipRequest request);
    Task<bool> DeleteParentKidRelationshipAsync(Guid parentId, Guid kidId);
    
    // Group membership management
    Task<GroupMemberResponse> AddKidToGroupAsync(Guid parentId, Guid kidId, Guid groupId, AddKidToGroupRequest request);
    Task<bool> RemoveKidFromGroupAsync(Guid parentId, Guid kidId, Guid groupId);
    Task<List<GroupMemberResponse>> GetKidGroupMembershipsAsync(Guid kidId, Guid? parentId = null);
    Task<List<GroupMemberResponse>> GetParentGroupMembershipsAsync(Guid parentId);
    
    // Parent acting on behalf of kid
    Task<bool> CanParentActForKidAsync(Guid parentId, Guid kidId, Guid groupId);
    Task<ParentActingResponse> ParentActingForKidAsync(Guid parentId, Guid kidId, Guid groupId, string action, object? data = null);
    Task<List<ParentActingResponse>> GetParentActingHistoryAsync(Guid parentId, Guid? kidId = null, Guid? groupId = null);
    
    // Visual indicators and UI support
    Task<ParentKidVisualResponse> GetParentKidVisualInfoAsync(Guid parentId, Guid kidId, Guid groupId);
    Task<List<ParentKidVisualResponse>> GetGroupParentKidVisualsAsync(Guid groupId);
    Task<ParentKidPermissionMatrix> GetParentKidPermissionMatrixAsync(Guid parentId, Guid kidId, Guid groupId);
    
    // Educational group specific features
    Task<bool> CanKidPerformActionAsync(Guid kidId, Guid groupId, string action);
    Task<bool> CanParentOverrideKidActionAsync(Guid parentId, Guid kidId, Guid groupId, string action);
    Task<EducationalGroupSettings> GetEducationalGroupSettingsAsync(Guid groupId);
    Task<EducationalGroupSettings> UpdateEducationalGroupSettingsAsync(Guid groupId, Guid userId, UpdateEducationalGroupSettingsRequest request);
}

public class ParentKidService : IParentKidService
{
    private readonly GroupsDbContext _context;
    private readonly IPermissionService _permissionService;
    private readonly IMapper _mapper;
    private readonly ILogger<ParentKidService> _logger;

    public ParentKidService(
        GroupsDbContext context,
        IPermissionService permissionService,
        IMapper mapper,
        ILogger<ParentKidService> logger)
    {
        _context = context;
        _permissionService = permissionService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ParentKidRelationshipResponse> CreateParentKidRelationshipAsync(Guid parentId, Guid kidId, CreateParentKidRelationshipRequest request)
    {
        try
        {
            // Validate that the parent has permission to create this relationship
            var canCreate = await _permissionService.CanUserPerformActionAsync(parentId, request.GroupId, "manage_kid_relationships");
            if (!canCreate)
            {
                throw new UnauthorizedAccessException("You don't have permission to create parent-kid relationships");
            }

            // Check if relationship already exists
            var existingRelationship = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == request.GroupId && 
                                         m.UserId == parentId && 
                                         m.ParentId == kidId);

            if (existingRelationship != null)
            {
                throw new InvalidOperationException("Parent-kid relationship already exists");
            }

            // Create parent membership
            var parentMember = new GroupMember
            {
                GroupId = request.GroupId,
                UserId = parentId,
                Role = "parent",
                ParentId = kidId,
                CanPost = request.CanParentPost,
                CanVote = request.CanParentVote,
                CanComment = request.CanParentComment,
                CanInvite = false, // Parents can't invite others
                IsActive = true,
                JoinedAt = DateTime.UtcNow
            };

            _context.GroupMembers.Add(parentMember);

            // Create kid membership
            var kidMember = new GroupMember
            {
                GroupId = request.GroupId,
                UserId = kidId,
                Role = "kid",
                KidId = kidId,
                ParentId = parentId,
                CanPost = request.CanKidPost,
                CanVote = request.CanKidVote,
                CanComment = request.CanKidComment,
                CanInvite = false, // Kids can't invite others
                IsActive = true,
                JoinedAt = DateTime.UtcNow
            };

            _context.GroupMembers.Add(kidMember);

            await _context.SaveChangesAsync();

            _logger.LogInformation("👨‍👩‍👧‍👦 Created parent-kid relationship: Parent {ParentId} - Kid {KidId} in group {GroupId}", 
                parentId, kidId, request.GroupId);

            return new ParentKidRelationshipResponse
            {
                ParentId = parentId,
                KidId = kidId,
                GroupId = request.GroupId,
                CanParentPost = request.CanParentPost,
                CanParentVote = request.CanParentVote,
                CanParentComment = request.CanParentComment,
                CanKidPost = request.CanKidPost,
                CanKidVote = request.CanKidVote,
                CanKidComment = request.CanKidComment,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error creating parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            throw;
        }
    }

    public async Task<ParentKidRelationshipResponse?> GetParentKidRelationshipAsync(Guid parentId, Guid kidId)
    {
        try
        {
            var relationship = await _context.GroupMembers
                .Include(m => m.Group)
                .FirstOrDefaultAsync(m => m.UserId == parentId && m.ParentId == kidId && m.IsActive);

            if (relationship == null) return null;

            var kidMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.UserId == kidId && m.ParentId == parentId && m.IsActive);

            return new ParentKidRelationshipResponse
            {
                ParentId = parentId,
                KidId = kidId,
                GroupId = relationship.GroupId,
                CanParentPost = relationship.CanPost,
                CanParentVote = relationship.CanVote,
                CanParentComment = relationship.CanComment,
                CanKidPost = kidMember?.CanPost ?? false,
                CanKidVote = kidMember?.CanVote ?? false,
                CanKidComment = kidMember?.CanComment ?? false,
                CreatedAt = relationship.JoinedAt,
                IsActive = relationship.IsActive
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            throw;
        }
    }

    public async Task<List<ParentKidRelationshipResponse>> GetParentRelationshipsAsync(Guid parentId)
    {
        try
        {
            var relationships = await _context.GroupMembers
                .Include(m => m.Group)
                .Where(m => m.UserId == parentId && m.ParentId.HasValue && m.IsActive)
                .ToListAsync();

            var responses = new List<ParentKidRelationshipResponse>();

            foreach (var relationship in relationships)
            {
                var kidMember = await _context.GroupMembers
                    .FirstOrDefaultAsync(m => m.UserId == relationship.ParentId.Value && 
                                           m.ParentId == parentId && 
                                           m.IsActive);

                responses.Add(new ParentKidRelationshipResponse
                {
                    ParentId = parentId,
                    KidId = relationship.ParentId.Value,
                    GroupId = relationship.GroupId,
                    CanParentPost = relationship.CanPost,
                    CanParentVote = relationship.CanVote,
                    CanParentComment = relationship.CanComment,
                    CanKidPost = kidMember?.CanPost ?? false,
                    CanKidVote = kidMember?.CanVote ?? false,
                    CanKidComment = kidMember?.CanComment ?? false,
                    CreatedAt = relationship.JoinedAt,
                    IsActive = relationship.IsActive
                });
            }

            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting parent relationships for parent {ParentId}", parentId);
            throw;
        }
    }

    public async Task<List<ParentKidRelationshipResponse>> GetKidRelationshipsAsync(Guid kidId)
    {
        try
        {
            var relationships = await _context.GroupMembers
                .Include(m => m.Group)
                .Where(m => m.UserId == kidId && m.ParentId.HasValue && m.IsActive)
                .ToListAsync();

            var responses = new List<ParentKidRelationshipResponse>();

            foreach (var relationship in relationships)
            {
                var parentMember = await _context.GroupMembers
                    .FirstOrDefaultAsync(m => m.UserId == relationship.ParentId.Value && 
                                           m.ParentId == kidId && 
                                           m.IsActive);

                responses.Add(new ParentKidRelationshipResponse
                {
                    ParentId = relationship.ParentId.Value,
                    KidId = kidId,
                    GroupId = relationship.GroupId,
                    CanParentPost = parentMember?.CanPost ?? false,
                    CanParentVote = parentMember?.CanVote ?? false,
                    CanParentComment = parentMember?.CanComment ?? false,
                    CanKidPost = relationship.CanPost,
                    CanKidVote = relationship.CanVote,
                    CanKidComment = relationship.CanComment,
                    CreatedAt = relationship.JoinedAt,
                    IsActive = relationship.IsActive
                });
            }

            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting kid relationships for kid {KidId}", kidId);
            throw;
        }
    }

    public async Task<ParentKidRelationshipResponse> UpdateParentKidRelationshipAsync(Guid parentId, Guid kidId, UpdateParentKidRelationshipRequest request)
    {
        try
        {
            var parentMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.UserId == parentId && m.ParentId == kidId && m.IsActive);

            if (parentMember == null)
            {
                throw new KeyNotFoundException("Parent-kid relationship not found");
            }

            // Check if parent has permission to update this relationship
            var canUpdate = await _permissionService.CanUserPerformActionAsync(parentId, parentMember.GroupId, "manage_kid_relationships");
            if (!canUpdate)
            {
                throw new UnauthorizedAccessException("You don't have permission to update this relationship");
            }

            // Update parent permissions
            if (request.CanParentPost.HasValue)
                parentMember.CanPost = request.CanParentPost.Value;
            
            if (request.CanParentVote.HasValue)
                parentMember.CanVote = request.CanParentVote.Value;
            
            if (request.CanParentComment.HasValue)
                parentMember.CanComment = request.CanParentComment.Value;

            // Update kid permissions
            var kidMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.UserId == kidId && m.ParentId == parentId && m.IsActive);

            if (kidMember != null)
            {
                if (request.CanKidPost.HasValue)
                    kidMember.CanPost = request.CanKidPost.Value;
                
                if (request.CanKidVote.HasValue)
                    kidMember.CanVote = request.CanKidVote.Value;
                
                if (request.CanKidComment.HasValue)
                    kidMember.CanComment = request.CanKidComment.Value;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("👨‍👩‍👧‍👦 Updated parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);

            return new ParentKidRelationshipResponse
            {
                ParentId = parentId,
                KidId = kidId,
                GroupId = parentMember.GroupId,
                CanParentPost = parentMember.CanPost,
                CanParentVote = parentMember.CanVote,
                CanParentComment = parentMember.CanComment,
                CanKidPost = kidMember?.CanPost ?? false,
                CanKidVote = kidMember?.CanVote ?? false,
                CanKidComment = kidMember?.CanComment ?? false,
                CreatedAt = parentMember.JoinedAt,
                IsActive = parentMember.IsActive
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            throw;
        }
    }

    public async Task<bool> DeleteParentKidRelationshipAsync(Guid parentId, Guid kidId)
    {
        try
        {
            var parentMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.UserId == parentId && m.ParentId == kidId && m.IsActive);

            if (parentMember == null) return false;

            // Check if parent has permission to delete this relationship
            var canDelete = await _permissionService.CanUserPerformActionAsync(parentId, parentMember.GroupId, "manage_kid_relationships");
            if (!canDelete)
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this relationship");
            }

            // Remove parent membership
            _context.GroupMembers.Remove(parentMember);

            // Remove kid membership
            var kidMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.UserId == kidId && m.ParentId == parentId && m.IsActive);

            if (kidMember != null)
            {
                _context.GroupMembers.Remove(kidMember);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("👨‍👩‍👧‍👦 Deleted parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error deleting parent-kid relationship: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            throw;
        }
    }

    public async Task<GroupMemberResponse> AddKidToGroupAsync(Guid parentId, Guid kidId, Guid groupId, AddKidToGroupRequest request)
    {
        try
        {
            // Check if parent can add kid to this group
            var canAdd = await _permissionService.CanUserPerformActionAsync(parentId, groupId, "manage_kid_relationships");
            if (!canAdd)
            {
                throw new UnauthorizedAccessException("You don't have permission to add kids to this group");
            }

            // Create parent membership
            var parentMember = new GroupMember
            {
                GroupId = groupId,
                UserId = parentId,
                Role = "parent",
                ParentId = kidId,
                CanPost = request.CanParentPost,
                CanVote = request.CanParentVote,
                CanComment = request.CanParentComment,
                CanInvite = false,
                IsActive = true,
                JoinedAt = DateTime.UtcNow
            };

            _context.GroupMembers.Add(parentMember);

            // Create kid membership
            var kidMember = new GroupMember
            {
                GroupId = groupId,
                UserId = kidId,
                Role = "kid",
                KidId = kidId,
                ParentId = parentId,
                CanPost = request.CanKidPost,
                CanVote = request.CanKidVote,
                CanComment = request.CanKidComment,
                CanInvite = false,
                IsActive = true,
                JoinedAt = DateTime.UtcNow
            };

            _context.GroupMembers.Add(kidMember);

            await _context.SaveChangesAsync();

            _logger.LogInformation("👨‍👩‍👧‍👦 Added kid {KidId} to group {GroupId} by parent {ParentId}", kidId, groupId, parentId);

            return _mapper.Map<GroupMemberResponse>(kidMember);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error adding kid {KidId} to group {GroupId} by parent {ParentId}", kidId, groupId, parentId);
            throw;
        }
    }

    public async Task<bool> RemoveKidFromGroupAsync(Guid parentId, Guid kidId, Guid groupId)
    {
        try
        {
            // Check if parent can remove kid from this group
            var canRemove = await _permissionService.CanUserPerformActionAsync(parentId, groupId, "manage_kid_relationships");
            if (!canRemove)
            {
                throw new UnauthorizedAccessException("You don't have permission to remove kids from this group");
            }

            var parentMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == parentId && m.ParentId == kidId);

            if (parentMember != null)
            {
                _context.GroupMembers.Remove(parentMember);
            }

            var kidMember = await _context.GroupMembers
                .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == kidId && m.ParentId == parentId);

            if (kidMember != null)
            {
                _context.GroupMembers.Remove(kidMember);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("👨‍👩‍👧‍👦 Removed kid {KidId} from group {GroupId} by parent {ParentId}", kidId, groupId, parentId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error removing kid {KidId} from group {GroupId} by parent {ParentId}", kidId, groupId, parentId);
            throw;
        }
    }

    public async Task<List<GroupMemberResponse>> GetKidGroupMembershipsAsync(Guid kidId, Guid? parentId = null)
    {
        try
        {
            var query = _context.GroupMembers
                .Include(m => m.Group)
                .Where(m => m.UserId == kidId && m.IsActive);

            if (parentId.HasValue)
            {
                query = query.Where(m => m.ParentId == parentId.Value);
            }

            var memberships = await query.ToListAsync();
            return memberships.Select(m => _mapper.Map<GroupMemberResponse>(m)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting kid group memberships for kid {KidId}", kidId);
            throw;
        }
    }

    public async Task<List<GroupMemberResponse>> GetParentGroupMembershipsAsync(Guid parentId)
    {
        try
        {
            var memberships = await _context.GroupMembers
                .Include(m => m.Group)
                .Where(m => m.UserId == parentId && m.ParentId.HasValue && m.IsActive)
                .ToListAsync();

            return memberships.Select(m => _mapper.Map<GroupMemberResponse>(m)).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting parent group memberships for parent {ParentId}", parentId);
            throw;
        }
    }

    public async Task<bool> CanParentActForKidAsync(Guid parentId, Guid kidId, Guid groupId)
    {
        return await _permissionService.CanParentActForKidAsync(parentId, kidId, groupId);
    }

    public async Task<ParentActingResponse> ParentActingForKidAsync(Guid parentId, Guid kidId, Guid groupId, string action, object? data = null)
    {
        try
        {
            // Check if parent can act for this kid
            var canAct = await CanParentActForKidAsync(parentId, kidId, groupId);
            if (!canAct)
            {
                throw new UnauthorizedAccessException("Parent cannot act on behalf of this kid");
            }

            // Log the parent acting for kid
            var actingRecord = new ParentActingRecord
            {
                ParentId = parentId,
                KidId = kidId,
                GroupId = groupId,
                Action = action,
                Data = data?.ToString(),
                Timestamp = DateTime.UtcNow
            };

            // In a real implementation, this would be stored in a separate table
            // For now, we'll just log it
            _logger.LogInformation("👨‍👩‍👧‍👦 Parent {ParentId} acting for kid {KidId} in group {GroupId}: {Action}", 
                parentId, kidId, groupId, action);

            return new ParentActingResponse
            {
                ParentId = parentId,
                KidId = kidId,
                GroupId = groupId,
                Action = action,
                Data = data,
                Timestamp = DateTime.UtcNow,
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error with parent acting for kid: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            throw;
        }
    }

    public async Task<List<ParentActingResponse>> GetParentActingHistoryAsync(Guid parentId, Guid? kidId = null, Guid? groupId = null)
    {
        try
        {
            // In a real implementation, this would query a ParentActingRecord table
            // For now, we'll return an empty list
            return new List<ParentActingResponse>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting parent acting history for parent {ParentId}", parentId);
            throw;
        }
    }

    public async Task<ParentKidVisualResponse> GetParentKidVisualInfoAsync(Guid parentId, Guid kidId, Guid groupId)
    {
        try
        {
            var relationship = await GetParentKidRelationshipAsync(parentId, kidId);
            if (relationship == null)
            {
                throw new KeyNotFoundException("Parent-kid relationship not found");
            }

            // In a real implementation, this would fetch user info from Officer service
            return new ParentKidVisualResponse
            {
                ParentId = parentId,
                KidId = kidId,
                GroupId = groupId,
                ParentName = "Parent Name", // Would come from Officer service
                KidName = "Kid Name", // Would come from Officer service
                ParentAvatar = "parent-avatar-url", // Would come from Officer service
                KidAvatar = "kid-avatar-url", // Would come from Officer service
                IsParentActing = true, // This would be determined by the current action
                Relationship = relationship,
                VisualIndicator = "👨‍👩‍👧‍👦", // Visual indicator for parent-kid relationship
                DisplayText = "Parent acting on behalf of Kid"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting parent-kid visual info: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            throw;
        }
    }

    public async Task<List<ParentKidVisualResponse>> GetGroupParentKidVisualsAsync(Guid groupId)
    {
        try
        {
            var relationships = await _context.GroupMembers
                .Include(m => m.Group)
                .Where(m => m.GroupId == groupId && m.ParentId.HasValue && m.IsActive)
                .ToListAsync();

            var visuals = new List<ParentKidVisualResponse>();

            foreach (var relationship in relationships)
            {
                var visual = await GetParentKidVisualInfoAsync(relationship.UserId, relationship.ParentId.Value, groupId);
                visuals.Add(visual);
            }

            return visuals;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting group parent-kid visuals for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<ParentKidPermissionMatrix> GetParentKidPermissionMatrixAsync(Guid parentId, Guid kidId, Guid groupId)
    {
        try
        {
            var relationship = await GetParentKidRelationshipAsync(parentId, kidId);
            if (relationship == null)
            {
                throw new KeyNotFoundException("Parent-kid relationship not found");
            }

            return new ParentKidPermissionMatrix
            {
                ParentId = parentId,
                KidId = kidId,
                GroupId = groupId,
                CanParentPost = relationship.CanParentPost,
                CanParentVote = relationship.CanParentVote,
                CanParentComment = relationship.CanParentComment,
                CanKidPost = relationship.CanKidPost,
                CanKidVote = relationship.CanKidVote,
                CanKidComment = relationship.CanKidComment,
                CanParentActForKid = await CanParentActForKidAsync(parentId, kidId, groupId),
                CanKidActIndependently = relationship.CanKidPost || relationship.CanKidVote || relationship.CanKidComment,
                OverrideRules = new Dictionary<string, bool>
                {
                    ["post"] = relationship.CanParentPost && !relationship.CanKidPost,
                    ["vote"] = relationship.CanParentVote && !relationship.CanKidVote,
                    ["comment"] = relationship.CanParentComment && !relationship.CanKidComment
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting parent-kid permission matrix: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            throw;
        }
    }

    public async Task<bool> CanKidPerformActionAsync(Guid kidId, Guid groupId, string action)
    {
        return await _permissionService.CanKidPerformActionAsync(kidId, groupId, action);
    }

    public async Task<bool> CanParentOverrideKidActionAsync(Guid parentId, Guid kidId, Guid groupId, string action)
    {
        try
        {
            var relationship = await GetParentKidRelationshipAsync(parentId, kidId);
            if (relationship == null) return false;

            return action switch
            {
                "post" => relationship.CanParentPost && !relationship.CanKidPost,
                "vote" => relationship.CanParentVote && !relationship.CanKidVote,
                "comment" => relationship.CanParentComment && !relationship.CanKidComment,
                _ => false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error checking parent override for kid action: Parent {ParentId} - Kid {KidId}", parentId, kidId);
            return false;
        }
    }

    public async Task<EducationalGroupSettings> GetEducationalGroupSettingsAsync(Guid groupId)
    {
        try
        {
            var group = await _context.Groups
                .Include(g => g.Settings)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group?.GroupType != "educational")
            {
                throw new InvalidOperationException("Group is not an educational group");
            }

            return new EducationalGroupSettings
            {
                GroupId = groupId,
                AllowKidPosts = group.Settings?.AllowKidPosts ?? false,
                AllowKidVoting = group.Settings?.AllowKidVoting ?? false,
                RequireParentApprovalForKidPosts = group.Settings?.RequireParentApprovalForKidPosts ?? true,
                AllowTeacherPosts = group.Settings?.AllowTeacherPosts ?? true,
                AllowParentPosts = group.Settings?.AllowParentPosts ?? true,
                EnableGrokAI = group.Settings?.EnableGrokAI ?? false,
                EnablePerpetualPhotos = group.Settings?.EnablePerpetualPhotos ?? false,
                EnablePaperScanning = group.Settings?.EnablePaperScanning ?? false,
                EnableHomeworkTracking = group.Settings?.EnableHomeworkTracking ?? false,
                EnableFundManagement = group.Settings?.EnableFundManagement ?? false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting educational group settings for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<EducationalGroupSettings> UpdateEducationalGroupSettingsAsync(Guid groupId, Guid userId, UpdateEducationalGroupSettingsRequest request)
    {
        try
        {
            var group = await _context.Groups
                .Include(g => g.Settings)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group?.GroupType != "educational")
            {
                throw new InvalidOperationException("Group is not an educational group");
            }

            // Check if user can update settings
            var canUpdate = await _permissionService.CanUserPerformActionAsync(userId, groupId, "manage_group_settings");
            if (!canUpdate)
            {
                throw new UnauthorizedAccessException("You don't have permission to update group settings");
            }

            // Update settings
            if (group.Settings == null)
            {
                group.Settings = new GroupSettings { GroupId = groupId };
                _context.GroupSettings.Add(group.Settings);
            }

            if (request.AllowKidPosts.HasValue)
                group.Settings.AllowKidPosts = request.AllowKidPosts.Value;
            
            if (request.AllowKidVoting.HasValue)
                group.Settings.AllowKidVoting = request.AllowKidVoting.Value;
            
            if (request.RequireParentApprovalForKidPosts.HasValue)
                group.Settings.RequireParentApprovalForKidPosts = request.RequireParentApprovalForKidPosts.Value;
            
            if (request.AllowTeacherPosts.HasValue)
                group.Settings.AllowTeacherPosts = request.AllowTeacherPosts.Value;
            
            if (request.AllowParentPosts.HasValue)
                group.Settings.AllowParentPosts = request.AllowParentPosts.Value;
            
            if (request.EnableGrokAI.HasValue)
                group.Settings.EnableGrokAI = request.EnableGrokAI.Value;
            
            if (request.EnablePerpetualPhotos.HasValue)
                group.Settings.EnablePerpetualPhotos = request.EnablePerpetualPhotos.Value;
            
            if (request.EnablePaperScanning.HasValue)
                group.Settings.EnablePaperScanning = request.EnablePaperScanning.Value;
            
            if (request.EnableHomeworkTracking.HasValue)
                group.Settings.EnableHomeworkTracking = request.EnableHomeworkTracking.Value;
            
            if (request.EnableFundManagement.HasValue)
                group.Settings.EnableFundManagement = request.EnableFundManagement.Value;

            await _context.SaveChangesAsync();

            _logger.LogInformation("🎓 Updated educational group settings for group {GroupId} by user {UserId}", groupId, userId);

            return await GetEducationalGroupSettingsAsync(groupId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating educational group settings for group {GroupId}", groupId);
            throw;
        }
    }
}
