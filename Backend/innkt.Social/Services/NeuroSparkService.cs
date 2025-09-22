using innkt.Social.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace innkt.Social.Services;

public class NeuroSparkService : INeuroSparkService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NeuroSparkService> _logger;
    private readonly IConfiguration _configuration;
    private readonly string _neuroSparkBaseUrl;

    public NeuroSparkService(HttpClient httpClient, IConfiguration configuration, ILogger<NeuroSparkService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
        _neuroSparkBaseUrl = configuration["NeuroSpark:BaseUrl"] ?? "http://localhost:5002";
    }

    public async Task<NeuroSparkGrokResponse> ProcessGrokRequestAsync(NeuroSparkGrokRequest request)
    {
        try
        {
            _logger.LogInformation("Sending Grok request to NeuroSpark Service: {RequestId}", request.RequestId);

            var requestBody = new
            {
                postContent = request.PostContent,
                userQuestion = request.UserQuestion,
                requestId = request.RequestId,
                postId = request.PostId,
                userId = request.UserId,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Set timeout for NeuroSpark call
            _httpClient.Timeout = TimeSpan.FromMinutes(5);

            var response = await _httpClient.PostAsync($"{_neuroSparkBaseUrl}/api/grok/internal/process", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("NeuroSpark response content: {ResponseContent}", responseContent);
                
                var grokResponse = JsonSerializer.Deserialize<GrokResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                _logger.LogInformation("Grok request {RequestId} processed successfully by NeuroSpark", request.RequestId);
                
                // Map GrokResponse to NeuroSparkGrokResponse
                return new NeuroSparkGrokResponse
                {
                    Response = grokResponse?.Response ?? "I apologize, but I couldn't generate a response at this time.",
                    Status = grokResponse?.Status ?? "completed",
                    ProcessedAt = grokResponse?.CreatedAt ?? DateTime.UtcNow
                };
            }
            else
            {
                _logger.LogWarning("NeuroSpark returned error status: {StatusCode} for request {RequestId}", 
                    response.StatusCode, request.RequestId);
                
                return new NeuroSparkGrokResponse
                {
                    Response = "I apologize, but I'm having trouble processing your request right now. Please try again later.",
                    Status = "failed"
                };
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error calling NeuroSpark for request {RequestId}", request.RequestId);
            return new NeuroSparkGrokResponse
            {
                Response = "I apologize, but I'm currently unavailable. Please try again later.",
                Status = "failed"
            };
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout calling NeuroSpark for request {RequestId}", request.RequestId);
            return new NeuroSparkGrokResponse
            {
                Response = "I apologize, but your request timed out. Please try again with a shorter question.",
                Status = "failed"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error calling NeuroSpark for request {RequestId}", request.RequestId);
            return new NeuroSparkGrokResponse
            {
                Response = "I apologize, but I encountered an unexpected error. Please try again later.",
                Status = "failed"
            };
        }
    }

}

// GrokResponse model from NeuroSpark service
public class GrokResponse
{
    public string Id { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public string Status { get; set; } = "completed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}
