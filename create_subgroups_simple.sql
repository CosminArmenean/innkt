CREATE TABLE IF NOT EXISTS "Subgroups" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(500),
    "ParentSubgroupId" uuid,
    "Level" integer NOT NULL,
    "MembersCount" integer NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "Settings" text NOT NULL DEFAULT '{}',
    CONSTRAINT "PK_Subgroups" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Subgroups_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Subgroups_Subgroups_ParentSubgroupId" FOREIGN KEY ("ParentSubgroupId") REFERENCES "Subgroups" ("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_Subgroups_GroupId" ON "Subgroups" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_Subgroups_ParentSubgroupId" ON "Subgroups" ("ParentSubgroupId");
CREATE INDEX IF NOT EXISTS "IX_Subgroups_Level" ON "Subgroups" ("Level");
CREATE INDEX IF NOT EXISTS "IX_Subgroups_IsActive" ON "Subgroups" ("IsActive");

