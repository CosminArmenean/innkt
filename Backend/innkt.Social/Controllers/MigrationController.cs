using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using innkt.Social.Services;

namespace innkt.Social.Controllers;

/// <summary>
/// Controller for managing data migration from PostgreSQL to MongoDB
/// Admin/maintenance endpoints for the hybrid architecture
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize] // Consider adding admin role requirement
public class MigrationController : ControllerBase
{
    private readonly IMigrationService _migrationService;
    private readonly ILogger<MigrationController> _logger;

    public MigrationController(IMigrationService migrationService, ILogger<MigrationController> logger)
    {
        _migrationService = migrationService;
        _logger = logger;
    }

    /// <summary>
    /// Get migration statistics comparing PostgreSQL and MongoDB data
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<MigrationStats>> GetMigrationStats()
    {
        try
        {
            var stats = await _migrationService.GetMigrationStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting migration stats");
            return StatusCode(500, "An error occurred while retrieving migration statistics");
        }
    }

    /// <summary>
    /// Migrate posts from PostgreSQL to MongoDB with user profile caching
    /// </summary>
    [HttpPost("posts")]
    [AllowAnonymous] // Temporary for migration
    public async Task<ActionResult<MigrationResult>> MigratePosts([FromQuery] int batchSize = 100)
    {
        try
        {
            if (batchSize < 1 || batchSize > 1000)
            {
                return BadRequest("Batch size must be between 1 and 1000");
            }

            _logger.LogInformation("Starting posts migration with batch size {BatchSize}", batchSize);

            var result = await _migrationService.MigratePostsToMongoAsync(batchSize);
            
            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during posts migration");
            return StatusCode(500, "An error occurred during posts migration");
        }
    }

    /// <summary>
    /// Migrate poll votes from PostgreSQL to MongoDB
    /// </summary>
    [HttpPost("poll-votes")]
    public async Task<ActionResult<MigrationResult>> MigratePollVotes([FromQuery] int batchSize = 100)
    {
        try
        {
            if (batchSize < 1 || batchSize > 1000)
            {
                return BadRequest("Batch size must be between 1 and 1000");
            }

            _logger.LogInformation("Starting poll votes migration with batch size {BatchSize}", batchSize);

            var result = await _migrationService.MigratePollVotesToMongoAsync(batchSize);
            
            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during poll votes migration");
            return StatusCode(500, "An error occurred during poll votes migration");
        }
    }

    /// <summary>
    /// Migrate all data (posts and poll votes) in sequence
    /// </summary>
    [HttpPost("all")]
    public async Task<ActionResult<CompleteMigrationResult>> MigrateAll([FromQuery] int batchSize = 100)
    {
        try
        {
            _logger.LogInformation("Starting complete migration with batch size {BatchSize}", batchSize);

            var completeMigration = new CompleteMigrationResult
            {
                StartTime = DateTime.UtcNow
            };

            // Migrate posts first
            _logger.LogInformation("Step 1: Migrating posts");
            completeMigration.PostsMigration = await _migrationService.MigratePostsToMongoAsync(batchSize);

            // Migrate poll votes
            _logger.LogInformation("Step 2: Migrating poll votes");
            completeMigration.PollVotesMigration = await _migrationService.MigratePollVotesToMongoAsync(batchSize);

            // Validate migration
            _logger.LogInformation("Step 3: Validating migration");
            completeMigration.ValidationPassed = await _migrationService.ValidateMigrationAsync();

            completeMigration.EndTime = DateTime.UtcNow;
            completeMigration.Success = completeMigration.PostsMigration.Success && 
                                      completeMigration.PollVotesMigration.Success && 
                                      completeMigration.ValidationPassed;

            _logger.LogInformation(
                "Complete migration finished. Success: {Success}, Duration: {Duration}",
                completeMigration.Success, completeMigration.Duration);

            return Ok(completeMigration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during complete migration");
            return StatusCode(500, "An error occurred during complete migration");
        }
    }

    /// <summary>
    /// Validate migration data integrity
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ValidationResult>> ValidateMigration()
    {
        try
        {
            _logger.LogInformation("Starting migration validation");

            var isValid = await _migrationService.ValidateMigrationAsync();
            var stats = await _migrationService.GetMigrationStatsAsync();

            var result = new ValidationResult
            {
                IsValid = isValid,
                Stats = stats,
                ValidatedAt = DateTime.UtcNow
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during migration validation");
            return StatusCode(500, "An error occurred during migration validation");
        }
    }

    /// <summary>
    /// Health check for migration services
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<ActionResult> GetMigrationHealth()
    {
        try
        {
            var stats = await _migrationService.GetMigrationStatsAsync();
            
            return Ok(new
            {
                Status = "Healthy",
                Service = "Migration Service",
                PostgreSQLConnected = stats.PostgreSQLPosts >= 0,
                MongoDBConnected = stats.MongoDBPosts >= 0,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Migration health check failed");
            return StatusCode(500, new
            {
                Status = "Unhealthy",
                Service = "Migration Service",
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}

// Additional DTOs for migration controller
public class CompleteMigrationResult
{
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public TimeSpan Duration => EndTime?.Subtract(StartTime) ?? TimeSpan.Zero;
    public MigrationResult PostsMigration { get; set; } = new();
    public MigrationResult PollVotesMigration { get; set; } = new();
    public bool ValidationPassed { get; set; }
    public bool Success { get; set; }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public MigrationStats Stats { get; set; } = new();
    public DateTime ValidatedAt { get; set; }
}
