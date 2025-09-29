using innkt.Groups.Models;
using innkt.Groups.Data;
using innkt.Groups.DTOs;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using System.ComponentModel.DataAnnotations;

namespace innkt.Groups.Services;

public interface ITopicService
{
    // Topic management
    Task<TopicResponse> CreateTopicAsync(Guid userId, CreateTopicRequest request);
    Task<TopicResponse?> GetTopicByIdAsync(Guid topicId, Guid? currentUserId = null);
    Task<List<TopicResponse>> GetGroupTopicsAsync(Guid groupId, Guid? currentUserId = null, Guid? subgroupId = null, string? status = null);
    Task<TopicResponse> UpdateTopicAsync(Guid topicId, Guid userId, UpdateTopicRequest request);
    Task<TopicResponse> UpdateTopicStatusAsync(Guid topicId, Guid userId, UpdateTopicStatusRequest request);
    Task<bool> DeleteTopicAsync(Guid topicId, Guid userId);
    
    // Topic posts
    Task<TopicPostListResponse> GetTopicPostsAsync(Guid topicId, Guid? currentUserId = null, int page = 1, int pageSize = 20);
    Task<TopicPostResponse> CreateTopicPostAsync(Guid topicId, Guid userId, CreateTopicPostRequest request);
    Task<TopicPostResponse?> GetTopicPostByIdAsync(Guid postId, Guid? currentUserId = null);
    Task<bool> PinTopicPostAsync(Guid postId, Guid userId);
    Task<bool> UnpinTopicPostAsync(Guid postId, Guid userId);
    Task<bool> DeleteTopicPostAsync(Guid postId, Guid userId);
    
    // Topic permissions
    Task<bool> CanUserCreateTopicAsync(Guid userId, Guid groupId, Guid? subgroupId = null);
    Task<bool> CanUserPostInTopicAsync(Guid userId, Guid topicId);
    Task<bool> CanUserModerateTopicAsync(Guid userId, Guid topicId);
    
    // Topic analytics
    Task<TopicAnalyticsResponse> GetTopicAnalyticsAsync(Guid topicId, Guid userId);
    Task<List<TopicResponse>> GetTrendingTopicsAsync(Guid groupId, int limit = 10);
    Task<List<TopicResponse>> GetRecentTopicsAsync(Guid groupId, int limit = 10);
    
    // Additional methods for TopicController
    Task<TopicResponse?> GetTopicAsync(Guid groupId, Guid topicId);
    Task<TopicResponse> CreateTopicAsync(Guid groupId, Guid userId, CreateTopicRequest request);
    Task<TopicResponse> UpdateTopicAsync(Guid groupId, Guid topicId, Guid userId, UpdateTopicRequest request);
    Task<bool> DeleteTopicAsync(Guid groupId, Guid topicId, Guid userId);
    Task<bool> ArchiveTopicAsync(Guid groupId, Guid topicId, Guid userId);
    Task<bool> UnarchiveTopicAsync(Guid groupId, Guid topicId, Guid userId);
    Task<bool> PinTopicAsync(Guid groupId, Guid topicId, Guid userId);
    Task<bool> UnpinTopicAsync(Guid groupId, Guid topicId, Guid userId);
    Task<TopicPermissionResponse> SetTopicPermissionsAsync(Guid groupId, Guid topicId, Guid userId, TopicPermissionRequest request);
    Task<TopicPermissionResponse> GetTopicPermissionsAsync(Guid groupId, Guid topicId);
}

public class TopicService : ITopicService
{
    private readonly GroupsDbContext _context;
    private readonly IPermissionService _permissionService;
    private readonly IMapper _mapper;
    private readonly ILogger<TopicService> _logger;

