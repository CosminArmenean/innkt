using innkt.NeuroSpark.Models.XAI;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Services;

public class FreeTierFallbackService
{
    private readonly IXAIService _xaiService;
    private readonly ILogger<FreeTierFallbackService> _logger;

    public FreeTierFallbackService(IXAIService xaiService, ILogger<FreeTierFallbackService> logger)
    {
        _xaiService = xaiService;
        _logger = logger;
    }

    public async Task<GrokResponse> GenerateResponseWithFallbackAsync(string question, string context)
    {
        // Try X.AI API first
        if (await _xaiService.CanMakeRequestAsync())
        {
            try
            {
                var xaiResponse = await _xaiService.GenerateResponseAsync(question, context);
                return ConvertToGrokResponse(xaiResponse, question);
            }
            catch (RateLimitExceededException ex)
            {
                _logger.LogWarning("X.AI rate limit exceeded, falling back to mock response: {Error}", ex.Message);
            }
            catch (InsufficientTokensException ex)
            {
                _logger.LogWarning("X.AI insufficient tokens, falling back to mock response: {Error}", ex.Message);
            }
            catch (XAIApiException ex)
            {
                _logger.LogWarning("X.AI API error, falling back to mock response: {Error}", ex.Message);
            }
        }
        else
        {
            _logger.LogInformation("Daily limit reached, using fallback response");
        }

        // Fallback to enhanced mock response
        return await GenerateEnhancedMockResponseAsync(question, context);
    }

    private GrokResponse ConvertToGrokResponse(XAIResponse xaiResponse, string question)
    {
        var message = xaiResponse.Choices.FirstOrDefault()?.Message?.Content ?? "No response generated";
        
        return new GrokResponse
        {
            Id = Guid.NewGuid(),
            Question = question,
            Response = message,
            ResponseType = "xai_generated",
            ConfidenceScore = 0.9,
            SafetyScore = 1.0,
            IsKidSafe = true,
            Model = xaiResponse.Model,
            GeneratedAt = DateTime.UtcNow,
            Metadata = new Dictionary<string, object>
            {
                ["xai_usage"] = xaiResponse.Usage,
                ["xai_model"] = xaiResponse.Model,
                ["tokens_used"] = xaiResponse.Usage.TotalTokens
            }
        };
    }

    private async Task<GrokResponse> GenerateEnhancedMockResponseAsync(string question, string context)
    {
        // More sophisticated mock responses for free tier fallback
        var response = GenerateContextualResponse(question, context);
        
        return new GrokResponse
        {
            Id = Guid.NewGuid(),
            Question = question,
            Response = response,
            ResponseType = "fallback",
            ConfidenceScore = 0.6, // Lower confidence for fallback
            SafetyScore = 1.0,
            IsKidSafe = true,
            Model = "grok-mock-fallback",
            GeneratedAt = DateTime.UtcNow,
            Metadata = new Dictionary<string, object>
            {
                ["fallback_reason"] = "free_tier_limit",
                ["original_context"] = context,
                ["fallback_type"] = "enhanced_mock"
            }
        };
    }

    private string GenerateContextualResponse(string question, string context)
    {
        var lowerQuestion = question.ToLower();
        
        // Context-aware responses
        if (lowerQuestion.Contains("aloha"))
        {
            return "Aloha is a Hawaiian greeting meaning 'hello', 'goodbye', or 'love'. It's used to express warmth, affection, and respect in Hawaiian culture. The word carries deep cultural significance and represents the spirit of hospitality that Hawaiians are known for.";
        }
        
        if (lowerQuestion.Contains("hello") || lowerQuestion.Contains("hi"))
        {
            return "Hello! I'm Grok, your AI assistant. While I'm processing your request, I can help you with general questions and information. How can I assist you today?";
        }
        
        if (lowerQuestion.Contains("weather"))
        {
            return "I'd love to help with weather information! For the most accurate and up-to-date weather data, I recommend checking a reliable weather service or app. They have access to real-time meteorological data that I can't provide directly.";
        }
        
        if (lowerQuestion.Contains("time") || lowerQuestion.Contains("date"))
        {
            return $"The current time is approximately {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC. For precise local time, please check your device's clock or a time service.";
        }
        
        if (lowerQuestion.Contains("help") || lowerQuestion.Contains("what can you do"))
        {
            return "I'm Grok, an AI assistant! I can help with general questions, provide information on various topics, and engage in conversations. While I'm processing your request, feel free to ask me anything you'd like to know about!";
        }
        
        // Generic contextual response
        return $"That's an interesting question about '{ExtractMainTopic(question)}'! While I'm processing your request, here's what I can tell you based on general knowledge: {GenerateGenericResponse(question, context)}";
    }

    private string ExtractMainTopic(string question)
    {
        // Simple topic extraction
        var words = question.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var topicWords = words.Where(w => w.Length > 3 && !IsCommonWord(w)).Take(2);
        return string.Join(" ", topicWords);
    }

    private bool IsCommonWord(string word)
    {
        var commonWords = new[] { "what", "how", "why", "when", "where", "who", "can", "will", "should", "could", "would", "this", "that", "with", "from", "they", "them", "their", "there", "then", "than" };
        return commonWords.Contains(word.ToLower());
    }

    private string GenerateGenericResponse(string question, string context)
    {
        if (context.Contains("beautiful day"))
        {
            return "It sounds like you're enjoying a beautiful day! That's wonderful to hear. Beautiful days often bring positive energy and opportunities for great conversations.";
        }
        
        if (context.Contains("social") || context.Contains("post"))
        {
            return "Social interactions and sharing experiences are important parts of human connection. It's great that you're engaging with others and sharing your thoughts!";
        }
        
        return "I appreciate you sharing your question with me. While I work on providing a more detailed response, I'm here to help with any information you might need.";
    }
}
