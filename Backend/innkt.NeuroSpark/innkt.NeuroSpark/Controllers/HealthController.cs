using Microsoft.AspNetCore.Mvc;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Get()
    {
        _logger.LogInformation("Health check requested");
        return Ok("NeuroSpark Service is healthy");
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        var status = new
        {
            Service = "NeuroSpark",
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Version = "1.0.0",
            Features = new[]
            {
                "AI Image Processing",
                "Background Removal",
                "Image Enhancement",
                "QR Code Generation",
                "QR Code Scanning",
                "Image Cropping"
            }
        };
        
        return Ok(status);
    }
}


