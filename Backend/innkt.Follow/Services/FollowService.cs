using Microsoft.EntityFrameworkCore;
using innkt.Follow.Data;
using innkt.Follow.DTOs;
using innkt.Follow.Models;
using AutoMapper;

namespace innkt.Follow.Services;

public class FollowService : IFollowService
{
    private readonly FollowDbContext _context;
    private readonly ILogger<FollowService> _logger;
    private readonly IMapper _mapper;

    public FollowService(FollowDbContext context, ILogger<FollowService> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<bool> FollowUserAsync(Guid followerId, Guid followingId, string? message = null)
    {
        if (followerId == followingId)
            return false; // Cannot follow yourself

        var existingFollow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);

        if (existingFollow != null)
        {
            if (existingFollow.IsActive)
                return false; // Already following
            else
            {
                // Reactivate the follow
                existingFollow.IsActive = true;
                existingFollow.CreatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return true;
            }
        }

        var follow = new Follow
        {
            FollowerId = followerId,
            FollowingId = followingId,
            Notes = message
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();

        // Update follow stats
        await UpdateFollowStatsAsync(followerId);
        await UpdateFollowStatsAsync(followingId);

        _logger.LogInformation("User {FollowerId} started following user {FollowingId}", followerId, followingId);
        return true;
    }

    public async Task<bool> UnfollowUserAsync(Guid followerId, Guid followingId)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);

        if (follow == null || !follow.IsActive)
            return false; // Not following

        follow.IsActive = false;
        await _context.SaveChangesAsync();

        // Update follow stats
        await UpdateFollowStatsAsync(followerId);
        await UpdateFollowStatsAsync(followingId);

