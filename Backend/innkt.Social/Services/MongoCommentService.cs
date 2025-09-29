using MongoDB.Driver;
using innkt.Social.Data;
using innkt.Social.DTOs;
using innkt.Social.Models.MongoDB;
using AutoMapper;
using innkt.Common.Services;
using innkt.Common.Models.Events;

namespace innkt.Social.Services;

public class MongoCommentService : IMongoCommentService
{
    private readonly MongoDbContext _mongoContext;
    private readonly ILogger<MongoCommentService> _logger;
    private readonly IMapper _mapper;
    private readonly IOfficerService _officerService;
    private readonly INeuroSparkService _neuroSparkService;
    private readonly IEventPublisher _eventPublisher;

    public MongoCommentService(
        MongoDbContext mongoContext, 
        ILogger<MongoCommentService> logger, 
        IMapper mapper,
        IOfficerService officerService,
        INeuroSparkService neuroSparkService,
        IEventPublisher eventPublisher)
    {
        _mongoContext = mongoContext;
        _logger = logger;
        _mapper = mapper;
        _officerService = officerService;
        _neuroSparkService = neuroSparkService;
        _eventPublisher = eventPublisher;
    }

    public async Task<CommentResponse> CreateCommentAsync(Guid postId, Guid userId, CreateCommentRequest request)
    {
        try
        {
            // Verify post exists in MongoDB
            var postFilter = Builders<MongoPost>.Filter.And(
                Builders<MongoPost>.Filter.Eq(p => p.PostId, postId),
                Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)
            );
            
            var post = await _mongoContext.Posts.Find(postFilter).FirstOrDefaultAsync();
            if (post == null)
                throw new KeyNotFoundException("Post not found");

            // Check depth limit before creating comment
            var calculatedDepth = await CalculateCommentDepth(request.ParentCommentId);
            const int MAX_DEPTH = 3; // Allow up to 4 levels (0-3)
            
            if (calculatedDepth > MAX_DEPTH)
            {
                throw new InvalidOperationException($"Cannot create comment: Maximum nesting depth of {MAX_DEPTH + 1} levels exceeded. Current depth would be {calculatedDepth + 1}.");
            }

            // Get user snapshot for caching
            var userSnapshot = await GetOrCreateUserSnapshotAsync(userId);

            var comment = new MongoComment
            {
                PostId = postId,
                UserId = userId,
                Content = request.Content,
                ParentCommentId = request.ParentCommentId,
                UserSnapshot = userSnapshot,
                Depth = calculatedDepth,
                ThreadPath = await BuildThreadPath(request.ParentCommentId)
            };

            await _mongoContext.Comments.InsertOneAsync(comment);

            // Update comment count on post
            var updateFilter = Builders<MongoPost>.Filter.Eq(p => p.PostId, postId);
            var update = Builders<MongoPost>.Update.Inc(p => p.CommentsCount, 1);
            await _mongoContext.Posts.UpdateOneAsync(updateFilter, update);

            // Update parent comment replies count if this is a reply
            if (request.ParentCommentId.HasValue)
            {
                var parentUpdateFilter = Builders<MongoComment>.Filter.Eq(c => c.CommentId, request.ParentCommentId.Value);
                var parentUpdate = Builders<MongoComment>.Update.Inc(c => c.RepliesCount, 1);
                await _mongoContext.Comments.UpdateOneAsync(parentUpdateFilter, parentUpdate);
            }

            _logger.LogInformation("Created comment {CommentId} for post {PostId} by user {UserId}", 
                comment.CommentId, postId, userId);

            // Check for @grok mentions and process asynchronously
            if (request.Content.Contains("@grok", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogInformation("🤖 @grok mention detected in comment {CommentId}, processing asynchronously", comment.CommentId);
                
                // Process @grok mention in background (fire-and-forget)
                _ = Task.Run(async () => await ProcessGrokMentionAsync(comment.CommentId, postId, userId, request.Content));
            }

            // Publish comment created event for notifications (not feed)
            _ = Task.Run(async () => await PublishCommentCreatedEventAsync(comment, postId, userId));

            return await GetCommentByIdAsync(comment.CommentId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating comment for post {PostId} by user {UserId}", postId, userId);
            throw;
        }
    }

    public async Task<CommentListResponse> GetPostCommentsAsync(Guid postId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        try
        {
            var filter = Builders<MongoComment>.Filter.And(
                Builders<MongoComment>.Filter.Eq(c => c.PostId, postId),
                Builders<MongoComment>.Filter.Eq(c => c.ParentCommentId, null), // Only top-level comments
                Builders<MongoComment>.Filter.Eq(c => c.IsDeleted, false)
            );

            var totalCount = await _mongoContext.Comments.CountDocumentsAsync(filter);

            var comments = await _mongoContext.Comments
                .Find(filter)
                .Sort(Builders<MongoComment>.Sort.Descending(c => c.CreatedAt))
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            // Load only first-level comments (no nested replies initially)
            var commentResponses = new List<CommentResponse>();
            foreach (var comment in comments)
            {
                var commentResponse = await MapToCommentResponse(comment, currentUserId);
                
                // Don't load nested replies initially - they will be loaded on-demand
                commentResponse.Replies = new List<CommentResponse>();
                commentResponses.Add(commentResponse);
            }

            return new CommentListResponse
            {
                Comments = commentResponses,
                TotalCount = (int)totalCount,
                Page = page,
                PageSize = pageSize,
                HasNextPage = page * pageSize < totalCount,
                HasPreviousPage = page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comments for post {PostId}", postId);
            throw;
        }
    }

    public async Task<CommentListResponse> GetNestedCommentsAsync(Guid parentCommentId, int page = 1, int pageSize = 20, Guid? currentUserId = null)
    {
        try
        {
            var filter = Builders<MongoComment>.Filter.And(
                Builders<MongoComment>.Filter.Eq(c => c.ParentCommentId, parentCommentId),
                Builders<MongoComment>.Filter.Eq(c => c.IsDeleted, false)
            );

            var totalCount = await _mongoContext.Comments.CountDocumentsAsync(filter);

            var comments = await _mongoContext.Comments
                .Find(filter)
                .Sort(Builders<MongoComment>.Sort.Ascending(c => c.CreatedAt))
                .Skip((page - 1) * pageSize)
                .Limit(pageSize)
                .ToListAsync();

            // Load replies for each comment (but not recursively - just one level)
            var commentResponses = new List<CommentResponse>();
            foreach (var comment in comments)
            {
                var commentResponse = await MapToCommentResponse(comment, currentUserId);
                
                // Load only direct replies (one level down)
                commentResponse.Replies = await LoadNestedRepliesAsync(comment.CommentId, currentUserId, 0);
                commentResponses.Add(commentResponse);
            }

            return new CommentListResponse
            {
                Comments = commentResponses,
                TotalCount = (int)totalCount,
                Page = page,
                PageSize = pageSize,
                HasNextPage = page * pageSize < totalCount,
                HasPreviousPage = page > 1
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nested comments for parent {ParentCommentId}", parentCommentId);
            throw;
        }
    }

    public async Task<int> GetNestedCommentsCountAsync(Guid parentCommentId)
    {
        try
        {
            var filter = Builders<MongoComment>.Filter.And(
                Builders<MongoComment>.Filter.Eq(c => c.ParentCommentId, parentCommentId),
                Builders<MongoComment>.Filter.Eq(c => c.IsDeleted, false)
            );

            return (int)await _mongoContext.Comments.CountDocumentsAsync(filter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting nested comments count for parent {ParentCommentId}", parentCommentId);
            return 0;
        }
    }

    public async Task<CommentResponse> GetCommentByIdAsync(Guid commentId, Guid? currentUserId = null)
    {
        try
        {
            var filter = Builders<MongoComment>.Filter.And(
                Builders<MongoComment>.Filter.Eq(c => c.CommentId, commentId),
                Builders<MongoComment>.Filter.Eq(c => c.IsDeleted, false)
            );

            var comment = await _mongoContext.Comments.Find(filter).FirstOrDefaultAsync();
            if (comment == null)
                throw new KeyNotFoundException("Comment not found");

            return await MapToCommentResponse(comment, currentUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting comment {CommentId}", commentId);
            throw;
        }
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId)
    {
        try
        {
            var filter = Builders<MongoComment>.Filter.And(
                Builders<MongoComment>.Filter.Eq(c => c.CommentId, commentId),
                Builders<MongoComment>.Filter.Eq(c => c.UserId, userId),
                Builders<MongoComment>.Filter.Eq(c => c.IsDeleted, false)
            );

            var comment = await _mongoContext.Comments.Find(filter).FirstOrDefaultAsync();
            if (comment == null)
                return false;

            // Soft delete
            comment.SoftDelete();
            await _mongoContext.Comments.ReplaceOneAsync(filter, comment);

            // Update post comment count
            var postUpdateFilter = Builders<MongoPost>.Filter.Eq(p => p.PostId, comment.PostId);
            var postUpdate = Builders<MongoPost>.Update.Inc(p => p.CommentsCount, -1);
            await _mongoContext.Posts.UpdateOneAsync(postUpdateFilter, postUpdate);

            // Update parent comment replies count if this was a reply
            if (comment.ParentCommentId.HasValue)
            {
                var parentUpdateFilter = Builders<MongoComment>.Filter.Eq(c => c.CommentId, comment.ParentCommentId.Value);
                var parentUpdate = Builders<MongoComment>.Update.Inc(c => c.RepliesCount, -1);
                await _mongoContext.Comments.UpdateOneAsync(parentUpdateFilter, parentUpdate);
            }

            _logger.LogInformation("Deleted comment {CommentId} by user {UserId}", commentId, userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting comment {CommentId}", commentId);
            throw;
        }
    }

    private async Task<CommentResponse> MapToCommentResponse(MongoComment comment, Guid? currentUserId)
    {
        var response = new CommentResponse
        {
            Id = comment.CommentId,
            PostId = comment.PostId,
            UserId = comment.UserId,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            LikesCount = comment.LikesCount,
            RepliesCount = comment.RepliesCount,
            ParentCommentId = comment.ParentCommentId
        };

        // Use cached user data if available and fresh
        if (comment.UserSnapshot != null && !comment.NeedsUserRefresh)
        {
            response.Author = new UserBasicInfo
            {
                Id = Guid.Parse(comment.UserSnapshot.UserId),
                Username = comment.UserSnapshot.Username,
                DisplayName = comment.UserSnapshot.DisplayName,
                AvatarUrl = comment.UserSnapshot.AvatarUrl,
                IsVerified = comment.UserSnapshot.IsVerified
            };
        }
        else
        {
            // Fallback to fresh user data
            try
            {
                var userProfile = await _officerService.GetUserByIdAsync(comment.UserId);
                response.Author = new UserBasicInfo
                {
                    Id = userProfile.Id,
                    Username = userProfile.Username ?? "Unknown User",
                    DisplayName = userProfile.DisplayName ?? "Unknown User",
                    AvatarUrl = userProfile.AvatarUrl,
                    IsVerified = userProfile.IsVerified
                };

                // Update cached data
                comment.UserSnapshot = new UserSnapshot
                {
                    UserId = userProfile.Id.ToString(),
                    Username = userProfile.Username ?? "Unknown User",
                    DisplayName = userProfile.DisplayName ?? "Unknown User",
                    AvatarUrl = userProfile.AvatarUrl,
                    IsVerified = userProfile.IsVerified,
                    LastUpdated = DateTime.UtcNow
                };

                await _mongoContext.Comments.ReplaceOneAsync(
                    Builders<MongoComment>.Filter.Eq(c => c.CommentId, comment.CommentId),
                    comment);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load user profile for comment {CommentId}", comment.CommentId);
                response.Author = new UserBasicInfo
                {
                    Id = comment.UserId,
                    Username = "Unknown User",
                    DisplayName = "Unknown User",
                    IsVerified = false
                };
            }
        }

        // Check if current user liked this comment
        if (currentUserId.HasValue)
        {
            response.IsLikedByCurrentUser = comment.LikedBy.Contains(currentUserId.Value.ToString());
        }

        return response;
    }

    private async Task<List<CommentResponse>> LoadNestedRepliesAsync(Guid parentCommentId, Guid? currentUserId, int currentDepth)
    {
        const int MAX_DEPTH = 3; // Allow up to 4 levels (0-3)
        
        if (currentDepth >= MAX_DEPTH)
        {
            return new List<CommentResponse>(); // Stop at max depth
        }

        var repliesFilter = Builders<MongoComment>.Filter.And(
            Builders<MongoComment>.Filter.Eq(c => c.ParentCommentId, parentCommentId),
            Builders<MongoComment>.Filter.Eq(c => c.IsDeleted, false)
        );

        var replies = await _mongoContext.Comments
            .Find(repliesFilter)
            .Sort(Builders<MongoComment>.Sort.Ascending(c => c.CreatedAt))
            .ToListAsync();

        var replyResponses = new List<CommentResponse>();
        foreach (var reply in replies)
        {
            var replyResponse = await MapToCommentResponse(reply, currentUserId);
            
            // Recursively load nested replies
            replyResponse.Replies = await LoadNestedRepliesAsync(reply.CommentId, currentUserId, currentDepth + 1);
            
            replyResponses.Add(replyResponse);
        }

        return replyResponses;
    }

    private async Task<UserSnapshot> GetOrCreateUserSnapshotAsync(Guid userId)
    {
        try
        {
            var userProfile = await _officerService.GetUserByIdAsync(userId);
            return new UserSnapshot
            {
                UserId = userProfile.Id.ToString(),
                Username = userProfile.Username,
                DisplayName = userProfile.DisplayName,
                AvatarUrl = userProfile.AvatarUrl,
                IsVerified = userProfile.IsVerified,
                LastUpdated = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load user profile for {UserId}, using fallback", userId);
            return new UserSnapshot
            {
                UserId = userId.ToString(),
                Username = "Unknown User",
                DisplayName = "Unknown User",
                IsVerified = false,
                LastUpdated = DateTime.UtcNow
            };
        }
    }

    private async Task<int> CalculateCommentDepth(Guid? parentCommentId)
    {
        if (!parentCommentId.HasValue)
            return 0;

        var parentFilter = Builders<MongoComment>.Filter.Eq(c => c.CommentId, parentCommentId.Value);
        var parent = await _mongoContext.Comments.Find(parentFilter).FirstOrDefaultAsync();
        
        return parent?.Depth + 1 ?? 1;
    }

    private async Task<List<string>> BuildThreadPath(Guid? parentCommentId)
    {
        if (!parentCommentId.HasValue)
            return new List<string>();

        var path = new List<string>();
        var currentParentId = parentCommentId;

        while (currentParentId.HasValue)
        {
            var parentFilter = Builders<MongoComment>.Filter.Eq(c => c.CommentId, currentParentId.Value);
            var parent = await _mongoContext.Comments.Find(parentFilter).FirstOrDefaultAsync();
            
            if (parent == null)
                break;

            path.Insert(0, parent.CommentId.ToString());
            currentParentId = parent.ParentCommentId;
        }

        return path;
    }

    private async Task ProcessGrokMentionAsync(Guid commentId, Guid postId, Guid userId, string commentContent)
    {
        try
        {
            _logger.LogInformation("🤖 Processing @grok mention for comment {CommentId}", commentId);

            // Extract the question from the comment
            var question = ExtractGrokQuestion(commentContent);
            if (string.IsNullOrWhiteSpace(question))
            {
                _logger.LogWarning("No valid question found in @grok mention for comment {CommentId}", commentId);
                return;
            }

            // Get the post content for context
            var post = await _mongoContext.Posts.Find(p => p.PostId == postId).FirstOrDefaultAsync();
            if (post == null)
            {
                _logger.LogWarning("Post {PostId} not found for @grok processing", postId);
                return;
            }

            // Send request to NeuroSpark Service
            var neuroSparkRequest = new NeuroSparkGrokRequest
            {
                PostContent = post.Content,
                UserQuestion = commentContent, // Send full comment content, not just extracted question
                RequestId = Guid.NewGuid().ToString(),
                PostId = postId.ToString(),
                UserId = userId.ToString()
            };

            _logger.LogInformation("🤖 Sending Grok request to NeuroSpark: PostId={PostId}, UserId={UserId}, RequestId={RequestId}", 
                neuroSparkRequest.PostId, neuroSparkRequest.UserId, neuroSparkRequest.RequestId);

            var neuroSparkResponse = await _neuroSparkService.ProcessGrokRequestAsync(neuroSparkRequest);
            
            if (neuroSparkResponse.Status == "completed")
            {
                // Create AI comment as reply
                var aiCommentRequest = new CreateCommentRequest
                {
                    Content = $"🤖 **Grok AI Response:**\n\n{neuroSparkResponse.Response}\n\n*This response was generated by Grok AI based on your question about the post.*",
                    ParentCommentId = commentId
                };

                // Get the grok.xai user ID from Officer service
                var grokUser = await _officerService.GetUserByUsernameAsync("grok.xai");
                if (grokUser == null)
                {
                    _logger.LogError("grok.xai user account not found. Cannot create AI response.");
                    return;
                }
                var grokUserId = grokUser.Id;

                var aiComment = await CreateCommentAsync(postId, grokUserId, aiCommentRequest);
                
                _logger.LogInformation("✅ Grok AI response created as comment {AiCommentId} for original comment {CommentId}", 
                    aiComment.Id, commentId);
            }
            else
            {
                _logger.LogWarning("Grok AI processing failed for comment {CommentId}: {Status}", commentId, neuroSparkResponse.Status);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing @grok mention for comment {CommentId}", commentId);
        }
    }

    private string ExtractGrokQuestion(string content)
    {
        // Extract the question after @grok
        var grokIndex = content.IndexOf("@grok", StringComparison.OrdinalIgnoreCase);
        if (grokIndex == -1) return string.Empty;

        var question = content.Substring(grokIndex + 5).Trim();
        return question;
    }

    private async Task PublishCommentCreatedEventAsync(MongoComment comment, Guid postId, Guid userId)
    {
        try
        {
            // Get post author to send notification to
            var post = await _mongoContext.Posts.Find(p => p.PostId == postId).FirstOrDefaultAsync();
            if (post == null) return;

            // Get sender information from Officer service
            var senderInfo = await _officerService.GetUserByIdAsync(userId);
            var senderName = senderInfo?.DisplayName ?? senderInfo?.Username ?? "Someone";
            var senderAvatar = senderInfo?.AvatarUrl ?? "";
            
            // Only publish notification events, not feed events
            // The social feed will continue to use SSE for real-time updates
            var socialEvent = new SocialEvent
            {
                EventType = "comment_notification",
                UserId = post.UserId.ToString(), // Notify the post author
                PostId = postId.ToString(),
                CommentId = comment.CommentId.ToString(),
                SenderId = userId.ToString(),
                SenderName = senderName,
                SenderAvatar = senderAvatar,
                ActionUrl = $"/post/{postId}#comment-{comment.CommentId}",
                RelatedContentId = postId.ToString(),
                RelatedContentType = "post",
                Data = new
                {
                    commentId = comment.CommentId,
                    postId = postId,
                    userId = userId,
                    content = comment.Content.Length > 100 ? comment.Content.Substring(0, 100) + "..." : comment.Content,
                    parentCommentId = comment.ParentCommentId,
                    isGrokMention = comment.Content.Contains("@grok", StringComparison.OrdinalIgnoreCase),
                    notificationType = "comment_created"
                }
            };

            _logger.LogInformation("📤 Publishing social event: UserId={UserId}, EventType={EventType}, PostId={PostId}", 
                socialEvent.UserId, socialEvent.EventType, socialEvent.PostId);
            
            await _eventPublisher.PublishSocialEventAsync(socialEvent);
            _logger.LogInformation("📤 Comment notification event published for comment {CommentId}", comment.CommentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to publish comment notification event for comment {CommentId}", comment.CommentId);
        }
    }
}
