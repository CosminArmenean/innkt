ALTER TABLE "Posts" ADD COLUMN "PollOptions" text[];
ALTER TABLE "Posts" ADD COLUMN "PollDuration" integer;
ALTER TABLE "Posts" ADD COLUMN "PollExpiresAt" timestamp with time zone;
