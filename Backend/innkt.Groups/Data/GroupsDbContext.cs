using Microsoft.EntityFrameworkCore;
using innkt.Groups.Models;

namespace innkt.Groups.Data;

public class GroupsDbContext : DbContext
{
    public GroupsDbContext(DbContextOptions<GroupsDbContext> options) : base(options)
    {
    }

    // Core entities
    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<GroupPost> GroupPosts { get; set; }
    public DbSet<GroupInvitation> GroupInvitations { get; set; }
    public DbSet<GroupSettings> GroupSettings { get; set; }
    
    // Enhanced entities
    public DbSet<Subgroup> Subgroups { get; set; }
    public DbSet<GroupRole> GroupRoles { get; set; }
    public DbSet<SubgroupRole> SubgroupRoles { get; set; }
    public DbSet<Topic> Topics { get; set; }
    public DbSet<TopicPost> TopicPosts { get; set; }
    public DbSet<SubgroupMember> SubgroupMembers { get; set; }
    public DbSet<GroupDocumentation> GroupDocumentations { get; set; }
    public DbSet<GroupPoll> GroupPolls { get; set; }
    public DbSet<PollVote> PollVotes { get; set; }
    public DbSet<GroupRule> GroupRules { get; set; }
    
    // File management
    public DbSet<GroupFile> GroupFiles { get; set; }
    public DbSet<GroupFilePermission> GroupFilePermissions { get; set; }
    
    // Subgroup role assignments
    public DbSet<SubgroupRoleAssignment> SubgroupRoleAssignments { get; set; }

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
            entity.Property(e => e.GroupType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.InstitutionName).HasMaxLength(100);
            entity.Property(e => e.GradeLevel).HasMaxLength(20);
            
            // Check constraint for valid group types
            entity.HasCheckConstraint("CK_Group_GroupType", 
                "\"GroupType\" IN ('general', 'educational', 'family')");
            
