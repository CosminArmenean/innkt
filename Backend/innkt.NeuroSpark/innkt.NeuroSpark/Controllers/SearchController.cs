using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.NeuroSpark.Services;
using innkt.NeuroSpark.Models;
using System.Security.Claims;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;
    private readonly ILogger<SearchController> _logger;

    public SearchController(ISearchService searchService, ILogger<SearchController> logger)
    {
        _searchService = searchService;
        _logger = logger;
    }

    /// <summary>
    /// Perform AI-powered search across all content types
    /// </summary>
    [HttpPost("search")]
    public async Task<ActionResult<SearchResponse>> Search([FromBody] SearchRequest request)
    {
        try
        {
            var response = await _searchService.SearchAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing search for query: {Query}", request.Query);
            return StatusCode(500, "An error occurred while performing the search");
        }
    }

    /// <summary>
    /// Search posts with AI-powered relevance
    /// </summary>
    [HttpPost("search/posts")]
    public async Task<ActionResult<SearchResponse>> SearchPosts([FromBody] SearchRequest request)
    {
        try
        {
            var response = await _searchService.SearchPostsAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching posts for query: {Query}", request.Query);
            return StatusCode(500, "An error occurred while searching posts");
        }
    }

    /// <summary>
    /// Search users with AI-powered matching
    /// </summary>
    [HttpPost("search/users")]
    public async Task<ActionResult<SearchResponse>> SearchUsers([FromBody] SearchRequest request)
    {
        try
        {
            var response = await _searchService.SearchUsersAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users for query: {Query}", request.Query);
            return StatusCode(500, "An error occurred while searching users");
        }
    }

    /// <summary>
    /// Search groups with AI-powered discovery
    /// </summary>
    [HttpPost("search/groups")]
    public async Task<ActionResult<SearchResponse>> SearchGroups([FromBody] SearchRequest request)
    {
        try
        {
            var response = await _searchService.SearchGroupsAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching groups for query: {Query}", request.Query);
            return StatusCode(500, "An error occurred while searching groups");
        }
    }

    /// <summary>
    /// Search hashtags with trending analysis
    /// </summary>
    [HttpPost("search/hashtags")]
    public async Task<ActionResult<SearchResponse>> SearchHashtags([FromBody] SearchRequest request)
    {
        try
        {
            var response = await _searchService.SearchHashtagsAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching hashtags for query: {Query}", request.Query);
            return StatusCode(500, "An error occurred while searching hashtags");
        }
    }

    /// <summary>
    /// Analyze content with AI (sentiment, toxicity, quality)
    /// </summary>
    [HttpPost("analyze")]
    public async Task<ActionResult<ContentAnalysisResponse>> AnalyzeContent([FromBody] ContentAnalysisRequest request)
    {
        try
        {
            var response = await _searchService.AnalyzeContentAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing content");
            return StatusCode(500, "An error occurred while analyzing content");
        }
    }

    /// <summary>
    /// Get personalized recommendations
    /// </summary>
    [HttpPost("recommendations")]
    public async Task<ActionResult<RecommendationResponse>> GetRecommendations([FromBody] RecommendationRequest request)
    {
        try
        {
            var response = await _searchService.GetRecommendationsAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendations for user: {UserId}", request.UserId);
            return StatusCode(500, "An error occurred while getting recommendations");
        }
    }

    /// <summary>
    /// Get trending topics and hashtags
    /// </summary>
    [HttpPost("trending")]
    public async Task<ActionResult<TrendingResponse>> GetTrending([FromBody] TrendingRequest request)
    {
        try
        {
            var response = await _searchService.GetTrendingAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting trending items");
            return StatusCode(500, "An error occurred while getting trending items");
        }
    }

    /// <summary>
    /// Get search suggestions for autocomplete
    /// </summary>
    [HttpGet("suggestions")]
    public async Task<ActionResult<string[]>> GetSearchSuggestions([FromQuery] string query, [FromQuery] int count = 10)
    {
        try
        {
            var suggestions = await _searchService.GetSearchSuggestionsAsync(query, count);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search suggestions for query: {Query}", query);
            return StatusCode(500, "An error occurred while getting search suggestions");
        }
    }

    /// <summary>
    /// Get search analytics and statistics
    /// </summary>
    [HttpGet("analytics")]
    public async Task<ActionResult<SearchAnalytics>> GetSearchAnalytics([FromQuery] string query, [FromQuery] DateTime? since = null, [FromQuery] DateTime? until = null)
    {
        try
        {
            var analytics = await _searchService.GetSearchAnalyticsAsync(query, since, until);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search analytics for query: {Query}", query);
            return StatusCode(500, "An error occurred while getting search analytics");
        }
    }

    /// <summary>
    /// Get search statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<Dictionary<string, int>>> GetSearchStats([FromQuery] DateTime? since = null, [FromQuery] DateTime? until = null)
    {
        try
        {
            var stats = await _searchService.GetSearchStatsAsync(since, until);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting search statistics");
            return StatusCode(500, "An error occurred while getting search statistics");
        }
    }

    /// <summary>
    /// Perform semantic search using AI embeddings
    /// </summary>
    [HttpPost("semantic")]
    public async Task<ActionResult<SearchResponse>> SemanticSearch([FromBody] SearchRequest request)
    {
        try
        {
            var response = await _searchService.SemanticSearchAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing semantic search for query: {Query}", request.Query);
            return StatusCode(500, "An error occurred while performing semantic search");
        }
    }

    /// <summary>
    /// Perform vector search using embeddings
    /// </summary>
    [HttpPost("vector")]
    public async Task<ActionResult<SearchResponse>> VectorSearch([FromBody] string query, [FromQuery] int count = 20)
    {
        try
        {
            var response = await _searchService.VectorSearchAsync(query, count);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing vector search for query: {Query}", query);
            return StatusCode(500, "An error occurred while performing vector search");
        }
    }

    /// <summary>
    /// Perform hybrid search combining multiple methods
    /// </summary>
    [HttpPost("hybrid")]
    public async Task<ActionResult<SearchResponse>> HybridSearch([FromBody] SearchRequest request)
    {
        try
        {
            var response = await _searchService.HybridSearchAsync(request);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing hybrid search for query: {Query}", request.Query);
            return StatusCode(500, "An error occurred while performing hybrid search");
        }
    }

    /// <summary>
    /// Index content for search
    /// </summary>
    [HttpPost("index")]
    public async Task<ActionResult> IndexContent([FromBody] IndexContentRequest request)
    {
        try
        {
            var success = await _searchService.IndexContentAsync(
                request.ContentId, 
                request.Content, 
                request.Type, 
                request.Metadata);

            if (success)
                return Ok(new { message = "Content indexed successfully" });
            else
                return BadRequest("Failed to index content");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error indexing content: {ContentId}", request.ContentId);
            return StatusCode(500, "An error occurred while indexing content");
        }
    }

    /// <summary>
    /// Update indexed content
    /// </summary>
    [HttpPut("index/{contentId}")]
    public async Task<ActionResult> UpdateContentIndex(string contentId, [FromBody] UpdateContentIndexRequest request)
    {
        try
        {
            var success = await _searchService.UpdateContentIndexAsync(
                contentId, 
                request.Content, 
                request.Metadata);

            if (success)
                return Ok(new { message = "Content index updated successfully" });
            else
                return BadRequest("Failed to update content index");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating content index: {ContentId}", contentId);
            return StatusCode(500, "An error occurred while updating content index");
        }
    }

    /// <summary>
    /// Remove content from search index
    /// </summary>
    [HttpDelete("index/{contentId}")]
    public async Task<ActionResult> RemoveContentFromIndex(string contentId)
    {
        try
        {
            var success = await _searchService.RemoveContentFromIndexAsync(contentId);

            if (success)
                return Ok(new { message = "Content removed from index successfully" });
            else
                return BadRequest("Failed to remove content from index");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing content from index: {ContentId}", contentId);
            return StatusCode(500, "An error occurred while removing content from index");
        }
    }

    /// <summary>
    /// Rebuild the entire search index
    /// </summary>
    [HttpPost("index/rebuild")]
    public async Task<ActionResult> RebuildSearchIndex()
    {
        try
        {
            var success = await _searchService.RebuildSearchIndexAsync();

            if (success)
                return Ok(new { message = "Search index rebuilt successfully" });
            else
                return BadRequest("Failed to rebuild search index");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rebuilding search index");
            return StatusCode(500, "An error occurred while rebuilding search index");
        }
    }
}

// Additional request models for index operations
public class IndexContentRequest
{
    public string ContentId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class UpdateContentIndexRequest
{
    public string Content { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}
