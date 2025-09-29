UPDATE "GroupMembers" 
SET "Role" = 'admin' 
WHERE "Role" = 'owner';

SELECT 
    g."Name" as group_name,
    gm."Role",
    gm."UserId",
    gm."IsActive"
FROM "Groups" g
JOIN "GroupMembers" gm ON g."Id" = gm."GroupId"
WHERE g."Name" LIKE '%Scoala%' OR g."Name" LIKE '%Test%';