    public TopicService(
        GroupsDbContext context,
        IPermissionService permissionService,
        IMapper mapper,
        ILogger<TopicService> logger)
    {
        _context = context;
        _permissionService = permissionService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<TopicResponse> CreateTopicAsync(Guid userId, CreateTopicRequest request)
    {
        try
        {
            // Check if user can create topics in this group/subgroup
            var canCreate = await _permissionService.CanUserCreateTopicAsync(userId, request.GroupId, request.SubgroupId);
            if (!canCreate)
            {
                throw new UnauthorizedAccessException("You don't have permission to create topics in this group");
            }

            // Validate subgroup if specified
            if (request.SubgroupId.HasValue)
            {
                var subgroup = await _context.Subgroups
                    .FirstOrDefaultAsync(s => s.Id == request.SubgroupId.Value && s.GroupId == request.GroupId);
                
                if (subgroup == null)
                {
                    throw new ArgumentException("Invalid subgroup specified");
                }
            }

            var topic = new Topic
            {
                GroupId = request.GroupId,
                SubgroupId = request.SubgroupId,
                Name = request.Name,
                Description = request.Description,
                Status = "active",
                IsAnnouncementOnly = request.IsAnnouncementOnly,
                AllowMemberPosts = request.AllowMemberPosts,
                AllowKidPosts = request.AllowKidPosts,
                AllowParentPosts = request.AllowParentPosts,
                AllowRolePosts = request.AllowRolePosts,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();

            _logger.LogInformation("📝 Created topic '{TopicName}' in group {GroupId} by user {UserId}", 
                topic.Name, topic.GroupId, userId);

            return await GetTopicByIdAsync(topic.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error creating topic for user {UserId}", userId);
            throw;
        }
    }

    public async Task<TopicResponse?> GetTopicByIdAsync(Guid topicId, Guid? currentUserId = null)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .Include(t => t.Subgroup)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null) return null;

            // Check if user can access this topic
            if (currentUserId.HasValue)
            {
                var canAccess = await CanUserAccessTopicAsync(currentUserId.Value, topic);
                if (!canAccess) return null;
            }

            var response = _mapper.Map<TopicResponse>(topic);
            
            // Add subgroup info if available
            if (topic.Subgroup != null)
            {
                response.Subgroup = _mapper.Map<SubgroupResponse>(topic.Subgroup);
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<List<TopicResponse>> GetGroupTopicsAsync(Guid groupId, Guid? currentUserId = null, Guid? subgroupId = null, string? status = null)
    {
        try
        {
            var query = _context.Topics
                .Include(t => t.Group)
                .Include(t => t.Subgroup)
                .Where(t => t.GroupId == groupId);

            // Filter by subgroup if specified
            if (subgroupId.HasValue)
            {
                query = query.Where(t => t.SubgroupId == subgroupId.Value);
            }

            // Filter by status if specified
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(t => t.Status == status);
            }

            var topics = await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var responses = new List<TopicResponse>();

            foreach (var topic in topics)
            {
                // Check if user can access this topic
                if (currentUserId.HasValue)
                {
                    var canAccess = await CanUserAccessTopicAsync(currentUserId.Value, topic);
                    if (!canAccess) continue;
                }

                var response = _mapper.Map<TopicResponse>(topic);
                
                if (topic.Subgroup != null)
                {
                    response.Subgroup = _mapper.Map<SubgroupResponse>(topic.Subgroup);
                }

                responses.Add(response);
            }

            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topics for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<TopicResponse> UpdateTopicAsync(Guid topicId, Guid userId, UpdateTopicRequest request)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            // Check if user can moderate this topic
            var canModerate = await _permissionService.CanUserModerateTopicAsync(userId, topicId);
            if (!canModerate)
            {
                throw new UnauthorizedAccessException("You don't have permission to update this topic");
            }

            // Update topic properties
            if (!string.IsNullOrEmpty(request.Name))
                topic.Name = request.Name;
            
            if (request.Description != null)
                topic.Description = request.Description;
            
            if (request.IsAnnouncementOnly.HasValue)
                topic.IsAnnouncementOnly = request.IsAnnouncementOnly.Value;
            
            if (request.AllowMemberPosts.HasValue)
                topic.AllowMemberPosts = request.AllowMemberPosts.Value;
            
            if (request.AllowKidPosts.HasValue)
                topic.AllowKidPosts = request.AllowKidPosts.Value;
            
            if (request.AllowParentPosts.HasValue)
                topic.AllowParentPosts = request.AllowParentPosts.Value;
            
            if (request.AllowRolePosts.HasValue)
                topic.AllowRolePosts = request.AllowRolePosts.Value;

            topic.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("📝 Updated topic '{TopicName}' by user {UserId}", topic.Name, userId);

            return await GetTopicByIdAsync(topic.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<TopicResponse> UpdateTopicStatusAsync(Guid topicId, Guid userId, UpdateTopicStatusRequest request)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            // Check if user can moderate this topic
            var canModerate = await _permissionService.CanUserModerateTopicAsync(userId, topicId);
            if (!canModerate)
            {
                throw new UnauthorizedAccessException("You don't have permission to update this topic status");
            }

            // Update topic status
            topic.Status = request.Status;
            topic.UpdatedAt = DateTime.UtcNow;

            // Set status-specific timestamps
            switch (request.Status)
            {
                case "paused":
                    topic.PausedAt = DateTime.UtcNow;
                    break;
                case "archived":
                    topic.ArchivedAt = DateTime.UtcNow;
                    break;
                case "active":
                    topic.PausedAt = null;
                    topic.ArchivedAt = null;
                    break;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("📝 Updated topic '{TopicName}' status to '{Status}' by user {UserId}", 
                topic.Name, request.Status, userId);

            return await GetTopicByIdAsync(topic.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating topic status {TopicId}", topicId);
            throw;
        }
    }

    public async Task<bool> DeleteTopicAsync(Guid topicId, Guid userId)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null) return false;

            // Check if user can moderate this topic
            var canModerate = await _permissionService.CanUserModerateTopicAsync(userId, topicId);
            if (!canModerate)
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this topic");
            }

            _context.Topics.Remove(topic);
            await _context.SaveChangesAsync();

            _logger.LogInformation("🗑️ Deleted topic '{TopicName}' by user {UserId}", topic.Name, userId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error deleting topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<TopicPostListResponse> GetTopicPostsAsync(Guid topicId, Guid? currentUserId = null, int page = 1, int pageSize = 20)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            // Check if user can access this topic
            if (currentUserId.HasValue)
            {
                var canAccess = await CanUserAccessTopicAsync(currentUserId.Value, topic);
                if (!canAccess)
                {
                    throw new UnauthorizedAccessException("You don't have permission to access this topic");
                }
            }

            var query = _context.TopicPosts
                .Include(tp => tp.Topic)
                .Where(tp => tp.TopicId == topicId);

            var totalCount = await query.CountAsync();
            var posts = await query
                .OrderByDescending(tp => tp.IsPinned)
                .ThenByDescending(tp => tp.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var responses = new List<TopicPostResponse>();
            foreach (var post in posts)
            {
                var response = _mapper.Map<TopicPostResponse>(post);
                responses.Add(response);
            }

            return new TopicPostListResponse
            {
                Posts = responses,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                HasNextPage = (page * pageSize) < totalCount,
                HasPreviousPage = page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting posts for topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<TopicPostResponse> CreateTopicPostAsync(Guid topicId, Guid userId, CreateTopicPostRequest request)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            // Check if user can post in this topic
            var canPost = await _permissionService.CanUserPostInTopicAsync(userId, topicId);
            if (!canPost)
            {
                throw new UnauthorizedAccessException("You don't have permission to post in this topic");
            }

            // Create a post in the Social service (this would be a call to Social service)
            // For now, we'll create a mock post ID
            var postId = Guid.NewGuid();

            var topicPost = new TopicPost
            {
                TopicId = topicId,
                PostId = postId,
                UserId = userId,
                KidId = request.KidId,
                IsParentPostingForKid = request.KidId.HasValue,
                Content = request.Content,
                MediaUrls = request.MediaUrls?.ToArray() ?? Array.Empty<string>(),
                Hashtags = request.Hashtags?.ToArray() ?? Array.Empty<string>(),
                Mentions = request.Mentions?.ToArray() ?? Array.Empty<string>(),
                Location = request.Location,
                IsAnnouncement = request.IsAnnouncement,
                CreatedAt = DateTime.UtcNow
            };

            _context.TopicPosts.Add(topicPost);
            
            // Update topic post count
            topic.PostsCount++;
            topic.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("📝 Created post in topic '{TopicName}' by user {UserId}", topic.Name, userId);

            return await GetTopicPostByIdAsync(topicPost.Id, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error creating post in topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<TopicPostResponse?> GetTopicPostByIdAsync(Guid postId, Guid? currentUserId = null)
    {
        try
        {
            var topicPost = await _context.TopicPosts
                .Include(tp => tp.Topic)
                .FirstOrDefaultAsync(tp => tp.Id == postId);

            if (topicPost == null) return null;

            // Check if user can access this topic
            if (currentUserId.HasValue)
            {
                var canAccess = await CanUserAccessTopicAsync(currentUserId.Value, topicPost.Topic);
                if (!canAccess) return null;
            }

            return _mapper.Map<TopicPostResponse>(topicPost);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic post {PostId}", postId);
            throw;
        }
    }

    public async Task<bool> PinTopicPostAsync(Guid postId, Guid userId)
    {
        try
        {
            var topicPost = await _context.TopicPosts
                .Include(tp => tp.Topic)
                .FirstOrDefaultAsync(tp => tp.Id == postId);

            if (topicPost == null) return false;

            // Check if user can moderate this topic
            var canModerate = await _permissionService.CanUserModerateTopicAsync(userId, topicPost.TopicId);
            if (!canModerate)
            {
                throw new UnauthorizedAccessException("You don't have permission to pin posts in this topic");
            }

            topicPost.IsPinned = true;
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error pinning topic post {PostId}", postId);
            throw;
        }
    }

    public async Task<bool> UnpinTopicPostAsync(Guid postId, Guid userId)
    {
        try
        {
            var topicPost = await _context.TopicPosts
                .Include(tp => tp.Topic)
                .FirstOrDefaultAsync(tp => tp.Id == postId);

            if (topicPost == null) return false;

            // Check if user can moderate this topic
            var canModerate = await _permissionService.CanUserModerateTopicAsync(userId, topicPost.TopicId);
            if (!canModerate)
            {
                throw new UnauthorizedAccessException("You don't have permission to unpin posts in this topic");
            }

            topicPost.IsPinned = false;
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error unpinning topic post {PostId}", postId);
            throw;
        }
    }

    public async Task<bool> DeleteTopicPostAsync(Guid postId, Guid userId)
    {
        try
        {
            var topicPost = await _context.TopicPosts
                .Include(tp => tp.Topic)
                .FirstOrDefaultAsync(tp => tp.Id == postId);

            if (topicPost == null) return false;

            // Check if user can delete this post (author or moderator)
            var canDelete = topicPost.UserId == userId || 
                           await _permissionService.CanUserModerateTopicAsync(userId, topicPost.TopicId);
            
            if (!canDelete)
            {
                throw new UnauthorizedAccessException("You don't have permission to delete this post");
            }

            _context.TopicPosts.Remove(topicPost);
            
            // Update topic post count
            var topic = await _context.Topics.FindAsync(topicPost.TopicId);
            if (topic != null)
            {
                topic.PostsCount = Math.Max(0, topic.PostsCount - 1);
                topic.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error deleting topic post {PostId}", postId);
            throw;
        }
    }

    public async Task<bool> CanUserCreateTopicAsync(Guid userId, Guid groupId, Guid? subgroupId = null)
    {
        return await _permissionService.CanUserCreateTopicAsync(userId, groupId, subgroupId);
    }

    public async Task<bool> CanUserPostInTopicAsync(Guid userId, Guid topicId)
    {
        return await _permissionService.CanUserPostInTopicAsync(userId, topicId);
    }

    public async Task<bool> CanUserModerateTopicAsync(Guid userId, Guid topicId)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null) return false;

            return await _permissionService.CanUserPerformActionAsync(userId, topic.GroupId, "moderate_content");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error checking topic moderation permission for user {UserId}", userId);
            return false;
        }
    }

    public async Task<TopicAnalyticsResponse> GetTopicAnalyticsAsync(Guid topicId, Guid userId)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .FirstOrDefaultAsync(t => t.Id == topicId);

            if (topic == null)
            {
                throw new KeyNotFoundException("Topic not found");
            }

            // Check if user can access analytics
            var canAccess = await _permissionService.CanUserPerformActionAsync(userId, topic.GroupId, "view_analytics");
            if (!canAccess)
            {
                throw new UnauthorizedAccessException("You don't have permission to view topic analytics");
            }

            var postsCount = await _context.TopicPosts
                .CountAsync(tp => tp.TopicId == topicId);

            var recentPosts = await _context.TopicPosts
                .Where(tp => tp.TopicId == topicId)
                .OrderByDescending(tp => tp.CreatedAt)
                .Take(5)
                .ToListAsync();

            return new TopicAnalyticsResponse
            {
                TopicId = topicId,
                TopicName = topic.Name,
                PostsCount = postsCount,
                RecentPosts = recentPosts.Select(p => _mapper.Map<TopicPostResponse>(p)).ToList(),
                CreatedAt = topic.CreatedAt,
                LastActivity = recentPosts.FirstOrDefault()?.CreatedAt ?? topic.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic analytics for topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<List<TopicResponse>> GetTrendingTopicsAsync(Guid groupId, int limit = 10)
    {
        try
        {
            var topics = await _context.Topics
                .Include(t => t.Group)
                .Include(t => t.Subgroup)
                .Where(t => t.GroupId == groupId && t.Status == "active")
                .OrderByDescending(t => t.PostsCount)
                .ThenByDescending(t => t.UpdatedAt)
                .Take(limit)
                .ToListAsync();

            var responses = new List<TopicResponse>();
            foreach (var topic in topics)
            {
                var response = _mapper.Map<TopicResponse>(topic);
                if (topic.Subgroup != null)
                {
                    response.Subgroup = _mapper.Map<SubgroupResponse>(topic.Subgroup);
                }
                responses.Add(response);
            }

            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting trending topics for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<List<TopicResponse>> GetRecentTopicsAsync(Guid groupId, int limit = 10)
    {
        try
        {
            var topics = await _context.Topics
                .Include(t => t.Group)
                .Include(t => t.Subgroup)
                .Where(t => t.GroupId == groupId && t.Status == "active")
                .OrderByDescending(t => t.UpdatedAt)
                .Take(limit)
                .ToListAsync();

            var responses = new List<TopicResponse>();
            foreach (var topic in topics)
            {
                var response = _mapper.Map<TopicResponse>(topic);
                if (topic.Subgroup != null)
                {
                    response.Subgroup = _mapper.Map<SubgroupResponse>(topic.Subgroup);
                }
                responses.Add(response);
            }

            return responses;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting recent topics for group {GroupId}", groupId);
            throw;
        }
    }

    private async Task<bool> CanUserAccessTopicAsync(Guid userId, Topic topic)
    {
        try
        {
            // Check if user is member of the group
            var isGroupMember = await _context.GroupMembers
                .AnyAsync(m => m.GroupId == topic.GroupId && m.UserId == userId && m.IsActive);

            if (!isGroupMember) return false;

            // If topic is in a subgroup, check subgroup access
            if (topic.SubgroupId.HasValue)
            {
                return await _permissionService.CanUserAccessSubgroupAsync(userId, topic.SubgroupId.Value);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error checking topic access for user {UserId}", userId);
            return false;
        }
    }
    
    // Additional methods for TopicController
    public async Task<TopicResponse?> GetTopicAsync(Guid groupId, Guid topicId)
    {
        try
        {
            var topic = await _context.Topics
                .Include(t => t.Group)
                .Include(t => t.Subgroup)
                .FirstOrDefaultAsync(t => t.Id == topicId && t.GroupId == groupId);

            if (topic == null) return null;

            var response = _mapper.Map<TopicResponse>(topic);
            if (topic.Subgroup != null)
            {
                response.Subgroup = _mapper.Map<SubgroupResponse>(topic.Subgroup);
            }

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic {TopicId} for group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<TopicResponse> CreateTopicAsync(Guid groupId, Guid userId, CreateTopicRequest request)
    {
        try
        {
            var topic = new Topic
            {
                Id = Guid.NewGuid(),
                GroupId = groupId,
                SubgroupId = request.SubgroupId,
                Name = request.Name,
                Description = request.Description,
                Status = "active",
                AllowMemberPosts = request.AllowMemberPosts,
                AllowKidPosts = request.AllowKidPosts,
                AllowParentPosts = request.AllowParentPosts,
                AllowRolePosts = request.AllowRolePosts,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();

            var response = _mapper.Map<TopicResponse>(topic);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error creating topic for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<TopicResponse> UpdateTopicAsync(Guid groupId, Guid topicId, Guid userId, UpdateTopicRequest request)
    {
        try
        {
            var topic = await _context.Topics
                .FirstOrDefaultAsync(t => t.Id == topicId && t.GroupId == groupId);

            if (topic == null)
                throw new ArgumentException("Topic not found");

            topic.Name = request.Name;
            topic.Description = request.Description;
            topic.AllowMemberPosts = request.AllowMemberPosts ?? topic.AllowMemberPosts;
            topic.AllowKidPosts = request.AllowKidPosts ?? topic.AllowKidPosts;
            topic.AllowParentPosts = request.AllowParentPosts ?? topic.AllowParentPosts;
            topic.AllowRolePosts = request.AllowRolePosts ?? topic.AllowRolePosts;
            topic.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = _mapper.Map<TopicResponse>(topic);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error updating topic {TopicId} for group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<bool> DeleteTopicAsync(Guid groupId, Guid topicId, Guid userId)
    {
        try
        {
            var topic = await _context.Topics
                .FirstOrDefaultAsync(t => t.Id == topicId && t.GroupId == groupId);

            if (topic == null) return false;

            _context.Topics.Remove(topic);
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error deleting topic {TopicId} for group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<bool> ArchiveTopicAsync(Guid groupId, Guid topicId, Guid userId)
    {
        try
        {
            var topic = await _context.Topics
                .FirstOrDefaultAsync(t => t.Id == topicId && t.GroupId == groupId);

            if (topic == null) return false;

            topic.Status = "archived";
            topic.ArchivedAt = DateTime.UtcNow;
            topic.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error archiving topic {TopicId} for group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<bool> UnarchiveTopicAsync(Guid groupId, Guid topicId, Guid userId)
    {
        try
        {
            var topic = await _context.Topics
                .FirstOrDefaultAsync(t => t.Id == topicId && t.GroupId == groupId);

            if (topic == null) return false;

            topic.Status = "active";
            topic.ArchivedAt = null;
            topic.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error unarchiving topic {TopicId} for group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<bool> PinTopicAsync(Guid groupId, Guid topicId, Guid userId)
    {
        try
        {
            var topic = await _context.Topics
                .FirstOrDefaultAsync(t => t.Id == topicId && t.GroupId == groupId);

            if (topic == null) return false;

            // Implementation for pinning topic
            topic.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error pinning topic {TopicId} for group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<bool> UnpinTopicAsync(Guid groupId, Guid topicId, Guid userId)
    {
        try
        {
            var topic = await _context.Topics
                .FirstOrDefaultAsync(t => t.Id == topicId && t.GroupId == groupId);

            if (topic == null) return false;

            // Implementation for unpinning topic
            topic.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error unpinning topic {TopicId} for group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<TopicPermissionResponse> SetTopicPermissionsAsync(Guid groupId, Guid topicId, Guid userId, TopicPermissionRequest request)
    {
        try
        {
            // Implementation for setting topic permissions
            var response = new TopicPermissionResponse
            {
                Id = Guid.NewGuid(),
                TopicId = topicId,
                RoleId = request.RoleId,
                RoleName = "Role", // Get from role service
                CanRead = request.CanRead,
                CanWrite = request.CanWrite,
                CanVote = request.CanVote,
                CanManage = request.CanManage
            };

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error setting topic permissions for topic {TopicId} in group {GroupId}", topicId, groupId);
            throw;
        }
    }

    public async Task<TopicPermissionResponse> GetTopicPermissionsAsync(Guid groupId, Guid topicId)
    {
        try
        {
            // Implementation for getting topic permissions
            var response = new TopicPermissionResponse
            {
                Id = Guid.NewGuid(),
                TopicId = topicId,
                RoleId = Guid.NewGuid(),
                RoleName = "Default Role",
                CanRead = true,
                CanWrite = false,
                CanVote = false,
                CanManage = false
            };

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic permissions for topic {TopicId} in group {GroupId}", topicId, groupId);
            throw;
        }
    }
}
