using innkt.Social.Data;
using innkt.Social.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace innkt.Social.Services;

public class TrendingService
{
    private readonly SocialDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly ILogger<TrendingService> _logger;
    private readonly TimeSpan _trendingWindow = TimeSpan.FromHours(1);
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(5);

    public TrendingService(
        SocialDbContext context,
        IDistributedCache cache,
        ILogger<TrendingService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<List<string>> GetTrendingTopicsAsync(int count = 20)
    {
        var cacheKey = $"trending_topics_{count}";
        var cached = await _cache.GetStringAsync(cacheKey);
        
        if (!string.IsNullOrEmpty(cached))
        {
            return JsonSerializer.Deserialize<List<string>>(cached) ?? new List<string>();
        }

        var trendingTopics = await CalculateTrendingTopicsAsync(count);
        
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(trendingTopics), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _cacheExpiry
        });

        return trendingTopics;
    }

    public async Task<List<UserProfile>> GetRecommendedUsersAsync(string userId, int count = 10)
    {
        var cacheKey = $"recommended_users_{userId}_{count}";
        var cached = await _cache.GetStringAsync(cacheKey);
        
        if (!string.IsNullOrEmpty(cached))
        {
            return JsonSerializer.Deserialize<List<UserProfile>>(cached) ?? new List<UserProfile>();
        }

        var recommendations = await CalculateUserRecommendationsAsync(userId, count);
        
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(recommendations), new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _cacheExpiry
        });

        return recommendations;
    }

    private async Task<List<string>> CalculateTrendingTopicsAsync(int count)
    {
        var now = DateTime.UtcNow;
        var windowStart = now - _trendingWindow;

        // Get all posts from the trending window
        var posts = await _context.Posts
            .Where(p => p.CreatedAt >= windowStart && p.IsPublic)
            .Select(p => new { p.Hashtags, p.LikesCount, p.CommentsCount, p.SharesCount, p.CreatedAt })
            .ToListAsync();

        // Extract and count hashtags
        var hashtagScores = new Dictionary<string, double>();
        
        foreach (var post in posts)
        {
            if (string.IsNullOrEmpty(post.Hashtags)) continue;

            var hashtags = post.Hashtags.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(h => h.Trim().ToLower())
                .Where(h => !string.IsNullOrEmpty(h));

            var postScore = CalculatePostScore(post.LikesCount, post.CommentsCount, post.SharesCount, post.CreatedAt, now);

            foreach (var hashtag in hashtags)
            {
                if (!hashtagScores.ContainsKey(hashtag))
                {
                    hashtagScores[hashtag] = 0;
                }
                hashtagScores[hashtag] += postScore;
            }
        }

        // Calculate trending scores with velocity and acceleration
        var trendingScores = new Dictionary<string, double>();
        
        foreach (var hashtag in hashtagScores.Keys)
        {
            var currentScore = hashtagScores[hashtag];
            
            // Get previous window score for velocity calculation
            var previousWindowStart = windowStart - _trendingWindow;
            var previousScore = await GetHashtagScoreInWindow(hashtag, previousWindowStart, windowStart);
            
            // Calculate velocity (growth rate)
            var velocity = previousScore > 0 ? currentScore / previousScore : currentScore;
            
            // Calculate acceleration (simplified)
            var acceleration = CalculateAcceleration(hashtag, windowStart, now);
            
            // Final trending score
            var trendingScore = currentScore * velocity * (1 + acceleration);
            trendingScores[hashtag] = trendingScore;
        }

        return trendingScores
            .OrderByDescending(kvp => kvp.Value)
            .Take(count)
            .Select(kvp => kvp.Key)
            .ToList();
    }

    private async Task<List<UserProfile>> CalculateUserRecommendationsAsync(string userId, int count)
    {
        // Get current user's following list
        var following = await _context.Follows
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FollowingId)
            .ToListAsync();

        // Get users that the current user's follows are following (friends of friends)
        var recommendations = await _context.Follows
            .Where(f => following.Contains(f.FollowerId) && !following.Contains(f.FollowingId) && f.FollowingId != userId)
            .GroupBy(f => f.FollowingId)
            .Select(g => new { UserId = g.Key, MutualConnections = g.Count() })
            .OrderByDescending(x => x.MutualConnections)
            .Take(count * 2) // Get more than needed for filtering
            .ToListAsync();

        // Get user profiles for recommendations
        var userIds = recommendations.Select(r => r.UserId).ToList();
        var userProfiles = await _context.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new UserProfile
            {
                Id = u.Id,
                Username = u.Username,
                DisplayName = u.DisplayName,
                Bio = u.Bio,
                Avatar = u.Avatar,
                IsVerified = u.IsVerified,
                FollowersCount = u.FollowersCount,
                FollowingCount = u.FollowingCount,
                PostsCount = u.PostsCount,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        // Sort by mutual connections and return top recommendations
        return userProfiles
            .OrderByDescending(u => recommendations.FirstOrDefault(r => r.UserId == u.Id)?.MutualConnections ?? 0)
            .Take(count)
            .ToList();
    }

    private double CalculatePostScore(int likes, int comments, int shares, DateTime createdAt, DateTime now)
    {
        // Time decay factor (newer posts get higher scores)
        var timeDecay = Math.Exp(-(now - createdAt).TotalHours / 24.0);
        
        // Engagement score with different weights
        var engagementScore = (likes * 1.0) + (comments * 2.0) + (shares * 3.0);
        
        return engagementScore * timeDecay;
    }

    private async Task<double> GetHashtagScoreInWindow(string hashtag, DateTime start, DateTime end)
    {
        var posts = await _context.Posts
            .Where(p => p.CreatedAt >= start && p.CreatedAt < end && p.IsPublic && p.Hashtags.Contains(hashtag))
            .Select(p => new { p.LikesCount, p.CommentsCount, p.SharesCount, p.CreatedAt })
            .ToListAsync();

        var now = DateTime.UtcNow;
        return posts.Sum(p => CalculatePostScore(p.LikesCount, p.CommentsCount, p.SharesCount, p.CreatedAt, now));
    }

    private double CalculateAcceleration(string hashtag, DateTime windowStart, DateTime now)
    {
        // Simplified acceleration calculation
        // In a real implementation, this would analyze the rate of change of velocity
        // For now, return a small random factor to add some variation
        var random = new Random(hashtag.GetHashCode());
        return random.NextDouble() * 0.1; // 0-10% acceleration factor
    }
}
