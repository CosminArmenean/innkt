using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Officer.Services;
using innkt.Common.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace innkt.Officer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TrendingController : ControllerBase
    {
        private readonly TrendingAlgorithmService _trendingService;
        private readonly ILogger<TrendingController> _logger;

        public TrendingController(
            TrendingAlgorithmService trendingService,
            ILogger<TrendingController> logger)
        {
            _trendingService = trendingService;
            _logger = logger;
        }

        /// <summary>
        /// Get trending posts using Reddit's Hot Algorithm
        /// </summary>
        [HttpGet("posts")]
        public async Task<ActionResult<ApiResponse<List<Post>>>> GetTrendingPosts(
            [FromQuery] int limit = 50,
            [FromQuery] string category = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] string timeRange = "24h") // 1h, 6h, 24h, 7d, 30d
        {
            try
            {
                // TODO: Get posts from database service
                var posts = new List<Post>(); // This should come from your post service
                
                // Adjust fromDate based on timeRange
                if (!fromDate.HasValue)
                {
                    fromDate = timeRange switch
                    {
                        "1h" => DateTime.UtcNow.AddHours(-1),
                        "6h" => DateTime.UtcNow.AddHours(-6),
                        "24h" => DateTime.UtcNow.AddDays(-1),
                        "7d" => DateTime.UtcNow.AddDays(-7),
                        "30d" => DateTime.UtcNow.AddDays(-30),
                        _ => DateTime.UtcNow.AddDays(-1)
                    };
                }

                var trendingPosts = await _trendingService.GetTrendingPostsAsync(
                    posts, limit, category, fromDate);

                return Ok(new ApiResponse<List<Post>>
                {
                    Success = true,
                    Data = trendingPosts,
                    Message = $"Retrieved {trendingPosts.Count} trending posts"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending posts");
                return StatusCode(500, new ApiResponse<List<Post>>
                {
                    Success = false,
                    Message = "Failed to retrieve trending posts"
                });
            }
        }

        /// <summary>
        /// Get trending hashtags
        /// </summary>
        [HttpGet("hashtags")]
        public async Task<ActionResult<ApiResponse<List<TrendingHashtag>>>> GetTrendingHashtags(
            [FromQuery] int limit = 20,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] string timeRange = "24h")
        {
            try
            {
                // TODO: Get posts from database service
                var posts = new List<Post>(); // This should come from your post service
                
                // Adjust fromDate based on timeRange
                if (!fromDate.HasValue)
                {
                    fromDate = timeRange switch
                    {
                        "1h" => DateTime.UtcNow.AddHours(-1),
                        "6h" => DateTime.UtcNow.AddHours(-6),
                        "24h" => DateTime.UtcNow.AddDays(-1),
                        "7d" => DateTime.UtcNow.AddDays(-7),
                        "30d" => DateTime.UtcNow.AddDays(-30),
                        _ => DateTime.UtcNow.AddDays(-1)
                    };
                }

                var trendingHashtags = await _trendingService.GetTrendingHashtagsAsync(
                    posts, limit, fromDate);

                return Ok(new ApiResponse<List<TrendingHashtag>>
                {
                    Success = true,
                    Data = trendingHashtags,
                    Message = $"Retrieved {trendingHashtags.Count} trending hashtags"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending hashtags");
                return StatusCode(500, new ApiResponse<List<TrendingHashtag>>
                {
                    Success = false,
                    Message = "Failed to retrieve trending hashtags"
                });
            }
        }

        /// <summary>
        /// Get trending users
        /// </summary>
        [HttpGet("users")]
        public async Task<ActionResult<ApiResponse<List<TrendingUser>>>> GetTrendingUsers(
            [FromQuery] int limit = 20,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] string timeRange = "24h")
        {
            try
            {
                // TODO: Get posts and users from database service
                var posts = new List<Post>(); // This should come from your post service
                var users = new List<User>(); // This should come from your user service
                
                // Adjust fromDate based on timeRange
                if (!fromDate.HasValue)
                {
                    fromDate = timeRange switch
                    {
                        "1h" => DateTime.UtcNow.AddHours(-1),
                        "6h" => DateTime.UtcNow.AddHours(-6),
                        "24h" => DateTime.UtcNow.AddDays(-1),
                        "7d" => DateTime.UtcNow.AddDays(-7),
                        "30d" => DateTime.UtcNow.AddDays(-30),
                        _ => DateTime.UtcNow.AddDays(-1)
                    };
                }

                var trendingUsers = await _trendingService.GetTrendingUsersAsync(
                    posts, users, limit, fromDate);

                return Ok(new ApiResponse<List<TrendingUser>>
                {
                    Success = true,
                    Data = trendingUsers,
                    Message = $"Retrieved {trendingUsers.Count} trending users"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending users");
                return StatusCode(500, new ApiResponse<List<TrendingUser>>
                {
                    Success = false,
                    Message = "Failed to retrieve trending users"
                });
            }
        }

        /// <summary>
        /// Get trending content by category
        /// </summary>
        [HttpGet("categories")]
        public async Task<ActionResult<ApiResponse<Dictionary<string, List<Post>>>>> GetTrendingByCategory(
            [FromQuery] int limitPerCategory = 10,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] string timeRange = "24h")
        {
            try
            {
                // TODO: Get posts from database service
                var posts = new List<Post>(); // This should come from your post service
                
                // Adjust fromDate based on timeRange
                if (!fromDate.HasValue)
                {
                    fromDate = timeRange switch
                    {
                        "1h" => DateTime.UtcNow.AddHours(-1),
                        "6h" => DateTime.UtcNow.AddHours(-6),
                        "24h" => DateTime.UtcNow.AddDays(-1),
                        "7d" => DateTime.UtcNow.AddDays(-7),
                        "30d" => DateTime.UtcNow.AddDays(-30),
                        _ => DateTime.UtcNow.AddDays(-1)
                    };
                }

                var categoryTrending = await _trendingService.GetTrendingByCategoryAsync(
                    posts, limitPerCategory, fromDate);

                return Ok(new ApiResponse<Dictionary<string, List<Post>>>
                {
                    Success = true,
                    Data = categoryTrending,
                    Message = $"Retrieved trending posts for {categoryTrending.Count} categories"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending content by category");
                return StatusCode(500, new ApiResponse<Dictionary<string, List<Post>>>
                {
                    Success = false,
                    Message = "Failed to retrieve trending content by category"
                });
            }
        }

        /// <summary>
        /// Get algorithm statistics
        /// </summary>
        [HttpGet("stats")]
        public ActionResult<ApiResponse<AlgorithmStats>> GetAlgorithmStats()
        {
            try
            {
                var stats = _trendingService.GetAlgorithmStats();
                
                return Ok(new ApiResponse<AlgorithmStats>
                {
                    Success = true,
                    Data = stats,
                    Message = "Algorithm statistics retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting algorithm statistics");
                return StatusCode(500, new ApiResponse<AlgorithmStats>
                {
                    Success = false,
                    Message = "Failed to retrieve algorithm statistics"
                });
            }
        }

        /// <summary>
        /// Update algorithm parameters (Admin only)
        /// </summary>
        [HttpPost("parameters")]
        [Authorize(Roles = "Admin")]
        public ActionResult<ApiResponse<object>> UpdateAlgorithmParameters(
            [FromBody] AlgorithmParametersRequest request)
        {
            try
            {
                _trendingService.UpdateAlgorithmParameters(
                    request.LogBase,
                    request.TimeDecay,
                    request.ScoreWeight,
                    request.CommentWeight,
                    request.ShareWeight,
                    request.ViewWeight);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Algorithm parameters updated successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating algorithm parameters");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to update algorithm parameters"
                });
            }
        }

        /// <summary>
        /// Get trending content for a specific user's feed
        /// </summary>
        [HttpGet("feed/{userId}")]
        public async Task<ActionResult<ApiResponse<List<Post>>>> GetTrendingFeed(
            string userId,
            [FromQuery] int limit = 50,
            [FromQuery] string category = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] string timeRange = "24h")
        {
            try
            {
                // TODO: Get posts from database service, filtered by user's interests/following
                var posts = new List<Post>(); // This should come from your post service
                
                // Adjust fromDate based on timeRange
                if (!fromDate.HasValue)
                {
                    fromDate = timeRange switch
                    {
                        "1h" => DateTime.UtcNow.AddHours(-1),
                        "6h" => DateTime.UtcNow.AddHours(-6),
                        "24h" => DateTime.UtcNow.AddDays(-1),
                        "7d" => DateTime.UtcNow.AddDays(-7),
                        "30d" => DateTime.UtcNow.AddDays(-30),
                        _ => DateTime.UtcNow.AddDays(-1)
                    };
                }

                var trendingPosts = await _trendingService.GetTrendingPostsAsync(
                    posts, limit, category, fromDate);

                return Ok(new ApiResponse<List<Post>>
                {
                    Success = true,
                    Data = trendingPosts,
                    Message = $"Retrieved {trendingPosts.Count} trending posts for user feed"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending feed for user {UserId}", userId);
                return StatusCode(500, new ApiResponse<List<Post>>
                {
                    Success = false,
                    Message = "Failed to retrieve trending feed"
                });
            }
        }
    }

    // Request models
    public class AlgorithmParametersRequest
    {
        public double? LogBase { get; set; }
        public double? TimeDecay { get; set; }
        public double? ScoreWeight { get; set; }
        public double? CommentWeight { get; set; }
        public double? ShareWeight { get; set; }
        public double? ViewWeight { get; set; }
    }
}
