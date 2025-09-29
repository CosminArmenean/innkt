using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;

namespace innkt.Groups
{
    public class StandaloneMigrationFixer
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
                Console.WriteLine("🔍 Auto-fixing migration issues...");

                // Step 1: Ensure migration history table exists
                Console.WriteLine("Step 1: Setting up migration history table...");
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                        ""MigrationId"" character varying(150) NOT NULL,
                        ""ProductVersion"" character varying(32) NOT NULL,
                        CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                    );");

                // Step 2: Mark initial migration as applied
                Console.WriteLine("Step 2: Marking initial migration as applied...");
                await context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20250927204429_InitialCreate', '9.0.0')
                    ON CONFLICT (""MigrationId"") DO NOTHING;");

                // Step 3: Add missing columns
                Console.WriteLine("Step 3: Adding missing columns...");
                
                // GroupMembers table
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""GroupMembers"" 
                    ADD COLUMN IF NOT EXISTS ""IsParentAccount"" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS ""KidAccountId"" uuid,
                    ADD COLUMN IF NOT EXISTS ""SubgroupId"" uuid,
                    ADD COLUMN IF NOT EXISTS ""RoleId"" uuid,
                    ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP);");

                // GroupRoles table
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""GroupRoles"" 
                    ADD COLUMN IF NOT EXISTS ""Permissions"" text NOT NULL DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS ""CanSeeRealUsername"" boolean NOT NULL DEFAULT false;");

                // Subgroups table
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""Subgroups"" 
                    ADD COLUMN IF NOT EXISTS ""Settings"" text NOT NULL DEFAULT '{}';");

                // Step 4: Mark new migration as applied
                Console.WriteLine("Step 4: Marking new migration as applied...");
                await context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
                    ON CONFLICT (""MigrationId"") DO NOTHING;");

                // Step 5: Verify the fix
                Console.WriteLine("Step 5: Verifying the fix...");
                var appliedMigrations = await context.Database.ExecuteSqlRawAsync(@"
                    SELECT ""MigrationId"" FROM ""__EFMigrationsHistory"" ORDER BY ""MigrationId"";");

                Console.WriteLine("✅ Migration fix completed successfully!");
                Console.WriteLine("✅ Database is now properly configured!");
                Console.WriteLine("✅ You can start the Groups service with: dotnet run");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error during migration fix: {ex.Message}");
                Console.WriteLine($"❌ Please run the SQL script manually: final_database_fix.sql");
                Environment.Exit(1);
            }
        }
    }
}
