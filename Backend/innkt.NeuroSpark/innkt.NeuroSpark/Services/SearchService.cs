using innkt.NeuroSpark.Models;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace innkt.NeuroSpark.Services;

public class SearchService : ISearchService
{
    private readonly ILogger<SearchService> _logger;
    private readonly IRedisService _redisService;
    private readonly IConfiguration _configuration;

    public SearchService(ILogger<SearchService> logger, IRedisService redisService, IConfiguration configuration)
    {
        _logger = logger;
        _redisService = redisService;
        _configuration = configuration;
    }

    public async Task<SearchResponse> SearchAsync(SearchRequest request)
    {
        try
        {
            _logger.LogInformation("Performing search for query: {Query}", request.Query);

            var startTime = DateTime.UtcNow;
            var results = new List<SearchResult>();

            // Determine search type and route accordingly
            switch (request.Type?.ToLower())
            {
                case "posts":
                    return await SearchPostsAsync(request);
                case "users":
                    return await SearchUsersAsync(request);
                case "groups":
                    return await SearchGroupsAsync(request);
                case "hashtags":
                    return await SearchHashtagsAsync(request);
                default:
                    return await HybridSearchAsync(request);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error performing search for query: {Query}", request.Query);
            return new SearchResponse
            {
                Query = request.Query,
                Results = new List<SearchResult>(),
                TotalCount = 0,
                Page = request.Page,
                PageSize = request.PageSize,
                HasNextPage = false,
                HasPreviousPage = false
            };
        }
    }

    public async Task<SearchResponse> SearchPostsAsync(SearchRequest request)
    {
        // This would integrate with the Social Service to search posts
        // For now, return mock data
        var results = new List<SearchResult>
        {
            new SearchResult
            {
                Id = Guid.NewGuid().ToString(),
                Type = "post",
                Title = "Sample Post",
                Content = $"This is a sample post containing '{request.Query}'",
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                LikesCount = 42,
                CommentsCount = 8,
                ViewsCount = 156,
                IsPublic = true,
                RelevanceScore = 0.85,
                AuthorId = "user123",
                AuthorName = "John Doe",
                AuthorUsername = "johndoe",
                Hashtags = new[] { "sample", "test" },
                Tags = new[] { "technology", "ai" }
            }
        };

        return new SearchResponse
        {
            Query = request.Query,
            Results = results,
            TotalCount = results.Count,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = false,
            HasPreviousPage = false,
            SuggestedQueries = GenerateSuggestions(request.Query)
        };
    }

    public async Task<SearchResponse> SearchUsersAsync(SearchRequest request)
    {
        // This would integrate with the Officer Service to search users
        var results = new List<SearchResult>
        {
            new SearchResult
            {
                Id = "user123",
                Type = "user",
                Title = "John Doe",
                Content = "Software Developer and AI Enthusiast",
                AvatarUrl = "https://example.com/avatar.jpg",
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                UpdatedAt = DateTime.UtcNow.AddDays(-5),
                IsVerified = true,
                IsPublic = true,
                RelevanceScore = 0.92,
                AuthorId = "user123",
                AuthorName = "John Doe",
                AuthorUsername = "johndoe",
                Tags = new[] { "developer", "ai", "tech" }
            }
        };

        return new SearchResponse
        {
            Query = request.Query,
            Results = results,
            TotalCount = results.Count,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = false,
            HasPreviousPage = false,
            SuggestedQueries = GenerateSuggestions(request.Query)
        };
    }

    public async Task<SearchResponse> SearchGroupsAsync(SearchRequest request)
    {
        // This would integrate with the Groups Service to search groups
        var results = new List<SearchResult>
        {
            new SearchResult
            {
                Id = "group123",
                Type = "group",
                Title = "AI Developers",
                Content = "A community for AI developers and enthusiasts",
                ImageUrl = "https://example.com/group-avatar.jpg",
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                UpdatedAt = DateTime.UtcNow.AddDays(-2),
                MembersCount = 1250,
                IsPublic = true,
                IsVerified = true,
                RelevanceScore = 0.88,
                Tags = new[] { "ai", "development", "community" }
            }
        };

        return new SearchResponse
        {
            Query = request.Query,
            Results = results,
            TotalCount = results.Count,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = false,
            HasPreviousPage = false,
            SuggestedQueries = GenerateSuggestions(request.Query)
        };
    }

    public async Task<SearchResponse> SearchHashtagsAsync(SearchRequest request)
    {
        var results = new List<SearchResult>
        {
            new SearchResult
            {
                Id = "hashtag123",
                Type = "hashtag",
                Title = "#" + request.Query,
                Content = $"Posts tagged with #{request.Query}",
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddDays(-1),
                RelevanceScore = 0.95,
                Tags = new[] { request.Query.ToLower() }
            }
        };

        return new SearchResponse
        {
            Query = request.Query,
            Results = results,
            TotalCount = results.Count,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = false,
            HasPreviousPage = false,
            SuggestedQueries = GenerateSuggestions(request.Query)
        };
    }

    public async Task<ContentAnalysisResponse> AnalyzeContentAsync(ContentAnalysisRequest request)
    {
        try
        {
            _logger.LogInformation("Analyzing content of type: {Type}", request.Type);

            var analysis = new ContentAnalysisResponse
            {
                Content = request.Content,
                DetectedLanguage = await DetectLanguageAsync(request.Content),
                LanguageConfidence = 0.95,
                ExtractedHashtags = request.ExtractHashtags ? ExtractHashtags(request.Content) : Array.Empty<string>(),
                ExtractedMentions = request.ExtractMentions ? ExtractMentions(request.Content) : Array.Empty<string>(),
                ExtractedKeywords = request.ExtractKeywords ? ExtractKeywords(request.Content) : Array.Empty<string>(),
                Sentiment = request.AnalyzeSentiment ? await AnalyzeSentimentAsync(request.Content, request.Language) : null,
                Toxicity = request.CheckToxicity ? await AnalyzeToxicityAsync(request.Content) : null,
                Quality = AnalyzeContentQuality(request.Content),
                SuggestedTags = GenerateSuggestedTags(request.Content),
                SuggestedImprovements = GenerateImprovementSuggestions(request.Content)
            };

            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing content");
            return new ContentAnalysisResponse
            {
                Content = request.Content,
                DetectedLanguage = "en",
                LanguageConfidence = 0.0
            };
        }
    }

    public async Task<SentimentAnalysis> AnalyzeSentimentAsync(string content, string? language = null)
    {
        // Simple sentiment analysis implementation
        var positiveWords = new[] { "good", "great", "excellent", "amazing", "wonderful", "fantastic", "love", "like", "happy", "joy" };
        var negativeWords = new[] { "bad", "terrible", "awful", "hate", "dislike", "sad", "angry", "frustrated", "disappointed" };

        var words = content.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var positiveCount = words.Count(w => positiveWords.Contains(w));
        var negativeCount = words.Count(w => negativeWords.Contains(w));

        var score = (positiveCount - negativeCount) / (double)Math.Max(words.Length, 1);
        var sentiment = score > 0.1 ? "positive" : score < -0.1 ? "negative" : "neutral";

        return new SentimentAnalysis
        {
            Sentiment = sentiment,
            Score = Math.Max(-1.0, Math.Min(1.0, score)),
            Confidence = Math.Min(1.0, Math.Abs(score) * 2),
            PositiveKeywords = words.Where(w => positiveWords.Contains(w)).ToArray(),
            NegativeKeywords = words.Where(w => negativeWords.Contains(w)).ToArray()
        };
    }

    public async Task<ToxicityAnalysis> AnalyzeToxicityAsync(string content)
    {
        // Simple toxicity detection
        var toxicPatterns = new[]
        {
            @"\b(hate|kill|murder|suicide|bomb|terrorist)\b",
            @"\b(fuck|shit|damn|bitch|asshole)\b",
            @"\b(nazi|hitler|kkk|white\s+supremacy)\b"
        };

        var isToxic = toxicPatterns.Any(pattern => Regex.IsMatch(content, pattern, RegexOptions.IgnoreCase));
        var problematicPhrases = toxicPatterns
            .SelectMany(pattern => Regex.Matches(content, pattern, RegexOptions.IgnoreCase)
                .Cast<Match>()
                .Select(m => m.Value))
            .ToArray();

        return new ToxicityAnalysis
        {
            IsToxic = isToxic,
            ToxicityScore = isToxic ? 0.8 : 0.1,
            DetectedToxicityTypes = isToxic ? new[] { "offensive_language" } : Array.Empty<string>(),
            ProblematicPhrases = problematicPhrases,
            SuggestedReplacements = Array.Empty<string>()
        };
    }

    public async Task<ContentQuality> AnalyzeContentQualityAsync(string content)
    {
        var wordCount = content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var characterCount = content.Length;
        var readabilityScore = CalculateReadabilityScore(content);

        var issues = new List<string>();
        var strengths = new List<string>();

        if (wordCount < 10) issues.Add("Content is too short");
        if (wordCount > 1000) issues.Add("Content is very long");
        if (characterCount > 5000) issues.Add("Content exceeds character limit");

        if (wordCount >= 50 && wordCount <= 500) strengths.Add("Good length");
        if (readabilityScore > 0.7) strengths.Add("Good readability");

        return new ContentQuality
        {
            OverallScore = CalculateOverallQualityScore(content),
            WordCount = wordCount,
            CharacterCount = characterCount,
            ReadabilityScore = readabilityScore,
            QualityIssues = issues.ToArray(),
            QualityStrengths = strengths.ToArray()
        };
    }

    public async Task<RecommendationResponse> GetRecommendationsAsync(RecommendationRequest request)
    {
        // This would integrate with other services to get personalized recommendations
        var items = new List<RecommendationItem>
        {
            new RecommendationItem
            {
                Id = "rec1",
                Type = request.Type ?? "posts",
                Title = "Recommended Content",
                Content = "This is a recommended post based on your interests",
                RelevanceScore = 0.85,
                Reasons = new[] { "Based on your interests", "Similar to content you liked" }
            }
        };

        return new RecommendationResponse
        {
            Items = items,
            TotalCount = items.Count,
            Type = request.Type ?? "posts",
            UserId = request.UserId
        };
    }

    public async Task<RecommendationResponse> GetPostRecommendationsAsync(string userId, int count = 10)
    {
        return await GetRecommendationsAsync(new RecommendationRequest
        {
            UserId = userId,
            Type = "posts",
            Count = count
        });
    }

    public async Task<RecommendationResponse> GetUserRecommendationsAsync(string userId, int count = 10)
    {
        return await GetRecommendationsAsync(new RecommendationRequest
        {
            UserId = userId,
            Type = "users",
            Count = count
        });
    }

    public async Task<RecommendationResponse> GetGroupRecommendationsAsync(string userId, int count = 10)
    {
        return await GetRecommendationsAsync(new RecommendationRequest
        {
            UserId = userId,
            Type = "groups",
            Count = count
        });
    }

    public async Task<TrendingResponse> GetTrendingAsync(TrendingRequest request)
    {
        var items = new List<TrendingItem>
        {
            new TrendingItem
            {
                Name = "AI",
                Value = "artificial intelligence",
                Count = 1250,
                GrowthRate = 0.15,
                RelatedItems = new[] { "machine learning", "deep learning", "neural networks" }
            },
            new TrendingItem
            {
                Name = "Technology",
                Value = "tech",
                Count = 980,
                GrowthRate = 0.12,
                RelatedItems = new[] { "innovation", "startup", "digital" }
            }
        };

        return new TrendingResponse
        {
            Items = items,
            TotalCount = items.Count,
            Type = request.Type ?? "hashtags",
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task<TrendingResponse> GetTrendingHashtagsAsync(int count = 20, string? location = null)
    {
        return await GetTrendingAsync(new TrendingRequest
        {
            Type = "hashtags",
            Count = count,
            Location = location
        });
    }

    public async Task<TrendingResponse> GetTrendingTopicsAsync(int count = 20, string? category = null)
    {
        return await GetTrendingAsync(new TrendingRequest
        {
            Type = "topics",
            Count = count,
            Category = category
        });
    }

    public async Task<TrendingResponse> GetTrendingUsersAsync(int count = 20, string? location = null)
    {
        return await GetTrendingAsync(new TrendingRequest
        {
            Type = "users",
            Count = count,
            Location = location
        });
    }

    public async Task<TrendingResponse> GetTrendingGroupsAsync(int count = 20, string? category = null)
    {
        return await GetTrendingAsync(new TrendingRequest
        {
            Type = "groups",
            Count = count,
            Category = category
        });
    }

    public async Task<SearchAnalytics> GetSearchAnalyticsAsync(string query, DateTime? since = null, DateTime? until = null)
    {
        return new SearchAnalytics
        {
            TotalResults = 100,
            ResultsByType = 5,
            ResultsByCategory = new Dictionary<string, int>
            {
                { "posts", 60 },
                { "users", 25 },
                { "groups", 15 }
            },
            TopHashtags = new Dictionary<string, int>
            {
                { "ai", 45 },
                { "tech", 32 },
                { "innovation", 28 }
            },
            AverageRelevanceScore = 0.75,
            SearchDuration = TimeSpan.FromMilliseconds(150)
        };
    }

    public async Task<Dictionary<string, int>> GetSearchStatsAsync(DateTime? since = null, DateTime? until = null)
    {
        return new Dictionary<string, int>
        {
            { "total_searches", 1250 },
            { "unique_queries", 890 },
            { "successful_searches", 1180 },
            { "failed_searches", 70 }
        };
    }

    public async Task<string[]> GetSearchSuggestionsAsync(string partialQuery, int count = 10)
    {
        var suggestions = new[]
        {
            "artificial intelligence",
            "machine learning",
            "deep learning",
            "neural networks",
            "data science",
            "programming",
            "technology",
            "innovation"
        };

        return suggestions
            .Where(s => s.StartsWith(partialQuery, StringComparison.OrdinalIgnoreCase))
            .Take(count)
            .ToArray();
    }

    // Placeholder implementations for advanced features
    public async Task<bool> IndexContentAsync(string contentId, string content, string type, Dictionary<string, object> metadata)
    {
        // Implementation would index content for search
        return true;
    }

    public async Task<bool> UpdateContentIndexAsync(string contentId, string content, Dictionary<string, object> metadata)
    {
        // Implementation would update indexed content
        return true;
    }

    public async Task<bool> RemoveContentFromIndexAsync(string contentId)
    {
        // Implementation would remove content from index
        return true;
    }

    public async Task<bool> RebuildSearchIndexAsync()
    {
        // Implementation would rebuild the entire search index
        return true;
    }

    public async Task<SearchResponse> SemanticSearchAsync(SearchRequest request)
    {
        // Implementation would use semantic search
        return await SearchAsync(request);
    }

    public async Task<SearchResponse> VectorSearchAsync(string query, int count = 20)
    {
        // Implementation would use vector search
        return new SearchResponse
        {
            Query = query,
            Results = new List<SearchResult>(),
            TotalCount = 0,
            Page = 1,
            PageSize = count,
            HasNextPage = false,
            HasPreviousPage = false
        };
    }

    public async Task<SearchResponse> HybridSearchAsync(SearchRequest request)
    {
        // Implementation would combine multiple search methods
        // For now, return a simple response to avoid infinite recursion
        return new SearchResponse
        {
            Query = request.Query,
            Results = new List<SearchResult>(),
            TotalCount = 0,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = false,
            HasPreviousPage = false
        };
    }

    public async Task<SearchResponse> SearchWithFiltersAsync(SearchRequest request, SearchFilters filters)
    {
        // Implementation would apply additional filters
        // For now, return a simple response to avoid infinite recursion
        return new SearchResponse
        {
            Query = request.Query,
            Results = new List<SearchResult>(),
            TotalCount = 0,
            Page = request.Page,
            PageSize = request.PageSize,
            HasNextPage = false,
            HasPreviousPage = false
        };
    }

    // Helper methods
    private string[] GenerateSuggestions(string query)
    {
        return new[]
        {
            $"{query} tutorial",
            $"{query} guide",
            $"{query} examples",
            $"best {query}",
            $"how to {query}"
        };
    }

    private async Task<string> DetectLanguageAsync(string content)
    {
        // Simple language detection
        var englishWords = new[] { "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by" };
        var words = content.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var englishCount = words.Count(w => englishWords.Contains(w));
        
        return englishCount > words.Length * 0.1 ? "en" : "unknown";
    }

    private string[] ExtractHashtags(string content)
    {
        var hashtagPattern = @"#\w+";
        return Regex.Matches(content, hashtagPattern)
            .Cast<Match>()
            .Select(m => m.Value.ToLower())
            .ToArray();
    }

    private string[] ExtractMentions(string content)
    {
        var mentionPattern = @"@\w+";
        return Regex.Matches(content, mentionPattern)
            .Cast<Match>()
            .Select(m => m.Value)
            .ToArray();
    }

    private string[] ExtractKeywords(string content)
    {
        var words = content.ToLower()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3)
            .GroupBy(w => w)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .Select(g => g.Key)
            .ToArray();

        return words;
    }

    private ContentQuality AnalyzeContentQuality(string content)
    {
        var wordCount = content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var characterCount = content.Length;
        var readabilityScore = CalculateReadabilityScore(content);

        return new ContentQuality
        {
            OverallScore = CalculateOverallQualityScore(content),
            WordCount = wordCount,
            CharacterCount = characterCount,
            ReadabilityScore = readabilityScore,
            QualityIssues = Array.Empty<string>(),
            QualityStrengths = Array.Empty<string>()
        };
    }

    private double CalculateReadabilityScore(string content)
    {
        // Simple readability calculation
        var words = content.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var sentences = content.Split(new char[] { '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries);
        
        if (sentences.Length == 0) return 0;
        
        var avgWordsPerSentence = words.Length / (double)sentences.Length;
        var avgSyllablesPerWord = words.Average(w => CountSyllables(w));
        
        // Simplified Flesch Reading Ease formula
        var score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        return Math.Max(0, Math.Min(1, score / 100));
    }

    private int CountSyllables(string word)
    {
        word = word.ToLower();
        var vowels = "aeiouy";
        var syllableCount = 0;
        var previousWasVowel = false;

        foreach (var c in word)
        {
            var isVowel = vowels.Contains(c);
            if (isVowel && !previousWasVowel)
            {
                syllableCount++;
            }
            previousWasVowel = isVowel;
        }

        if (word.EndsWith("e"))
        {
            syllableCount--;
        }

        return Math.Max(1, syllableCount);
    }

    private double CalculateOverallQualityScore(string content)
    {
        var wordCount = content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        var readabilityScore = CalculateReadabilityScore(content);
        
        // Simple quality scoring
        var lengthScore = Math.Min(1.0, wordCount / 100.0);
        var overallScore = (lengthScore + readabilityScore) / 2.0;
        
        return Math.Max(0, Math.Min(1, overallScore));
    }

    private string[] GenerateSuggestedTags(string content)
    {
        var keywords = ExtractKeywords(content);
        return keywords.Take(5).ToArray();
    }

    private string[] GenerateImprovementSuggestions(string content)
    {
        var suggestions = new List<string>();
        
        if (content.Length < 50)
        {
            suggestions.Add("Consider adding more detail to your content");
        }
        
        if (!content.Contains('#'))
        {
            suggestions.Add("Consider adding hashtags to increase discoverability");
        }
        
        if (!content.Contains('@'))
        {
            suggestions.Add("Consider mentioning other users to increase engagement");
        }
        
        return suggestions.ToArray();
    }
}
