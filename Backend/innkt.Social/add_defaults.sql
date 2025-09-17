-- Add default values for poll columns
ALTER TABLE "Posts" ALTER COLUMN "PollOptions" SET DEFAULT '{}';
ALTER TABLE "Posts" ALTER COLUMN "PollDuration" SET DEFAULT NULL;
ALTER TABLE "Posts" ALTER COLUMN "PollExpiresAt" SET DEFAULT NULL;
