using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Notifications.Services;
using innkt.Notifications.Models;
using System.Security.Claims;

namespace innkt.Notifications.Controllers;

/// <summary>
/// Notifications API controller with kid-safe filtering
/// </summary>
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        INotificationService notificationService,
        ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
    }

    /// <summary>
    /// Get user notifications with kid-safe filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<BaseNotification>>> GetNotifications(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications");
            return StatusCode(500, "Error retrieving notifications");
        }
    }

    /// <summary>
    /// Send notification (internal service use)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<bool>> SendNotification([FromBody] BaseNotification notification)
    {
        try
        {
            var result = await _notificationService.SendNotificationAsync(notification);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification");
            return StatusCode(500, "Error sending notification");
        }
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPut("{notificationId}/read")]
    public async Task<ActionResult<bool>> MarkAsRead(Guid notificationId)
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var result = await _notificationService.MarkNotificationAsReadAsync(notificationId, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, "Error updating notification");
        }
    }

    /// <summary>
    /// Send emergency alert (high priority)
    /// </summary>
    [HttpPost("emergency")]
    public async Task<ActionResult<bool>> SendEmergencyAlert([FromBody] SafetyAlertNotification alert)
    {
        try
        {
            _logger.LogCritical("🚨 EMERGENCY ALERT RECEIVED: {AlertType}", alert.AlertType);
            
            var result = await _notificationService.SendSafetyAlertAsync(alert);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CRITICAL: Error sending emergency alert");
            return StatusCode(500, "Error sending emergency alert");
        }
    }

    /// <summary>
    /// Get notification preferences
    /// </summary>
    [HttpGet("preferences")]
    public async Task<ActionResult<NotificationPreferences>> GetPreferences()
    {
        try
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
                return Unauthorized();

            var preferences = await _notificationService.GetUserNotificationPreferencesAsync(userId);
            return Ok(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification preferences");
            return StatusCode(500, "Error retrieving preferences");
        }
    }
}