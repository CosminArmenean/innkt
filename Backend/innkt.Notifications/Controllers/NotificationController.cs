using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Notifications.Services;
using innkt.Notifications.Models;

namespace innkt.Notifications.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(INotificationService notificationService, ILogger<NotificationController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Get notifications for a user from MongoDB
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserNotifications(string userId, int page = 0, int limit = 50)
    {
        try
        {
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, limit);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get notifications for user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get unread notifications for a user
    /// </summary>
    [HttpGet("user/{userId}/unread")]
    public async Task<IActionResult> GetUnreadNotifications(string userId)
    {
        try
        {
            var notifications = await _notificationService.GetUnreadNotificationsAsync(userId);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get unread notifications for user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPost("mark-read/{notificationId}")]
    public async Task<IActionResult> MarkAsRead(string notificationId)
    {
        try
        {
            var success = await _notificationService.MarkNotificationAsReadAsync(notificationId);
            if (success)
            {
                return Ok(new { message = "Notification marked as read" });
            }
            return NotFound(new { message = "Notification not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark notification {NotificationId} as read", notificationId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Mark all notifications as read for a user
    /// </summary>
    [HttpPost("user/{userId}/mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead(string userId)
    {
        try
        {
            var success = await _notificationService.MarkAllNotificationsAsReadAsync(userId);
            return Ok(new { message = "All notifications marked as read", success });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark all notifications as read for user {UserId}", userId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get undelivered notifications (for offline user sync)
    /// </summary>
    [HttpGet("undelivered")]
    public async Task<IActionResult> GetUndeliveredNotifications()
    {
        try
        {
            var notifications = await _notificationService.GetUndeliveredNotificationsAsync();
            return Ok(new { notifications, count = notifications.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get undelivered notifications");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Mark notification as delivered
    /// </summary>
    [HttpPost("mark-delivered/{notificationId}")]
    public async Task<IActionResult> MarkAsDelivered(string notificationId)
    {
        try
        {
            var success = await _notificationService.MarkNotificationAsDeliveredAsync(notificationId);
            if (success)
            {
                return Ok(new { message = "Notification marked as delivered" });
            }
            return NotFound(new { message = "Notification not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to mark notification {NotificationId} as delivered", notificationId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Clean up expired notifications
    /// </summary>
    [HttpPost("cleanup-expired")]
    public async Task<IActionResult> CleanupExpiredNotifications()
    {
        try
        {
            var deletedCount = await _notificationService.CleanupExpiredNotificationsAsync();
            return Ok(new { message = $"Cleaned up {deletedCount} expired notifications", deletedCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cleanup expired notifications");
            return StatusCode(500, "Internal server error");
        }
    }
}
