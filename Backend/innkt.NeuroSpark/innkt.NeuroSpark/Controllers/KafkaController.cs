using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KafkaController : ControllerBase
{
    private readonly IKafkaService _kafkaService;
    private readonly ILogger<KafkaController> _logger;

    public KafkaController(
        IKafkaService kafkaService,
        ILogger<KafkaController> logger)
    {
        _kafkaService = kafkaService;
        _logger = logger;
    }

    /// <summary>
    /// Get Kafka connection status
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetConnectionStatus()
    {
        try
        {
            var status = await _kafkaService.GetConnectionStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Kafka connection status");
            return StatusCode(500, "Error getting connection status");
        }
    }

    /// <summary>
    /// Get Kafka metrics and statistics
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        try
        {
            var metrics = await _kafkaService.GetMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Kafka metrics");
            return StatusCode(500, "Error getting metrics");
        }
    }

    /// <summary>
    /// Publish a custom event to a topic
    /// </summary>
    [HttpPost("publish")]
    public async Task<IActionResult> PublishEvent([FromBody] PublishEventRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Topic) || string.IsNullOrWhiteSpace(request.EventType))
            {
                return BadRequest("Topic and EventType are required");
            }

            await _kafkaService.PublishEventAsync(request.Topic, request.EventData, request.EventType, request.CorrelationId);
            
            _logger.LogInformation("Event published to topic {Topic}: {EventType}", request.Topic, request.EventType);
            
            return Ok(new
            {
                Message = "Event published successfully",
                Topic = request.Topic,
                EventType = request.EventType,
                CorrelationId = request.CorrelationId,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing event to topic {Topic}", request.Topic);
            return StatusCode(500, "Error publishing event");
        }
    }

    /// <summary>
    /// Publish image processing result event
    /// </summary>
    [HttpPost("publish/image-processing-result")]
    public async Task<IActionResult> PublishImageProcessingResult([FromBody] ImageProcessingResultEvent request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.CorrelationId))
            {
                return BadRequest("CorrelationId is required");
            }

            await _kafkaService.PublishEventAsync("image.processing.results", request, "image.processing.completed", request.CorrelationId);
            
            _logger.LogInformation("Image processing result published: {CorrelationId}", request.CorrelationId);
            
            return Ok(new
            {
                Message = "Image processing result published successfully",
                CorrelationId = request.CorrelationId,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing image processing result");
            return StatusCode(500, "Error publishing result");
        }
    }

    /// <summary>
    /// Publish QR code generation result event
    /// </summary>
    [HttpPost("publish/qr-code-result")]
    public async Task<IActionResult> PublishQrCodeResult([FromBody] QrCodeResultEvent request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.CorrelationId))
            {
                return BadRequest("CorrelationId is required");
            }

            await _kafkaService.PublishEventAsync("qr.code.results", request, "qr.code.generated", request.CorrelationId);
            
            _logger.LogInformation("QR code result published: {CorrelationId}", request.CorrelationId);
            
            return Ok(new
            {
                Message = "QR code result published successfully",
                CorrelationId = request.CorrelationId,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing QR code result");
            return StatusCode(500, "Error publishing result");
        }
    }

    /// <summary>
    /// Publish service health event
    /// </summary>
    [HttpPost("publish/health")]
    public async Task<IActionResult> PublishHealthEvent([FromBody] ServiceHealthEvent request)
    {
        try
        {
            await _kafkaService.PublishEventAsync("service.health", request, "service.health.updated");
            
            _logger.LogDebug("Service health event published");
            
            return Ok(new
            {
                Message = "Health event published successfully",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing health event");
            return StatusCode(500, "Error publishing health event");
        }
    }

    /// <summary>
    /// Get Kafka health status for monitoring
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        try
        {
            var status = await _kafkaService.GetConnectionStatusAsync();
            var metrics = await _kafkaService.GetMetricsAsync();

            var health = new
            {
                Status = status.IsConnected ? "Healthy" : "Unhealthy",
                IsConnected = status.IsConnected,
                BootstrapServers = status.BootstrapServers,
                ConnectedTopics = status.ConnectedTopics.Count,
                MessagesProduced = metrics.MessagesProduced,
                MessagesConsumed = metrics.MessagesConsumed,
                Errors = metrics.Errors,
                Uptime = metrics.Uptime,
                LastChecked = DateTime.UtcNow
            };

            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Kafka health");
            return StatusCode(500, new
            {
                Status = "Unhealthy",
                Error = ex.Message,
                LastChecked = DateTime.UtcNow
            });
        }
    }
}

public class PublishEventRequest
{
    public string Topic { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public object EventData { get; set; } = new();
    public string? CorrelationId { get; set; }
}

public class ImageProcessingResultEvent
{
    public string CorrelationId { get; set; } = string.Empty;
    public string ImageId { get; set; } = string.Empty;
    public string ProcessingType { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ResultUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public TimeSpan ProcessingTime { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

public class QrCodeResultEvent
{
    public string CorrelationId { get; set; } = string.Empty;
    public string QrCodeId { get; set; } = string.Empty;
    public string QrCodeType { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? QrCodeUrl { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class ServiceHealthEvent
{
    public string ServiceName { get; set; } = "NeuroSpark";
    public string Status { get; set; } = "Healthy";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Metrics { get; set; } = new();
}


