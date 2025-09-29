using innkt.Groups.Models;
using innkt.Groups.Data;
using innkt.Groups.DTOs;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace innkt.Groups.Services;

public interface ITopicAnalyticsService
{
    Task<TopicAnalyticsResponse> GetTopicAnalyticsAsync(Guid topicId, Guid userId);
    Task<GroupAnalyticsResponse> GetGroupAnalyticsAsync(Guid groupId, Guid userId);
    Task<List<TopicTrendResponse>> GetTopicTrendsAsync(Guid groupId, DateTime fromDate, DateTime toDate);
    Task<List<TopicEngagementResponse>> GetTopicEngagementAsync(Guid groupId, int limit = 10);
    Task<TopicPerformanceResponse> GetTopicPerformanceAsync(Guid topicId, Guid userId);
    Task<List<TopicResponse>> GetTrendingTopicsAsync(Guid groupId, int limit = 10);
    Task<List<TopicResponse>> GetRecentTopicsAsync(Guid groupId, int limit = 10);
    Task<List<TopicResponse>> GetMostActiveTopicsAsync(Guid groupId, int limit = 10);
}

public class TopicAnalyticsService : ITopicAnalyticsService
{
    private readonly GroupsDbContext _context;
    private readonly IPermissionService _permissionService;
    private readonly IMapper _mapper;
    private readonly ILogger<TopicAnalyticsService> _logger;

    public TopicAnalyticsService(
        GroupsDbContext context,
        IPermissionService permissionService,
        IMapper mapper,
        ILogger<TopicAnalyticsService> logger)
    {
        _context = context;
        _permissionService = permissionService;
        _mapper = mapper;
        _logger = logger;
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

            var lastActivity = recentPosts.FirstOrDefault()?.CreatedAt ?? topic.CreatedAt;

            return new TopicAnalyticsResponse
            {
                TopicId = topicId,
                TopicName = topic.Name,
                PostsCount = postsCount,
                RecentPosts = recentPosts.Select(p => _mapper.Map<TopicPostResponse>(p)).ToList(),
                CreatedAt = topic.CreatedAt,
                LastActivity = lastActivity,
                Status = topic.Status,
                IsAnnouncementOnly = topic.IsAnnouncementOnly,
                AllowMemberPosts = topic.AllowMemberPosts,
                AllowKidPosts = topic.AllowKidPosts,
                AllowParentPosts = topic.AllowParentPosts,
                AllowRolePosts = topic.AllowRolePosts
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic analytics for topic {TopicId}", topicId);
            throw;
        }
    }

