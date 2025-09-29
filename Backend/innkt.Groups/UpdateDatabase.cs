using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;

namespace innkt.Groups;

public class UpdateDatabase
{
    public static async Task Main(string[] args)
    {
        var connectionString = "Host=localhost;Database=innkt_groups;Username=postgres;Password=postgres";
        
        var options = new DbContextOptionsBuilder<GroupsDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new GroupsDbContext(options);
        
        try
        {
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

            // Update the migration history
            await context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                VALUES ('20250927204429_InitialCreate', '9.0.0')
                ON CONFLICT (""MigrationId"") DO NOTHING;");

            await context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
                ON CONFLICT (""MigrationId"") DO NOTHING;");

            Console.WriteLine("✅ Database updated successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error updating database: {ex.Message}");
        }
    }
}
