using Microsoft.EntityFrameworkCore;
using innkt.Groups.Models;

namespace innkt.Groups.Data;

public class GroupsDbContext : DbContext
{
    public GroupsDbContext(DbContextOptions<GroupsDbContext> options) : base(options)
    {
    }

    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<GroupPost> GroupPosts { get; set; }
    public DbSet<GroupInvitation> GroupInvitations { get; set; }
    public DbSet<GroupSettings> GroupSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Group configuration
        modelBuilder.Entity<Group>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.CoverImageUrl).HasMaxLength(500);
            
            // Indexes for performance
            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.IsPublic);
            entity.HasIndex(e => e.IsVerified);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Name);
        });

        // GroupMember configuration
        modelBuilder.Entity<GroupMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany(e => e.Members)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - user can only be member of group once
            entity.HasIndex(e => new { e.GroupId, e.UserId }).IsUnique();
            
            // Check constraint for valid roles
            entity.HasCheckConstraint("CK_GroupMember_Role", 
                "Role IN ('owner', 'admin', 'moderator', 'member')");
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.JoinedAt);
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
            
            // Unique constraint - post can only be in group once
            entity.HasIndex(e => new { e.GroupId, e.PostId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.IsAnnouncement);
            entity.HasIndex(e => e.IsPinned);
        });

        // GroupInvitation configuration
        modelBuilder.Entity<GroupInvitation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany(e => e.Invitations)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Check constraint for valid status
            entity.HasCheckConstraint("CK_GroupInvitation_Status", 
                "Status IN ('pending', 'accepted', 'rejected', 'expired')");
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.InvitedUserId);
            entity.HasIndex(e => e.InvitedByUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ExpiresAt);
        });

        // GroupSettings configuration
        modelBuilder.Entity<GroupSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithOne()
                  .HasForeignKey<GroupSettings>(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - one settings per group
            entity.HasIndex(e => e.GroupId).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
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
