-- Create GroupRoles table
CREATE TABLE IF NOT EXISTS "GroupRoles" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "GroupId" uuid NOT NULL,
    "Name" varchar(50) NOT NULL,
    "Alias" varchar(100),
    "Description" varchar(500),
    "ShowRealUsername" boolean NOT NULL DEFAULT false,
    "CanCreateTopics" boolean NOT NULL DEFAULT false,
    "CanManageMembers" boolean NOT NULL DEFAULT false,
    "CanManageRoles" boolean NOT NULL DEFAULT false,
    "CanManageSubgroups" boolean NOT NULL DEFAULT false,
    "CanPostAnnouncements" boolean NOT NULL DEFAULT false,
    "CanModerateContent" boolean NOT NULL DEFAULT false,
    "CanAccessAllSubgroups" boolean NOT NULL DEFAULT false,
    "CanUseGrokAI" boolean NOT NULL DEFAULT true,
    "CanUsePerpetualPhotos" boolean NOT NULL DEFAULT false,
    "CanUsePaperScanning" boolean NOT NULL DEFAULT false,
    "CanManageFunds" boolean NOT NULL DEFAULT false,
    "Permissions" text NOT NULL DEFAULT '{}',
    "CanSeeRealUsername" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "FK_GroupRoles_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

-- Create index on GroupId for better performance
CREATE INDEX IF NOT EXISTS "IX_GroupRoles_GroupId" ON "GroupRoles" ("GroupId");
