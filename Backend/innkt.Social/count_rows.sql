SELECT 'Posts' as table_name, COUNT(*) as row_count FROM "Posts" 
UNION ALL 
SELECT 'Comments', COUNT(*) FROM "Comments" 
UNION ALL 
SELECT 'Likes', COUNT(*) FROM "Likes" 
UNION ALL 
SELECT 'Follows', COUNT(*) FROM "Follows" 
UNION ALL 
SELECT 'Groups', COUNT(*) FROM "Groups" 
UNION ALL 
SELECT 'GroupMembers', COUNT(*) FROM "GroupMembers" 
UNION ALL 
SELECT 'GroupPosts', COUNT(*) FROM "GroupPosts" 
ORDER BY table_name;
