-- Fix Groups migration history to match actual database state
-- The tables exist but migration history is missing some entries

-- Insert missing migration records
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
    ('20250927204429_InitialCreate', '9.0.0'),
    ('20250928183648_AddMissingGroupMemberProperties', '9.0.0'),
    ('20251008152938_AddRolePostingFields', '9.0.0'),
    ('20251009154208_AddRoleBasedInvitations', '9.0.0'),
    ('20251009162342_AddGroupInvitationsTable', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Verify the fix
SELECT "MigrationId", "ProductVersion" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
