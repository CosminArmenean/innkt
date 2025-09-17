-- Check Posts table structure and data
SELECT COUNT(*) as post_count FROM "Posts";

-- Check if poll columns actually exist by trying to select them
SELECT "Id", "Content", "PollDuration", "PollExpiresAt", "PollOptions" 
FROM "Posts" 
LIMIT 1;

-- Get actual column list from the table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Posts' 
AND table_schema = 'public' 
ORDER BY ordinal_position;
