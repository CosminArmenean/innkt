-- Check what the service actually sees
SELECT current_database(), current_user, current_schema();

-- Check if there are multiple Posts tables
SELECT schemaname, tablename, tableowner FROM pg_tables WHERE tablename = 'Posts';

-- Check the actual table structure that the service sees
\d "Posts"

-- Check if there are any views or other objects
SELECT schemaname, viewname FROM pg_views WHERE viewname LIKE '%Posts%';
