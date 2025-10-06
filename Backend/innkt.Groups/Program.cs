using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;
using AutoMapper;
using innkt.Groups.Mapping;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Confluent.Kafka;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
builder.Services.AddDbContext<GroupsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(GroupsMappingProfile));

// Add JWT Authentication (matching Officer service configuration)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "http://localhost:5001",
            ValidAudience = "innkt.officer.api",
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes("innkt.officer.jwt.secret.key.2025.very.long.and.secure.key"))
        };
    });

// Add HttpClient for external API calls
builder.Services.AddHttpClient();

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add Kafka producer
builder.Services.AddSingleton<IProducer<string, string>>(provider =>
{
    var config = new ProducerConfig
    {
        BootstrapServers = builder.Configuration["Kafka:BootstrapServers"] ?? "localhost:9092",
        ClientId = "groups-service",
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

// Add other services
builder.Services.AddScoped<innkt.Groups.Services.IUserService, innkt.Groups.Services.UserService>();
builder.Services.AddScoped<innkt.Groups.Services.IGroupService, innkt.Groups.Services.GroupService>();
builder.Services.AddScoped<innkt.Groups.Services.IPermissionService, innkt.Groups.Services.PermissionService>();
builder.Services.AddScoped<innkt.Groups.Services.IRoleManagementService, innkt.Groups.Services.RoleManagementService>();
builder.Services.AddScoped<innkt.Groups.Services.ISubgroupService, innkt.Groups.Services.SubgroupService>();
builder.Services.AddScoped<innkt.Groups.Services.ITopicService, innkt.Groups.Services.TopicService>();
builder.Services.AddScoped<innkt.Groups.Services.IAIIntegrationService, innkt.Groups.Services.AIIntegrationService>();

// Notification service removed - using Kafka events instead

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Check if we should run database update instead of web server
if (args.Length > 0 && args[0] == "update-db")
{
    try
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<GroupsDbContext>();
        
        Console.WriteLine("🔄 Updating database with missing columns...");
        
        // Add missing columns to GroupMembers table
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""GroupMembers"" ADD COLUMN IF NOT EXISTS ""IsParentAccount"" boolean NOT NULL DEFAULT false;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""GroupMembers"" ADD COLUMN IF NOT EXISTS ""KidAccountId"" uuid;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""GroupMembers"" ADD COLUMN IF NOT EXISTS ""SubgroupId"" uuid;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""GroupMembers"" ADD COLUMN IF NOT EXISTS ""RoleId"" uuid;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""GroupMembers"" ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP);");

        // Add missing columns to GroupRoles table
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""GroupRoles"" ADD COLUMN IF NOT EXISTS ""Permissions"" text NOT NULL DEFAULT '{}';");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""GroupRoles"" ADD COLUMN IF NOT EXISTS ""CanSeeRealUsername"" boolean NOT NULL DEFAULT false;");

        // Add missing columns to Subgroups table
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Subgroups"" ADD COLUMN IF NOT EXISTS ""Settings"" text NOT NULL DEFAULT '{}';");

        // Add missing columns to Topics table
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""AllowKidPosts"" boolean NOT NULL DEFAULT false;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""AllowParentPosts"" boolean NOT NULL DEFAULT true;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""AllowMemberPosts"" boolean NOT NULL DEFAULT true;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""AllowRolePosts"" boolean NOT NULL DEFAULT true;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""IsAnnouncementOnly"" boolean NOT NULL DEFAULT false;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""Status"" text NOT NULL DEFAULT 'active';");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""PausedAt"" timestamp with time zone;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""ArchivedAt"" timestamp with time zone;");
        await context.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Topics"" ADD COLUMN IF NOT EXISTS ""PostsCount"" integer NOT NULL DEFAULT 0;");

        // Skip migration history for now - columns are added successfully
        Console.WriteLine("Migration history update skipped - columns added successfully");

        Console.WriteLine("✅ Database updated successfully!");
        return;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error updating database: {ex.Message}");
        return;
    }
}

app.Run();