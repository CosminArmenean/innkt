using MongoDB.Driver;
using MongoDB.Bson;
using innkt.Social.Models.MongoDB;
using System.Reflection;

namespace innkt.Social.Data;

/// <summary>
/// MongoDB context for social media data with optimized collections
/// Handles posts, votes, and real-time updates
/// </summary>
public class MongoDbContext
{
    private readonly IMongoDatabase _database;
    private readonly ILogger<MongoDbContext> _logger;

    public MongoDbContext(IConfiguration configuration, ILogger<MongoDbContext> logger)
    {
        _logger = logger;
        
        var connectionString = configuration.GetConnectionString("MongoDB") 
            ?? throw new ArgumentNullException(nameof(configuration), "MongoDB connection string is required");
        
        _logger.LogInformation("Connecting to MongoDB with connection string: {ConnectionString}", 
            connectionString.Replace("mongodb://", "mongodb://***"));
        
        try
        {
            var mongoUrl = MongoUrl.Create(connectionString);
            
            // Create client with specific settings for replica set
            var clientSettings = MongoClientSettings.FromUrl(mongoUrl);
            clientSettings.ConnectTimeout = TimeSpan.FromSeconds(30);
            clientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(30);
            clientSettings.SocketTimeout = TimeSpan.FromSeconds(30);
            
            // Force replica set mode if replicaSet parameter is present
            if (!string.IsNullOrEmpty(mongoUrl.ReplicaSetName))
            {
                clientSettings.ReplicaSetName = mongoUrl.ReplicaSetName;
                clientSettings.ConnectionMode = ConnectionMode.ReplicaSet;
                
            // Add the server explicitly to help with discovery
            clientSettings.Servers = new[] { new MongoServerAddress("localhost", 27018) };
                
                // Increase timeouts for replica set discovery
                clientSettings.ServerSelectionTimeout = TimeSpan.FromSeconds(60);
                clientSettings.ConnectTimeout = TimeSpan.FromSeconds(60);
                
                _logger.LogInformation("Configuring MongoDB client for replica set: {ReplicaSetName}", mongoUrl.ReplicaSetName);
            }
            
            var client = new MongoClient(clientSettings);
            _database = client.GetDatabase(mongoUrl.DatabaseName ?? "innkt_social");

            _logger.LogInformation("Connected to MongoDB database: {DatabaseName}", _database.DatabaseNamespace.DatabaseName);
            
            // Test the connection
            Task.Run(async () => 
            {
                try
                {
                    await _database.RunCommandAsync((Command<BsonDocument>)"{ping:1}");
                    _logger.LogInformation("MongoDB connection test successful");
                    
                    // Ensure indexes are created after successful connection
                    await EnsureIndexesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "MongoDB connection test failed");
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create MongoDB client");
            throw;
        }
    }

    // Collections
    public IMongoCollection<MongoPost> Posts => GetCollection<MongoPost>();
    public IMongoCollection<MongoPollVote> PollVotes => GetCollection<MongoPollVote>();

    /// <summary>
    /// Get a MongoDB collection with proper naming convention
    /// </summary>
    private IMongoCollection<T> GetCollection<T>()
    {
        var collectionName = GetCollectionName<T>();
        return _database.GetCollection<T>(collectionName);
    }

    /// <summary>
    /// Get collection name from BsonCollection attribute or class name
    /// </summary>
    private static string GetCollectionName<T>()
    {
        var attribute = typeof(T).GetCustomAttribute<BsonCollectionAttribute>();
        return attribute?.CollectionName ?? typeof(T).Name.ToLowerInvariant();
    }

    /// <summary>
    /// Create optimized indexes for fast queries
    /// </summary>
    private async Task EnsureIndexesAsync()
    {
        try
        {
            _logger.LogInformation("Creating MongoDB indexes...");

            // Posts Collection Indexes
            var postsIndexes = new List<CreateIndexModel<MongoPost>>
            {
                // Feed queries - compound index for user feeds
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys
                        .Ascending(p => p.UserId)
                        .Descending(p => p.CreatedAt),
                    new CreateIndexOptions { Name = "userId_createdAt", Background = true }
                ),
                
                // Public posts for general feed
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys
                        .Ascending(p => p.IsPublic)
                        .Descending(p => p.CreatedAt),
                    new CreateIndexOptions { Name = "isPublic_createdAt", Background = true }
                ),
                
                // Feed score for algorithmic ranking
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys
                        .Descending(p => p.FeedScore)
                        .Descending(p => p.CreatedAt),
                    new CreateIndexOptions { Name = "feedScore_createdAt", Background = true }
                ),
                
                // PostId for lookups
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys.Ascending(p => p.PostId),
                    new CreateIndexOptions { Name = "postId_unique", Unique = true, Background = true }
                ),
                
                // Hashtags for search
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys.Ascending(p => p.Hashtags),
                    new CreateIndexOptions { Name = "hashtags", Background = true }
                ),
                
                // User cache expiry for batch updates
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys.Ascending("userSnapshot.cacheExpiry"),
                    new CreateIndexOptions { Name = "userCache_expiry", Background = true }
                ),
                
                // Poll expiration
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys.Ascending(p => p.PollExpiresAt),
                    new CreateIndexOptions { 
                        Name = "pollExpiresAt", 
                        Background = true
                    }
                ),
                
                // Text search index
                new CreateIndexModel<MongoPost>(
                    Builders<MongoPost>.IndexKeys
                        .Text(p => p.Content)
                        .Text(p => p.Hashtags)
                        .Text(p => p.Tags),
                    new CreateIndexOptions { Name = "text_search", Background = true }
                )
            };

            await Posts.Indexes.CreateManyAsync(postsIndexes);

            // Poll Votes Collection Indexes
            var votesIndexes = new List<CreateIndexModel<MongoPollVote>>
            {
                // Unique constraint: one vote per user per post
                new CreateIndexModel<MongoPollVote>(
                    Builders<MongoPollVote>.IndexKeys
                        .Ascending(v => v.PostId)
                        .Ascending(v => v.UserId),
                    new CreateIndexOptions { Name = "postId_userId_unique", Unique = true, Background = true }
                ),
                
                // Vote counting by post
                new CreateIndexModel<MongoPollVote>(
                    Builders<MongoPollVote>.IndexKeys.Ascending(v => v.PostId),
                    new CreateIndexOptions { Name = "postId", Background = true }
                ),
                
                // User vote history
                new CreateIndexModel<MongoPollVote>(
                    Builders<MongoPollVote>.IndexKeys
                        .Ascending(v => v.UserId)
                        .Descending(v => v.CreatedAt),
                    new CreateIndexOptions { Name = "userId_createdAt", Background = true }
                )
            };

            await PollVotes.Indexes.CreateManyAsync(votesIndexes);

            _logger.LogInformation("MongoDB indexes created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create MongoDB indexes");
        }
    }

    /// <summary>
    /// Health check for MongoDB connection
    /// </summary>
    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            await _database.RunCommandAsync((Command<BsonDocument>)"{ping:1}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MongoDB health check failed");
            return false;
        }
    }

    /// <summary>
    /// Get database statistics
    /// </summary>
    public async Task<BsonDocument> GetStatsAsync()
    {
        try
        {
            return await _database.RunCommandAsync((Command<BsonDocument>)"{dbStats:1}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get MongoDB stats");
            return new BsonDocument();
        }
    }
}
