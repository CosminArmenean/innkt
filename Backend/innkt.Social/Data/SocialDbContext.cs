using Microsoft.EntityFrameworkCore;
using innkt.Social.Models;

namespace innkt.Social.Data;

/// <summary>
/// Social service database context - optimized after migration
/// Kid safety tables moved to Kinder service
/// </summary>
public class SocialDbContext : DbContext
{
    public SocialDbContext(DbContextOptions<SocialDbContext> options) : base(options)
    {
    }

    // Core social media tables (optimized)
    public DbSet<Post> Posts { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Like> Likes { get; set; }
    public DbSet<Follow> Follows { get; set; }
    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<GroupPost> GroupPosts { get; set; }
    public DbSet<UserReport> UserReports { get; set; }
    public DbSet<PollVote> PollVotes { get; set; }
    
    // NOTE: Kid safety tables migrated to Kinder service (Port 5004)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Post configuration
        modelBuilder.Entity<Post>(entity =>
        {
            entity.ToTable("Posts", "public");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(5000);
            entity.Property(e => e.Location).HasMaxLength(255);
            entity.Property(e => e.PostType).HasMaxLength(50).HasDefaultValue("text");
            entity.Property(e => e.MediaUrls).HasColumnType("text[]");
            entity.Property(e => e.Hashtags).HasColumnType("text[]");
            entity.Property(e => e.Mentions).HasColumnType("text[]");
            entity.Property(e => e.PollOptions).HasColumnType("text[]");
            entity.Property(e => e.PollDuration).HasColumnName("PollDuration");
            entity.Property(e => e.PollExpiresAt).HasColumnName("PollExpiresAt");
            
            // Indexes for performance
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsPublic);
            entity.HasIndex(e => e.IsPinned);
            entity.HasIndex(e => e.PostType);
            entity.HasIndex(e => e.PollExpiresAt);
            
            // GIN index for array fields
            entity.HasIndex(e => e.Hashtags).HasMethod("gin");
            entity.HasIndex(e => e.PollOptions).HasMethod("gin");
        });

        // Comment configuration
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.ToTable("Comments", "public");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(2000);
            
            // Foreign key relationships
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.Comments)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.ParentComment)
                  .WithMany(e => e.Replies)
                  .HasForeignKey(e => e.ParentCommentId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ParentCommentId);
        });

        // Like configuration
        modelBuilder.Entity<Like>(entity =>
        {
            entity.ToTable("Likes", "public");
            entity.HasKey(e => e.Id);
            
            // Foreign key relationships
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.Likes)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Comment)
                  .WithMany(e => e.Likes)
                  .HasForeignKey(e => e.CommentId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - user can only like a post/comment once
            entity.HasIndex(e => new { e.UserId, e.PostId }).IsUnique().HasFilter("\"PostId\" IS NOT NULL");
            entity.HasIndex(e => new { e.UserId, e.CommentId }).IsUnique().HasFilter("\"CommentId\" IS NOT NULL");
            
            // Check constraint - must like either post or comment, not both
            entity.HasCheckConstraint("CK_Like_PostOrComment", 
                "(\"PostId\" IS NOT NULL AND \"CommentId\" IS NULL) OR (\"PostId\" IS NULL AND \"CommentId\" IS NOT NULL)");
        });

        // Follow configuration
        modelBuilder.Entity<Follow>(entity =>
        {
            entity.ToTable("Follows", "public");
            entity.HasKey(e => e.Id);
            
            // Unique constraint - user can only follow another user once
            entity.HasIndex(e => new { e.FollowerId, e.FollowingId }).IsUnique();
            
            // Check constraint - user cannot follow themselves
            entity.HasCheckConstraint("CK_Follow_NotSelf", "\"FollowerId\" != \"FollowingId\"");
            
            // Indexes
            entity.HasIndex(e => e.FollowerId);
            entity.HasIndex(e => e.FollowingId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Group configuration
        modelBuilder.Entity<Group>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.AvatarUrl).HasMaxLength(255);
            entity.Property(e => e.CoverImageUrl).HasMaxLength(255);
            
            // Indexes
            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.IsPublic);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.CreatedAt);
        });

        // GroupMember configuration
        modelBuilder.Entity<GroupMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany(e => e.Members)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - user can only be member of group once
            entity.HasIndex(e => new { e.GroupId, e.UserId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Role);
        });

        // GroupPost configuration
        modelBuilder.Entity<GroupPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany(e => e.GroupPosts)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.GroupPosts)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - post can only be in group once
            entity.HasIndex(e => new { e.GroupId, e.PostId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.PostId);
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

        // UserReport configuration
        modelBuilder.Entity<UserReport>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Unique constraint - user can only report another user once per reason
            entity.HasIndex(e => new { e.ReporterId, e.ReportedUserId, e.Reason }).IsUnique();
            
            // Check constraint - user cannot report themselves
            entity.HasCheckConstraint("CK_UserReport_NotSelf", "\"ReporterId\" != \"ReportedUserId\"");
            
            // Indexes
            entity.HasIndex(e => e.ReporterId);
            entity.HasIndex(e => e.ReportedUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        // PollVote configuration
        modelBuilder.Entity<PollVote>(entity =>
        {
            entity.ToTable("PollVotes", "public");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SelectedOption).IsRequired().HasMaxLength(500);
            
            // Foreign key relationship
            entity.HasOne(e => e.Post)
                  .WithMany(e => e.PollVotes)
                  .HasForeignKey(e => e.PostId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - one vote per user per poll
            entity.HasIndex(e => new { e.PostId, e.UserId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
