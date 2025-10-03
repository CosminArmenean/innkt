-- Add missing columns to GroupMembers table
ALTER TABLE "GroupMembers" ADD COLUMN IF NOT EXISTS "IsParentAccount" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "GroupMembers" ADD COLUMN IF NOT EXISTS "KidAccountId" uuid;
ALTER TABLE "GroupMembers" ADD COLUMN IF NOT EXISTS "RoleId" uuid;
ALTER TABLE "GroupMembers" ADD COLUMN IF NOT EXISTS "SubgroupId" uuid;
ALTER TABLE "GroupMembers" ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to GroupRoles table
ALTER TABLE "GroupRoles" ADD COLUMN IF NOT EXISTS "CanSeeRealUsername" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "GroupRoles" ADD COLUMN IF NOT EXISTS "Permissions" text NOT NULL DEFAULT '';

-- Add missing columns to Subgroups table
ALTER TABLE "Subgroups" ADD COLUMN IF NOT EXISTS "Settings" text NOT NULL DEFAULT '';

-- Update migration history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250928183648_AddMissingGroupMemberProperties', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;