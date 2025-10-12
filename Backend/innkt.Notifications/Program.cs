using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Localization;
using System.Text;
using Serilog;
using Confluent.Kafka;
using innkt.Notifications.Services;
using innkt.Notifications.Hubs;
using innkt.Notifications.Data;
using MongoDB.Driver;

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

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/notifications-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Notifications API - Kafka-powered Messaging", 
        Version = "v1",
        Description = "High-performance notification service with kid-safety filtering"
    });
});

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
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
            RequireExpirationTime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("NotificationPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:51303")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add Kafka producer
builder.Services.AddSingleton<IProducer<string, string>>(provider =>
{
    var config = new ProducerConfig
    {
        BootstrapServers = builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092",
        ClientId = "notification-service",
        Acks = Acks.All,
        EnableIdempotence = true,
        MessageTimeoutMs = 30000,
        RetryBackoffMs = 100,
        MessageSendMaxRetries = 3,
        CompressionType = CompressionType.Snappy,
        BatchSize = 16384,
        LingerMs = 5
    };

    return new ProducerBuilder<string, string>(config)
        .SetErrorHandler((_, error) => Console.WriteLine($"Kafka producer error: {error.Reason}"))
        .SetLogHandler((_, logMessage) => Console.WriteLine($"Kafka producer log: {logMessage.Message}"))
        .Build();
});

// Add Kafka consumer
builder.Services.AddSingleton<IConsumer<string, string>>(provider =>
{
    var config = new ConsumerConfig
    {
        BootstrapServers = builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092",
        GroupId = "notification-service",
        AutoOffsetReset = AutoOffsetReset.Earliest,
        EnableAutoCommit = true,
        AutoCommitIntervalMs = 1000,
        SessionTimeoutMs = 30000,
        HeartbeatIntervalMs = 10000
    };

    return new ConsumerBuilder<string, string>(config)
        .SetErrorHandler((_, error) => Console.WriteLine($"Kafka consumer error: {error.Reason}"))
        .SetLogHandler((_, logMessage) => Console.WriteLine($"Kafka consumer log: {logMessage.Message}"))
        .Build();
});

// Add HttpClientFactory
builder.Services.AddHttpClient();

// Add SignalR for real-time notifications
builder.Services.AddSignalR();

// Add MongoDB for notification persistence
builder.Services.AddSingleton<IMongoDatabase>(provider =>
{
    var connectionString = builder.Configuration["MongoDB:ConnectionString"] ?? "mongodb://localhost:27017";
    var databaseName = builder.Configuration["MongoDB:DatabaseName"] ?? "innkt_notifications";
    
    var client = new MongoClient(connectionString);
    return client.GetDatabase(databaseName);
});

builder.Services.AddScoped<NotificationDbContext>();

// Add notification services
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEventConsumer, EventConsumer>();
builder.Services.AddScoped<ParentNotificationService>();

// Add Event Consumer as hosted service
builder.Services.AddHostedService<innkt.Notifications.Services.EventConsumerHostedService>();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Notifications API v1");
    c.RoutePrefix = string.Empty;
});

app.UseCors("NotificationPolicy");

// Use request localization (detects language from Accept-Language header)
app.UseRequestLocalization();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Map SignalR hub
app.MapHub<NotificationHub>("/notificationHub");

// Health check endpoint
app.MapGet("/health", () => new { 
    service = "Notifications", 
    status = "healthy", 
    version = "1.0.0",
    timestamp = DateTime.UtcNow,
    message = "🔔 Kafka-powered notification service operational!",
    port = 5006
});

Console.WriteLine("🔔 NOTIFICATIONS SERVICE - KAFKA-POWERED MESSAGING");
Console.WriteLine("🎯 Port: 5006");

app.Run("http://localhost:5006");

