-- Add missing columns to GroupPolls table
ALTER TABLE "GroupPolls" ADD COLUMN IF NOT EXISTS "AllowKidVoting" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "GroupPolls" ADD COLUMN IF NOT EXISTS "AllowMultipleVotes" boolean NOT NULL DEFAULT FALSE;
ALTER TABLE "GroupPolls" ADD COLUMN IF NOT EXISTS "AllowParentVotingForKid" boolean NOT NULL DEFAULT FALSE;
