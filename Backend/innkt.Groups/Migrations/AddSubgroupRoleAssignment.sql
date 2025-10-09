-- Create SubgroupRoleAssignment table
CREATE TABLE "SubgroupRoleAssignments" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SubgroupId" UUID NOT NULL,
    "RoleId" UUID NOT NULL,
    "AssignedByUserId" UUID NOT NULL,
    "AssignedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "ExpiresAt" TIMESTAMP WITH TIME ZONE NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "Notes" VARCHAR(500) NULL
);

-- Add foreign key constraints
ALTER TABLE "SubgroupRoleAssignments" 
    ADD CONSTRAINT "FK_SubgroupRoleAssignments_Subgroup" 
    FOREIGN KEY ("SubgroupId") REFERENCES "Subgroups"("Id") ON DELETE CASCADE;

ALTER TABLE "SubgroupRoleAssignments" 
    ADD CONSTRAINT "FK_SubgroupRoleAssignments_Role" 
    FOREIGN KEY ("RoleId") REFERENCES "GroupRoles"("Id") ON DELETE CASCADE;

ALTER TABLE "SubgroupRoleAssignments" 
    ADD CONSTRAINT "FK_SubgroupRoleAssignments_AssignedByUser" 
    FOREIGN KEY ("AssignedByUserId") REFERENCES "AspNetUsers"("Id") ON DELETE RESTRICT;

-- Add indexes for performance
CREATE INDEX "IX_SubgroupRoleAssignments_SubgroupId" ON "SubgroupRoleAssignments"("SubgroupId");
CREATE INDEX "IX_SubgroupRoleAssignments_RoleId" ON "SubgroupRoleAssignments"("RoleId");
CREATE INDEX "IX_SubgroupRoleAssignments_AssignedByUserId" ON "SubgroupRoleAssignments"("AssignedByUserId");
CREATE UNIQUE INDEX "IX_SubgroupRoleAssignments_SubgroupId_RoleId" ON "SubgroupRoleAssignments"("SubgroupId", "RoleId");
CREATE INDEX "IX_SubgroupRoleAssignments_IsActive" ON "SubgroupRoleAssignments"("IsActive");
