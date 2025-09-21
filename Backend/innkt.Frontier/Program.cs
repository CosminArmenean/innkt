using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Serilog;
using Serilog.Events;
using System.Text;
using System.Net.Http.Headers;

Console.WriteLine("🚀 [DEBUG] Starting Frontier Gateway initialization...");

var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("✅ [DEBUG] WebApplication.CreateBuilder completed");

// Configure Serilog
Console.WriteLine("🔧 [DEBUG] Configuring Serilog...");

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File("logs/frontier-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

Console.WriteLine("✅ [DEBUG] Serilog configured successfully");

builder.Host.UseSerilog();

Console.WriteLine("✅ [DEBUG] UseSerilog() completed");

// Add configuration
Console.WriteLine("🔧 [DEBUG] Adding configuration sources...");

builder.Configuration
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddJsonFile("ocelot.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

Console.WriteLine("✅ [DEBUG] Configuration sources added successfully");

// Add HttpContextAccessor for JWT forwarding
Console.WriteLine("🔧 [DEBUG] Adding HttpContextAccessor...");
builder.Services.AddHttpContextAccessor();
Console.WriteLine("✅ [DEBUG] HttpContextAccessor added");

// Add Ocelot with JWT forwarding
Console.WriteLine("🔧 [DEBUG] Adding Ocelot services...");
builder.Services.AddOcelot(builder.Configuration)
    .AddDelegatingHandler<JwtTokenForwardingHandler>();

Console.WriteLine("✅ [DEBUG] Ocelot services added successfully");

// Add Authentication
Console.WriteLine("🔧 [DEBUG] Adding JWT Authentication...");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "")),
            ClockSkew = TimeSpan.Zero
        };
    });

Console.WriteLine("✅ [DEBUG] JWT Authentication configured successfully");

// Add Authorization
Console.WriteLine("🔧 [DEBUG] Adding Authorization policies...");
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ApiScope", policy =>
    {
        policy.RequireAuthenticatedUser();
    });
});

Console.WriteLine("✅ [DEBUG] Authorization policies configured");

// Add CORS
Console.WriteLine("🔧 [DEBUG] Adding CORS policies...");
builder.Services.AddCors(options =>
{
    options.AddPolicy("default", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>())
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

Console.WriteLine("✅ [DEBUG] CORS policies configured");

// Add Redis Cache
Console.WriteLine("🔧 [DEBUG] Adding Redis cache...");
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

Console.WriteLine("✅ [DEBUG] Redis cache configured");

// Add MediatR
Console.WriteLine("🔧 [DEBUG] Adding MediatR...");
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

Console.WriteLine("✅ [DEBUG] MediatR configured");

// Add AutoMapper
Console.WriteLine("🔧 [DEBUG] Adding AutoMapper...");
builder.Services.AddAutoMapper(typeof(Program));
Console.WriteLine("✅ [DEBUG] AutoMapper configured");

Console.WriteLine("🏗️ [DEBUG] Building application...");
var app = builder.Build();
Console.WriteLine("✅ [DEBUG] Application built successfully");

// Configure the HTTP request pipeline
Console.WriteLine("🔧 [DEBUG] Configuring HTTP request pipeline...");

if (app.Environment.IsDevelopment())
{
    Console.WriteLine("🔧 [DEBUG] Adding developer exception page...");
    app.UseDeveloperExceptionPage();
}

Console.WriteLine("🔧 [DEBUG] Adding HTTPS redirection...");
app.UseHttpsRedirection();

Console.WriteLine("🔧 [DEBUG] Adding CORS middleware...");
app.UseCors("default");

Console.WriteLine("🔧 [DEBUG] Adding Authentication middleware...");
app.UseAuthentication();

Console.WriteLine("🔧 [DEBUG] Adding Authorization middleware...");
app.UseAuthorization();

Console.WriteLine("✅ [DEBUG] All middleware configured successfully");

// Use Ocelot
Console.WriteLine("🚀 [DEBUG] Starting Ocelot initialization...");
Console.WriteLine("⚠️  [DEBUG] This is where hanging typically occurs - initializing Ocelot...");
await app.UseOcelot();
Console.WriteLine("🎉 [DEBUG] Ocelot initialization completed successfully!");

Console.WriteLine("🚀 [DEBUG] Starting application with app.Run()...");
Console.WriteLine("🌐 [DEBUG] Web server will start listening on configured ports...");
Console.WriteLine("⚠️  [DEBUG] NO MORE CONSOLE OUTPUT EXPECTED - Server enters listening mode");
Console.WriteLine("✅ [DEBUG] To verify: Test-NetConnection localhost -Port 51303");
app.Run();

// JWT Token Forwarding Handler
public class JwtTokenForwardingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public JwtTokenForwardingHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            var authHeader = httpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader))
            {
                request.Headers.Authorization = AuthenticationHeaderValue.Parse(authHeader);
            }
        }

        return await base.SendAsync(request, cancellationToken);
    }
}
