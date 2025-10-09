using Duende.IdentityServer.EntityFramework.DbContexts;
using Duende.IdentityServer.EntityFramework.Mappers;
using innkt.Officer.Data;
using innkt.Officer.Models;
using innkt.Officer.Services;
using innkt.StringLibrary.Data;
using innkt.StringLibrary.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/innkt-officer-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework with PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<ConfigurationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("IdentityServer"), 
        opt => opt.MigrationsAssembly("innkt.Officer")));

builder.Services.AddDbContext<PersistedGrantDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("IdentityServer"), 
        opt => opt.MigrationsAssembly("innkt.Officer")));

// Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add Redis Configuration
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
    return ConnectionMultiplexer.Connect(connectionString);
});

// Add Redis Distributed Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    options.InstanceName = builder.Configuration["Redis:InstanceName"] ?? "Officer";
});

// Add Localization and Enhanced Logging Services
builder.Services.AddScoped<ILocalizationService, LocalizationService>();
builder.Services.AddScoped<IEnhancedLoggingService, EnhancedLoggingService>();

// Add Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMfaService, MfaService>();
builder.Services.AddScoped<IKidAccountService, KidAccountService>();
builder.Services.AddScoped<IUserVerificationService, UserVerificationService>();
builder.Services.AddScoped<IUsernameValidationService, UsernameValidationService>();

// Add JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.Authority = builder.Configuration["Jwt:Issuer"];
    options.Audience = builder.Configuration["Jwt:Audience"];
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
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? ""))
    };
});

// Configure IdentityServer
builder.Services.AddIdentityServer(options =>
{
    options.Events.RaiseErrorEvents = true;
    options.Events.RaiseInformationEvents = true;
    options.Events.RaiseFailureEvents = true;
    options.Events.RaiseSuccessEvents = true;
    
    options.EmitStaticAudienceClaim = true;
})
.AddConfigurationStore(options =>
{
    options.ConfigureDbContext = b => b.UseNpgsql(
        builder.Configuration.GetConnectionString("IdentityServer"),
        opt => opt.MigrationsAssembly("innkt.Officer"));
})
.AddOperationalStore(options =>
{
    options.ConfigureDbContext = b => b.UseNpgsql(
        builder.Configuration.GetConnectionString("IdentityServer"),
        opt => opt.MigrationsAssembly("innkt.Officer"));
});

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!, tags: new[] { "ready" })
    .AddRedis(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379", tags: new[] { "ready" });

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

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Configure Swagger
app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseStaticFiles();

app.UseRouting();

app.UseIdentityServer();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health Check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});

// Seed the database
using (var serviceScope = app.Services.CreateScope())
{
    var services = serviceScope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var configContext = services.GetRequiredService<ConfigurationDbContext>();
        var persistedGrantContext = services.GetRequiredService<PersistedGrantDbContext>();
        
        // Apply migrations
        context.Database.Migrate();
        configContext.Database.Migrate();
        persistedGrantContext.Database.Migrate();
        
        // Seed String Library (temporarily disabled for debugging)
        // await StringLibrarySeeder.SeedAsync(services.GetRequiredService<ILocalizationService>());
        
        Log.Information("Database seeded successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while seeding the database");
    }
}

app.Run();
