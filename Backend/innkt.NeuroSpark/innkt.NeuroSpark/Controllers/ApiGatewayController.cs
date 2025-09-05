using Microsoft.AspNetCore.Mvc;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Controllers;

[ApiController]
[Route("api/gateway")]
public class ApiGatewayController : ControllerBase
{
    private readonly IApiGatewayService _gatewayService;
    private readonly ILogger<ApiGatewayController> _logger;

    public ApiGatewayController(
        IApiGatewayService gatewayService,
        ILogger<ApiGatewayController> logger)
    {
        _gatewayService = gatewayService;
        _logger = logger;
    }

    /// <summary>
    /// Route a request through the gateway
    /// </summary>
    [HttpPost("route")]
    public async Task<IActionResult> RouteRequest([FromBody] ApiGatewayRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Path))
            {
                return BadRequest("Path is required");
            }

            var response = await _gatewayService.RouteRequestAsync(request);
            return StatusCode(response.StatusCode, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in gateway routing");
            return StatusCode(500, "Gateway error");
        }
    }

    /// <summary>
    /// Aggregate data from multiple services
    /// </summary>
    [HttpPost("aggregate")]
    public async Task<IActionResult> AggregateData([FromBody] AggregationRequest request)
    {
        try
        {
            if (request.ServicePaths == null || !request.ServicePaths.Any())
            {
                return BadRequest("Service paths are required");
            }

            var response = await _gatewayService.AggregateDataAsync(request);
            return StatusCode(response.StatusCode, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in data aggregation");
            return StatusCode(500, "Aggregation error");
        }
        }

    /// <summary>
    /// Get health status of all services
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetServicesHealth()
    {
        try
        {
            var services = new[] { "Officer", "NeuroSpark" };
            var healthResults = new Dictionary<string, ServiceHealthInfo>();

            foreach (var service in services)
            {
                var health = await _gatewayService.GetServiceHealthAsync(service);
                healthResults[service] = health;
            }

            var overallHealth = new
            {
                Services = healthResults,
                OverallStatus = healthResults.All(h => h.Value.IsHealthy) ? "Healthy" : "Unhealthy",
                TotalServices = services.Length,
                HealthyServices = healthResults.Count(h => h.Value.IsHealthy),
                UnhealthyServices = healthResults.Count(h => !h.Value.IsHealthy),
                LastChecked = DateTime.UtcNow
            };

            return Ok(overallHealth);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting services health");
            return StatusCode(500, "Health check error");
        }
    }

    /// <summary>
    /// Get health status of a specific service
    /// </summary>
    [HttpGet("health/{serviceName}")]
    public async Task<IActionResult> GetServiceHealth(string serviceName)
    {
        try
        {
            var health = await _gatewayService.GetServiceHealthAsync(serviceName);
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting health for service {ServiceName}", serviceName);
            return StatusCode(500, "Health check error");
        }
    }

    /// <summary>
    /// Get all registered services
    /// </summary>
    [HttpGet("services")]
    public async Task<IActionResult> GetRegisteredServices()
    {
        try
        {
            var services = await _gatewayService.GetRegisteredServicesAsync();
            return Ok(services);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting registered services");
            return StatusCode(500, "Service discovery error");
        }
    }

    /// <summary>
    /// Register a new service endpoint
    /// </summary>
    [HttpPost("services")]
    public async Task<IActionResult> RegisterService([FromBody] ServiceEndpoint endpoint)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(endpoint.ServiceName) || string.IsNullOrWhiteSpace(endpoint.Endpoint))
            {
                return BadRequest("Service name and endpoint are required");
            }

            await _gatewayService.RegisterServiceEndpointAsync(endpoint);
            
            return Ok(new
            {
                Message = "Service registered successfully",
                Service = endpoint
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering service {ServiceName}", endpoint.ServiceName);
            return StatusCode(500, "Service registration error");
        }
    }

    /// <summary>
    /// Get gateway statistics and metrics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetGatewayStats()
    {
        try
        {
            var services = await _gatewayService.GetRegisteredServicesAsync();
            var serviceList = services.ToList();
            
            var stats = new
            {
                TotalServices = serviceList.Count,
                ActiveServices = serviceList.Count(s => s.IsActive),
                InactiveServices = serviceList.Count(s => !s.IsActive),
                Services = serviceList.Select(s => new
                {
                    s.ServiceName,
                    s.Endpoint,
                    s.IsActive,
                    s.RegisteredAt,
                    s.Metadata
                }),
                GatewayInfo = new
                {
                    Version = "1.0.0",
                    StartTime = DateTime.UtcNow.AddHours(-1), // Placeholder
                    Uptime = TimeSpan.FromHours(1), // Placeholder
                    LastHealthCheck = DateTime.UtcNow
                }
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting gateway stats");
            return StatusCode(500, "Stats error");
        }
    }

    /// <summary>
    /// Test gateway connectivity to a specific service
    /// </summary>
    [HttpPost("test-connection")]
    public async Task<IActionResult> TestConnection([FromBody] TestConnectionRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ServiceName))
            {
                return BadRequest("Service name is required");
            }

            var health = await _gatewayService.GetServiceHealthAsync(request.ServiceName);
            var endpoint = await _gatewayService.GetLoadBalancedEndpointAsync(request.ServiceName);

            var result = new
            {
                ServiceName = request.ServiceName,
                Endpoint = endpoint,
                IsHealthy = health.IsHealthy,
                ResponseTime = health.ResponseTime,
                ErrorMessage = health.ErrorMessage,
                TestTime = DateTime.UtcNow
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connection to {ServiceName}", request.ServiceName);
            return StatusCode(500, "Connection test error");
        }
    }
}

public class TestConnectionRequest
{
    public string ServiceName { get; set; } = string.Empty;
}



