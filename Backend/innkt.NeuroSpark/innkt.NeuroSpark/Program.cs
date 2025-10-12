using innkt.NeuroSpark.Services;
using innkt.NeuroSpark.Middleware;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Localization;
using StackExchange.Redis;
using Microsoft.Extensions.Options;
using innkt.KafkaCommunicationLibrary.Interfaces;
using innkt.KafkaCommunicationLibrary.Producers;
using innkt.KafkaCommunicationLibrary.Consumers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add JSON-based localization
var resourcesPath = Path.Combine(Directory.GetCurrentDirectory(), "Resources");
builder.Services.AddSingleton<IStringLocalizerFactory>(sp => 
    new JsonStringLocalizerFactory(resourcesPath, sp.GetRequiredService<ILoggerFactory>()));

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "en", "es", "fr", "de", "it", "pt", "nl", "pl", "cs", "hu", "ro" };
    options.SetDefaultCulture("en")
        .AddSupportedCultures(supportedCultures)
        .AddSupportedUICultures(supportedCultures);
    options.ApplyCurrentCultureToResponseHeaders = true;
});

// Add services to the container
builder.Services.AddControllers();

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false; // Set to true in production
        
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

// Add Service Authentication
builder.Services.AddAuthentication("ServiceAuth")
    .AddScheme<ServiceAuthenticationSchemeOptions, ServiceAuthenticationHandler>("ServiceAuth", options =>
    {
        options.ServiceToken = builder.Configuration["ServiceAuth:Token"] ?? "innkt-social-service-token-2025";
    });

// Add Authorization
builder.Services.AddAuthorization();

// Add Redis Configuration
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

// Add Redis Service
builder.Services.AddScoped<IRedisService, RedisService>();

// Add Service Authentication
builder.Services.AddScoped<IServiceAuthService, ServiceAuthService>();

// Add HTTP Client for Officer service communication
builder.Services.AddHttpClient<IServiceAuthService, ServiceAuthService>(client =>
{
    var baseUrl = builder.Configuration["OfficerService:BaseUrl"] ?? "https://localhost:5003";
    var timeout = int.Parse(builder.Configuration["OfficerService:Timeout"] ?? "30000");
    
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromMilliseconds(timeout);
});

// Add NeuroSpark Services (Commented out due to Redis dependencies)
// builder.Services.AddScoped<IImageProcessingService, ImageProcessingService>();
// builder.Services.AddScoped<IQrCodeService, QrCodeService>();
// builder.Services.AddScoped<IAdvancedImageProcessingService, AdvancedImageProcessingService>();

// Add Certificate Management Service (Commented out due to Redis dependencies)
// builder.Services.AddScoped<ICertificateService, CertificateService>();

// Add API Gateway Service (Commented out due to Redis dependencies)
// builder.Services.AddScoped<IApiGatewayService, ApiGatewayService>();

// Add HTTP Client for API Gateway
// builder.Services.AddHttpClient<IApiGatewayService, ApiGatewayService>(client =>
// {
//     client.Timeout = TimeSpan.FromSeconds(30);
// });

// Add Kafka Services (Commented out due to Redis dependencies)
// builder.Services.Configure<innkt.KafkaCommunicationLibrary.Configuration.KafkaProducerSettings>(builder.Configuration.GetSection("Kafka:Producer"));
// builder.Services.Configure<innkt.KafkaCommunicationLibrary.Configuration.KafkaConsumerSettings>(builder.Configuration.GetSection("Kafka:Consumer"));
// builder.Services.Configure<innkt.KafkaCommunicationLibrary.Configuration.KafkaServiceSettings>(builder.Configuration.GetSection("Kafka:Service"));

// Register Kafka configuration objects as services
// builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<innkt.KafkaCommunicationLibrary.Configuration.KafkaProducerSettings>>().Value);
// builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<innkt.KafkaCommunicationLibrary.Configuration.KafkaConsumerSettings>>().Value);
// builder.Services.AddSingleton(sp => sp.GetRequiredService<IOptions<innkt.KafkaCommunicationLibrary.Configuration.KafkaServiceSettings>>().Value);

