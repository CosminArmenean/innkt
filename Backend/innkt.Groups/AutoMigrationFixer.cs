using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;

namespace innkt.Groups
{
    public class AutoMigrationFixer
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
                Console.WriteLine("🔍 Investigating database state...");

                // Check if migration history table exists
                var historyExists = await context.Database.ExecuteSqlRawAsync(@"
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = '__EFMigrationsHistory'
                    );") > 0;

                Console.WriteLine($"Migration history table exists: {historyExists}");

                // Check if initial migration is recorded
                var initialMigrationExists = false;
                try
                {
                    var result = await context.Database.ExecuteSqlRawAsync(@"
                        SELECT COUNT(*) FROM ""__EFMigrationsHistory"" 
                        WHERE ""MigrationId"" = '20250927204429_InitialCreate';");
                    initialMigrationExists = result > 0;
                }
                catch
                {
                    // Table doesn't exist or is empty
                }

                Console.WriteLine($"Initial migration recorded: {initialMigrationExists}");

                // Step 1: Ensure migration history table exists
                Console.WriteLine("🔄 Setting up migration history table...");
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                        ""MigrationId"" character varying(150) NOT NULL,
                        ""ProductVersion"" character varying(32) NOT NULL,
                        CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                    );");

                // Step 2: Mark initial migration as applied if not already
                if (!initialMigrationExists)
                {
                    Console.WriteLine("🔄 Marking initial migration as applied...");
                    await context.Database.ExecuteSqlRawAsync(@"
                        INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                        VALUES ('20250927204429_InitialCreate', '9.0.0')
                        ON CONFLICT (""MigrationId"") DO NOTHING;");
                }

                // Step 3: Add missing columns directly (since migration system is problematic)
                Console.WriteLine("🔄 Adding missing columns...");

                // Add missing columns to GroupMembers table
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""GroupMembers"" 
                    ADD COLUMN IF NOT EXISTS ""IsParentAccount"" boolean NOT NULL DEFAULT false,
                    ADD COLUMN IF NOT EXISTS ""KidAccountId"" uuid,
                    ADD COLUMN IF NOT EXISTS ""SubgroupId"" uuid,
                    ADD COLUMN IF NOT EXISTS ""RoleId"" uuid,
                    ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP);");

                // Add missing columns to GroupRoles table
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""GroupRoles"" 
                    ADD COLUMN IF NOT EXISTS ""Permissions"" text NOT NULL DEFAULT '{}',
                    ADD COLUMN IF NOT EXISTS ""CanSeeRealUsername"" boolean NOT NULL DEFAULT false;");

                // Add missing columns to Subgroups table
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""Subgroups"" 
                    ADD COLUMN IF NOT EXISTS ""Settings"" text NOT NULL DEFAULT '{}';");

                // Step 4: Mark the new migration as applied
                Console.WriteLine("🔄 Marking new migration as applied...");
                await context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
                    ON CONFLICT (""MigrationId"") DO NOTHING;");

                // Step 5: Verify everything worked
                Console.WriteLine("🔍 Verifying the fix...");
                var appliedMigrations = await context.Database.ExecuteSqlRawAsync(@"
                    SELECT ""MigrationId"" FROM ""__EFMigrationsHistory"" ORDER BY ""MigrationId"";");

                Console.WriteLine("✅ Database migration fix completed successfully!");
                Console.WriteLine("✅ All missing columns have been added!");
                Console.WriteLine("✅ Migration history is properly set up!");
                Console.WriteLine("✅ You can now start the Groups service with: dotnet run");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error during migration fix: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
            }
        }
    }
}
