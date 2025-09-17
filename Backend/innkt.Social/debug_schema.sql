-- Check current schema and table
SELECT current_schema();

-- Check table structure
\d "Posts"

-- Check if there are any views or other objects
SELECT schemaname, tablename, tableowner FROM pg_tables WHERE tablename LIKE '%Posts%';

-- Check if there are any views
SELECT schemaname, viewname, viewowner FROM pg_views WHERE viewname LIKE '%Posts%';
