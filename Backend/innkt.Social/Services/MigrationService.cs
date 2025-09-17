using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using innkt.Social.Data;
using innkt.Social.Models;
using innkt.Social.Models.MongoDB;

namespace innkt.Social.Services;

/// <summary>
/// Service for migrating data from PostgreSQL to MongoDB with user profile caching
/// </summary>
public interface IMigrationService
{
    Task<MigrationResult> MigratePostsToMongoAsync(int batchSize = 100);
    Task<MigrationResult> MigratePollVotesToMongoAsync(int batchSize = 100);
    Task<bool> ValidateMigrationAsync();
    Task<MigrationStats> GetMigrationStatsAsync();
}

public class MigrationService : IMigrationService
{
    private readonly SocialDbContext _sqlContext;
    private readonly MongoDbContext _mongoContext;
    private readonly IOfficerService _officerService;
    private readonly ILogger<MigrationService> _logger;

    public MigrationService(
        SocialDbContext sqlContext,
        MongoDbContext mongoContext,
        IOfficerService officerService,
        ILogger<MigrationService> logger)
    {
        _sqlContext = sqlContext;
        _mongoContext = mongoContext;
        _officerService = officerService;
        _logger = logger;
    }

    public async Task<MigrationResult> MigratePostsToMongoAsync(int batchSize = 100)
    {
        var result = new MigrationResult { StartTime = DateTime.UtcNow };
        
        try
        {
            _logger.LogInformation("Starting posts migration from PostgreSQL to MongoDB");

            // Get total count for progress tracking
            var totalPosts = await _sqlContext.Posts.CountAsync();
            _logger.LogInformation("Found {TotalPosts} posts to migrate", totalPosts);

            var processed = 0;
            var migrated = 0;
            var errors = 0;

            // Process in batches to avoid memory issues
            var offset = 0;
            while (offset < totalPosts)
            {
                var batch = await _sqlContext.Posts
                    .OrderBy(p => p.CreatedAt)
                    .Skip(offset)
                    .Take(batchSize)
                    .ToListAsync();

                if (!batch.Any())
                    break;

                _logger.LogInformation("Processing batch {Offset}-{End} of {Total}", 
                    offset + 1, offset + batch.Count, totalPosts);

                // Get unique user IDs for batch user profile loading
                var userIds = batch.Select(p => p.UserId).Distinct().ToList();
                var userProfiles = await _officerService.GetUsersByIdsAsync(userIds);

                // Migrate each post in the batch
                var mongoPostsBatch = new List<MongoPost>();
                
                foreach (var sqlPost in batch)
                {
                    try
                    {
                        var mongoPost = await ConvertToMongoPostAsync(sqlPost, userProfiles);
                        mongoPostsBatch.Add(mongoPost);
                        migrated++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error converting post {PostId}", sqlPost.Id);
                        errors++;
                    }
                    
                    processed++;
                }

                // Bulk insert the batch
                if (mongoPostsBatch.Any())
                {
                    try
                    {
                        await _mongoContext.Posts.InsertManyAsync(mongoPostsBatch);
                        _logger.LogInformation("Inserted {Count} posts to MongoDB", mongoPostsBatch.Count);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error bulk inserting posts batch");
                        errors += mongoPostsBatch.Count;
                        migrated -= mongoPostsBatch.Count;
                    }
                }

                offset += batchSize;

                // Progress logging
                var progress = (double)offset / totalPosts * 100;
                _logger.LogInformation("Migration progress: {Progress:F1}% ({Processed}/{Total})", 
                    progress, processed, totalPosts);
            }

            result.EndTime = DateTime.UtcNow;
            result.TotalProcessed = processed;
            result.TotalMigrated = migrated;
            result.TotalErrors = errors;
            result.Success = errors == 0;

            _logger.LogInformation(
                "Posts migration completed. Processed: {Processed}, Migrated: {Migrated}, Errors: {Errors}, Duration: {Duration}",
                processed, migrated, errors, result.Duration);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error during posts migration");
            result.EndTime = DateTime.UtcNow;
            result.Success = false;
            result.ErrorMessage = ex.Message;
            return result;
        }
    }

