ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PostType" VARCHAR(50) NOT NULL DEFAULT 'text';
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PollOptions" TEXT[];
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PollDuration" INTEGER;
ALTER TABLE "Posts" ADD COLUMN IF NOT EXISTS "PollExpiresAt" TIMESTAMP WITH TIME ZONE;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS "IX_Posts_PostType" ON "Posts" ("PostType");
CREATE INDEX IF NOT EXISTS "IX_Posts_PollExpiresAt" ON "Posts" ("PollExpiresAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_PollOptions" ON "Posts" USING GIN ("PollOptions");

