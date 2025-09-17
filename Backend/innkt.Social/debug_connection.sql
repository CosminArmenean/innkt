-- Check current user and database
SELECT current_user, current_database();

-- Check all tables in current database
SELECT schemaname, tablename, tableowner FROM pg_tables WHERE tablename = 'Posts';

-- Check if there are multiple Posts tables
SELECT schemaname, tablename, tableowner FROM pg_tables WHERE tablename LIKE '%Posts%';

-- Check actual data in Posts table
SELECT COUNT(*) as actual_count FROM "Posts";
