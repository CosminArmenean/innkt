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
using innkt.Common.Services;
using innkt.Common.Models.Events;

namespace innkt.Social.Services;

public class GrokService : IGrokService
{
    private readonly MongoDbContext _mongoContext;
    private readonly ILogger<GrokService> _logger;
    private readonly INeuroSparkService _neuroSparkService;
    private readonly IMongoCommentService _commentService;
    private readonly IEventPublisher _eventPublisher;

    public GrokService(
        MongoDbContext mongoContext,
        ILogger<GrokService> logger,
        INeuroSparkService neuroSparkService,
        IMongoCommentService commentService,
        IEventPublisher eventPublisher)
    {
        _mongoContext = mongoContext;
        _logger = logger;
        _neuroSparkService = neuroSparkService;
        _commentService = commentService;
        _eventPublisher = eventPublisher;
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

            // Step 4: Publish Grok response event
            _logger.LogInformation("📤 Publishing Grok response event for {RequestId}", requestId);
            await PublishGrokResponseEventAsync(userId, requestId, request.PostId, request.CommentId, "completed");

            _logger.LogInformation("✅ Grok request {RequestId} completed successfully", requestId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing Grok request {RequestId}", requestId);
            await UpdateGrokStatusAsync(requestId, "failed", "Failed to process request");
            
            // Publish failure event
            await PublishGrokResponseEventAsync(userId, requestId, request.PostId, request.CommentId, "failed");
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

    private async Task PublishGrokResponseEventAsync(Guid userId, string requestId, string postId, string commentId, string status = "completed")
    {
        try
        {
            var grokEvent = new GrokEvent
            {
                EventType = "grok_response",
                UserId = userId.ToString(),
                PostId = postId,
                OriginalCommentId = commentId,
                GrokCommentId = commentId, // Will be updated when AI comment is created
                OriginalQuestion = "", // Will be extracted from the original comment
                Confidence = status == "completed" ? 0.9 : 0.0,
                Data = new
                {
                    requestId = requestId,
                    postId = postId,
                    commentId = commentId,
                    status = status,
                    timestamp = DateTime.UtcNow,
                    title = status == "completed" ? "🤖 Grok AI Response Ready" : "❌ Grok AI Request Failed",
                    message = status == "completed" 
                        ? "Your Grok AI response is ready! Check the comments section."
                        : "Sorry, there was an issue processing your Grok AI request. Please try again.",
                    action = status == "completed" ? "view_comment" : "retry_request",
                    source = "grok_ai",
                    category = "ai_response"
                }
            };

            await _eventPublisher.PublishGrokEventAsync(grokEvent);
            _logger.LogInformation("📤 Grok response event published for user {UserId}, request {RequestId}", userId, requestId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish Grok response event for request {RequestId}", requestId);
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
