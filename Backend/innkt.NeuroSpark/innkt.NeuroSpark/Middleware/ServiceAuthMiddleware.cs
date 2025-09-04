using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Middleware;

public class ServiceAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ServiceAuthMiddleware> _logger;
    private readonly IServiceProvider _serviceProvider;

    public ServiceAuthMiddleware(
        RequestDelegate next,
        ILogger<ServiceAuthMiddleware> logger,
        IServiceProvider serviceProvider)
    {
        _next = next;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Skip authentication for health checks and public endpoints
            if (ShouldSkipAuthentication(context.Request.Path))
            {
                await _next(context);
                return;
            }

            // Create a scope for this request to resolve scoped services
            using var scope = _serviceProvider.CreateScope();
            var authService = scope.ServiceProvider.GetRequiredService<IServiceAuthService>();

            // Extract and validate service token
            var serviceToken = ExtractServiceToken(context.Request);
            if (!string.IsNullOrEmpty(serviceToken))
            {
                var serviceAuthResult = await authService.AuthenticateServiceAsync(serviceToken);
                if (!serviceAuthResult.IsAuthenticated)
                {
                    _logger.LogWarning("Service authentication failed: {Error}", serviceAuthResult.ErrorMessage);
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { Error = "Service authentication failed", Details = serviceAuthResult.ErrorMessage });
                    return;
                }

                // Add service info to context
                context.Items["ServiceId"] = serviceAuthResult.ServiceId;
                context.Items["ServiceAuthenticated"] = true;
                _logger.LogDebug("Service authenticated: {ServiceId}", serviceAuthResult.ServiceId);
            }

            // Extract and validate user token if present
            var userToken = ExtractUserToken(context.Request);
            if (!string.IsNullOrEmpty(userToken))
            {
                var userAuthResult = await authService.ValidateUserTokenAsync(userToken);
                if (!userAuthResult.IsAuthenticated)
                {
                    _logger.LogWarning("User authentication failed: {Error}", userAuthResult.ErrorMessage);
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsJsonAsync(new { Error = "User authentication failed", Details = userAuthResult.ErrorMessage });
                    return;
                }

                // Add user info to context
                context.Items["UserId"] = userAuthResult.UserId;
                context.Items["UserPermissions"] = userAuthResult.Permissions;
                context.Items["UserAuthenticated"] = true;
                _logger.LogDebug("User authenticated: {UserId}", userAuthResult.UserId);
            }

            // Check if authentication is required for this endpoint
            if (RequiresAuthentication(context.Request.Path) && 
                !context.Items.ContainsKey("ServiceAuthenticated") && 
                !context.Items.ContainsKey("UserAuthenticated"))
            {
                _logger.LogWarning("Authentication required but no valid token provided for path: {Path}", context.Request.Path);
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(new { Error = "Authentication required" });
                return;
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in authentication middleware");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { Error = "Internal authentication error" });
        }
    }

    private bool ShouldSkipAuthentication(PathString path)
    {
        var skipPaths = new[]
        {
            "/health",
            "/swagger",
            "/api/redis/health",
            "/api/cachemanagement/overview"
        };

        return skipPaths.Any(skipPath => path.StartsWithSegments(skipPath));
    }

    private bool RequiresAuthentication(PathString path)
    {
        var publicPaths = new[]
        {
            "/health",
            "/swagger",
            "/api/redis/health",
            "/api/cachemanagement/overview"
        };

        return !publicPaths.Any(publicPath => path.StartsWithSegments(publicPath));
    }

    private string? ExtractServiceToken(HttpRequest request)
    {
        // Check Authorization header for service token
        var authHeader = request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Service "))
        {
            return authHeader.Substring("Service ".Length);
        }

        // Check X-Service-Token header
        var serviceTokenHeader = request.Headers["X-Service-Token"].FirstOrDefault();
        if (!string.IsNullOrEmpty(serviceTokenHeader))
        {
            return serviceTokenHeader;
        }

        // Check query parameter
        var serviceTokenQuery = request.Query["serviceToken"].FirstOrDefault();
        if (!string.IsNullOrEmpty(serviceTokenQuery))
        {
            return serviceTokenQuery;
        }

        return null;
    }

    private string? ExtractUserToken(HttpRequest request)
    {
        // Check Authorization header for Bearer token
        var authHeader = request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
        {
            return authHeader.Substring("Bearer ".Length);
        }

        // Check X-User-Token header
        var userTokenHeader = request.Headers["X-User-Token"].FirstOrDefault();
        if (!string.IsNullOrEmpty(userTokenHeader))
        {
            return userTokenHeader;
        }

        // Check query parameter
        var userTokenQuery = request.Query["userToken"].FirstOrDefault();
        if (!string.IsNullOrEmpty(userTokenQuery))
        {
            return userTokenQuery;
        }

        return null;
    }
}

public static class ServiceAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseServiceAuthentication(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ServiceAuthMiddleware>();
    }
}
