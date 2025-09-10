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

    // Only identity-related DbSets remain

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

        // Only ApplicationUser configuration remains - all group-related configurations removed
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

        // Only ApplicationUser entities are handled - group entities removed

        return base.SaveChangesAsync(cancellationToken);
    }
}
