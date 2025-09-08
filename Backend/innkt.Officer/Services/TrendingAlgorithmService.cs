using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using innkt.Common.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace innkt.Officer.Services
{
    public class TrendingAlgorithmService
    {
        private readonly ILogger<TrendingAlgorithmService> _logger;
        private readonly IConfiguration _configuration;
        
        // Reddit's Hot Algorithm constants
        private readonly double _logBase = 10.0;
        private readonly double _timeDecay = 45000; // 12.5 hours in seconds
        private readonly double _scoreWeight = 1.0;
        private readonly double _commentWeight = 0.5;
        private readonly double _shareWeight = 2.0;
        private readonly double _viewWeight = 0.1;

        public TrendingAlgorithmService(ILogger<TrendingAlgorithmService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Calculate Reddit's Hot Score for a post
        /// Formula: log10(max(abs(s), 1)) * sign(s) + (epoch_seconds - 1134028003) / 45000
        /// Where s = score (likes - dislikes)
        /// </summary>
        public double CalculateHotScore(Post post, DateTime currentTime)
        {
            try
            {
                // Calculate engagement score
                var engagementScore = CalculateEngagementScore(post);
                
                // Calculate time decay factor
                var timeDecay = CalculateTimeDecay(post.CreatedAt, currentTime);
                
                // Apply Reddit's Hot Algorithm formula
                var hotScore = Math.Log10(Math.Max(Math.Abs(engagementScore), 1)) * Math.Sign(engagementScore) + timeDecay;
                
                _logger.LogDebug($"Hot score calculated for post {post.Id}: {hotScore:F4} (engagement: {engagementScore}, time: {timeDecay:F4})");
                
                return hotScore;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calculating hot score for post {post.Id}");
                return 0;
            }
        }

        /// <summary>
        /// Calculate engagement score based on various interactions
        /// </summary>
        private double CalculateEngagementScore(Post post)
        {
            var score = 0.0;
            
            // Base score from likes (echoes)
            score += (post.LikesCount ?? 0) * _scoreWeight;
            
            // Comments engagement
            score += (post.CommentsCount ?? 0) * _commentWeight;
            
            // Shares engagement (higher weight as it's more valuable)
            score += (post.SharesCount ?? 0) * _shareWeight;
            
            // Views engagement (lower weight as it's passive)
            score += (post.ViewsCount ?? 0) * _viewWeight;
            
            // Bonus for posts with media
            if (post.Media != null && post.Media.Any())
            {
                score *= 1.2; // 20% bonus for media posts
            }
            
            // Bonus for posts with hashtags
            if (!string.IsNullOrEmpty(post.Hashtags) && post.Hashtags.Split(',').Length > 0)
            {
                score *= 1.1; // 10% bonus for hashtagged posts
            }
            
            return score;
        }

        /// <summary>
        /// Calculate time decay factor
        /// Formula: (current_time - post_time) / time_decay_constant
        /// </summary>
        private double CalculateTimeDecay(DateTime postTime, DateTime currentTime)
        {
            var timeDifference = (currentTime - postTime).TotalSeconds;
            return timeDifference / _timeDecay;
        }

        /// <summary>
        /// Get trending posts using Reddit's Hot Algorithm
        /// </summary>
        public async Task<List<Post>> GetTrendingPostsAsync(
            List<Post> posts, 
            int limit = 50, 
            string category = null,
            DateTime? fromDate = null)
        {
            try
            {
                var currentTime = DateTime.UtcNow;
                
                // Filter posts by category and date if specified
                var filteredPosts = posts.AsQueryable();
                
                if (!string.IsNullOrEmpty(category))
                {
                    filteredPosts = filteredPosts.Where(p => p.Category == category);
                }
                
                if (fromDate.HasValue)
                {
                    filteredPosts = filteredPosts.Where(p => p.CreatedAt >= fromDate.Value);
                }
                
                // Calculate hot scores for all posts
                var postsWithScores = filteredPosts
                    .Select(post => new
                    {
                        Post = post,
                        HotScore = CalculateHotScore(post, currentTime)
                    })
                    .OrderByDescending(x => x.HotScore)
                    .Take(limit)
                    .Select(x => x.Post)
                    .ToList();
                
                _logger.LogInformation($"Retrieved {postsWithScores.Count} trending posts");
                
                return postsWithScores;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending posts");
                return new List<Post>();
            }
        }

        /// <summary>
        /// Get trending hashtags based on post engagement
        /// </summary>
        public async Task<List<TrendingHashtag>> GetTrendingHashtagsAsync(
            List<Post> posts, 
            int limit = 20,
            DateTime? fromDate = null)
        {
            try
            {
                var currentTime = DateTime.UtcNow;
                var hashtagScores = new Dictionary<string, double>();
                
                // Filter posts by date if specified
                var filteredPosts = posts.AsQueryable();
                if (fromDate.HasValue)
                {
                    filteredPosts = filteredPosts.Where(p => p.CreatedAt >= fromDate.Value);
                }
                
                // Calculate hashtag scores
                foreach (var post in filteredPosts)
                {
                    if (string.IsNullOrEmpty(post.Hashtags)) continue;
                    
                    var hashtags = post.Hashtags.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(h => h.Trim().ToLower())
                        .Where(h => !string.IsNullOrEmpty(h));
                    
                    var postScore = CalculateHotScore(post, currentTime);
                    
                    foreach (var hashtag in hashtags)
                    {
                        if (hashtagScores.ContainsKey(hashtag))
                        {
                            hashtagScores[hashtag] += postScore;
                        }
                        else
                        {
                            hashtagScores[hashtag] = postScore;
                        }
                    }
                }
                
                // Sort by score and return top hashtags
                var trendingHashtags = hashtagScores
                    .OrderByDescending(kvp => kvp.Value)
                    .Take(limit)
                    .Select(kvp => new TrendingHashtag
                    {
                        Hashtag = kvp.Key,
                        Score = kvp.Value,
                        PostCount = filteredPosts.Count(p => 
                            !string.IsNullOrEmpty(p.Hashtags) && 
                            p.Hashtags.ToLower().Contains(kvp.Key))
                    })
                    .ToList();
                
                _logger.LogInformation($"Retrieved {trendingHashtags.Count} trending hashtags");
                
                return trendingHashtags;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending hashtags");
                return new List<TrendingHashtag>();
            }
        }

        /// <summary>
        /// Get trending users based on their recent post performance
        /// </summary>
        public async Task<List<TrendingUser>> GetTrendingUsersAsync(
            List<Post> posts,
            List<User> users,
            int limit = 20,
            DateTime? fromDate = null)
        {
            try
            {
                var currentTime = DateTime.UtcNow;
                var userScores = new Dictionary<string, double>();
                
                // Filter posts by date if specified
                var filteredPosts = posts.AsQueryable();
                if (fromDate.HasValue)
                {
                    filteredPosts = filteredPosts.Where(p => p.CreatedAt >= fromDate.Value);
                }
                
                // Calculate user scores based on their posts
                foreach (var post in filteredPosts)
                {
                    var postScore = CalculateHotScore(post, currentTime);
                    
                    if (userScores.ContainsKey(post.AuthorId))
                    {
                        userScores[post.AuthorId] += postScore;
                    }
                    else
                    {
                        userScores[post.AuthorId] = postScore;
                    }
                }
                
                // Get user details and create trending users
                var trendingUsers = userScores
                    .OrderByDescending(kvp => kvp.Value)
                    .Take(limit)
                    .Select(kvp =>
                    {
                        var user = users.FirstOrDefault(u => u.Id == kvp.Key);
                        return new TrendingUser
                        {
                            UserId = kvp.Key,
                            Username = user?.Username ?? "Unknown",
                            DisplayName = user?.DisplayName ?? "Unknown User",
                            AvatarUrl = user?.AvatarUrl,
                            Score = kvp.Value,
                            PostCount = filteredPosts.Count(p => p.AuthorId == kvp.Key),
                            FollowersCount = user?.FollowersCount ?? 0
                        };
                    })
                    .Where(tu => tu.Username != "Unknown") // Filter out users not found
                    .ToList();
                
                _logger.LogInformation($"Retrieved {trendingUsers.Count} trending users");
                
                return trendingUsers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending users");
                return new List<TrendingUser>();
            }
        }

        /// <summary>
        /// Get trending content by category
        /// </summary>
        public async Task<Dictionary<string, List<Post>>> GetTrendingByCategoryAsync(
            List<Post> posts,
            int limitPerCategory = 10,
            DateTime? fromDate = null)
        {
            try
            {
                var currentTime = DateTime.UtcNow;
                var categoryTrending = new Dictionary<string, List<Post>>();
                
                // Filter posts by date if specified
                var filteredPosts = posts.AsQueryable();
                if (fromDate.HasValue)
                {
                    filteredPosts = filteredPosts.Where(p => p.CreatedAt >= fromDate.Value);
                }
                
                // Group posts by category
                var postsByCategory = filteredPosts
                    .GroupBy(p => p.Category ?? "General")
                    .ToList();
                
                foreach (var categoryGroup in postsByCategory)
                {
                    var category = categoryGroup.Key;
                    var categoryPosts = categoryGroup.ToList();
                    
                    // Calculate hot scores and sort
                    var trendingPosts = categoryPosts
                        .Select(post => new
                        {
                            Post = post,
                            HotScore = CalculateHotScore(post, currentTime)
                        })
                        .OrderByDescending(x => x.HotScore)
                        .Take(limitPerCategory)
                        .Select(x => x.Post)
                        .ToList();
                    
                    categoryTrending[category] = trendingPosts;
                }
                
                _logger.LogInformation($"Retrieved trending posts for {categoryTrending.Count} categories");
                
                return categoryTrending;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending content by category");
                return new Dictionary<string, List<Post>>();
            }
        }

        /// <summary>
        /// Update algorithm parameters (for A/B testing)
        /// </summary>
        public void UpdateAlgorithmParameters(
            double? logBase = null,
            double? timeDecay = null,
            double? scoreWeight = null,
            double? commentWeight = null,
            double? shareWeight = null,
            double? viewWeight = null)
        {
            if (logBase.HasValue) _logBase = logBase.Value;
            if (timeDecay.HasValue) _timeDecay = timeDecay.Value;
            if (scoreWeight.HasValue) _scoreWeight = scoreWeight.Value;
            if (commentWeight.HasValue) _commentWeight = commentWeight.Value;
            if (shareWeight.HasValue) _shareWeight = shareWeight.Value;
            if (viewWeight.HasValue) _viewWeight = viewWeight.Value;
            
            _logger.LogInformation("Trending algorithm parameters updated");
        }

        /// <summary>
        /// Get algorithm statistics for monitoring
        /// </summary>
        public AlgorithmStats GetAlgorithmStats()
        {
            return new AlgorithmStats
            {
                LogBase = _logBase,
                TimeDecay = _timeDecay,
                ScoreWeight = _scoreWeight,
                CommentWeight = _commentWeight,
                ShareWeight = _shareWeight,
                ViewWeight = _viewWeight,
                LastUpdated = DateTime.UtcNow
            };
        }
    }

    // Supporting models
    public class TrendingHashtag
    {
        public string Hashtag { get; set; }
        public double Score { get; set; }
        public int PostCount { get; set; }
    }

    public class TrendingUser
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public string DisplayName { get; set; }
        public string AvatarUrl { get; set; }
        public double Score { get; set; }
        public int PostCount { get; set; }
        public int FollowersCount { get; set; }
    }

    public class AlgorithmStats
    {
        public double LogBase { get; set; }
        public double TimeDecay { get; set; }
        public double ScoreWeight { get; set; }
        public double CommentWeight { get; set; }
        public double ShareWeight { get; set; }
        public double ViewWeight { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
