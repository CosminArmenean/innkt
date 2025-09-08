using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Officer.Services;
using innkt.Common.Models;
using System.Security.Claims;

namespace innkt.Officer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ILogger<SearchController> _logger;
        private readonly SearchService _searchService;

        public SearchController(
            ILogger<SearchController> logger,
            SearchService searchService)
        {
            _logger = logger;
            _searchService = searchService;
        }

        /// <summary>
        /// Perform comprehensive search across all content types
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<SearchResult>>> Search([FromQuery] SearchRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Query))
                {
                    return BadRequest(new ApiResponse<SearchResult>
                    {
                        Success = false,
                        Message = "Search query is required"
                    });
                }

                var result = await _searchService.SearchAsync(request);

                // Save search to user's history
                var userId = GetUserId();
                if (!string.IsNullOrEmpty(userId))
                {
                    await _searchService.SaveSearchQueryAsync(userId, request.Query, result);
                }

                return Ok(new ApiResponse<SearchResult>
                {
                    Success = true,
                    Data = result,
                    Message = $"Found {result.TotalResults} results for '{request.Query}'"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error performing search for query '{request.Query}'");
                return StatusCode(500, new ApiResponse<SearchResult>
                {
                    Success = false,
                    Message = "Search failed. Please try again."
                });
            }
        }

        /// <summary>
        /// Search posts only
        /// </summary>
        [HttpGet("posts")]
        public async Task<ActionResult<ApiResponse<List<SearchPostResult>>>> SearchPosts([FromQuery] SearchRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Query))
                {
                    return BadRequest(new ApiResponse<List<SearchPostResult>>
                    {
                        Success = false,
                        Message = "Search query is required"
                    });
                }

                request.IncludeUsers = false;
                request.IncludeGroups = false;
                request.IncludeHashtags = false;

                var result = await _searchService.SearchAsync(request);

                return Ok(new ApiResponse<List<SearchPostResult>>
                {
                    Success = true,
                    Data = result.Posts,
                    Message = $"Found {result.Posts.Count} posts for '{request.Query}'"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching posts for query '{request.Query}'");
                return StatusCode(500, new ApiResponse<List<SearchPostResult>>
                {
                    Success = false,
                    Message = "Post search failed. Please try again."
                });
            }
        }

        /// <summary>
        /// Search users only
        /// </summary>
        [HttpGet("users")]
        public async Task<ActionResult<ApiResponse<List<SearchUserResult>>>> SearchUsers([FromQuery] SearchRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Query))
                {
                    return BadRequest(new ApiResponse<List<SearchUserResult>>
                    {
                        Success = false,
                        Message = "Search query is required"
                    });
                }

                request.IncludePosts = false;
                request.IncludeGroups = false;
                request.IncludeHashtags = false;

                var result = await _searchService.SearchAsync(request);

                return Ok(new ApiResponse<List<SearchUserResult>>
                {
                    Success = true,
                    Data = result.Users,
                    Message = $"Found {result.Users.Count} users for '{request.Query}'"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching users for query '{request.Query}'");
                return StatusCode(500, new ApiResponse<List<SearchUserResult>>
                {
                    Success = false,
                    Message = "User search failed. Please try again."
                });
            }
        }

        /// <summary>
        /// Search groups only
        /// </summary>
        [HttpGet("groups")]
        public async Task<ActionResult<ApiResponse<List<SearchGroupResult>>>> SearchGroups([FromQuery] SearchRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Query))
                {
                    return BadRequest(new ApiResponse<List<SearchGroupResult>>
                    {
                        Success = false,
                        Message = "Search query is required"
                    });
                }

                request.IncludePosts = false;
                request.IncludeUsers = false;
                request.IncludeHashtags = false;

                var result = await _searchService.SearchAsync(request);

                return Ok(new ApiResponse<List<SearchGroupResult>>
                {
                    Success = true,
                    Data = result.Groups,
                    Message = $"Found {result.Groups.Count} groups for '{request.Query}'"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching groups for query '{request.Query}'");
                return StatusCode(500, new ApiResponse<List<SearchGroupResult>>
                {
                    Success = false,
                    Message = "Group search failed. Please try again."
                });
            }
        }

        /// <summary>
        /// Search hashtags only
        /// </summary>
        [HttpGet("hashtags")]
        public async Task<ActionResult<ApiResponse<List<SearchHashtagResult>>>> SearchHashtags([FromQuery] SearchRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Query))
                {
                    return BadRequest(new ApiResponse<List<SearchHashtagResult>>
                    {
                        Success = false,
                        Message = "Search query is required"
                    });
                }

                request.IncludePosts = false;
                request.IncludeUsers = false;
                request.IncludeGroups = false;

                var result = await _searchService.SearchAsync(request);

                return Ok(new ApiResponse<List<SearchHashtagResult>>
                {
                    Success = true,
                    Data = result.Hashtags,
                    Message = $"Found {result.Hashtags.Count} hashtags for '{request.Query}'"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching hashtags for query '{request.Query}'");
                return StatusCode(500, new ApiResponse<List<SearchHashtagResult>>
                {
                    Success = false,
                    Message = "Hashtag search failed. Please try again."
                });
            }
        }

        /// <summary>
        /// Get search suggestions
        /// </summary>
        [HttpGet("suggestions")]
        public async Task<ActionResult<ApiResponse<List<string>>>> GetSearchSuggestions([FromQuery] string query, [FromQuery] int limit = 10)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                {
                    return Ok(new ApiResponse<List<string>>
                    {
                        Success = true,
                        Data = new List<string>(),
                        Message = "Query too short for suggestions"
                    });
                }

                var request = new SearchRequest
                {
                    Query = query,
                    PageSize = limit
                };

                var result = await _searchService.SearchAsync(request);

                return Ok(new ApiResponse<List<string>>
                {
                    Success = true,
                    Data = result.Suggestions,
                    Message = $"Found {result.Suggestions.Count} suggestions"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting search suggestions for query '{query}'");
                return StatusCode(500, new ApiResponse<List<string>>
                {
                    Success = false,
                    Message = "Failed to get search suggestions"
                });
            }
        }

        /// <summary>
        /// Get trending searches
        /// </summary>
        [HttpGet("trending")]
        public async Task<ActionResult<ApiResponse<List<TrendingSearch>>>> GetTrendingSearches([FromQuery] int limit = 10)
        {
            try
            {
                var trendingSearches = await _searchService.GetTrendingSearchesAsync(limit);

                return Ok(new ApiResponse<List<TrendingSearch>>
                {
                    Success = true,
                    Data = trendingSearches,
                    Message = $"Retrieved {trendingSearches.Count} trending searches"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting trending searches");
                return StatusCode(500, new ApiResponse<List<TrendingSearch>>
                {
                    Success = false,
                    Message = "Failed to get trending searches"
                });
            }
        }

        /// <summary>
        /// Get user's search history
        /// </summary>
        [HttpGet("history")]
        public async Task<ActionResult<ApiResponse<List<SearchHistoryItem>>>> GetSearchHistory([FromQuery] int limit = 20)
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<List<SearchHistoryItem>>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                var history = await _searchService.GetSearchHistoryAsync(userId, limit);

                return Ok(new ApiResponse<List<SearchHistoryItem>>
                {
                    Success = true,
                    Data = history,
                    Message = $"Retrieved {history.Count} search history items"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting search history");
                return StatusCode(500, new ApiResponse<List<SearchHistoryItem>>
                {
                    Success = false,
                    Message = "Failed to get search history"
                });
            }
        }

        /// <summary>
        /// Clear user's search history
        /// </summary>
        [HttpDelete("history")]
        public async Task<ActionResult<ApiResponse<object>>> ClearSearchHistory()
        {
            try
            {
                var userId = GetUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Unauthorized"
                    });
                }

                await _searchService.ClearSearchHistoryAsync(userId);

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = "Search history cleared successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error clearing search history");
                return StatusCode(500, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Failed to clear search history"
                });
            }
        }

        /// <summary>
        /// Get search analytics (Admin only)
        /// </summary>
        [HttpGet("analytics")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<SearchAnalytics>>> GetSearchAnalytics(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            try
            {
                var analytics = await _searchService.GetSearchAnalyticsAsync(fromDate, toDate);

                return Ok(new ApiResponse<SearchAnalytics>
                {
                    Success = true,
                    Data = analytics,
                    Message = "Search analytics retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting search analytics");
                return StatusCode(500, new ApiResponse<SearchAnalytics>
                {
                    Success = false,
                    Message = "Failed to get search analytics"
                });
            }
        }

        /// <summary>
        /// Advanced search with complex filters
        /// </summary>
        [HttpPost("advanced")]
        public async Task<ActionResult<ApiResponse<SearchResult>>> AdvancedSearch([FromBody] AdvancedSearchRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Query))
                {
                    return BadRequest(new ApiResponse<SearchResult>
                    {
                        Success = false,
                        Message = "Search query is required"
                    });
                }

                var searchRequest = new SearchRequest
                {
                    Query = request.Query,
                    Page = request.Page,
                    PageSize = request.PageSize,
                    IncludePosts = request.IncludePosts,
                    IncludeUsers = request.IncludeUsers,
                    IncludeGroups = request.IncludeGroups,
                    IncludeHashtags = request.IncludeHashtags,
                    Filters = request.Filters,
                    Sort = request.Sort
                };

                var result = await _searchService.SearchAsync(searchRequest);

                // Save search to user's history
                var userId = GetUserId();
                if (!string.IsNullOrEmpty(userId))
                {
                    await _searchService.SaveSearchQueryAsync(userId, request.Query, result);
                }

                return Ok(new ApiResponse<SearchResult>
                {
                    Success = true,
                    Data = result,
                    Message = $"Found {result.TotalResults} results for advanced search"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error performing advanced search for query '{request.Query}'");
                return StatusCode(500, new ApiResponse<SearchResult>
                {
                    Success = false,
                    Message = "Advanced search failed. Please try again."
                });
            }
        }

        private string? GetUserId()
        {
            return User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }

    // Request Models
    public class AdvancedSearchRequest
    {
        public string Query { get; set; } = string.Empty;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public bool IncludePosts { get; set; } = true;
        public bool IncludeUsers { get; set; } = true;
        public bool IncludeGroups { get; set; } = true;
        public bool IncludeHashtags { get; set; } = true;
        public SearchFilters? Filters { get; set; }
        public SearchSort? Sort { get; set; }
    }
}
