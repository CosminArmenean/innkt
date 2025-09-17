-- Add new fields to Posts table for post types and polls
-- This script adds the missing fields that the frontend is sending

-- Add PostType column
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PostType" character varying(50) DEFAULT 'text';

-- Add Poll fields
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PollOptions" text[];
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PollDuration" integer;
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PollExpiresAt" timestamp with time zone;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "IX_Posts_PostType" ON "Posts" ("PostType");
CREATE INDEX IF NOT EXISTS "IX_Posts_PollExpiresAt" ON "Posts" ("PollExpiresAt");

-- Add GIN index for PollOptions array
CREATE INDEX IF NOT EXISTS "IX_Posts_PollOptions" ON "Posts" USING gin ("PollOptions");

