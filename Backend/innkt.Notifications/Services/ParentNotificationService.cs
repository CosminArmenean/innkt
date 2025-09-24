using innkt.Notifications.Models;
using innkt.Notifications.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace innkt.Notifications.Services;

/// <summary>
/// Service to handle parent notifications for kid account activities
/// </summary>
public class ParentNotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<ParentNotificationService> _logger;

    public ParentNotificationService(
        IHubContext<NotificationHub> hubContext,
        ILogger<ParentNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Send notification to parent when kid tries to follow someone
    /// </summary>
    public async Task NotifyParentKidFollowRequestAsync(string kidUserId, string targetUserId, string kidDisplayName, string targetDisplayName)
    {
        try
        {
            // Get parent user ID from kid account
            var parentUserId = await GetParentUserIdAsync(kidUserId);
            if (string.IsNullOrEmpty(parentUserId))
            {
                _logger.LogWarning("Parent not found for kid account {KidUserId}", kidUserId);
                return;
            }

            var notification = new EventNotification
            {
                Id = Guid.NewGuid(),
                Type = "kid_follow_request",
                Title = "Kid Follow Request",
                Message = $"{kidDisplayName} wants to follow {targetDisplayName}",
                RecipientId = Guid.Parse(parentUserId),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            notification.Metadata = new Dictionary<string, object>
            {
                ["kidUserId"] = kidUserId,
                ["targetUserId"] = targetUserId,
                ["kidDisplayName"] = kidDisplayName,
                ["targetDisplayName"] = targetDisplayName,
                ["action"] = "follow_request"
            };

            await _hubContext.Clients.Group($"user_{parentUserId}").SendAsync("notification", notification);
            _logger.LogInformation("📱 Parent notification sent for kid follow request: {KidUserId} -> {TargetUserId}", kidUserId, targetUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send parent notification for kid follow request");
        }
    }

    /// <summary>
    /// Send notification to parent when someone tries to follow their kid
    /// </summary>
    public async Task NotifyParentFollowRequestForKidAsync(string followerUserId, string kidUserId, string followerDisplayName, string kidDisplayName)
    {
        try
        {
            // Get parent user ID from kid account
            var parentUserId = await GetParentUserIdAsync(kidUserId);
            if (string.IsNullOrEmpty(parentUserId))
            {
                _logger.LogWarning("Parent not found for kid account {KidUserId}", kidUserId);
                return;
            }

            var notification = new EventNotification
            {
                Id = Guid.NewGuid(),
                Type = "kid_follow_request",
                Title = "Follow Request for Your Kid",
                Message = $"{followerDisplayName} wants to follow {kidDisplayName}",
                RecipientId = Guid.Parse(parentUserId),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            notification.Metadata = new Dictionary<string, object>
            {
                ["followerUserId"] = followerUserId,
                ["kidUserId"] = kidUserId,
                ["followerDisplayName"] = followerDisplayName,
                ["kidDisplayName"] = kidDisplayName,
                ["action"] = "follow_request_for_kid"
            };

            await _hubContext.Clients.Group($"user_{parentUserId}").SendAsync("notification", notification);
            _logger.LogInformation("📱 Parent notification sent for follow request to kid: {FollowerUserId} -> {KidUserId}", followerUserId, kidUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send parent notification for follow request to kid");
        }
    }

    /// <summary>
    /// Send notification to parent when kid posts content
    /// </summary>
    public async Task NotifyParentKidPostAsync(string kidUserId, string postId, string kidDisplayName, string postContent)
    {
        try
        {
            // Get parent user ID from kid account
            var parentUserId = await GetParentUserIdAsync(kidUserId);
            if (string.IsNullOrEmpty(parentUserId))
            {
                _logger.LogWarning("Parent not found for kid account {KidUserId}", kidUserId);
                return;
            }

            var notification = new EventNotification
            {
                Id = Guid.NewGuid(),
                Type = "kid_post",
                Title = "Your Kid Posted",
                Message = $"{kidDisplayName} posted: {postContent.Substring(0, Math.Min(50, postContent.Length))}...",
                RecipientId = Guid.Parse(parentUserId),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            notification.Metadata = new Dictionary<string, object>
            {
                ["kidUserId"] = kidUserId,
                ["postId"] = postId,
                ["kidDisplayName"] = kidDisplayName,
                ["postContent"] = postContent,
                ["action"] = "kid_post"
            };

            await _hubContext.Clients.Group($"user_{parentUserId}").SendAsync("notification", notification);
            _logger.LogInformation("📱 Parent notification sent for kid post: {KidUserId}", kidUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send parent notification for kid post");
        }
    }

    /// <summary>
    /// Send notification to parent when kid receives a message
    /// </summary>
    public async Task NotifyParentKidMessageAsync(string kidUserId, string senderUserId, string senderDisplayName, string kidDisplayName, string messageContent)
    {
        try
        {
            // Get parent user ID from kid account
            var parentUserId = await GetParentUserIdAsync(kidUserId);
            if (string.IsNullOrEmpty(parentUserId))
            {
                _logger.LogWarning("Parent not found for kid account {KidUserId}", kidUserId);
                return;
            }

            var notification = new EventNotification
            {
                Id = Guid.NewGuid(),
                Type = "kid_message",
                Title = "Message for Your Kid",
                Message = $"{senderDisplayName} sent a message to {kidDisplayName}",
                RecipientId = Guid.Parse(parentUserId),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            notification.Metadata = new Dictionary<string, object>
            {
                ["kidUserId"] = kidUserId,
                ["senderUserId"] = senderUserId,
                ["senderDisplayName"] = senderDisplayName,
                ["kidDisplayName"] = kidDisplayName,
                ["messageContent"] = messageContent,
                ["action"] = "kid_message"
            };

            await _hubContext.Clients.Group($"user_{parentUserId}").SendAsync("notification", notification);
            _logger.LogInformation("📱 Parent notification sent for kid message: {SenderUserId} -> {KidUserId}", senderUserId, kidUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send parent notification for kid message");
        }
    }

    /// <summary>
    /// Send notification to parent when kid's content is flagged
    /// </summary>
    public async Task NotifyParentKidContentFlaggedAsync(string kidUserId, string contentId, string kidDisplayName, string reason)
    {
        try
        {
            // Get parent user ID from kid account
            var parentUserId = await GetParentUserIdAsync(kidUserId);
            if (string.IsNullOrEmpty(parentUserId))
            {
                _logger.LogWarning("Parent not found for kid account {KidUserId}", kidUserId);
                return;
            }

            var notification = new EventNotification
            {
                Id = Guid.NewGuid(),
                Type = "kid_content_flagged",
                Title = "Content Flagged",
                Message = $"{kidDisplayName}'s content was flagged: {reason}",
                RecipientId = Guid.Parse(parentUserId),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            notification.Metadata = new Dictionary<string, object>
            {
                ["kidUserId"] = kidUserId,
                ["contentId"] = contentId,
                ["kidDisplayName"] = kidDisplayName,
                ["reason"] = reason,
                ["action"] = "content_flagged"
            };

            await _hubContext.Clients.Group($"user_{parentUserId}").SendAsync("notification", notification);
            _logger.LogInformation("📱 Parent notification sent for flagged kid content: {KidUserId}", kidUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send parent notification for flagged kid content");
        }
    }

    /// <summary>
    /// Send notification to parent when kid's time limit is reached
    /// </summary>
    public async Task NotifyParentKidTimeLimitReachedAsync(string kidUserId, string kidDisplayName, int timeUsed, int timeLimit)
    {
        try
        {
            // Get parent user ID from kid account
            var parentUserId = await GetParentUserIdAsync(kidUserId);
            if (string.IsNullOrEmpty(parentUserId))
            {
                _logger.LogWarning("Parent not found for kid account {KidUserId}", kidUserId);
                return;
            }

            var notification = new EventNotification
            {
                Id = Guid.NewGuid(),
                Type = "kid_time_limit",
                Title = "Time Limit Reached",
                Message = $"{kidDisplayName} has reached their daily time limit ({timeUsed}/{timeLimit} minutes)",
                RecipientId = Guid.Parse(parentUserId),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            notification.Metadata = new Dictionary<string, object>
            {
                ["kidUserId"] = kidUserId,
                ["kidDisplayName"] = kidDisplayName,
                ["timeUsed"] = timeUsed,
                ["timeLimit"] = timeLimit,
                ["action"] = "time_limit_reached"
            };

            await _hubContext.Clients.Group($"user_{parentUserId}").SendAsync("notification", notification);
            _logger.LogInformation("📱 Parent notification sent for kid time limit: {KidUserId}", kidUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send parent notification for kid time limit");
        }
    }

    /// <summary>
    /// Get parent user ID from kid account
    /// TODO: Implement actual database lookup
    /// </summary>
    private async Task<string?> GetParentUserIdAsync(string kidUserId)
    {
        // TODO: Implement actual database lookup to get parent user ID
        // For now, return a mock parent ID
        _logger.LogInformation("Looking up parent for kid account {KidUserId}", kidUserId);
        
        // This would be replaced with actual database query
        // SELECT parent_user_id FROM kid_accounts WHERE kid_user_id = @kidUserId
        await Task.CompletedTask;
        return "parent-user-id"; // Mock parent ID
    }
}
