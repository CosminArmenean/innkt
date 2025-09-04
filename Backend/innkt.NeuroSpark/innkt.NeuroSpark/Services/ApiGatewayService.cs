using System.Text;
using System.Text.Json;

namespace innkt.NeuroSpark.Services;

public class ApiGatewayService : IApiGatewayService
{
    private readonly ILogger<ApiGatewayService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IRedisService _redisService;
    private readonly HttpClient _httpClient;
    private readonly Dictionary<string, List<ServiceEndpoint>> _serviceRegistry;
    private readonly Random _random;

    public ApiGatewayService(
        ILogger<ApiGatewayService> logger,
        IConfiguration configuration,
        IRedisService redisService,
        HttpClient httpClient)
    {
        _logger = logger;
        _configuration = configuration;
        _redisService = redisService;
        _httpClient = httpClient;
        _serviceRegistry = new Dictionary<string, List<ServiceEndpoint>>();
        _random = new Random();
        
        // Initialize with known services
        InitializeServiceRegistry();
    }

    public async Task<ApiGatewayResponse> RouteRequestAsync(ApiGatewayRequest request)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            _logger.LogDebug("Routing request: {Method} {Path}", request.Method, request.Path);
            
            // Determine target service based on path
            var targetService = DetermineTargetService(request.Path);
            if (string.IsNullOrEmpty(targetService))
            {
                return new ApiGatewayResponse
                {
                    StatusCode = 404,
                    ErrorMessage = $"No service found for path: {request.Path}"
                };
            }

            // Get load-balanced endpoint
            var endpoint = await GetLoadBalancedEndpointAsync(targetService);
            if (string.IsNullOrEmpty(endpoint))
            {
                return new ApiGatewayResponse
                {
                    StatusCode = 503,
                    ErrorMessage = $"Service {targetService} is unavailable"
                };
            }

            // Build target URL
            var targetUrl = $"{endpoint.TrimEnd('/')}{request.Path}";
            
            // Create HTTP request
            using var httpRequest = new HttpRequestMessage(new HttpMethod(request.Method), targetUrl);
            
