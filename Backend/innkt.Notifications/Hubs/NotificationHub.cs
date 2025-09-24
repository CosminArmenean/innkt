using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace innkt.Notifications.Hubs;

/// <summary>
/// SignalR hub for real-time notifications
/// </summary>
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("🔔 Client connected to notification hub");
        
        // Log all available claims for debugging
        var claims = Context.User?.Claims?.ToList();
        if (claims != null)
        {
            _logger.LogInformation("🔔 Available claims: {Claims}", string.Join(", ", claims.Select(c => $"{c.Type}={c.Value}")));
        }
        
        var userId = GetUserId();
        _logger.LogInformation("🔔 Extracted UserId: {UserId}", userId);
        
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("🔔 User {UserId} added to group user_{UserId}", userId, userId);
        }
        else
        {
            _logger.LogWarning("⚠️ No UserId found in claims");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.LogInformation("🔔 User {UserId} disconnected from notification hub", userId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    // SignalR Hub Methods
    public async Task Authenticate(string userId, string token)
    {
        _logger.LogInformation("🔔 User {UserId} authenticated", userId);
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task SubscribeUser(string userId)
    {
        _logger.LogInformation("🔔 User {UserId} subscribed to notifications", userId);
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task UnsubscribeUser(string userId)
    {
        _logger.LogInformation("🔔 User {UserId} unsubscribed from notifications", userId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    public async Task MarkRead(string notificationId)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            _logger.LogWarning("⚠️ Cannot mark notification as read: UserId not found");
            return;
        }

        _logger.LogInformation("🔔 User {UserId} marked notification {NotificationId} as read", userId, notificationId);
        
        // TODO: Implement actual database update
        // For now, just log the action
        await Task.CompletedTask;
    }

    public async Task MarkAllRead()
    {
        var userId = GetUserId();
        if (userId == null)
        {
            _logger.LogWarning("⚠️ Cannot mark all notifications as read: UserId not found");
            return;
        }

        _logger.LogInformation("🔔 User {UserId} marked all notifications as read", userId);
        
        // TODO: Implement actual database update
        // For now, just log the action
        await Task.CompletedTask;
    }

    private string? GetUserId()
    {
        // Try different claim types that might contain the user ID
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            userId = Context.User?.FindFirst("sub")?.Value;
        }
        if (userId == null)
        {
            userId = Context.User?.FindFirst("user_id")?.Value;
        }
        if (userId == null)
        {
            userId = Context.User?.FindFirst("id")?.Value;
        }
        
        // If no user ID found in claims, try to extract from query string
        if (userId == null)
        {
            var accessToken = Context.GetHttpContext()?.Request.Query["access_token"].FirstOrDefault();
            if (!string.IsNullOrEmpty(accessToken))
            {
                // Extract user ID from token payload (simple approach)
                try
                {
                    var parts = accessToken.Split('.');
                    if (parts.Length == 3)
                    {
                        var payload = parts[1];
                        // Add padding if needed
                        while (payload.Length % 4 != 0)
                        {
                            payload += "=";
                        }
                        payload = payload.Replace('-', '+').Replace('_', '/');
                        var jsonBytes = Convert.FromBase64String(payload);
                        var json = System.Text.Encoding.UTF8.GetString(jsonBytes);
                        
                        // Parse JSON to find user ID
                        var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
                        if (jsonDoc.RootElement.TryGetProperty("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier", out var nameIdElement))
                        {
                            userId = nameIdElement.GetString();
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Failed to extract user ID from token: {Error}", ex.Message);
                }
            }
        }
        
        return userId;
    }
}
