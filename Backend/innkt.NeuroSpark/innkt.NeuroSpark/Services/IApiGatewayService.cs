namespace innkt.NeuroSpark.Services;

public interface IApiGatewayService
{
    /// <summary>
    /// Routes a request to the appropriate service based on the path
    /// </summary>
    Task<ApiGatewayResponse> RouteRequestAsync(ApiGatewayRequest request);
    
    /// <summary>
    /// Aggregates data from multiple services
    /// </summary>
    Task<ApiGatewayResponse> AggregateDataAsync(AggregationRequest request);
    
    /// <summary>
    /// Performs load balancing across multiple service instances
    /// </summary>
    Task<string> GetLoadBalancedEndpointAsync(string serviceName);
    
    /// <summary>
    /// Gets service health and availability information
    /// </summary>
    Task<ServiceHealthInfo> GetServiceHealthAsync(string serviceName);
    
    /// <summary>
    /// Registers a service endpoint for discovery
    /// </summary>
    Task RegisterServiceEndpointAsync(ServiceEndpoint endpoint);
    
    /// <summary>
    /// Gets all registered service endpoints
    /// </summary>
    Task<IEnumerable<ServiceEndpoint>> GetRegisteredServicesAsync();
}

public class ApiGatewayRequest
{
    public string Path { get; set; } = string.Empty;
    public string Method { get; set; } = "GET";
    public Dictionary<string, string> Headers { get; set; } = new();
    public object? Body { get; set; }
    public string? ServiceToken { get; set; }
    public string? UserToken { get; set; }
}

public class ApiGatewayResponse
{
    public int StatusCode { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
    public object? Body { get; set; }
    public string? ErrorMessage { get; set; }
    public TimeSpan ResponseTime { get; set; }
    public string? RoutedTo { get; set; }
}

public class AggregationRequest
{
    public List<string> ServicePaths { get; set; } = new();
    public string? UserToken { get; set; }
    public Dictionary<string, object> Parameters { get; set; } = new();
}

public class ServiceHealthInfo
{
    public string ServiceName { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public bool IsHealthy { get; set; }
    public TimeSpan ResponseTime { get; set; }
    public DateTime LastChecked { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> Metrics { get; set; } = new();
}

public class ServiceEndpoint
{
    public string ServiceName { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string HealthCheckPath { get; set; } = "/health";
    public bool IsActive { get; set; } = true;
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
    public Dictionary<string, string> Metadata { get; set; } = new();
}