    public async Task<MigrationResult> MigratePollVotesToMongoAsync(int batchSize = 100)
    {
        var result = new MigrationResult { StartTime = DateTime.UtcNow };

        try
        {
            _logger.LogInformation("Starting poll votes migration from PostgreSQL to MongoDB");

            var totalVotes = await _sqlContext.PollVotes.CountAsync();
            _logger.LogInformation("Found {TotalVotes} poll votes to migrate", totalVotes);

            var processed = 0;
            var migrated = 0;
            var errors = 0;

            var offset = 0;
            while (offset < totalVotes)
            {
                var batch = await _sqlContext.PollVotes
                    .OrderBy(v => v.CreatedAt)
                    .Skip(offset)
                    .Take(batchSize)
                    .ToListAsync();

                if (!batch.Any())
                    break;

                // Get unique user IDs for batch user profile loading
                var userIds = batch.Select(v => v.UserId).Distinct().ToList();
                var userProfiles = await _officerService.GetUsersByIdsAsync(userIds);

                var mongoVotesBatch = new List<MongoPollVote>();

                foreach (var sqlVote in batch)
                {
                    try
                    {
                        var mongoVote = ConvertToMongoPollVote(sqlVote, userProfiles);
                        mongoVotesBatch.Add(mongoVote);
                        migrated++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error converting poll vote {VoteId}", sqlVote.Id);
                        errors++;
                    }

                    processed++;
                }

                // Bulk insert the batch
                if (mongoVotesBatch.Any())
                {
                    try
                    {
                        await _mongoContext.PollVotes.InsertManyAsync(mongoVotesBatch);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error bulk inserting poll votes batch");
                        errors += mongoVotesBatch.Count;
                        migrated -= mongoVotesBatch.Count;
                    }
                }

                offset += batchSize;
            }

            result.EndTime = DateTime.UtcNow;
            result.TotalProcessed = processed;
            result.TotalMigrated = migrated;
            result.TotalErrors = errors;
            result.Success = errors == 0;

            _logger.LogInformation(
                "Poll votes migration completed. Processed: {Processed}, Migrated: {Migrated}, Errors: {Errors}",
                processed, migrated, errors);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error during poll votes migration");
            result.EndTime = DateTime.UtcNow;
            result.Success = false;
            result.ErrorMessage = ex.Message;
            return result;
        }
    }