// builder.Services.AddScoped<IKafkaProducer, KafkaProducer>();
// builder.Services.AddScoped<IKafkaConsumer, KafkaConsumer>();
// builder.Services.AddScoped<IKafkaService, KafkaService>();

// Add Performance & Monitoring Services
builder.Services.Configure<RedisPoolSettings>(builder.Configuration.GetSection("Redis:Pool"));
builder.Services.Configure<RateLimiterSettings>(builder.Configuration.GetSection("RateLimiting"));
builder.Services.AddScoped<IRedisConnectionPool, RedisConnectionPool>();
builder.Services.AddScoped<IPerformanceMonitor, PerformanceMonitor>();
builder.Services.AddScoped<IRateLimiter, RateLimiter>();

// Add Security Services (Basic only, without Redis dependencies)
builder.Services.AddScoped<IInputValidator, InputValidator>();

// Add Advanced Security Services
builder.Services.Configure<AuditLoggerSettings>(builder.Configuration.GetSection("AuditLogging"));
builder.Services.Configure<ApiKeyServiceSettings>(builder.Configuration.GetSection("ApiKeyManagement"));
builder.Services.Configure<EncryptionSettings>(builder.Configuration.GetSection("Encryption"));
builder.Services.AddScoped<IAuditLogger, AuditLogger>();
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();
builder.Services.AddScoped<IEncryptionService, EncryptionService>();

// Add Threat Detection Services
builder.Services.AddScoped<IThreatDetectionService, ThreatDetectionService>();

// Add AI Moderation Services
builder.Services.AddScoped<IAIModerationService, AIModerationService>();
builder.Services.AddScoped<INudeNetModerationService, NudeNetModerationService>();
builder.Services.AddScoped<IBackgroundRemovalService, BackgroundRemovalService>();

// Add Search Services
builder.Services.AddScoped<ISearchService, SearchService>();

// Add X.AI Configuration
builder.Services.Configure<innkt.NeuroSpark.Models.XAI.XAIConfiguration>(builder.Configuration.GetSection("XAI"));

// Add X.AI Services
builder.Services.AddHttpClient<IXAIService, XAIService>();
builder.Services.AddScoped<IXAIService, XAIService>();
builder.Services.AddScoped<IDailyUsageTracker, DailyUsageTracker>();
builder.Services.AddScoped<ISmartTokenManager, SmartTokenManager>();
builder.Services.AddScoped<IFreeTierRateLimiter, FreeTierRateLimiter>();
builder.Services.AddScoped<FreeTierFallbackService>();

// Add Grok AI Services
builder.Services.AddScoped<IGrokService, GrokService>();
builder.Services.AddScoped<IContentFilteringService, ContentFilteringService>();

// Add HTTP Client for AI Moderation services
builder.Services.AddHttpClient<IAIModerationService, AIModerationService>();
builder.Services.AddHttpClient<INudeNetModerationService, NudeNetModerationService>();
builder.Services.AddHttpClient<IBackgroundRemovalService, BackgroundRemovalService>();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure file upload limits
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB limit
});

var app = builder.Build();

// Create required directories before configuring static files
var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
var processedPath = Path.Combine(Directory.GetCurrentDirectory(), "processed");
var qrCodesPath = Path.Combine(Directory.GetCurrentDirectory(), "qrcodes");

Directory.CreateDirectory(uploadsPath);
Directory.CreateDirectory(processedPath);
Directory.CreateDirectory(qrCodesPath);

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Only use HTTPS redirection in production
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowAll");

// Use request localization (detects language from Accept-Language header)
app.UseRequestLocalization();

// Add Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// Add Security Middleware
app.UseMiddleware<SecurityMiddleware>();

// Add Service Authentication Middleware (Temporarily disabled for testing)
// app.UseServiceAuthentication();

// Serve static files from upload and processed directories
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(processedPath),
    RequestPath = "/processed"
});
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(qrCodesPath),
    RequestPath = "/qrcodes"
});

app.MapControllers();

app.Run();

