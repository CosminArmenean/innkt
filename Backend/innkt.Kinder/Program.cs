using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using innkt.Kinder.Data;
using innkt.Kinder.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/kinder-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Kinder API - Revolutionary Child Protection Service", 
        Version = "v1",
        Description = "Industry-leading child safety and protection microservice"
    });
});

// Add Entity Framework for PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<KinderDbContext>(options =>
    options.UseNpgsql(connectionString));

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
    options.AddPolicy("KinderSafetyPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3001", "http://localhost:51303")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add Kinder services
builder.Services.AddScoped<IKidSafetyService, KidSafetyService>();
builder.Services.AddScoped<IKinderAuthService, KinderAuthService>();

// Add HTTP Clients for inter-service communication
builder.Services.AddHttpClient("NotificationService", client =>
{
    client.BaseAddress = new Uri("http://localhost:5006/");
});
builder.Services.AddHttpClient("NeuroSparkService", client =>
{
    client.BaseAddress = new Uri("http://localhost:5005/");
});

// Add Kafka Producer
builder.Services.AddSingleton<Confluent.Kafka.IProducer<string, string>>(sp =>
{
    var config = new Confluent.Kafka.ProducerConfig
    {
        BootstrapServers = "localhost:9092",
        ClientId = "kinder-service"
    };
    return new Confluent.Kafka.ProducerBuilder<string, string>(config).Build();
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Kinder API v1");
    c.RoutePrefix = string.Empty;
});

app.UseCors("KinderSafetyPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new { 
    service = "Kinder", 
    status = "healthy", 
    version = "1.0.0",
    timestamp = DateTime.UtcNow,
    message = "🛡️ Revolutionary child protection service operational!",
    port = 5004
});

Console.WriteLine("🛡️ KINDER SERVICE - REVOLUTIONARY CHILD PROTECTION");
Console.WriteLine("🎯 Port: 5004");
Console.WriteLine("🛡️ Purpose: Industry-leading child safety");

app.Run("http://localhost:5004");