    public async Task<bool> ValidateMigrationAsync()
    {
        try
        {
            _logger.LogInformation("Validating migration data integrity");

            // Count comparison
            var sqlPostsCount = await _sqlContext.Posts.CountAsync();
            var mongoPostsCount = await _mongoContext.Posts.CountDocumentsAsync(Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false));

            _logger.LogInformation("Posts count - SQL: {SqlCount}, MongoDB: {MongoCount}", 
                sqlPostsCount, mongoPostsCount);

            var sqlVotesCount = await _sqlContext.PollVotes.CountAsync();
            var mongoVotesCount = await _mongoContext.PollVotes.CountDocumentsAsync(Builders<MongoPollVote>.Filter.Eq(v => v.IsDeleted, false));

            _logger.LogInformation("Poll votes count - SQL: {SqlCount}, MongoDB: {MongoCount}", 
                sqlVotesCount, mongoVotesCount);

            // Sample validation - check a few random posts
            var samplePosts = await _sqlContext.Posts
                .OrderBy(p => Guid.NewGuid())
                .Take(10)
                .ToListAsync();

            var validationErrors = 0;

            foreach (var sqlPost in samplePosts)
            {
                var mongoPost = await _mongoContext.Posts
                    .Find(Builders<MongoPost>.Filter.Eq(p => p.PostId, sqlPost.Id))
                    .FirstOrDefaultAsync();

                if (mongoPost == null)
                {
                    _logger.LogWarning("Post {PostId} not found in MongoDB", sqlPost.Id);
                    validationErrors++;
                    continue;
                }

                // Validate key fields
                if (mongoPost.Content != sqlPost.Content ||
                    mongoPost.PostType != sqlPost.PostType ||
                    mongoPost.UserId != sqlPost.UserId)
                {
                    _logger.LogWarning("Data mismatch for post {PostId}", sqlPost.Id);
                    validationErrors++;
                }
            }

            var isValid = sqlPostsCount == mongoPostsCount && 
                         sqlVotesCount == mongoVotesCount && 
                         validationErrors == 0;

            _logger.LogInformation("Migration validation result: {IsValid}", isValid);
            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during migration validation");
            return false;
        }
    }

    public async Task<MigrationStats> GetMigrationStatsAsync()
    {
        try
        {
            var sqlStats = new
            {
                Posts = await _sqlContext.Posts.CountAsync(),
                PollVotes = await _sqlContext.PollVotes.CountAsync(),
                Users = await _sqlContext.Posts.Select(p => p.UserId).Distinct().CountAsync()
            };

            var mongoStats = new
            {
                Posts = await _mongoContext.Posts.CountDocumentsAsync(Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false)),
                PollVotes = await _mongoContext.PollVotes.CountDocumentsAsync(Builders<MongoPollVote>.Filter.Eq(v => v.IsDeleted, false)),
                Users = (await _mongoContext.Posts
                    .Distinct<Guid>("userId", Builders<MongoPost>.Filter.Eq(p => p.IsDeleted, false))
                    .ToListAsync()).Count
            };

            return new MigrationStats
            {
                PostgreSQLPosts = sqlStats.Posts,
                MongoDBPosts = (int)mongoStats.Posts,
                PostgreSQLPollVotes = sqlStats.PollVotes,
                MongoDBPollVotes = (int)mongoStats.PollVotes,
                PostgreSQLUsers = sqlStats.Users,
                MongoDBUsers = mongoStats.Users,
                GeneratedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting migration stats");
            return new MigrationStats { GeneratedAt = DateTime.UtcNow };
        }
    }

    // Helper methods
    private async Task<MongoPost> ConvertToMongoPostAsync(Post sqlPost, Dictionary<Guid, DTOs.UserBasicInfo> userProfiles)
    {
        UserSnapshot? userSnapshot = null;
        
        if (userProfiles.TryGetValue(sqlPost.UserId, out var userInfo))
        {
            userSnapshot = new UserSnapshot
            {
                UserId = userInfo.Id.ToString(),
                DisplayName = userInfo.DisplayName,
                Username = userInfo.Username,
                AvatarUrl = userInfo.AvatarUrl,
                IsVerified = userInfo.IsVerified,
                IsActive = true
            };
            userSnapshot.RefreshExpiry();
        }

        var mongoPost = new MongoPost
        {
            PostId = sqlPost.Id,
            UserId = sqlPost.UserId,
            Content = sqlPost.Content,
            PostType = sqlPost.PostType,
            MediaUrls = sqlPost.MediaUrls?.ToList() ?? new List<string>(),
            Hashtags = sqlPost.Hashtags?.ToList() ?? new List<string>(),
            Mentions = sqlPost.Mentions?.ToList() ?? new List<string>(),
            Location = sqlPost.Location,
            IsPublic = sqlPost.IsPublic,
            IsPinned = sqlPost.IsPinned,
            PollOptions = sqlPost.PollOptions?.ToList(),
            PollDuration = sqlPost.PollDuration,
            PollExpiresAt = sqlPost.PollExpiresAt,
            LikesCount = sqlPost.LikesCount,
            CommentsCount = sqlPost.CommentsCount,
            SharesCount = sqlPost.SharesCount,
            ViewsCount = sqlPost.ViewsCount,
            CreatedAt = sqlPost.CreatedAt,
            UpdatedAt = sqlPost.UpdatedAt,
            UserSnapshot = userSnapshot
        };

        mongoPost.CalculateFeedScore();
        return mongoPost;
    }

    private MongoPollVote ConvertToMongoPollVote(PollVote sqlVote, Dictionary<Guid, DTOs.UserBasicInfo> userProfiles)
    {
        UserSnapshot? userSnapshot = null;
        
        if (userProfiles.TryGetValue(sqlVote.UserId, out var userInfo))
        {
            userSnapshot = new UserSnapshot
            {
                UserId = userInfo.Id.ToString(),
                DisplayName = userInfo.DisplayName,
                Username = userInfo.Username,
                AvatarUrl = userInfo.AvatarUrl,
                IsVerified = userInfo.IsVerified,
                IsActive = true
            };
            userSnapshot.RefreshExpiry();
        }

        return new MongoPollVote
        {
            VoteId = sqlVote.Id,
            PostId = sqlVote.PostId,
            UserId = sqlVote.UserId,
            SelectedOption = sqlVote.SelectedOption,
            OptionIndex = sqlVote.OptionIndex,
            CreatedAt = sqlVote.CreatedAt,
            UserSnapshot = userSnapshot
        };
    }
}

// DTOs for migration results
public class MigrationResult
{
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public TimeSpan Duration => EndTime?.Subtract(StartTime) ?? TimeSpan.Zero;
    public int TotalProcessed { get; set; }
    public int TotalMigrated { get; set; }
    public int TotalErrors { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

public class MigrationStats
{
    public int PostgreSQLPosts { get; set; }
    public int MongoDBPosts { get; set; }
    public int PostgreSQLPollVotes { get; set; }
    public int MongoDBPollVotes { get; set; }
    public int PostgreSQLUsers { get; set; }
    public int MongoDBUsers { get; set; }
    public DateTime GeneratedAt { get; set; }
}
