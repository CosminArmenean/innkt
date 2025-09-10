using Microsoft.EntityFrameworkCore;
using innkt.Follow.Models;

namespace innkt.Follow.Data;

public class FollowDbContext : DbContext
{
    public FollowDbContext(DbContextOptions<FollowDbContext> options) : base(options)
    {
    }

    public DbSet<Follow> Follows { get; set; }
    public DbSet<FollowRequest> FollowRequests { get; set; }
    public DbSet<FollowNotification> FollowNotifications { get; set; }
    public DbSet<FollowStats> FollowStats { get; set; }
    public DbSet<FollowSuggestion> FollowSuggestions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Follow configuration
        modelBuilder.Entity<Follow>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Unique constraint - user can only follow another user once
            entity.HasIndex(e => new { e.FollowerId, e.FollowingId }).IsUnique();
            
            // Check constraint - user cannot follow themselves
            entity.HasCheckConstraint("CK_Follow_NotSelf", "FollowerId != FollowingId");
            
            // Indexes for performance
            entity.HasIndex(e => e.FollowerId);
            entity.HasIndex(e => e.FollowingId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.IsMuted);
            entity.HasIndex(e => e.IsBlocked);
        });

        // FollowRequest configuration
        modelBuilder.Entity<FollowRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            
            // Check constraint for valid status
            entity.HasCheckConstraint("CK_FollowRequest_Status", 
                "Status IN ('pending', 'accepted', 'rejected', 'cancelled')");
            
            // Unique constraint - one pending request per user pair
            entity.HasIndex(e => new { e.RequesterId, e.TargetUserId, e.Status })
                  .IsUnique()
                  .HasFilter("Status = 'pending'");
            
            // Indexes
            entity.HasIndex(e => e.RequesterId);
            entity.HasIndex(e => e.TargetUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ExpiresAt);
        });

        // FollowNotification configuration
        modelBuilder.Entity<FollowNotification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Message).HasMaxLength(500);
            
            // Check constraint for valid notification types
            entity.HasCheckConstraint("CK_FollowNotification_Type", 
                "Type IN ('follow', 'unfollow', 'follow_request', 'follow_accepted', 'follow_rejected')");
            
            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.RelatedUserId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.IsRead);
            entity.HasIndex(e => e.CreatedAt);
        });

        // FollowStats configuration
        modelBuilder.Entity<FollowStats>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Unique constraint - one stats record per user
            entity.HasIndex(e => e.UserId).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.LastUpdatedAt);
        });

        // FollowSuggestion configuration
        modelBuilder.Entity<FollowSuggestion>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Reason).IsRequired().HasMaxLength(50);
            
            // Check constraint for valid reasons
            entity.HasCheckConstraint("CK_FollowSuggestion_Reason", 
                "Reason IN ('mutual_friends', 'similar_interests', 'location', 'trending', 'recommended')");
            
            // Unique constraint - one suggestion per user pair
            entity.HasIndex(e => new { e.UserId, e.SuggestedUserId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SuggestedUserId);
            entity.HasIndex(e => e.Score);
            entity.HasIndex(e => e.IsDismissed);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure timestamps
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var createdAtProperty = entityType.FindProperty("CreatedAt");
            if (createdAtProperty != null)
            {
                createdAtProperty.SetDefaultValueSql("CURRENT_TIMESTAMP");
            }
            
            var updatedAtProperty = entityType.FindProperty("UpdatedAt");
            if (updatedAtProperty != null)
            {
                updatedAtProperty.SetDefaultValueSql("CURRENT_TIMESTAMP");
            }
        }
    }
}
