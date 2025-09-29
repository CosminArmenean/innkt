-- Fix missing columns in Groups database
-- Execute this script directly against the PostgreSQL database

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

-- Update the migration history to mark migrations as applied
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'GroupMembers' 
AND column_name IN ('IsParentAccount', 'KidAccountId', 'SubgroupId', 'RoleId', 'UpdatedAt');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'GroupRoles' 
AND column_name IN ('Permissions', 'CanSeeRealUsername');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Subgroups' 
AND column_name = 'Settings';
