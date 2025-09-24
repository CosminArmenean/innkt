using MongoDB.Driver;
using innkt.Notifications.Models;

namespace innkt.Notifications.Data;

/// <summary>
/// MongoDB context for notification storage
/// Handles offline user notifications and delivery tracking
/// </summary>
public class NotificationDbContext
{
    private readonly IMongoDatabase _database;
    
    public NotificationDbContext(IMongoDatabase database)
    {
        _database = database;
    }
    
    /// <summary>
    /// Notifications collection for persistent storage
    /// </summary>
    public IMongoCollection<NotificationDocument> Notifications => 
        _database.GetCollection<NotificationDocument>("notifications");
    
    /// <summary>
    /// Create indexes for optimal query performance
    /// </summary>
    public async Task CreateIndexesAsync()
    {
        var notificationsCollection = Notifications;
        
        // Index for recipient queries
        await notificationsCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<NotificationDocument>(
                Builders<NotificationDocument>.IndexKeys
                    .Ascending(n => n.RecipientId)
                    .Descending(n => n.CreatedAt),
                new CreateIndexOptions { Name = "recipient_created" }
            )
        );
        
        // Index for unread notifications
        await notificationsCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<NotificationDocument>(
                Builders<NotificationDocument>.IndexKeys
                    .Ascending(n => n.RecipientId)
                    .Ascending(n => n.IsRead),
                new CreateIndexOptions { Name = "recipient_unread" }
            )
        );
        
        // Index for undelivered notifications
        await notificationsCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<NotificationDocument>(
                Builders<NotificationDocument>.IndexKeys
                    .Ascending(n => n.Delivered)
                    .Ascending(n => n.CreatedAt),
                new CreateIndexOptions { Name = "undelivered_created" }
            )
        );
        
        // Index for expired notifications cleanup
        await notificationsCollection.Indexes.CreateOneAsync(
            new CreateIndexModel<NotificationDocument>(
                Builders<NotificationDocument>.IndexKeys
                    .Ascending(n => n.ExpiresAt),
                new CreateIndexOptions { Name = "expires_at" }
            )
        );
    }
}
