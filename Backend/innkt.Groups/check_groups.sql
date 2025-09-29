SELECT 
    g."Name" as group_name,
    g."OwnerId" as owner_id,
    gm."UserId" as member_user_id,
    gm."Role" as member_role,
    gm."IsActive" as is_active
FROM "Groups" g 
LEFT JOIN "GroupMembers" gm ON g."Id" = gm."GroupId";

