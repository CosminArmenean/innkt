-- Verify legacy tables cleanup
SELECT 
    tablename, 
    schemaname,
    'LEGACY TABLE' as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND table_name IN (
        'users', 'user_profiles', 'joint_accounts', 'kid_accounts',
        'user_sessions', 'user_verifications', 'user_login_attempts',
        'user_security_events', 'joint_account_members'
    )

UNION ALL

-- Show remaining tables (should be none for innkt_officer database)
SELECT 
    tablename, 
    schemaname,
    'REMAINING TABLE' as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY status, tablename;
