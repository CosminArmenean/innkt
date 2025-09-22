using innkt.Social.DTOs;
using innkt.Social.Data;
using innkt.Social.Models.MongoDB;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace innkt.Social.Services;

public class GrokService : IGrokService
{
    private readonly MongoDbContext _mongoContext;
    private readonly ILogger<GrokService> _logger;
    private readonly INeuroSparkService _neuroSparkService;
    private readonly IMongoCommentService _commentService;
    private readonly HttpClient _httpClient;
    private readonly string _notificationServiceUrl;

    public GrokService(
        MongoDbContext mongoContext,
        ILogger<GrokService> logger,
        INeuroSparkService neuroSparkService,
        IMongoCommentService commentService,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _mongoContext = mongoContext;
        _logger = logger;
        _neuroSparkService = neuroSparkService;
        _commentService = commentService;
        _httpClient = httpClient;
        _notificationServiceUrl = configuration["NotificationService:BaseUrl"] ?? "http://localhost:5006";
    }

    public async Task<GrokResponseDto> ProcessGrokRequestAsync(GrokRequestDto request, Guid userId)
    {
        try
        {
            var requestId = Guid.NewGuid().ToString();
            
            // Create initial response record
            var grokResponse = new GrokResponseDto
            {
                Id = requestId,
                Response = "🤖 Processing your Grok AI request... This may take a few moments.",
                Status = "processing",
                CreatedAt = DateTime.UtcNow,
                PostId = request.PostId,
                CommentId = request.CommentId,
                UserId = userId.ToString()
            };

            // Store in MongoDB for tracking
            await StoreGrokRequestAsync(requestId, request, userId);

            // Send to NeuroSpark service asynchronously
            _ = Task.Run(async () =>
            {
                try
                {
                    await ProcessGrokRequestAsync(requestId, request, userId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing Grok request {RequestId}", requestId);
                    await UpdateGrokStatusAsync(requestId, "failed", "Failed to process request");
                }
            });

            _logger.LogInformation("Grok request {RequestId} initiated for user {UserId}", requestId, userId);
            return grokResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating Grok request for user {UserId}", userId);
            throw;
        }
    }

    private async Task ProcessGrokRequestAsync(string requestId, GrokRequestDto request, Guid userId)
    {
        try
        {
            _logger.LogInformation("🤖 Starting background processing for Grok request {RequestId}", requestId);

            // Step 1: Send to NeuroSpark service (Port 5003)
            _logger.LogInformation("📤 Sending request to NeuroSpark service for {RequestId}", requestId);
            var neuroSparkResponse = await _neuroSparkService.ProcessGrokRequestAsync(new NeuroSparkGrokRequest
            {
                PostContent = request.PostContent,
                UserQuestion = request.UserQuestion,
                RequestId = requestId
            });

            _logger.LogInformation("📥 Received response from NeuroSpark for {RequestId}", requestId);

            // Step 2: Update status to completed
            await UpdateGrokStatusAsync(requestId, "completed", neuroSparkResponse.Response);

            // Step 3: Create AI comment as reply in MongoDB
            _logger.LogInformation("💬 Creating AI comment for {RequestId}", requestId);
            await CreateGrokCommentAsync(requestId, request, userId, neuroSparkResponse.Response);

            // Step 4: Send notification to user via Notification Service
            _logger.LogInformation("🔔 Sending notification for {RequestId}", requestId);
            await SendGrokNotificationAsync(userId, requestId, request.PostId, request.CommentId);

            _logger.LogInformation("✅ Grok request {RequestId} completed successfully", requestId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing Grok request {RequestId}", requestId);
            await UpdateGrokStatusAsync(requestId, "failed", "Failed to process request");
            
            // Send failure notification
            await SendGrokNotificationAsync(userId, requestId, request.PostId, request.CommentId, "failed");
        }
    }

    private async Task StoreGrokRequestAsync(string requestId, GrokRequestDto request, Guid userId)
    {
        var grokRequest = new MongoGrokRequest
        {
            Id = requestId,
            PostId = Guid.Parse(request.PostId),
            CommentId = Guid.Parse(request.CommentId),
            UserId = userId,
            PostContent = request.PostContent,
            UserQuestion = request.UserQuestion,
            Status = "processing",
            CreatedAt = DateTime.UtcNow
        };

        await _mongoContext.GrokRequests.InsertOneAsync(grokRequest);
    }

    private async Task UpdateGrokStatusAsync(string requestId, string status, string response)
    {
        var filter = Builders<MongoGrokRequest>.Filter.Eq(r => r.Id, requestId);
        var update = Builders<MongoGrokRequest>.Update
            .Set(r => r.Status, status)
            .Set(r => r.Response, response)
            .Set(r => r.UpdatedAt, DateTime.UtcNow);

        if (status == "completed")
        {
            update = update.Set(r => r.CompletedAt, DateTime.UtcNow);
        }

        await _mongoContext.GrokRequests.UpdateOneAsync(filter, update);
    }

    private async Task CreateGrokCommentAsync(string requestId, GrokRequestDto request, Guid userId, string response)
    {
        try
        {
            // Create AI comment as reply to the original comment
            var commentRequest = new CreateCommentRequest
            {
                Content = $"🤖 **Grok AI Response:**\n\n{response}\n\n*This response was generated by Grok AI based on your question about the post.*",
                ParentCommentId = Guid.Parse(request.CommentId)
            };

            // Use a special AI user ID for Grok responses
            var grokUserId = Guid.Parse("00000000-0000-0000-0000-000000000001"); // Special AI user ID
            
            await _commentService.CreateCommentAsync(Guid.Parse(request.PostId), grokUserId, commentRequest);
            
            _logger.LogInformation("Grok AI comment created for request {RequestId}", requestId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating Grok AI comment for request {RequestId}", requestId);
            throw;
        }
    }

    private async Task SendGrokNotificationAsync(Guid userId, string requestId, string postId, string commentId, string status = "completed")
    {
        try
        {
            var notification = new
            {
                userId = userId.ToString(),
                type = "grok_response",
                title = status == "completed" ? "🤖 Grok AI Response Ready" : "❌ Grok AI Request Failed",
                message = status == "completed" 
                    ? "Your Grok AI response has been generated and posted as a comment." 
                    : "Sorry, your Grok AI request could not be processed. Please try again later.",
                data = new
                {
                    requestId = requestId,
                    postId = postId,
                    commentId = commentId,
                    action = status == "completed" ? "view_comment" : "retry_request",
                    source = "grok_ai",
                    status = status
                },
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                priority = status == "completed" ? "normal" : "high",
                category = "ai_response"
            };

            var json = JsonSerializer.Serialize(notification, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation("Sending Grok notification to Notification Service for user {UserId}", userId);
            var response = await _httpClient.PostAsync($"{_notificationServiceUrl}/api/notifications/send", content);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Grok notification sent successfully to user {UserId} for request {RequestId}", userId, requestId);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Failed to send Grok notification to user {UserId}. Status: {StatusCode}, Error: {Error}", 
                    userId, response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Grok notification for request {RequestId}", requestId);
        }
    }

    public async Task<GrokResponseDto?> GetGrokStatusAsync(string requestId, Guid userId)
    {
        try
        {
            var filter = Builders<MongoGrokRequest>.Filter.And(
                Builders<MongoGrokRequest>.Filter.Eq(r => r.Id, requestId),
                Builders<MongoGrokRequest>.Filter.Eq(r => r.UserId, userId)
            );

            var grokRequest = await _mongoContext.GrokRequests.Find(filter).FirstOrDefaultAsync();
            if (grokRequest == null)
                return null;

            return new GrokResponseDto
            {
                Id = grokRequest.Id,
                Response = grokRequest.Response ?? "Processing...",
                Status = grokRequest.Status,
                CreatedAt = grokRequest.CreatedAt,
                CompletedAt = grokRequest.CompletedAt,
                PostId = grokRequest.PostId.ToString(),
                CommentId = grokRequest.CommentId.ToString(),
                UserId = grokRequest.UserId.ToString()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Grok status for request {RequestId}", requestId);
            throw;
        }
    }


    public async Task ProcessCompletedGrokResponseAsync(string requestId, string response)
    {
        try
        {
            var filter = Builders<MongoGrokRequest>.Filter.Eq(r => r.Id, requestId);
            var update = Builders<MongoGrokRequest>.Update
                .Set(r => r.Status, "completed")
                .Set(r => r.Response, response)
                .Set(r => r.CompletedAt, DateTime.UtcNow)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);

            await _mongoContext.GrokRequests.UpdateOneAsync(filter, update);
            _logger.LogInformation("Grok request {RequestId} marked as completed", requestId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing completed Grok response for request {RequestId}", requestId);
            throw;
        }
    }
}
