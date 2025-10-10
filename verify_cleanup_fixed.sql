-- Verify legacy tables cleanup
SELECT 
    tablename, 
    schemaname,
    'REMAINING TABLE' as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
