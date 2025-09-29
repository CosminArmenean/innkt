# PowerShell script to fix the database by adding missing columns and setting up migration history

$env:PGPASSWORD = "@CAvp57rt26"

Write-Host "🔄 Fixing database by adding missing columns..."

# SQL commands to add missing columns and set up migration history
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

-- Set up migration history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verify the columns were added
SELECT 'GroupMembers columns:' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'GroupMembers' 
AND column_name IN ('IsParentAccount', 'KidAccountId', 'SubgroupId', 'RoleId', 'UpdatedAt')
UNION ALL
SELECT 'GroupRoles columns:' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'GroupRoles' 
AND column_name IN ('Permissions', 'CanSeeRealUsername')
UNION ALL
SELECT 'Subgroups columns:' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Subgroups' 
AND column_name = 'Settings';
"@

try {
    # Execute the SQL commands
    $sqlCommands | psql -h localhost -U admin_officer -d innkt_groups
    Write-Host "✅ Database fixed successfully!"
    Write-Host "✅ Missing columns added and migration history set up!"
} catch {
    Write-Host "❌ Error executing SQL commands: $($_.Exception.Message)"
    Write-Host "Please run the SQL commands manually using pgAdmin or another PostgreSQL client"
}
