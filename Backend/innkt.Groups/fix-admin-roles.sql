-- Fix admin roles: change 'owner' to 'admin' for group creators
UPDATE "GroupMembers" 
SET "Role" = 'admin' 
WHERE "Role" = 'owner';

-- Check the results
SELECT 
    g."Name" as group_name,
    gm."Role",
    gm."UserId",
    gm."IsActive"
FROM "Groups" g
JOIN "GroupMembers" gm ON g."Id" = gm."GroupId"
WHERE g."Name" = 'Scoala Test-oaso';

