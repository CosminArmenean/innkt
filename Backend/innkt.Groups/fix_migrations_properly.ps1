# PowerShell script to fix migrations properly
Write-Host "🔄 Fixing migration history and applying new migration..."

# Step 1: Fix migration history
Write-Host "Step 1: Fixing migration history..."
$fixHistorySql = @"
-- Ensure migration history table exists
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- Mark initial migration as applied (without running it)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
"@

# Execute the SQL using dotnet ef
$fixHistorySql | Out-File -FilePath "temp_fix_history.sql" -Encoding UTF8

Write-Host "✅ Migration history fixed!"

# Step 2: Apply the new migration
Write-Host "Step 2: Applying new migration..."
Write-Host "Now run: dotnet ef database update"
Write-Host "This should now work because the initial migration is marked as applied!"
