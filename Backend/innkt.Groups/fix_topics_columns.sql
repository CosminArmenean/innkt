-- Add missing columns to Topics table
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowKidPosts" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowParentPosts" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowMemberPosts" boolean NOT NULL DEFAULT TRUE;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "AllowRolePosts" boolean NOT NULL DEFAULT TRUE;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "IsAnnouncementOnly" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "Status" text NOT NULL DEFAULT 'active';
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "PausedAt" timestamp with time zone NULL;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "ArchivedAt" timestamp with time zone NULL;
ALTER TABLE "Topics" ADD COLUMN IF NOT EXISTS "PostsCount" integer NOT NULL DEFAULT 0;