    public async Task<GroupAnalyticsResponse> GetGroupAnalyticsAsync(Guid groupId, Guid userId)
    {
        try
        {
            var group = await _context.Groups
                .Include(g => g.Topics)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                throw new KeyNotFoundException("Group not found");
            }

            // Check if user can access analytics
            var canAccess = await _permissionService.CanUserPerformActionAsync(userId, groupId, "view_analytics");
            if (!canAccess)
            {
                throw new UnauthorizedAccessException("You don't have permission to view group analytics");
            }

            var totalTopics = await _context.Topics
                .CountAsync(t => t.GroupId == groupId);

            var activeTopics = await _context.Topics
                .CountAsync(t => t.GroupId == groupId && t.Status == "active");

            var totalPosts = await _context.TopicPosts
                .CountAsync(tp => tp.Topic.GroupId == groupId);

            var recentTopics = await _context.Topics
                .Where(t => t.GroupId == groupId)
                .OrderByDescending(t => t.UpdatedAt)
                .Take(5)
                .ToListAsync();

            var mostActiveTopics = await _context.Topics
                .Where(t => t.GroupId == groupId)
                .OrderByDescending(t => t.PostsCount)
                .Take(5)
                .ToListAsync();

            return new GroupAnalyticsResponse
            {
                GroupId = groupId,
                GroupName = group.Name,
                TotalTopics = totalTopics,
                ActiveTopics = activeTopics,
                TotalPosts = totalPosts,
                RecentTopics = recentTopics.Select(t => _mapper.Map<TopicResponse>(t)).ToList(),
                MostActiveTopics = mostActiveTopics.Select(t => _mapper.Map<TopicResponse>(t)).ToList(),
                CreatedAt = group.CreatedAt,
                LastActivity = recentTopics.FirstOrDefault()?.UpdatedAt ?? group.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting group analytics for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<List<TopicTrendResponse>> GetTopicTrendsAsync(Guid groupId, DateTime fromDate, DateTime toDate)
    {
        try
        {
            var trends = await _context.TopicPosts
                .Where(tp => tp.Topic.GroupId == groupId && 
                            tp.CreatedAt >= fromDate && 
                            tp.CreatedAt <= toDate)
                .GroupBy(tp => tp.CreatedAt.Date)
                .Select(g => new TopicTrendResponse
                {
                    Date = g.Key,
                    PostsCount = g.Count(),
                    TopicsCount = g.Select(tp => tp.TopicId).Distinct().Count()
                })
                .OrderBy(t => t.Date)
                .ToListAsync();

            return trends;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic trends for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<List<TopicEngagementResponse>> GetTopicEngagementAsync(Guid groupId, int limit = 10)
    {
        try
        {
            var engagement = await _context.Topics
                .Where(t => t.GroupId == groupId)
                .Select(t => new TopicEngagementResponse
                {
                    TopicId = t.Id,
                    TopicName = t.Name,
                    PostsCount = t.PostsCount,
                    Status = t.Status,
                    CreatedAt = t.CreatedAt,
                    LastActivity = t.UpdatedAt,
                    EngagementScore = t.PostsCount * 0.7 + (DateTime.UtcNow - t.UpdatedAt).TotalDays * 0.3
                })
                .OrderByDescending(e => e.EngagementScore)
                .Take(limit)
                .ToListAsync();

            return engagement;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic engagement for group {GroupId}", groupId);
            throw;
        }
    }

    public async Task<TopicPerformanceResponse> GetTopicPerformanceAsync(Guid topicId, Guid userId)
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
                throw new UnauthorizedAccessException("You don't have permission to view topic performance");
            }

            var postsCount = await _context.TopicPosts
                .CountAsync(tp => tp.TopicId == topicId);

            var recentPosts = await _context.TopicPosts
                .Where(tp => tp.TopicId == topicId)
                .OrderByDescending(tp => tp.CreatedAt)
                .Take(10)
                .ToListAsync();

            var averagePostsPerDay = postsCount / Math.Max(1, (DateTime.UtcNow - topic.CreatedAt).TotalDays);

            var performance = new TopicPerformanceResponse
            {
                TopicId = topicId,
                TopicName = topic.Name,
                PostsCount = postsCount,
                AveragePostsPerDay = averagePostsPerDay,
                Status = topic.Status,
                CreatedAt = topic.CreatedAt,
                LastActivity = recentPosts.FirstOrDefault()?.CreatedAt ?? topic.CreatedAt,
                RecentPosts = recentPosts.Select(p => _mapper.Map<TopicPostResponse>(p)).ToList(),
                PerformanceScore = CalculatePerformanceScore(topic, postsCount, averagePostsPerDay)
            };

            return performance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting topic performance for topic {TopicId}", topicId);
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

    public async Task<List<TopicResponse>> GetMostActiveTopicsAsync(Guid groupId, int limit = 10)
    {
        try
        {
            var topics = await _context.Topics
                .Include(t => t.Group)
                .Include(t => t.Subgroup)
                .Where(t => t.GroupId == groupId && t.Status == "active")
                .OrderByDescending(t => t.PostsCount)
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
            _logger.LogError(ex, "❌ Error getting most active topics for group {GroupId}", groupId);
            throw;
        }
    }

    private double CalculatePerformanceScore(Topic topic, int postsCount, double averagePostsPerDay)
    {
        var daysSinceCreation = (DateTime.UtcNow - topic.CreatedAt).TotalDays;
        var recencyScore = Math.Max(0, 1 - (DateTime.UtcNow - topic.UpdatedAt).TotalDays / 30);
        var activityScore = Math.Min(1, averagePostsPerDay / 10);
        var engagementScore = Math.Min(1, postsCount / 100);

        return (recencyScore * 0.4 + activityScore * 0.3 + engagementScore * 0.3) * 100;
    }
}
