using innkt.NeuroSpark.Models;

namespace innkt.NeuroSpark.Services;

public interface ISearchService
{
    // AI-Powered Search
    Task<SearchResponse> SearchAsync(SearchRequest request);
    Task<SearchResponse> SearchPostsAsync(SearchRequest request);
    Task<SearchResponse> SearchUsersAsync(SearchRequest request);
    Task<SearchResponse> SearchGroupsAsync(SearchRequest request);
    Task<SearchResponse> SearchHashtagsAsync(SearchRequest request);
    
    // Content Analysis
    Task<ContentAnalysisResponse> AnalyzeContentAsync(ContentAnalysisRequest request);
    Task<SentimentAnalysis> AnalyzeSentimentAsync(string content, string? language = null);
    Task<ToxicityAnalysis> AnalyzeToxicityAsync(string content);
    Task<ContentQuality> AnalyzeContentQualityAsync(string content);
    
    // Recommendations
    Task<RecommendationResponse> GetRecommendationsAsync(RecommendationRequest request);
    Task<RecommendationResponse> GetPostRecommendationsAsync(string userId, int count = 10);
    Task<RecommendationResponse> GetUserRecommendationsAsync(string userId, int count = 10);
    Task<RecommendationResponse> GetGroupRecommendationsAsync(string userId, int count = 10);
    
    // Trending Analysis
    Task<TrendingResponse> GetTrendingAsync(TrendingRequest request);
    Task<TrendingResponse> GetTrendingHashtagsAsync(int count = 20, string? location = null);
    Task<TrendingResponse> GetTrendingTopicsAsync(int count = 20, string? category = null);
    Task<TrendingResponse> GetTrendingUsersAsync(int count = 20, string? location = null);
    Task<TrendingResponse> GetTrendingGroupsAsync(int count = 20, string? category = null);
    
    // Search Analytics
    Task<SearchAnalytics> GetSearchAnalyticsAsync(string query, DateTime? since = null, DateTime? until = null);
    Task<Dictionary<string, int>> GetSearchStatsAsync(DateTime? since = null, DateTime? until = null);
    Task<string[]> GetSearchSuggestionsAsync(string partialQuery, int count = 10);
    
    // Search Optimization
    Task<bool> IndexContentAsync(string contentId, string content, string type, Dictionary<string, object> metadata);
    Task<bool> UpdateContentIndexAsync(string contentId, string content, Dictionary<string, object> metadata);
    Task<bool> RemoveContentFromIndexAsync(string contentId);
    Task<bool> RebuildSearchIndexAsync();
    
    // Advanced Search Features
    Task<SearchResponse> SemanticSearchAsync(SearchRequest request);
    Task<SearchResponse> VectorSearchAsync(string query, int count = 20);
    Task<SearchResponse> HybridSearchAsync(SearchRequest request);
    Task<SearchResponse> SearchWithFiltersAsync(SearchRequest request, SearchFilters filters);
}
