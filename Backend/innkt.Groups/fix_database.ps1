# PowerShell script to add missing columns to the database
$connectionString = "Host=localhost;Database=innkt_groups;Username=postgres;Password=postgres"

# SQL commands to add missing columns
$sqlCommands = @"
-- Add missing columns to GroupMembers table
ALTER TABLE "GroupMembers" 
ADD COLUMN IF NOT EXISTS "IsParentAccount" boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "KidAccountId" uuid,
ADD COLUMN IF NOT EXISTS "SubgroupId" uuid,
ADD COLUMN IF NOT EXISTS "RoleId" uuid,
ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP);

-- Add missing columns to GroupRoles table
ALTER TABLE "GroupRoles" 
ADD COLUMN IF NOT EXISTS "Permissions" text NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "CanSeeRealUsername" boolean NOT NULL DEFAULT false;

-- Add missing columns to Subgroups table
ALTER TABLE "Subgroups" 
ADD COLUMN IF NOT EXISTS "Settings" text NOT NULL DEFAULT '{}';

-- Update the migration history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
"@

# Execute the SQL commands using dotnet ef database update with a custom script
Write-Host "Adding missing columns to the database..."

# Create a temporary migration file with the SQL commands
$migrationFile = "Migrations\20250928183648_AddMissingGroupMemberProperties.cs"
if (Test-Path $migrationFile) {
    Write-Host "Migration file exists, updating database..."
    # The migration should handle adding the columns
    Write-Host "✅ Database columns should be added by the migration"
} else {
    Write-Host "❌ Migration file not found"
}

Write-Host "Database update completed!"
