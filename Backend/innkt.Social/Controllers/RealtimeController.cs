using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;
using System.Collections.Concurrent;
using innkt.Social.Services;

namespace innkt.Social.Controllers;

/// <summary>
/// Server-Sent Events (SSE) controller for real-time notifications
/// Provides live updates for social media interactions
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class RealtimeController : ControllerBase
{
    private readonly IRealtimeService _realtimeService;
    private readonly ILogger<RealtimeController> _logger;

    // Static event storage for SSE connections (in production, use Redis or similar)
    private static readonly ConcurrentDictionary<string, SseConnection> _sseConnections = new();
    private static readonly ConcurrentQueue<SseEvent> _eventQueue = new();

    public RealtimeController(IRealtimeService realtimeService, ILogger<RealtimeController> logger)
    {
        _realtimeService = realtimeService;
        _logger = logger;
    }

    /// <summary>
    /// Establish Server-Sent Events connection for real-time notifications
    /// </summary>
    [HttpGet("events")]
    [AllowAnonymous] // Temporary for testing - in production use WebSockets with proper auth
    public async Task GetEventStream()
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            // For testing purposes, use a default test user
            userId = Guid.Parse("bdfc4c41-c42e-42e0-a57b-d8301a37b1fe");
            _logger.LogWarning("Using test user ID for anonymous SSE connection: {UserId}", userId);
        }

        var connectionId = Guid.NewGuid().ToString();
        
        // Set SSE headers
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";
        Response.Headers["Access-Control-Allow-Origin"] = "*";
        Response.Headers["Access-Control-Allow-Headers"] = "Cache-Control";

        _logger.LogInformation("Establishing SSE connection {ConnectionId} for user {UserId}", 
            connectionId, userId);

        try
        {
            // Register client with realtime service
            await _realtimeService.AddClientAsync(userId, connectionId);

            // Create SSE connection tracking
            var sseConnection = new SseConnection
            {
                ConnectionId = connectionId,
                UserId = userId,
                Response = Response,
                ConnectedAt = DateTime.UtcNow,
                LastHeartbeat = DateTime.UtcNow
            };

            _sseConnections[connectionId] = sseConnection;

            // Send initial connection event
            await SendSseEventAsync(connectionId, new SseEvent
            {
                EventType = "connected",
                Data = new { message = "Connected to real-time events", userId = userId, connectionId = connectionId }
            });

            // Send heartbeat every 30 seconds and process events
            var cancellationToken = HttpContext.RequestAborted;
            
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    // Process queued events for this connection
                    await ProcessQueuedEventsAsync(connectionId);

                    // Send heartbeat every 30 seconds
                    if (DateTime.UtcNow - sseConnection.LastHeartbeat > TimeSpan.FromSeconds(30))
                    {
                        await SendHeartbeatAsync(connectionId);
                        sseConnection.LastHeartbeat = DateTime.UtcNow;
                    }

                    await Task.Delay(1000, cancellationToken); // Check every second
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in SSE event loop for connection {ConnectionId}", connectionId);
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SSE connection {ConnectionId}", connectionId);
        }
        finally
        {
            // Cleanup
            await CleanupConnectionAsync(connectionId, userId);
        }
    }

    /// <summary>
    /// Test endpoint to manually trigger SSE events (bypassing Change Streams)
    /// </summary>
    [HttpPost("test-event")]
    [AllowAnonymous]
    public async Task<ActionResult> TriggerTestEvent([FromBody] TestEventRequest request)
    {
        try
        {
            _logger.LogInformation("🧪 Manual test event triggered: {EventType}", request.EventType);

            var testEvent = new SseEvent
            {
                EventType = request.EventType,
                Data = new
                {
                    message = request.Message,
                    timestamp = DateTime.UtcNow,
                    testData = request.TestData
                }
            };

            // Queue for all connected users
            var allConnectedUsers = _sseConnections.Values.Select(c => c.UserId).Distinct().ToList();
            
            foreach (var userId in allConnectedUsers)
            {
                QueueEventForUser(userId, testEvent);
                _logger.LogInformation("🔔 Queued test event for user {UserId}", userId);
            }

            return Ok(new 
            { 
                Message = $"Test event '{request.EventType}' queued for {allConnectedUsers.Count} connected users",
                ConnectedUsers = allConnectedUsers.Count,
                QueueSize = _eventQueue.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering test event");
            return StatusCode(500, "Error triggering test event");
        }
    }

    /// <summary>
    /// Get real-time service status
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    public async Task<ActionResult> GetRealtimeStatus()
    {
        try
        {
            var connectedClients = await _realtimeService.GetConnectedClientsCount();
            var isChangeStreamActive = _realtimeService.IsChangeStreamActive;

            return Ok(new
            {
                Status = "Healthy",
                Service = "Realtime Service",
                ConnectedClients = connectedClients,
                SseConnections = _sseConnections.Count,
                ChangeStreamActive = isChangeStreamActive,
                QueuedEvents = _eventQueue.Count,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting realtime status");
            return StatusCode(500, new
            {
                Status = "Unhealthy",
                Service = "Realtime Service",
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Start change streams (admin endpoint)
    /// </summary>
    [HttpPost("start")]
    [Authorize] // Add admin role requirement in production
    public async Task<ActionResult> StartChangeStreams()
    {
        try
        {
            await _realtimeService.StartChangeStreamsAsync();
            _logger.LogInformation("Change streams started via API");
            
            return Ok(new { Message = "Change streams started successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting change streams via API");
            return StatusCode(500, new { Message = "Failed to start change streams", Error = ex.Message });
        }
    }

    /// <summary>
    /// Stop change streams (admin endpoint)
    /// </summary>
    [HttpPost("stop")]
    [Authorize] // Add admin role requirement in production
    public async Task<ActionResult> StopChangeStreams()
    {
        try
        {
            await _realtimeService.StopChangeStreamsAsync();
            _logger.LogInformation("Change streams stopped via API");
            
            return Ok(new { Message = "Change streams stopped successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping change streams via API");
            return StatusCode(500, new { Message = "Failed to stop change streams", Error = ex.Message });
        }
    }

    /// <summary>
    /// Send test notification (development endpoint)
    /// </summary>
    [HttpPost("test-notification")]
    [Authorize]
    public async Task<ActionResult> SendTestNotification([FromBody] TestNotificationRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            
            var testEvent = new SseEvent
            {
                EventType = "test_notification",
                Data = new
                {
                    message = request.Message,
                    type = request.Type,
                    sentBy = userId,
                    timestamp = DateTime.UtcNow
                }
            };

            // Queue event for the user
            QueueEventForUser(userId, testEvent);

            return Ok(new { Message = "Test notification sent" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test notification");
            return StatusCode(500, new { Message = "Failed to send test notification" });
        }
    }

    /// <summary>
    /// Broadcast message to all connected users (admin endpoint)
    /// </summary>
    [HttpPost("broadcast")]
    [Authorize] // Add admin role requirement in production
    public async Task<ActionResult> BroadcastMessage([FromBody] BroadcastRequest request)
    {
        try
        {
            await _realtimeService.NotifySystemMaintenanceAsync(request.Message);
            
            return Ok(new { Message = "Broadcast sent to all connected users" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting message");
            return StatusCode(500, new { Message = "Failed to broadcast message" });
        }
    }

    // Helper methods
    private Guid GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return Guid.Empty;
    }

    private async Task SendSseEventAsync(string connectionId, SseEvent sseEvent)
    {
        if (!_sseConnections.TryGetValue(connectionId, out var connection))
        {
            return;
        }

        try
        {
            var eventData = JsonSerializer.Serialize(sseEvent.Data, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var sseMessage = $"event: {sseEvent.EventType}\n" +
                           $"data: {eventData}\n" +
                           $"id: {sseEvent.Id}\n\n";

            await connection.Response.WriteAsync(sseMessage);
            await connection.Response.Body.FlushAsync();

            _logger.LogDebug("Sent SSE event {EventType} to connection {ConnectionId}", 
                sseEvent.EventType, connectionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending SSE event to connection {ConnectionId}", connectionId);
            
            // Remove dead connection
            await CleanupConnectionAsync(connectionId, connection.UserId);
        }
    }

    private async Task SendHeartbeatAsync(string connectionId)
    {
        await SendSseEventAsync(connectionId, new SseEvent
        {
            EventType = "heartbeat",
            Data = new { timestamp = DateTime.UtcNow }
        });
    }

    private async Task ProcessQueuedEventsAsync(string connectionId)
    {
        if (!_sseConnections.TryGetValue(connectionId, out var connection))
        {
            return;
        }

        var eventsToProcess = new List<SseEvent>();
        var eventsToRequeue = new List<SseEvent>();
        
        // Dequeue events for this user
        while (_eventQueue.TryDequeue(out var queuedEvent))
        {
            if (queuedEvent.TargetUserId == connection.UserId)
            {
                eventsToProcess.Add(queuedEvent);
                _logger.LogInformation("🎯 SSE: Found event {EventType} for user {UserId}", 
                    queuedEvent.EventType, connection.UserId);
            }
            else
            {
                // Re-queue events for other users
                eventsToRequeue.Add(queuedEvent);
            }

            // Prevent infinite loop
            if (eventsToProcess.Count > 100) break;
        }

        // Re-queue events for other users
        foreach (var eventToRequeue in eventsToRequeue)
        {
            _eventQueue.Enqueue(eventToRequeue);
        }

        // Send events to client
        foreach (var eventToSend in eventsToProcess)
        {
            _logger.LogInformation("📤 SSE: Sending {EventType} to connection {ConnectionId}", 
                eventToSend.EventType, connectionId);
            await SendSseEventAsync(connectionId, eventToSend);
        }

        if (eventsToProcess.Any())
        {
            _logger.LogInformation("📬 SSE: Processed {Count} events for connection {ConnectionId}", 
                eventsToProcess.Count, connectionId);
        }
    }

    private async Task CleanupConnectionAsync(string connectionId, Guid userId)
    {
        try
        {
            _sseConnections.TryRemove(connectionId, out _);
            await _realtimeService.RemoveClientAsync(connectionId);
            
            _logger.LogInformation("Cleaned up SSE connection {ConnectionId} for user {UserId}", 
                connectionId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up connection {ConnectionId}", connectionId);
        }
    }

    // Static helper method for other services to queue events
    public static void QueueEventForUser(Guid userId, SseEvent sseEvent)
    {
        sseEvent.TargetUserId = userId;
        _eventQueue.Enqueue(sseEvent);
        
        // Debug logging
        Console.WriteLine($"🔔 SSE: Queued {sseEvent.EventType} event for user {userId}. Queue size: {_eventQueue.Count}");
    }

    public static void QueueEventForUsers(List<Guid> userIds, SseEvent sseEvent)
    {
        foreach (var userId in userIds)
        {
            var userEvent = new SseEvent
            {
                Id = Guid.NewGuid().ToString(),
                EventType = sseEvent.EventType,
                Data = sseEvent.Data,
                Timestamp = sseEvent.Timestamp,
                TargetUserId = userId
            };
            _eventQueue.Enqueue(userEvent);
        }
    }
}

// Helper classes
public class SseConnection
{
    public string ConnectionId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public HttpResponse Response { get; set; } = null!;
    public DateTime ConnectedAt { get; set; }
    public DateTime LastHeartbeat { get; set; }
}

public class SseEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string EventType { get; set; } = string.Empty;
    public object Data { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Guid TargetUserId { get; set; }
}

// Request DTOs
public class TestEventRequest
{
    public string EventType { get; set; } = "test";
    public string Message { get; set; } = string.Empty;
    public object? TestData { get; set; }
}

public class TestNotificationRequest
{
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
}

public class BroadcastRequest
{
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "info";
}
