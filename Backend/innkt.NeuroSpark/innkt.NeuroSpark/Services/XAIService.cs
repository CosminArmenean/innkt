using innkt.NeuroSpark.Models.XAI;
using Microsoft.Extensions.Options;
using System.Text;
using System.Text.Json;

namespace innkt.NeuroSpark.Services;

public class XAIService : IXAIService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<XAIService> _logger;
    private readonly XAIConfiguration _config;
    private readonly IDailyUsageTracker _usageTracker;
    private readonly ISmartTokenManager _tokenManager;
    private readonly IFreeTierRateLimiter _rateLimiter;

    public XAIService(
        HttpClient httpClient, 
        ILogger<XAIService> logger, 
        IOptions<XAIConfiguration> config,
        IDailyUsageTracker usageTracker,
        ISmartTokenManager tokenManager,
        IFreeTierRateLimiter rateLimiter)
    {
        _httpClient = httpClient;
        _logger = logger;
        _config = config.Value;
        _usageTracker = usageTracker;
        _tokenManager = tokenManager;
        _rateLimiter = rateLimiter;

        // Configure HttpClient
        _httpClient.BaseAddress = new Uri(_config.BaseUrl);
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_config.ApiKey}");
        _httpClient.Timeout = TimeSpan.FromSeconds(_config.TimeoutSeconds);
    }

    public async Task<XAIResponse> GenerateResponseAsync(string question, string context)
    {
        try
        {
            _logger.LogInformation("🤖 Generating X.AI response for question: {Question}", question);

            // Check if we can make a request
            if (!await _rateLimiter.TryAcquireRequestAsync())
            {
                throw new RateLimitExceededException("Rate limit exceeded");
            }

            try
            {
                // Calculate optimal token usage
                var maxTokens = await _tokenManager.CalculateOptimalMaxTokensAsync(question, context);
                
                // Check if we have enough tokens
                if (!await _usageTracker.CanUseTokensAsync(maxTokens))
                {
                    throw new InsufficientTokensException("Insufficient tokens for request");
                }

                // Create request
                var request = new XAIRequest
                {
                    Model = _config.Model,
                    MaxTokens = maxTokens,
                    Temperature = _config.Temperature,
                    Messages = new List<XAIMessage>
                    {
                        new XAIMessage
                        {
                            Role = "system",
                            Content = "You are Grok, a helpful AI assistant. Provide concise, accurate, and helpful responses. Keep responses appropriate for all audiences."
                        },
                        new XAIMessage
                        {
                            Role = "user",
                            Content = $"{question}\n\nContext: {context}"
                        }
                    }
                };

                // Make API call
                var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                });

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("chat/completions", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var xaiResponse = JsonSerializer.Deserialize<XAIResponse>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
                    });

                    if (xaiResponse != null)
                    {
                        // Track usage
                        await _usageTracker.TrackUsageAsync(xaiResponse.Usage.TotalTokens);
                        
                        _logger.LogInformation("✅ X.AI response generated successfully. Tokens used: {Tokens}", 
                            xaiResponse.Usage.TotalTokens);
                        
                        return xaiResponse;
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("X.AI API error: {StatusCode} - {Error}", response.StatusCode, errorContent);
                    
                    throw new XAIApiException($"X.AI API error: {response.StatusCode}");
                }
            }
            finally
            {
                _rateLimiter.ReleaseRequest();
            }
        }
        catch (Exception ex) when (!(ex is RateLimitExceededException || ex is InsufficientTokensException))
        {
            _logger.LogError(ex, "❌ Error calling X.AI API");
            throw;
        }

        throw new XAIApiException("Failed to generate response");
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            // Simple health check - try to make a minimal request
            var request = new XAIRequest
            {
                Model = _config.Model,
                MaxTokens = 10,
                Messages = new List<XAIMessage>
                {
                    new XAIMessage { Role = "user", Content = "Hi" }
                }
            };

            var json = JsonSerializer.Serialize(request, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("chat/completions", content);
            
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<DailyUsage> GetTodayUsageAsync()
    {
        return await _usageTracker.GetTodayUsageAsync();
    }

    public async Task<bool> CanMakeRequestAsync()
    {
        return await _usageTracker.CanMakeRequestAsync();
    }

    public async Task<bool> CanUseTokensAsync(int requestedTokens)
    {
        return await _usageTracker.CanUseTokensAsync(requestedTokens);
    }

    public async Task TrackUsageAsync(int tokensUsed)
    {
        await _usageTracker.TrackUsageAsync(tokensUsed);
    }
}

// Custom exceptions
public class RateLimitExceededException : Exception
{
    public RateLimitExceededException(string message) : base(message) { }
}

public class InsufficientTokensException : Exception
{
    public InsufficientTokensException(string message) : base(message) { }
}

public class XAIApiException : Exception
{
    public XAIApiException(string message) : base(message) { }
}
