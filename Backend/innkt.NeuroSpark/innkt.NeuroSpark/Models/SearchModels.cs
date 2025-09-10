using System.ComponentModel.DataAnnotations;

namespace innkt.NeuroSpark.Models;

public class SearchRequest
{
    [Required]
    public string Query { get; set; } = string.Empty;
    
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    
    public string? Type { get; set; } // "posts", "users", "groups", "all"
    public string? Category { get; set; } // "content", "users", "groups", "hashtags"
    public string? Location { get; set; }
    public DateTime? Since { get; set; }
    public DateTime? Until { get; set; }
    public string[]? Hashtags { get; set; }
    public string[]? Mentions { get; set; }
    public bool? IsPublic { get; set; }
    public bool? IsVerified { get; set; }
    public string? Language { get; set; } = "en";
    public string? SortBy { get; set; } = "relevance"; // "relevance", "date", "popularity"
    public string? SortOrder { get; set; } = "desc"; // "asc", "desc"
}

public class SearchResponse
{
    public List<SearchResult> Results { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
    public string Query { get; set; } = string.Empty;
    public string[] SuggestedQueries { get; set; } = Array.Empty<string>();
    public SearchFilters? AppliedFilters { get; set; }
    public SearchAnalytics? Analytics { get; set; }
}

public class SearchResult
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "post", "user", "group", "hashtag"
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? AvatarUrl { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    public string[] Mentions { get; set; } = Array.Empty<string>();
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int LikesCount { get; set; }
    public int CommentsCount { get; set; }
    public int ViewsCount { get; set; }
    public int MembersCount { get; set; }
    public bool IsVerified { get; set; }
    public bool IsPublic { get; set; }
    public double RelevanceScore { get; set; }
    public string? AuthorId { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorUsername { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class SearchFilters
{
    public string[] Types { get; set; } = Array.Empty<string>();
    public string[] Categories { get; set; } = Array.Empty<string>();
    public string[] Locations { get; set; } = Array.Empty<string>();
    public string[] Hashtags { get; set; } = Array.Empty<string>();
    public string[] Languages { get; set; } = Array.Empty<string>();
    public bool? IsVerified { get; set; }
    public bool? IsPublic { get; set; }
    public DateTime? Since { get; set; }
    public DateTime? Until { get; set; }
}

public class SearchAnalytics
{
    public int TotalResults { get; set; }
    public int ResultsByType { get; set; }
    public Dictionary<string, int> ResultsByCategory { get; set; } = new();
    public Dictionary<string, int> TopHashtags { get; set; } = new();
    public Dictionary<string, int> TopLocations { get; set; } = new();
    public Dictionary<string, int> TopAuthors { get; set; } = new();
    public double AverageRelevanceScore { get; set; }
    public TimeSpan SearchDuration { get; set; }
    public string[] SuggestedImprovements { get; set; } = Array.Empty<string>();
}

public class ContentAnalysisRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;
    
    public string? Type { get; set; } // "post", "comment", "description"
    public string? Language { get; set; } = "en";
    public bool ExtractHashtags { get; set; } = true;
    public bool ExtractMentions { get; set; } = true;
    public bool ExtractKeywords { get; set; } = true;
    public bool AnalyzeSentiment { get; set; } = true;
    public bool DetectLanguage { get; set; } = true;
    public bool CheckToxicity { get; set; } = true;
}

public class ContentAnalysisResponse
{
    public string Content { get; set; } = string.Empty;
    public string DetectedLanguage { get; set; } = string.Empty;
    public double LanguageConfidence { get; set; }
    public string[] ExtractedHashtags { get; set; } = Array.Empty<string>();
    public string[] ExtractedMentions { get; set; } = Array.Empty<string>();
    public string[] ExtractedKeywords { get; set; } = Array.Empty<string>();
    public SentimentAnalysis? Sentiment { get; set; }
    public ToxicityAnalysis? Toxicity { get; set; }
    public ContentQuality? Quality { get; set; }
    public string[] SuggestedTags { get; set; } = Array.Empty<string>();
    public string[] SuggestedImprovements { get; set; } = Array.Empty<string>();
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class SentimentAnalysis
{
    public string Sentiment { get; set; } = string.Empty; // "positive", "negative", "neutral"
    public double Score { get; set; } // -1.0 to 1.0
    public double Confidence { get; set; } // 0.0 to 1.0
    public string[] PositiveKeywords { get; set; } = Array.Empty<string>();
    public string[] NegativeKeywords { get; set; } = Array.Empty<string>();
}

public class ToxicityAnalysis
{
    public bool IsToxic { get; set; }
    public double ToxicityScore { get; set; } // 0.0 to 1.0
    public string[] DetectedToxicityTypes { get; set; } = Array.Empty<string>();
    public string[] ProblematicPhrases { get; set; } = Array.Empty<string>();
    public string[] SuggestedReplacements { get; set; } = Array.Empty<string>();
}

public class ContentQuality
{
    public double OverallScore { get; set; } // 0.0 to 1.0
    public int WordCount { get; set; }
    public int CharacterCount { get; set; }
    public double ReadabilityScore { get; set; }
    public string[] QualityIssues { get; set; } = Array.Empty<string>();
    public string[] QualityStrengths { get; set; } = Array.Empty<string>();
}

public class RecommendationRequest
{
    [Required]
    public string UserId { get; set; } = string.Empty;
    
    public string? Type { get; set; } // "posts", "users", "groups", "content"
    public int Count { get; set; } = 10;
    public string[]? ExcludeIds { get; set; }
    public string[]? IncludeCategories { get; set; }
    public string[]? ExcludeCategories { get; set; }
    public string? Location { get; set; }
    public string? Language { get; set; } = "en";
    public Dictionary<string, object> Preferences { get; set; } = new();
}

public class RecommendationResponse
{
    public List<RecommendationItem> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class RecommendationItem
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? AvatarUrl { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public double RelevanceScore { get; set; }
    public string[] Reasons { get; set; } = Array.Empty<string>();
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class TrendingRequest
{
    public string? Type { get; set; } // "hashtags", "topics", "users", "groups"
    public int Count { get; set; } = 20;
    public string? Location { get; set; }
    public string? Language { get; set; } = "en";
    public DateTime? Since { get; set; }
    public DateTime? Until { get; set; }
    public string? Category { get; set; }
}

public class TrendingResponse
{
    public List<TrendingItem> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class TrendingItem
{
    public string Name { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public int Count { get; set; }
    public double GrowthRate { get; set; }
    public string[] RelatedItems { get; set; } = Array.Empty<string>();
    public Dictionary<string, object> Metadata { get; set; } = new();
}
