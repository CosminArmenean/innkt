-- Fix the comment count for the post
UPDATE "Posts" 
SET "CommentsCount" = 0 
WHERE "Id" = '8b5ba9de-0032-4f60-83ca-af85ceda018e';

-- Verify the fix
SELECT "Id", "Content", "CommentsCount" 
FROM "Posts" 
WHERE "Id" = '8b5ba9de-0032-4f60-83ca-af85ceda018e';
