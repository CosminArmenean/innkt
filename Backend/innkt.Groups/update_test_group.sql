-- Update the test group to use the correct user ID format
-- First, let's see what user ID format is being used
-- The frontend is using '00000000-0000-0000-0000-000000000001'

-- Update the group owner ID
UPDATE "Groups" 
SET "OwnerId" = '00000000-0000-0000-0000-000000000001'
WHERE "Name" = 'Scoala Testoasa';

-- Update the group member user ID
UPDATE "GroupMembers" 
SET "UserId" = '00000000-0000-0000-0000-000000000001'
WHERE "GroupId" = (SELECT "Id" FROM "Groups" WHERE "Name" = 'Scoala Testoasa');

-- Verify the changes
SELECT 
    g."Name" as group_name,
    g."OwnerId" as owner_id,
    gm."UserId" as member_user_id,
    gm."Role" as member_role,
    gm."IsActive" as is_active
FROM "Groups" g 
LEFT JOIN "GroupMembers" gm ON g."Id" = gm."GroupId"
WHERE g."Name" = 'Scoala Testoasa';

