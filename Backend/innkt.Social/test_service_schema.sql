-- Test what the service actually sees
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Posts' 
    AND column_name IN ('PollDuration', 'PollExpiresAt', 'PollOptions')
ORDER BY column_name;

-- Test if we can select these columns directly
SELECT "PollDuration", "PollExpiresAt", "PollOptions" FROM "Posts" LIMIT 1;
