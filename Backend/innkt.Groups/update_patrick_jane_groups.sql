-- Update the groups to use Patrick Jane's correct user ID from the logs
-- User ID: 5e578ba9-edd9-487a-b222-8aad79db6e81

-- Update the group owner ID for 'Scoala Testoasa'
UPDATE "Groups"
SET "OwnerId" = '5e578ba9-edd9-487a-b222-8aad79db6e81'
WHERE "Name" = 'Scoala Testoasa';

-- Update the group member user ID for Patrick Jane in 'Scoala Testoasa'
UPDATE "GroupMembers"
SET "UserId" = '5e578ba9-edd9-487a-b222-8aad79db6e81', "Role" = 'admin'
WHERE "GroupId" = (SELECT "Id" FROM "Groups" WHERE "Name" = 'Scoala Testoasa');

-- Update the group owner ID for 'Scoala Test-oaso' (if it exists)
UPDATE "Groups"
SET "OwnerId" = '5e578ba9-edd9-487a-b222-8aad79db6e81'
WHERE "Name" = 'Scoala Test-oaso';

-- Update the group member user ID for Patrick Jane in 'Scoala Test-oaso'
UPDATE "GroupMembers"
SET "UserId" = '5e578ba9-edd9-487a-b222-8aad79db6e81', "Role" = 'admin'
WHERE "GroupId" = (SELECT "Id" FROM "Groups" WHERE "Name" = 'Scoala Test-oaso');

-- Verify the changes
SELECT
    g."Name" as group_name,
    g."OwnerId" as owner_id,
    gm."UserId" as member_user_id,
    gm."Role" as member_role,
    gm."IsActive" as is_active
FROM "Groups" g
LEFT JOIN "GroupMembers" gm ON g."Id" = gm."GroupId"
WHERE g."OwnerId" = '5e578ba9-edd9-487a-b222-8aad79db6e81';