            // Indexes for performance
            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.IsPublic);
            entity.HasIndex(e => e.IsVerified);
            entity.HasIndex(e => e.GroupType);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.IsKidFriendly);
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
            
            entity.HasOne(e => e.AssignedRole)
                  .WithMany(e => e.Members)
                  .HasForeignKey(e => e.AssignedRoleId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Unique constraint - user can only be member of group once
            entity.HasIndex(e => new { e.GroupId, e.UserId }).IsUnique();
            
            // Check constraint for valid roles
            entity.HasCheckConstraint("CK_GroupMember_Role", 
                "\"Role\" IN ('owner', 'admin', 'moderator', 'member')");
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.AssignedRoleId);
            entity.HasIndex(e => e.JoinedAt);
            entity.HasIndex(e => e.IsActive);
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
                "\"Status\" IN ('pending', 'accepted', 'rejected', 'expired')");
            
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

        // Subgroup configuration
        modelBuilder.Entity<Subgroup>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany(e => e.Subgroups)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.ParentSubgroup)
                  .WithMany(e => e.ChildSubgroups)
                  .HasForeignKey(e => e.ParentSubgroupId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.ParentSubgroupId);
            entity.HasIndex(e => e.Level);
            entity.HasIndex(e => e.IsActive);
        });

        // GroupRole configuration
        modelBuilder.Entity<GroupRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Alias).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany(e => e.Roles)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.Name);
        });

        // SubgroupRole configuration
        modelBuilder.Entity<SubgroupRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Foreign key relationships
            entity.HasOne(e => e.Subgroup)
                  .WithMany()
                  .HasForeignKey(e => e.SubgroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Role)
                  .WithMany(e => e.SubgroupRoles)
                  .HasForeignKey(e => e.RoleId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - role can only be assigned to subgroup once
            entity.HasIndex(e => new { e.SubgroupId, e.RoleId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.SubgroupId);
            entity.HasIndex(e => e.RoleId);
        });

        // Topic configuration
        modelBuilder.Entity<Topic>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany(e => e.Topics)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Subgroup)
                  .WithMany(e => e.Topics)
                  .HasForeignKey(e => e.SubgroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Check constraint for valid status
            entity.HasCheckConstraint("CK_Topic_Status", 
                "\"Status\" IN ('active', 'paused', 'archived')");
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.SubgroupId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.CreatedAt);
        });

        // TopicPost configuration
        modelBuilder.Entity<TopicPost>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Foreign key relationships
            entity.HasOne(e => e.Topic)
                  .WithMany(e => e.Posts)
                  .HasForeignKey(e => e.TopicId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - post can only be in topic once
            entity.HasIndex(e => new { e.TopicId, e.PostId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.TopicId);
            entity.HasIndex(e => e.PostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
        });

        // SubgroupMember configuration
        modelBuilder.Entity<SubgroupMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Foreign key relationships
            entity.HasOne(e => e.Subgroup)
                  .WithMany(e => e.Members)
                  .HasForeignKey(e => e.SubgroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.GroupMember)
                  .WithMany(e => e.SubgroupMemberships)
                  .HasForeignKey(e => e.GroupMemberId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.AssignedRole)
                  .WithMany()
                  .HasForeignKey(e => e.AssignedRoleId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Unique constraint - member can only be in subgroup once
            entity.HasIndex(e => new { e.SubgroupId, e.GroupMemberId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.SubgroupId);
            entity.HasIndex(e => e.GroupMemberId);
            entity.HasIndex(e => e.AssignedRoleId);
        });

        // GroupDocumentation configuration
        modelBuilder.Entity<GroupDocumentation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany()
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.CreatedAt);
        });

        // GroupPoll configuration
        modelBuilder.Entity<GroupPoll>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Question).IsRequired().HasMaxLength(200);
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany()
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Topic)
                  .WithMany()
                  .HasForeignKey(e => e.TopicId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.TopicId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.ExpiresAt);
        });

        // PollVote configuration
        modelBuilder.Entity<PollVote>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Foreign key relationships
            entity.HasOne(e => e.Poll)
                  .WithMany(e => e.Votes)
                  .HasForeignKey(e => e.PollId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Unique constraint - user can only vote once per poll
            entity.HasIndex(e => new { e.PollId, e.UserId }).IsUnique();
            
            // Indexes
            entity.HasIndex(e => e.PollId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.VotedAt);
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

        // GroupRule configuration
        modelBuilder.Entity<GroupRule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Details).HasMaxLength(1000);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasOne(e => e.Group)
                .WithMany()
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => new { e.GroupId, e.IsActive });
            entity.HasIndex(e => new { e.GroupId, e.Order });
        });

        // GroupFile configuration
        modelBuilder.Entity<GroupFile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FileCategory).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Foreign key relationships
            entity.HasOne(e => e.Group)
                  .WithMany()
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Topic)
                  .WithMany()
                  .HasForeignKey(e => e.TopicId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.TopicId);
            entity.HasIndex(e => e.UploadedBy);
            entity.HasIndex(e => e.FileCategory);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => new { e.GroupId, e.FileCategory });
        });

        // GroupFilePermission configuration
        modelBuilder.Entity<GroupFilePermission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Foreign key relationships
            entity.HasOne(e => e.File)
                  .WithMany()
                  .HasForeignKey(e => e.FileId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes
            entity.HasIndex(e => e.FileId);
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => new { e.FileId, e.Role }).IsUnique();
        });

        // SubgroupRoleAssignment configuration
        modelBuilder.Entity<SubgroupRoleAssignment>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.AssignedAt).IsRequired();
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            
            // Foreign key relationships
            entity.HasOne(e => e.Subgroup)
                  .WithMany()
                  .HasForeignKey(e => e.SubgroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Role)
                  .WithMany()
                  .HasForeignKey(e => e.RoleId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Note: AssignedByUserId is stored as Guid, UserBasicInfo is fetched separately when needed
            
            // Indexes
            entity.HasIndex(e => e.SubgroupId);
            entity.HasIndex(e => e.RoleId);
            entity.HasIndex(e => e.AssignedByUserId);
            entity.HasIndex(e => new { e.SubgroupId, e.RoleId }).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });
    }
}