            // Add headers
            foreach (var header in request.Headers)
            {
                httpRequest.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
            
            // Add authentication headers
            if (!string.IsNullOrEmpty(request.ServiceToken))
            {
                httpRequest.Headers.Add("X-Service-Token", request.ServiceToken);
            }
            
            if (!string.IsNullOrEmpty(request.UserToken))
            {
                httpRequest.Headers.Add("Authorization", $"Bearer {request.UserToken}");
            }
            
            // Add body if present
            if (request.Body != null)
            {
                var json = JsonSerializer.Serialize(request.Body);
                httpRequest.Content = new StringContent(json, Encoding.UTF8, "application/json");
            }

            // Send request
            var response = await _httpClient.SendAsync(httpRequest);
            
            // Read response
            var responseBody = await response.Content.ReadAsStringAsync();
            object? parsedBody = null;
            
            try
            {
                parsedBody = JsonSerializer.Deserialize<object>(responseBody);
            }
            catch
            {
                parsedBody = responseBody;
            }

            stopwatch.Stop();
            
            return new ApiGatewayResponse
            {
                StatusCode = (int)response.StatusCode,
                Headers = response.Headers.ToDictionary(h => h.Key, h => string.Join(", ", h.Value)),
                Body = parsedBody,
                ResponseTime = stopwatch.Elapsed,
                RoutedTo = targetService
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error routing request: {Method} {Path}", request.Method, request.Path);
            stopwatch.Stop();
            
            return new ApiGatewayResponse
            {
                StatusCode = 500,
                ErrorMessage = "Internal gateway error",
                ResponseTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<ApiGatewayResponse> AggregateDataAsync(AggregationRequest request)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var results = new Dictionary<string, object>();
        var errors = new List<string>();

        try
        {
            foreach (var servicePath in request.ServicePaths)
            {
                try
                {
                    var serviceRequest = new ApiGatewayRequest
                    {
                        Path = servicePath,
                        Method = "GET",
                        UserToken = request.UserToken
                    };

                    var response = await RouteRequestAsync(serviceRequest);
                    if (response.StatusCode == 200)
                    {
                        results[servicePath] = response.Body ?? "No data";
                    }
                    else
                    {
                        errors.Add($"Service {servicePath}: {response.ErrorMessage}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error aggregating data from {ServicePath}", servicePath);
                    errors.Add($"Service {servicePath}: {ex.Message}");
                }
            }

            stopwatch.Stop();

            return new ApiGatewayResponse
            {
                StatusCode = errors.Any() ? 207 : 200, // 207 Multi-Status if there are partial failures
                Body = new
                {
                    Results = results,
                    Errors = errors,
                    TotalServices = request.ServicePaths.Count,
                    SuccessfulServices = results.Count,
                    FailedServices = errors.Count
                },
                ResponseTime = stopwatch.Elapsed
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in data aggregation");
            stopwatch.Stop();
            
            return new ApiGatewayResponse
            {
                StatusCode = 500,
                ErrorMessage = "Aggregation failed",
                ResponseTime = stopwatch.Elapsed
            };
        }
    }

    public async Task<string> GetLoadBalancedEndpointAsync(string serviceName)
    {
        try
        {
            // Check cache first
            var cacheKey = $"service_endpoints:{serviceName}";
            var cachedEndpoints = await _redisService.GetAsync<List<ServiceEndpoint>>(cacheKey);
            
            List<ServiceEndpoint> endpoints;
            if (cachedEndpoints != null)
            {
                endpoints = cachedEndpoints.Where(e => e.IsActive).ToList();
            }
            else
            {
                endpoints = _serviceRegistry.GetValueOrDefault(serviceName, new List<ServiceEndpoint>())
                    .Where(e => e.IsActive)
                    .ToList();
                
                // Cache for 1 minute
                await _redisService.SetAsync(cacheKey, endpoints, TimeSpan.FromMinutes(1));
            }

            if (!endpoints.Any())
            {
                return string.Empty;
            }

            // Simple round-robin load balancing
            var selectedEndpoint = endpoints[_random.Next(endpoints.Count)];
            return selectedEndpoint.Endpoint;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting load balanced endpoint for {ServiceName}", serviceName);
            return string.Empty;
        }
    }

    public async Task<ServiceHealthInfo> GetServiceHealthAsync(string serviceName)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            var endpoint = await GetLoadBalancedEndpointAsync(serviceName);
            if (string.IsNullOrEmpty(endpoint))
            {
                return new ServiceHealthInfo
                {
                    ServiceName = serviceName,
                    Endpoint = string.Empty,
                    IsHealthy = false,
                    ErrorMessage = "Service not available"
                };
            }

            var healthUrl = $"{endpoint.TrimEnd('/')}/health";
            var response = await _httpClient.GetAsync(healthUrl);
            
            stopwatch.Stop();
            
            return new ServiceHealthInfo
            {
                ServiceName = serviceName,
                Endpoint = endpoint,
                IsHealthy = response.IsSuccessStatusCode,
                ResponseTime = stopwatch.Elapsed,
                LastChecked = DateTime.UtcNow,
                ErrorMessage = response.IsSuccessStatusCode ? null : $"HTTP {response.StatusCode}"
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Error checking health for {ServiceName}", serviceName);
            
            return new ServiceHealthInfo
            {
                ServiceName = serviceName,
                Endpoint = string.Empty,
                IsHealthy = false,
                ResponseTime = stopwatch.Elapsed,
                LastChecked = DateTime.UtcNow,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task RegisterServiceEndpointAsync(ServiceEndpoint endpoint)
    {
        try
        {
            if (!_serviceRegistry.ContainsKey(endpoint.ServiceName))
            {
                _serviceRegistry[endpoint.ServiceName] = new List<ServiceEndpoint>();
            }

            // Check if endpoint already exists
            var existingEndpoint = _serviceRegistry[endpoint.ServiceName]
                .FirstOrDefault(e => e.Endpoint == endpoint.Endpoint);
            
            if (existingEndpoint != null)
            {
                // Update existing endpoint
                existingEndpoint.IsActive = endpoint.IsActive;
                existingEndpoint.Metadata = endpoint.Metadata;
            }
            else
            {
                // Add new endpoint
                _serviceRegistry[endpoint.ServiceName].Add(endpoint);
            }

            // Clear cache
            var cacheKey = $"service_endpoints:{endpoint.ServiceName}";
            await _redisService.DeleteAsync(cacheKey);
            
            _logger.LogInformation("Service endpoint registered: {ServiceName} at {Endpoint}", 
                endpoint.ServiceName, endpoint.Endpoint);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering service endpoint: {ServiceName}", endpoint.ServiceName);
        }
    }

    public async Task<IEnumerable<ServiceEndpoint>> GetRegisteredServicesAsync()
    {
        try
        {
            var allEndpoints = new List<ServiceEndpoint>();
            foreach (var service in _serviceRegistry)
            {
                allEndpoints.AddRange(service.Value);
            }
            return allEndpoints;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting registered services");
            return Enumerable.Empty<ServiceEndpoint>();
        }
    }

    private string? DetermineTargetService(string path)
    {
        // Simple path-based routing
        if (path.StartsWith("/api/imageprocessing") || path.StartsWith("/api/qrcode"))
        {
            return "NeuroSpark";
        }
        else if (path.StartsWith("/api/auth") || path.StartsWith("/api/users"))
        {
            return "Officer";
        }
        else if (path.StartsWith("/api/groups"))
        {
            return "Officer";
        }
        
        return null;
    }

    private void InitializeServiceRegistry()
    {
        // Register known services
        var officerEndpoint = new ServiceEndpoint
        {
            ServiceName = "Officer",
            Endpoint = _configuration["OfficerService:BaseUrl"] ?? "https://localhost:5003",
            HealthCheckPath = "/health",
            IsActive = true,
            Metadata = new Dictionary<string, string>
            {
                ["Type"] = "Identity Server",
                ["Version"] = "1.0.0"
            }
        };

        var neuroSparkEndpoint = new ServiceEndpoint
        {
            ServiceName = "NeuroSpark",
            Endpoint = "https://localhost:5007",
            HealthCheckPath = "/health",
            IsActive = true,
            Metadata = new Dictionary<string, string>
            {
                ["Type"] = "AI Processing Service",
                ["Version"] = "1.0.0"
            }
        };

        _serviceRegistry["Officer"] = new List<ServiceEndpoint> { officerEndpoint };
        _serviceRegistry["NeuroSpark"] = new List<ServiceEndpoint> { neuroSparkEndpoint };
    }
}


