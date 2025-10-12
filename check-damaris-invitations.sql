SELECT "Id", "InvitedUserId", "SubgroupId", "Status", "CreatedAt" 
FROM "GroupInvitations" 
WHERE "InvitedUserId" = '82991052-8e4d-43b6-a00f-6ee647c7e7f3' 
ORDER BY "CreatedAt" DESC 
LIMIT 5;
