using Microsoft.EntityFrameworkCore;
using innkt.Kinder.Models;

namespace innkt.Kinder.Data;

/// <summary>
/// Kinder service database context for child safety features
/// Complete with all 8 kid safety tables
/// </summary>
public class KinderDbContext : DbContext
{
    public KinderDbContext(DbContextOptions<KinderDbContext> options) : base(options)
    {
    }

    // All 8 kid safety tables - migrated from Social Service
    public DbSet<KidAccount> KidAccounts { get; set; }
    public DbSet<ParentApproval> ParentApprovals { get; set; }
    public DbSet<SafetyEvent> SafetyEvents { get; set; }
    public DbSet<BehaviorAssessment> BehaviorAssessments { get; set; }
    public DbSet<EducationalProfile> EducationalProfiles { get; set; }
    public DbSet<TeacherProfile> TeacherProfiles { get; set; }
    public DbSet<IndependenceTransition> IndependenceTransitions { get; set; }
    public DbSet<ContentSafetyRule> ContentSafetyRules { get; set; }

    // New tables for QR code login and maturity system
    public DbSet<KidLoginCode> KidLoginCodes { get; set; }
    public DbSet<KidPasswordSettings> KidPasswordSettings { get; set; }
    public DbSet<MaturityScore> MaturityScores { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure relationships and constraints
        ConfigureKidAccounts(modelBuilder);
        ConfigureParentApprovals(modelBuilder);
        ConfigureSafetyEvents(modelBuilder);
        ConfigureBehaviorAssessments(modelBuilder);
        ConfigureEducationalProfiles(modelBuilder);
        ConfigureIndependenceTransitions(modelBuilder);
        ConfigureContentSafetyRules(modelBuilder);
        
        // Configure new tables
        ConfigureKidLoginCodes(modelBuilder);
        ConfigureKidPasswordSettings(modelBuilder);
        ConfigureMaturityScores(modelBuilder);
    }

    private void ConfigureKidAccounts(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<KidAccount>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.ParentId);
            entity.HasIndex(e => new { e.ParentId, e.IsActive });

            // Configure array properties for PostgreSQL
            entity.Property(e => e.AllowedTopics)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));

            entity.Property(e => e.BlockedTopics)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));

            entity.Property(e => e.EmergencyContacts)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));
        });
    }

    private void ConfigureParentApprovals(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ParentApproval>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.KidAccountId, e.Status });
            entity.HasIndex(e => new { e.ParentId, e.Status });
            entity.HasIndex(e => e.ExpiresAt);

            entity.HasOne(e => e.KidAccount)
                .WithMany(k => k.PendingApprovals)
                .HasForeignKey(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.SafetyFlags)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));
        });
    }

    private void ConfigureSafetyEvents(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SafetyEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.KidAccountId, e.Severity });
            entity.HasIndex(e => new { e.EventType, e.CreatedAt });
            entity.HasIndex(e => new { e.Resolved, e.Severity });

            entity.HasOne(e => e.KidAccount)
                .WithMany(k => k.SafetyEvents)
                .HasForeignKey(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.AiFlags)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));
        });
    }

    private void ConfigureBehaviorAssessments(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BehaviorAssessment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.KidAccountId, e.AssessmentDate });
            entity.HasIndex(e => e.NextAssessmentDate);

            entity.HasOne(e => e.KidAccount)
                .WithMany(k => k.BehaviorAssessments)
                .HasForeignKey(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.RecommendedActions)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));

            entity.Property(e => e.SafetyRecommendations)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));
        });
    }

    private void ConfigureEducationalProfiles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EducationalProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.KidAccountId).IsUnique();
            entity.HasIndex(e => e.TeacherId);

            entity.HasOne(e => e.KidAccount)
                .WithOne()
                .HasForeignKey<EducationalProfile>(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Subjects)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));

            entity.Property(e => e.LearningGoals)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));
        });
    }

    private void ConfigureIndependenceTransitions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<IndependenceTransition>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.KidAccountId);
            entity.HasIndex(e => new { e.IndependenceDate, e.TransitionPhase });

            entity.HasOne(e => e.KidAccount)
                .WithMany()
                .HasForeignKey(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureContentSafetyRules(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ContentSafetyRule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.RuleType, e.IsActive });
            entity.HasIndex(e => new { e.MinAge, e.MaxAge });
            entity.HasIndex(e => new { e.Priority, e.IsActive });

            entity.Property(e => e.ApplicableContexts)
                .HasConversion(
                    v => string.Join(',', v),
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries));
        });
    }

    private void ConfigureKidLoginCodes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<KidLoginCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => new { e.KidAccountId, e.IsRevoked, e.IsUsed });
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => new { e.ParentId, e.CreatedAt });

            entity.HasOne(e => e.KidAccount)
                .WithMany()
                .HasForeignKey(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureKidPasswordSettings(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<KidPasswordSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.KidAccountId).IsUnique();
            entity.HasIndex(e => e.IndependenceDay);

            entity.HasOne(e => e.KidAccount)
                .WithOne()
                .HasForeignKey<KidPasswordSettings>(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private void ConfigureMaturityScores(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MaturityScore>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.KidAccountId);
            entity.HasIndex(e => new { e.Level, e.LastUpdated });
            entity.HasIndex(e => e.TotalScore);

            entity.HasOne(e => e.KidAccount)
                .WithMany()
                .HasForeignKey(e => e.KidAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
