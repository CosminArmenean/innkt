-- Add advanced topic settings columns to Topics table
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowComments" boolean NOT NULL DEFAULT true;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowReactions" boolean NOT NULL DEFAULT true;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowPolls" boolean NOT NULL DEFAULT true;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowMedia" boolean NOT NULL DEFAULT true;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "RequireApproval" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "IsPinned" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "IsLocked" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowAnonymous" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AutoArchive" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowScheduling" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "TimeRestricted" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "MuteNotifications" boolean NOT NULL DEFAULT false;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "DocumentationMode" boolean NOT NULL DEFAULT false;

-- Update migration history to reflect this change
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250110000000_AddAdvancedTopicSettings', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
