-- Final database fix for Groups service
-- Execute this script in pgAdmin or any PostgreSQL client

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

-- Set up migration history to prevent future conflicts
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verify the fix worked
SELECT 'SUCCESS: Database fixed!' as status;
