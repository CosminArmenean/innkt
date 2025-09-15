using Microsoft.EntityFrameworkCore;
using innkt.Social.Data;
using innkt.Social.DTOs;
using innkt.Social.Models;
using AutoMapper;

namespace innkt.Social.Services;

public class FollowService : IFollowService
{
    private readonly SocialDbContext _context;
    private readonly ILogger<FollowService> _logger;
    private readonly IMapper _mapper;

    public FollowService(SocialDbContext context, ILogger<FollowService> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<bool> FollowUserAsync(Guid followerId, Guid followingId)
    {
        if (followerId == followingId)
            return false; // Cannot follow yourself

        var existingFollow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);

        if (existingFollow != null)
            return false; // Already following

        var follow = new Follow
        {
            FollowerId = followerId,
            FollowingId = followingId
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {FollowerId} started following user {FollowingId}", followerId, followingId);
        return true;
    }

    public async Task<bool> UnfollowUserAsync(Guid followerId, Guid followingId)
    {
        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);

        if (follow == null)
            return false; // Not following

        _context.Follows.Remove(follow);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {FollowerId} unfollowed user {FollowingId}", followerId, followingId);
        return true;
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followingId)
    {
        return await _context.Follows
            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId);
    }

    public async Task<FollowListResponse> GetFollowersAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var query = _context.Follows
            .Where(f => f.FollowingId == userId)
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
            // Populate Follower info with mock data for now
            response.Follower = GetMockUserInfo(follow.FollowerId);
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

    public async Task<FollowListResponse> GetFollowingAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var query = _context.Follows
            .Where(f => f.FollowerId == userId)
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
            // Populate Following info with mock data for now
            response.Following = GetMockUserInfo(follow.FollowingId);
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

    public async Task<int> GetFollowersCountAsync(Guid userId)
    {
        return await _context.Follows
            .CountAsync(f => f.FollowingId == userId);
    }

    public async Task<int> GetFollowingCountAsync(Guid userId)
    {
        return await _context.Follows
            .CountAsync(f => f.FollowerId == userId);
    }

    public async Task<FollowListResponse> GetMutualFollowsAsync(Guid userId1, Guid userId2, int page = 1, int pageSize = 20)
    {
        // Get users that both userId1 and userId2 follow
        var user1Following = await _context.Follows
            .Where(f => f.FollowerId == userId1)
            .Select(f => f.FollowingId)
            .ToListAsync();

        var user2Following = await _context.Follows
            .Where(f => f.FollowerId == userId2)
            .Select(f => f.FollowingId)
            .ToListAsync();

        var mutualUserIds = user1Following.Intersect(user2Following).ToList();

        var query = _context.Follows
            .Where(f => f.FollowerId == userId1 && mutualUserIds.Contains(f.FollowingId))
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
            // Populate Following info with mock data for now
            response.Following = GetMockUserInfo(follow.FollowingId);
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

    private UserBasicInfo? GetMockUserInfo(Guid userId)
    {
        // Mock user data - in a real implementation, this would query the Officer service
        var mockUsers = new Dictionary<Guid, UserBasicInfo>
        {
            { Guid.Parse("4f8c8759-dfdc-423e-878e-c68036140114"), new UserBasicInfo 
                { Id = Guid.Parse("4f8c8759-dfdc-423e-878e-c68036140114"), Username = "testuser1", DisplayName = "Test User 1", IsVerified = false } },
            { Guid.Parse("b1234567-1234-5678-9abc-def012345680"), new UserBasicInfo 
                { Id = Guid.Parse("b1234567-1234-5678-9abc-def012345680"), Username = "bob.smith", DisplayName = "Bob Smith", IsVerified = true } },
            { Guid.Parse("a1234567-1234-5678-9abc-def012345681"), new UserBasicInfo 
                { Id = Guid.Parse("a1234567-1234-5678-9abc-def012345681"), Username = "alice.johnson", DisplayName = "Alice Johnson", IsVerified = false } },
            { Guid.Parse("c1234567-1234-5678-9abc-def012345682"), new UserBasicInfo 
                { Id = Guid.Parse("c1234567-1234-5678-9abc-def012345682"), Username = "charlie.brown", DisplayName = "Charlie Brown", IsVerified = false } },
            { Guid.Parse("c1234567-1234-5678-9abc-def012345684"), new UserBasicInfo 
                { Id = Guid.Parse("c1234567-1234-5678-9abc-def012345684"), Username = "charlie.kirk", DisplayName = "Charlie Kirk", IsVerified = false } },
            { Guid.Parse("bdfc4c41-c42e-42e0-a57b-d8301a37b1fe"), new UserBasicInfo 
                { Id = Guid.Parse("bdfc4c41-c42e-42e0-a57b-d8301a37b1fe"), Username = "junior11", DisplayName = "Cosmin", IsVerified = false } },
            { Guid.Parse("d1234567-1234-5678-9abc-def012345683"), new UserBasicInfo 
                { Id = Guid.Parse("d1234567-1234-5678-9abc-def012345683"), Username = "diana.wilson", DisplayName = "Diana Wilson", IsVerified = true } }
        };

        return mockUsers.TryGetValue(userId, out var user) ? user : null;
    }
}
