using innkt.Officer.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace innkt.Officer.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        
        // Suppress the warning about pending model changes
        optionsBuilder.ConfigureWarnings(warnings => warnings
            .Ignore(RelationalEventId.PendingModelChangesWarning));
    }

    // Group-related DbSets
    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<GroupPost> GroupPosts { get; set; }
    public DbSet<GroupInvitation> GroupInvitations { get; set; }
    public DbSet<GroupPostReaction> GroupPostReactions { get; set; }
    public DbSet<GroupPostComment> GroupPostComments { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure ApplicationUser
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CountryCode).HasMaxLength(20);
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.Language).HasMaxLength(10).HasDefaultValue("en");
            entity.Property(e => e.Theme).HasMaxLength(10).HasDefaultValue("light");
            entity.Property(e => e.ProfilePictureUrl).HasMaxLength(500);
            
            // Additional profile fields
            entity.Property(e => e.Country).HasMaxLength(100);
            entity.Property(e => e.Address).HasMaxLength(200);
            entity.Property(e => e.PostalCode).HasMaxLength(20);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.State).HasMaxLength(100);
            
            // Profile picture storage
            entity.Property(e => e.ProfilePicturePngUrl).HasMaxLength(500);
            entity.Property(e => e.ProfilePictureCroppedUrl).HasMaxLength(500);
            
            // Multi-factor authentication
            entity.Property(e => e.MfaSecretKey).HasMaxLength(128);
            
            // User verification
            entity.Property(e => e.VerificationMethod).HasMaxLength(20);
            entity.Property(e => e.CreditCardLastFour).HasMaxLength(4);
            entity.Property(e => e.DriverLicensePhotoUrl).HasMaxLength(500);
            entity.Property(e => e.VerificationStatus).HasMaxLength(20);
            entity.Property(e => e.VerificationRejectionReason).HasMaxLength(500);
            
            // Kid account support
            entity.Property(e => e.KidQrCode).HasMaxLength(128);
            entity.Property(e => e.KidPairingCode).HasMaxLength(10);
            entity.Property(e => e.KidAccountStatus).HasMaxLength(30);
            
            // Joint account specific fields
            entity.Property(e => e.JointAccountEmail).HasMaxLength(256);
            entity.Property(e => e.JointAccountPassword).HasMaxLength(128);
            entity.Property(e => e.JointAccountStatus).HasMaxLength(20);
            entity.Property(e => e.LockReason).HasMaxLength(500);
            
            // Joint account relationship
            entity.HasOne(e => e.LinkedUser)
                  .WithMany()
                  .HasForeignKey(e => e.LinkedUserId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Kid account relationship
            entity.HasOne(e => e.ParentUser)
                  .WithMany()
                  .HasForeignKey(e => e.ParentUserId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes for performance
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.JointAccountEmail);
            entity.HasIndex(e => e.IsJointAccount);
            entity.HasIndex(e => e.JointAccountStatus);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.RegisteredAt);
            entity.HasIndex(e => e.LastLogin);
            entity.HasIndex(e => e.IsMfaEnabled);
            entity.HasIndex(e => e.IsIdentityVerified);
            entity.HasIndex(e => e.VerificationStatus);
            entity.HasIndex(e => e.IsKidAccount);
            entity.HasIndex(e => e.ParentUserId);
            entity.HasIndex(e => e.KidAccountStatus);
            entity.HasIndex(e => e.KidIndependenceDate);
            
            // Audit fields - PostgreSQL compatible defaults
            entity.Property(e => e.CreatedAt).HasDefaultValue(DateTime.UtcNow);
            entity.Property(e => e.UpdatedAt).HasDefaultValue(DateTime.UtcNow);
        });

        // Configure Group
        builder.Entity<Group>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.CoverImageUrl).HasMaxLength(500);
            entity.Property(e => e.GroupAvatarUrl).HasMaxLength(500);
            
            // Relationships
            entity.HasOne(e => e.Owner)
                  .WithMany()
                  .HasForeignKey(e => e.OwnerId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Indexes
            entity.HasIndex(e => e.OwnerId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Privacy);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.CreatedAt);
            
            // Audit fields
            entity.Property(e => e.CreatedAt).HasDefaultValue(DateTime.UtcNow);
            entity.Property(e => e.UpdatedAt).HasDefaultValue(DateTime.UtcNow);
        });

        // Configure GroupMember
        builder.Entity<GroupMember>(entity =>
        {
            // Composite key for unique membership
            entity.HasIndex(e => new { e.GroupId, e.UserId }).IsUnique();
            
            // Relationships
            entity.HasOne(e => e.Group)
                  .WithMany(g => g.Members)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.InvitedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.InvitedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasOne(e => e.ParentalApprovalByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ParentalApprovalByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.JoinedAt);
            
            // Audit fields
            entity.Property(e => e.JoinedAt).HasDefaultValue(DateTime.UtcNow);
        });

        // Configure GroupPost
        builder.Entity<GroupPost>(entity =>
        {
            entity.Property(e => e.TextContent).HasMaxLength(1000);
            entity.Property(e => e.ImageUrl).HasMaxLength(500);
            entity.Property(e => e.VideoUrl).HasMaxLength(500);
            entity.Property(e => e.DocumentUrl).HasMaxLength(500);
            entity.Property(e => e.EditReason).HasMaxLength(200);
            entity.Property(e => e.DeletionReason).HasMaxLength(200);
            entity.Property(e => e.QrCodeIdentifier).HasMaxLength(128);
            entity.Property(e => e.QrCodeLocation).HasMaxLength(200);
            entity.Property(e => e.ParentalApprovalNotes).HasMaxLength(500);
            
            // Relationships
            entity.HasOne(e => e.Group)
                  .WithMany(g => g.Posts)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Author)
                  .WithMany()
                  .HasForeignKey(e => e.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.DeletedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.DeletedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasOne(e => e.QrCodeScannedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.QrCodeScannedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasOne(e => e.ParentalApprovalByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ParentalApprovalByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.AuthorId);
            entity.HasIndex(e => e.ContentType);
            entity.HasIndex(e => e.Visibility);
            entity.HasIndex(e => e.IsPinned);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.QrCodeIdentifier);
            
            // Audit fields
            entity.Property(e => e.CreatedAt).HasDefaultValue(DateTime.UtcNow);
            entity.Property(e => e.UpdatedAt).HasDefaultValue(DateTime.UtcNow);
        });

        // Configure GroupInvitation
        builder.Entity<GroupInvitation>(entity =>
        {
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.QrCodeData).HasMaxLength(500);
            entity.Property(e => e.QrCodeLocation).HasMaxLength(200);
            entity.Property(e => e.ParentalApprovalNotes).HasMaxLength(500);
            
            // Relationships
            entity.HasOne(e => e.Group)
                  .WithMany(g => g.Invitations)
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.InvitedUser)
                  .WithMany()
                  .HasForeignKey(e => e.InvitedUserId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.InvitedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.InvitedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.QrCodeScannedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.QrCodeScannedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasOne(e => e.ParentalApprovalByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ParentalApprovalByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.InvitedUserId);
            entity.HasIndex(e => e.InvitedByUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.InvitedAt);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.QrCodeData);
            
            // Audit fields
            entity.Property(e => e.InvitedAt).HasDefaultValue(DateTime.UtcNow);
            entity.Property(e => e.CreatedAt).HasDefaultValue(DateTime.UtcNow);
            entity.Property(e => e.UpdatedAt).HasDefaultValue(DateTime.UtcNow);
        });

        // Configure GroupPostReaction
        builder.Entity<GroupPostReaction>(entity =>
        {
            entity.Property(e => e.ReactionType).HasMaxLength(50).IsRequired();
            
            // Composite key for unique reaction per user per post
            entity.HasIndex(e => new { e.GroupPostId, e.UserId, e.ReactionType }).IsUnique();
            
            // Relationships
            entity.HasOne(e => e.GroupPost)
                  .WithMany(p => p.Reactions)
                  .HasForeignKey(e => e.GroupPostId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            // Indexes
            entity.HasIndex(e => e.GroupPostId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ReactionType);
            entity.HasIndex(e => e.CreatedAt);
            
            // Audit fields
            entity.Property(e => e.CreatedAt).HasDefaultValue(DateTime.UtcNow);
            entity.Property(e => e.UpdatedAt).HasDefaultValue(DateTime.UtcNow);
        });

        // Configure GroupPostComment
        builder.Entity<GroupPostComment>(entity =>
        {
            entity.Property(e => e.Content).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.EditReason).HasMaxLength(200);
            entity.Property(e => e.DeletionReason).HasMaxLength(200);
            entity.Property(e => e.ParentalApprovalNotes).HasMaxLength(500);
            
            // Relationships
            entity.HasOne(e => e.GroupPost)
                  .WithMany(p => p.Comments)
                  .HasForeignKey(e => e.GroupPostId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.Author)
                  .WithMany()
                  .HasForeignKey(e => e.AuthorId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.ParentComment)
                  .WithMany(p => p.Replies)
                  .HasForeignKey(e => e.ParentCommentId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.DeletedByUser)
                  .WithMany()
                  .HasForeignKey(e => e.DeletedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasOne(e => e.ParentalApprovalByUser)
                  .WithMany()
                  .HasForeignKey(e => e.ParentalApprovalByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
            
            // Indexes
            entity.HasIndex(e => e.GroupPostId);
            entity.HasIndex(e => e.AuthorId);
            entity.HasIndex(e => e.ParentCommentId);
            entity.HasIndex(e => e.CreatedAt);
            
            // Audit fields
            entity.Property(e => e.CreatedAt).HasDefaultValue(DateTime.UtcNow);
            entity.Property(e => e.UpdatedAt).HasDefaultValue(DateTime.UtcNow);
        });
    }
    
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<ApplicationUser>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            entry.Entity.UpdatedAt = DateTime.UtcNow;
            
            // Set RegisteredAt for new users
            if (entry.State == EntityState.Added && !entry.Entity.RegisteredAt.HasValue)
            {
                entry.Entity.RegisteredAt = DateTime.UtcNow;
            }
        }

        // Update UpdatedAt for group entities
        var groupEntries = ChangeTracker.Entries()
            .Where(e => e.Entity is Group || e.Entity is GroupPost || e.Entity is GroupInvitation || 
                       e.Entity is GroupPostReaction || e.Entity is GroupPostComment)
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in groupEntries)
        {
            if (entry.Entity is Group group)
                group.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is GroupPost post)
                post.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is GroupInvitation invitation)
                invitation.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is GroupPostReaction reaction)
                reaction.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is GroupPostComment comment)
                comment.UpdatedAt = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
