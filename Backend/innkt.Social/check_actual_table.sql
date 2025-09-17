-- Check the actual table structure by selecting all columns
SELECT * FROM "Posts" LIMIT 1;

-- Also check the table definition using pg_attribute
SELECT 
    attname as column_name,
    format_type(atttypid, atttypmod) as data_type
FROM pg_attribute 
WHERE attrelid = 'public."Posts"'::regclass 
    AND attnum > 0 
    AND NOT attisdropped
ORDER BY attnum;
