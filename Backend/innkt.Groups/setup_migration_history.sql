-- Set up migration history for existing database
-- This will mark the initial migration as applied without actually running it

-- Insert the initial migration into the history table
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verify the migration history
SELECT "MigrationId", "ProductVersion" 
FROM "__EFMigrationsHistory" 
ORDER BY "MigrationId";
