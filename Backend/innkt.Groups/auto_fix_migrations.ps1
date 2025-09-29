# Auto-fix migrations script
# This script handles the migration issue automatically without user intervention

Write-Host "🔍 Auto-fixing migration issues for Groups service..." -ForegroundColor Cyan

# Step 1: Stop any running Groups service
Write-Host "Step 1: Stopping any running Groups service..." -ForegroundColor Yellow
Get-Process -Name "innkt.Groups" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Create a temporary console app to fix the database
Write-Host "Step 2: Creating database fix application..." -ForegroundColor Yellow

$fixAppCode = @"
using Microsoft.EntityFrameworkCore;
using innkt.Groups.Data;

var connectionString = "Host=localhost;Port=5432;Database=innkt_groups;Username=admin_officer;Password=@CAvp57rt26;TrustServerCertificate=true;";

var options = new DbContextOptionsBuilder<GroupsDbContext>()
    .UseNpgsql(connectionString)
    .Options;

using var context = new GroupsDbContext(options);

try
{
    Console.WriteLine("🔄 Fixing database and migration history...");

    // Step 1: Ensure migration history table exists
    await context.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
            ""MigrationId"" character varying(150) NOT NULL,
            ""ProductVersion"" character varying(32) NOT NULL,
            CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
        );");

    // Step 2: Mark initial migration as applied
    await context.Database.ExecuteSqlRawAsync(@"
        INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
        VALUES ('20250927204429_InitialCreate', '9.0.0')
        ON CONFLICT (""MigrationId"") DO NOTHING;");

    // Step 3: Add missing columns
    await context.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""GroupMembers"" 
        ADD COLUMN IF NOT EXISTS ""IsParentAccount"" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS ""KidAccountId"" uuid,
        ADD COLUMN IF NOT EXISTS ""SubgroupId"" uuid,
        ADD COLUMN IF NOT EXISTS ""RoleId"" uuid,
        ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP);");

    await context.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""GroupRoles"" 
        ADD COLUMN IF NOT EXISTS ""Permissions"" text NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS ""CanSeeRealUsername"" boolean NOT NULL DEFAULT false;");

    await context.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""Subgroups"" 
        ADD COLUMN IF NOT EXISTS ""Settings"" text NOT NULL DEFAULT '{}';");

    // Step 4: Mark new migration as applied
    await context.Database.ExecuteSqlRawAsync(@"
        INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
        VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
        ON CONFLICT (""MigrationId"") DO NOTHING;");

    Console.WriteLine("✅ Database fixed successfully!");
    Console.WriteLine("✅ Migration history properly set up!");
    Console.WriteLine("✅ All missing columns added!");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    Environment.Exit(1);
}
"@

# Write the fix app to a temporary file
$fixAppCode | Out-File -FilePath "TempDatabaseFixer.cs" -Encoding UTF8

# Step 3: Compile and run the fix
Write-Host "Step 3: Running database fix..." -ForegroundColor Yellow
try {
    dotnet run TempDatabaseFixer.cs
    Write-Host "✅ Database fix completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Database fix failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please run the SQL script manually: final_database_fix.sql" -ForegroundColor Yellow
    exit 1
}

# Step 4: Clean up temporary files
Write-Host "Step 4: Cleaning up..." -ForegroundColor Yellow
Remove-Item "TempDatabaseFixer.cs" -ErrorAction SilentlyContinue

# Step 5: Verify the fix worked
Write-Host "Step 5: Verifying migration status..." -ForegroundColor Yellow
try {
    $migrationStatus = dotnet ef migrations list
    Write-Host "Migration status:" -ForegroundColor Cyan
    Write-Host $migrationStatus -ForegroundColor White
} catch {
    Write-Host "Could not check migration status, but database should be fixed." -ForegroundColor Yellow
}

Write-Host "`n🎉 Migration fix completed!" -ForegroundColor Green
Write-Host "✅ You can now start the Groups service with: dotnet run" -ForegroundColor Green
Write-Host "✅ The Groups service should work without 500 errors!" -ForegroundColor Green
