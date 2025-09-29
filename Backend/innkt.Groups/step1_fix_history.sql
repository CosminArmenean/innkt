-- Step 1: Fix migration history
-- Execute this in pgAdmin or any PostgreSQL client

-- Ensure migration history table exists
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- Mark the initial migration as applied (without running it)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verify it worked
SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory";
