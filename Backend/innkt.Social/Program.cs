using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using innkt.Social.Data;
using innkt.Social.Services;
using StackExchange.Redis;
using AutoMapper;
using Confluent.Kafka;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/social-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Entity Framework
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
Console.WriteLine($"Using connection string: {connectionString}");
builder.Services.AddDbContext<SocialDbContext>(options =>
    options.UseNpgsql(connectionString)
           .EnableSensitiveDataLogging()
           .LogTo(Console.WriteLine, LogLevel.Information));

// Add Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(configuration);
});

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = "Social";
});

// Add Memory Cache for UserProfileCacheService
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1000; // Limit to 1000 cached profiles
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
            // Don't require key ID validation
            RequireExpirationTime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program), typeof(innkt.Social.Mapping.AutoMapperProfile));

// Add MongoDB
builder.Services.AddSingleton<MongoDbContext>();

// Add Application Services
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IMongoPostService, MongoPostService>();
builder.Services.AddScoped<IMigrationService, MigrationService>();
builder.Services.AddSingleton<IUserProfileCacheService, UserProfileCacheService>();
builder.Services.AddSingleton<IRealtimeService, RealtimeService>();
builder.Services.AddHostedService<RealtimeHostedService>();
builder.Services.AddScoped<IMongoCommentService, MongoCommentService>(); // MongoDB comment service
builder.Services.AddScoped<IFollowService, FollowService>();
builder.Services.AddScoped<IRepostService, RepostService>(); // NEW: Repost service
builder.Services.AddScoped<IGrokService, GrokService>(); // NEW: Grok AI service
builder.Services.AddScoped<INeuroSparkService, NeuroSparkService>(); // NEW: NeuroSpark service
// NOTE: Kid safety, notifications, and content filtering services migrated to dedicated microservices:
// - Kid safety → Kinder service (Port 5004)
// - Notifications → Notifications service (Port 5006) 
// - Content filtering → NeuroSpark service (Port 5005)
builder.Services.AddScoped<TrendingService>();

// NOTE: Kafka and notification configuration migrated to Notifications service

// Add HTTP Client for Officer service
builder.Services.AddHttpClient<IOfficerService, OfficerService>();

// Add HTTP Client for NeuroSpark service with service authentication
builder.Services.AddHttpClient<INeuroSparkService, NeuroSparkService>((serviceProvider, client) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var serviceToken = configuration["NeuroSpark:ServiceToken"];
    client.DefaultRequestHeaders.Add("X-Service-Token", serviceToken);
    client.DefaultRequestHeaders.Add("X-Service-Name", "innkt-social");
});

// Add HTTP Client for Notification service (for Grok notifications)
builder.Services.AddHttpClient<GrokService>();

// Add Logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
});

var app = builder.Build();

// Configure the HTTP request pipeline
// Enable Swagger in all environments
app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is created
// using (var scope = app.Services.CreateScope())
// {
//     var context = scope.ServiceProvider.GetRequiredService<SocialDbContext>();
//     context.Database.EnsureCreated();
// }

// Health check endpoint
app.MapGet("/health", () => new { Status = "Healthy", Service = "innkt.Social", Timestamp = DateTime.UtcNow });

app.Run();
