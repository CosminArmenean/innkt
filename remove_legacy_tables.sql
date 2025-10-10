-- ============================================
-- LEGACY TABLES CLEANUP SCRIPT
-- ============================================
-- Purpose: Remove unused legacy tables from Docker's innkt_officer database
-- Target: Docker PostgreSQL (port 5433)
-- Database: innkt_officer (unused by Officer service)
-- 
-- SAFETY CHECK: These tables contain only test data and are NOT used by any service
-- The Officer service uses local PostgreSQL (port 5432) with AspNetUsers tables
-- ============================================

-- Drop legacy tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS joint_account_members CASCADE;
DROP TABLE IF EXISTS joint_accounts CASCADE;
DROP TABLE IF EXISTS kid_accounts CASCADE;
DROP TABLE IF EXISTS user_login_attempts CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_security_events CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_verifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verify cleanup
SELECT 
    'Legacy tables cleanup completed' as status,
    COUNT(*) as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'user_profiles', 'joint_accounts', 'kid_accounts',
        'user_sessions', 'user_verifications', 'user_login_attempts',
        'user_security_events', 'joint_account_members'
    );