        _logger.LogInformation("User {FollowerId} unfollowed user {FollowingId}", followerId, followingId);
        return true;
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followingId)
    {
        return await _context.Follows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId && f.IsActive);
    }

    public async Task<bool> IsFollowedByAsync(Guid userId, Guid followerId)
    {
        return await _context.Follows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == userId && f.IsActive);
    }

    public async Task<FollowRequestResponse> SendFollowRequestAsync(Guid requesterId, Guid targetUserId, string? message = null)
    {
        // Implementation would go here for private account follow requests
        return new FollowRequestResponse();
    }

    public async Task<FollowRequestResponse?> GetFollowRequestAsync(Guid requestId)
    {
        // Implementation would go here
        return null;
    }

    public async Task<FollowRequestListResponse> GetFollowRequestsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        // Implementation would go here
        return new FollowRequestListResponse();
    }

    public async Task<FollowRequestListResponse> GetSentFollowRequestsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        // Implementation would go here
        return new FollowRequestListResponse();
    }

    public async Task<bool> RespondToFollowRequestAsync(Guid requestId, Guid userId, string action)
    {
        // Implementation would go here
        return false;
    }

    public async Task<bool> CancelFollowRequestAsync(Guid requestId, Guid userId)
    {
        // Implementation would go here
        return false;
    }

    public async Task<FollowListResponse> GetFollowersAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var query = _context.Follows
            .Where(f => f.FollowingId == userId && f.IsActive)
            .OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync();
        var follows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<FollowResponse>();
        foreach (var follow in follows)
        {
            var response = _mapper.Map<FollowResponse>(follow);
            // TODO: Populate Follower info from Officer service
            responses.Add(response);
        }

        return new FollowListResponse
        {
            Follows = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<FollowListResponse> GetFollowingAsync(Guid userId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        var query = _context.Follows
            .Where(f => f.FollowerId == userId && f.IsActive)
            .OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync();
        var follows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<FollowResponse>();
        foreach (var follow in follows)
        {
            var response = _mapper.Map<FollowResponse>(follow);
            // TODO: Populate Following info from Officer service
            responses.Add(response);
        }

        return new FollowListResponse
        {
            Follows = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<FollowListResponse> GetMutualFollowsAsync(Guid userId1, Guid userId2, int page = 1, int pageSize = 20)
    {
        // Get users that both userId1 and userId2 follow
        var user1Following = await _context.Follows
            .Where(f => f.FollowerId == userId1 && f.IsActive)
            .Select(f => f.FollowingId)
            .ToListAsync();

        var user2Following = await _context.Follows
            .Where(f => f.FollowerId == userId2 && f.IsActive)
            .Select(f => f.FollowingId)
            .ToListAsync();

        var mutualUserIds = user1Following.Intersect(user2Following).ToList();

        var query = _context.Follows
            .Where(f => f.FollowerId == userId1 && mutualUserIds.Contains(f.FollowingId) && f.IsActive)
            .OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync();
        var follows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var responses = new List<FollowResponse>();
        foreach (var follow in follows)
        {
            var response = _mapper.Map<FollowResponse>(follow);
            // TODO: Populate Following info from Officer service
            responses.Add(response);
        }

        return new FollowListResponse
        {
            Follows = responses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasNextPage = page * pageSize < totalCount,
            HasPreviousPage = page > 1
        };
    }

    public async Task<FollowStatsResponse> GetFollowStatsAsync(Guid userId)
    {
        var stats = await _context.FollowStats
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (stats == null)
        {
            // Create new stats record
            stats = new FollowStats
            {
                UserId = userId,
                FollowersCount = await GetFollowersCountAsync(userId),
                FollowingCount = await GetFollowingCountAsync(userId)
            };
            _context.FollowStats.Add(stats);
            await _context.SaveChangesAsync();
        }

        return _mapper.Map<FollowStatsResponse>(stats);
    }

    public async Task<int> GetFollowersCountAsync(Guid userId)
    {
        return await _context.Follows
            .CountAsync(f => f.FollowingId == userId && f.IsActive);
    }

    public async Task<int> GetFollowingCountAsync(Guid userId)
    {
        return await _context.Follows
            .CountAsync(f => f.FollowerId == userId && f.IsActive);
    }

    public async Task<int> GetMutualFollowsCountAsync(Guid userId1, Guid userId2)
    {
        var user1Following = await _context.Follows
            .Where(f => f.FollowerId == userId1 && f.IsActive)
            .Select(f => f.FollowingId)
            .ToListAsync();

        var user2Following = await _context.Follows
            .Where(f => f.FollowerId == userId2 && f.IsActive)
            .Select(f => f.FollowingId)
            .ToListAsync();

        return user1Following.Intersect(user2Following).Count();
    }

    // Placeholder implementations for other methods
    public async Task<bool> MuteUserAsync(Guid userId, Guid targetUserId, bool mute = true)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == userId && f.FollowingId == targetUserId);

        if (follow == null)
            return false;

        follow.IsMuted = mute;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> BlockUserAsync(Guid userId, Guid targetUserId, bool block = true)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == userId && f.FollowingId == targetUserId);

        if (follow == null)
            return false;

        follow.IsBlocked = block;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateFollowNotesAsync(Guid userId, Guid targetUserId, string? notes)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == userId && f.FollowingId == targetUserId);

        if (follow == null)
            return false;

        follow.Notes = notes;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsUserMutedAsync(Guid userId, Guid targetUserId)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == userId && f.FollowingId == targetUserId);

        return follow?.IsMuted ?? false;
    }

    public async Task<bool> IsUserBlockedAsync(Guid userId, Guid targetUserId)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == userId && f.FollowingId == targetUserId);

        return follow?.IsBlocked ?? false;
    }

    // Placeholder implementations for remaining methods
    public async Task<FollowSuggestionListResponse> GetFollowSuggestionsAsync(Guid userId, GetFollowSuggestionsRequest request)
    {
        return new FollowSuggestionListResponse();
    }

    public async Task<bool> DismissSuggestionAsync(Guid suggestionId, Guid userId)
    {
        return false;
    }

    public async Task<bool> GenerateFollowSuggestionsAsync(Guid userId)
    {
        return false;
    }

    public async Task<FollowNotificationListResponse> GetFollowNotificationsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        return new FollowNotificationListResponse();
    }

    public async Task<bool> MarkNotificationAsReadAsync(Guid notificationId, Guid userId)
    {
        return false;
    }

    public async Task<bool> MarkAllNotificationsAsReadAsync(Guid userId)
    {
        return false;
    }

    public async Task<int> GetUnreadNotificationCountAsync(Guid userId)
    {
        return 0;
    }

    public async Task<FollowTimelineResponse> GetFollowTimelineAsync(Guid userId, GetFollowTimelineRequest request)
    {
        return new FollowTimelineResponse();
    }

    public async Task<Dictionary<Guid, bool>> GetFollowingStatusAsync(Guid userId, Guid[] targetUserIds)
    {
        return new Dictionary<Guid, bool>();
    }

    public async Task<Dictionary<Guid, int>> GetFollowersCountsAsync(Guid[] userIds)
    {
        return new Dictionary<Guid, int>();
    }

    public async Task<Dictionary<Guid, int>> GetFollowingCountsAsync(Guid[] userIds)
    {
        return new Dictionary<Guid, int>();
    }

    public async Task<FollowListResponse> SearchFollowersAsync(Guid userId, string query, int page = 1, int pageSize = 20)
    {
        return new FollowListResponse();
    }

    public async Task<FollowListResponse> SearchFollowingAsync(Guid userId, string query, int page = 1, int pageSize = 20)
    {
        return new FollowListResponse();
    }

    public async Task<Dictionary<string, object>> GetFollowAnalyticsAsync(Guid userId, DateTime? since = null, DateTime? until = null)
    {
        return new Dictionary<string, object>();
    }

    public async Task<List<FollowTimelineItem>> GetRecentFollowActivityAsync(Guid userId, int count = 10)
    {
        return new List<FollowTimelineItem>();
    }

    public async Task<bool> CleanupExpiredRequestsAsync()
    {
        return false;
    }

    public async Task<bool> UpdateFollowStatsAsync(Guid userId)
    {
        var stats = await _context.FollowStats
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (stats == null)
        {
            stats = new FollowStats { UserId = userId };
            _context.FollowStats.Add(stats);
        }

        stats.FollowersCount = await GetFollowersCountAsync(userId);
        stats.FollowingCount = await GetFollowingCountAsync(userId);
        stats.LastUpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RebuildFollowStatsAsync()
    {
        var userIds = await _context.Follows
            .Select(f => f.FollowerId)
            .Union(_context.Follows.Select(f => f.FollowingId))
            .Distinct()
            .ToListAsync();

        foreach (var userId in userIds)
        {
            await UpdateFollowStatsAsync(userId);
        }

        return true;
    }
}
