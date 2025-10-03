-- Add missing TotalVotes column to GroupPolls table
ALTER TABLE "GroupPolls" ADD COLUMN IF NOT EXISTS "TotalVotes" integer NOT NULL DEFAULT 0;
