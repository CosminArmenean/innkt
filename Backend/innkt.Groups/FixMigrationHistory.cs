using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;

namespace innkt.Groups
{
    public class FixMigrationHistory
    {
        public static async Task Main(string[] args)
        {
            var connectionString = "Host=localhost;Port=5432;Database=innkt_groups;Username=admin_officer;Password=@CAvp57rt26;TrustServerCertificate=true;";

            var options = new DbContextOptionsBuilder<GroupsDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            using var context = new GroupsDbContext(options);

            try
            {
                Console.WriteLine("🔄 Fixing migration history...");

                // Ensure the migration history table exists
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                        ""MigrationId"" character varying(150) NOT NULL,
                        ""ProductVersion"" character varying(32) NOT NULL,
                        CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                    );");

                // Mark the initial migration as applied (without running it)
                await context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20250927204429_InitialCreate', '9.0.0')
                    ON CONFLICT (""MigrationId"") DO NOTHING;");

                Console.WriteLine("✅ Migration history fixed!");
                Console.WriteLine("✅ Now you can apply the new migration properly!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error fixing migration history: {ex.Message}");
            }
        }
    }
}
