using Microsoft.AspNetCore.Http;
using innkt.NeuroSpark.Services;

namespace innkt.NeuroSpark.Middleware;

public class SecurityMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityMiddleware> _logger;
    private readonly IServiceProvider _serviceProvider;

    public SecurityMiddleware(
        RequestDelegate next,
        ILogger<SecurityMiddleware> logger,
        IServiceProvider serviceProvider)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            // Resolve scoped services for this request
            using var scope = _serviceProvider.CreateScope();
            var inputValidator = scope.ServiceProvider.GetRequiredService<IInputValidator>();
            var performanceMonitor = scope.ServiceProvider.GetRequiredService<IPerformanceMonitor>();
            var rateLimiter = scope.ServiceProvider.GetRequiredService<IRateLimiter>();
            
            // Apply security headers
            ApplySecurityHeaders(context);

            // Validate request headers
            var headerValidation = inputValidator.ValidateHeaders(context.Request.Headers);
            if (!headerValidation.IsValid)
            {
                _logger.LogWarning("Request headers validation failed: {Errors}", string.Join(", ", headerValidation.Errors));
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { error = "Invalid request headers", details = headerValidation.Errors });
                return;
            }

            // Check rate limiting
            var clientId = GetClientIdentifier(context);
            var defaultRule = new RateLimitRule
            {
                Name = "Default",
                Endpoint = context.Request.Path,
                MaxRequests = 100,
                Window = TimeSpan.FromMinutes(1),
                BlockDuration = TimeSpan.FromMinutes(5)
            };
            var rateLimitResult = await rateLimiter.CheckRateLimitAsync(clientId, context.Request.Path, defaultRule);
            
            if (!rateLimitResult.IsAllowed)
            {
                _logger.LogWarning("Rate limit exceeded for client {ClientId}: {Path}", clientId, context.Request.Path);
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers["Retry-After"] = rateLimitResult.TimeUntilReset.TotalSeconds.ToString();
                await context.Response.WriteAsJsonAsync(new { error = "Rate limit exceeded", retryAfter = rateLimitResult.TimeUntilReset.TotalSeconds });
                return;
            }

            // Add rate limit headers
            context.Response.Headers["X-RateLimit-Limit"] = rateLimitResult.AppliedRule.MaxRequests.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = rateLimitResult.RemainingRequests.ToString();
            context.Response.Headers["X-RateLimit-Reset"] = rateLimitResult.ResetTime.ToString("R");

            // Continue with the request pipeline
            await _next(context);

            // Record successful request metrics
            performanceMonitor.IncrementCounter("security_middleware_success", 1, "security");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in security middleware");
            
            // Try to get performance monitor for error logging
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var performanceMonitor = scope.ServiceProvider.GetRequiredService<IPerformanceMonitor>();
                performanceMonitor.IncrementCounter("security_middleware_error", 1, "security");
            }
            catch
            {
                // Ignore errors in error handling
            }
            
            // Don't expose internal errors to the client
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new { error = "Internal server error" });
        }
        finally
        {
            stopwatch.Stop();
            
            // Try to record timing
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var performanceMonitor = scope.ServiceProvider.GetRequiredService<IPerformanceMonitor>();
                performanceMonitor.RecordTiming("security_middleware_duration", stopwatch.Elapsed, "security");
            }
            catch
            {
                // Ignore errors in timing recording
            }
        }
    }

    private void ApplySecurityHeaders(HttpContext context)
    {
        var response = context.Response;

        // Security headers
        response.Headers["X-Content-Type-Options"] = "nosniff";
        response.Headers["X-Frame-Options"] = "DENY";
        response.Headers["X-XSS-Protection"] = "1; mode=block";
        response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
        
        // Content Security Policy
        response.Headers["Content-Security-Policy"] = 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self'; " +
            "connect-src 'self'; " +
            "media-src 'self'; " +
            "object-src 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'; " +
            "frame-ancestors 'none';";

        // HSTS header (only for HTTPS)
        if (context.Request.IsHttps)
        {
            response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
        }

        // Remove server information
        response.Headers.Remove("Server");
        response.Headers.Remove("X-Powered-By");
    }

    private string GetClientIdentifier(HttpContext context)
    {
        // Try to get client IP from various headers
        var clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                      context.Request.Headers["X-Real-IP"].FirstOrDefault() ??
                      context.Connection.RemoteIpAddress?.ToString() ??
                      "unknown";

        // Clean the IP address
        clientIp = clientIp.Split(',')[0].Trim();

        // Add user agent for more granular rate limiting
        var userAgent = context.Request.Headers["User-Agent"].FirstOrDefault() ?? "unknown";
        
        return $"{clientIp}:{userAgent.GetHashCode()}";
    }
}
