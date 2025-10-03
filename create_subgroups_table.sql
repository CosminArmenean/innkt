-- Create Subgroups table for innkt.Groups database
CREATE TABLE IF NOT EXISTS "Subgroups" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(500),
    "ParentSubgroupId" uuid,
    "Level" integer NOT NULL DEFAULT 0,
    "MembersCount" integer NOT NULL DEFAULT 0,
    "IsActive" boolean NOT NULL DEFAULT true,
    "Settings" text NOT NULL DEFAULT '{}',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Subgroups" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Subgroups_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Subgroups_Subgroups_ParentSubgroupId" FOREIGN KEY ("ParentSubgroupId") REFERENCES "Subgroups" ("Id") ON DELETE RESTRICT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IX_Subgroups_GroupId" ON "Subgroups" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_Subgroups_ParentSubgroupId" ON "Subgroups" ("ParentSubgroupId");
CREATE INDEX IF NOT EXISTS "IX_Subgroups_Level" ON "Subgroups" ("Level");
CREATE INDEX IF NOT EXISTS "IX_Subgroups_IsActive" ON "Subgroups" ("IsActive");

-- Create SubgroupMembers table
CREATE TABLE IF NOT EXISTS "SubgroupMembers" (
    "Id" uuid NOT NULL,
    "SubgroupId" uuid NOT NULL,
    "GroupMemberId" uuid NOT NULL,
    "AssignedRoleId" uuid,
    "JoinedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "IsActive" boolean NOT NULL DEFAULT true,
    CONSTRAINT "PK_SubgroupMembers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SubgroupMembers_Subgroups_SubgroupId" FOREIGN KEY ("SubgroupId") REFERENCES "Subgroups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_SubgroupMembers_GroupMembers_GroupMemberId" FOREIGN KEY ("GroupMemberId") REFERENCES "GroupMembers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_SubgroupMembers_GroupRoles_AssignedRoleId" FOREIGN KEY ("AssignedRoleId") REFERENCES "GroupRoles" ("Id") ON DELETE SET NULL
);

-- Create indexes for SubgroupMembers
CREATE INDEX IF NOT EXISTS "IX_SubgroupMembers_SubgroupId" ON "SubgroupMembers" ("SubgroupId");
CREATE INDEX IF NOT EXISTS "IX_SubgroupMembers_GroupMemberId" ON "SubgroupMembers" ("GroupMemberId");
CREATE INDEX IF NOT EXISTS "IX_SubgroupMembers_AssignedRoleId" ON "SubgroupMembers" ("AssignedRoleId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SubgroupMembers_SubgroupId_GroupMemberId" ON "SubgroupMembers" ("SubgroupId", "GroupMemberId");

-- Create SubgroupRoles table
CREATE TABLE IF NOT EXISTS "SubgroupRoles" (
    "Id" uuid NOT NULL,
    "SubgroupId" uuid NOT NULL,
    "RoleId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_SubgroupRoles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_SubgroupRoles_Subgroups_SubgroupId" FOREIGN KEY ("SubgroupId") REFERENCES "Subgroups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_SubgroupRoles_GroupRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "GroupRoles" ("Id") ON DELETE CASCADE
);

-- Create indexes for SubgroupRoles
CREATE INDEX IF NOT EXISTS "IX_SubgroupRoles_SubgroupId" ON "SubgroupRoles" ("SubgroupId");
CREATE INDEX IF NOT EXISTS "IX_SubgroupRoles_RoleId" ON "SubgroupRoles" ("RoleId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SubgroupRoles_SubgroupId_RoleId" ON "SubgroupRoles" ("SubgroupId", "RoleId");

-- Create Topics table
CREATE TABLE IF NOT EXISTS "Topics" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "SubgroupId" uuid,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(1000),
    "Status" character varying(20) NOT NULL DEFAULT 'active',
    "IsPinned" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Topics" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Topics_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Topics_Subgroups_SubgroupId" FOREIGN KEY ("SubgroupId") REFERENCES "Subgroups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_Topic_Status" CHECK ("Status" IN ('active', 'paused', 'archived'))
);

-- Create indexes for Topics
CREATE INDEX IF NOT EXISTS "IX_Topics_GroupId" ON "Topics" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_Topics_SubgroupId" ON "Topics" ("SubgroupId");
CREATE INDEX IF NOT EXISTS "IX_Topics_Status" ON "Topics" ("Status");
CREATE INDEX IF NOT EXISTS "IX_Topics_CreatedAt" ON "Topics" ("CreatedAt");

-- Create TopicPosts table
CREATE TABLE IF NOT EXISTS "TopicPosts" (
    "Id" uuid NOT NULL,
    "TopicId" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_TopicPosts" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TopicPosts_Topics_TopicId" FOREIGN KEY ("TopicId") REFERENCES "Topics" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TopicPosts_GroupPosts_PostId" FOREIGN KEY ("PostId") REFERENCES "GroupPosts" ("Id") ON DELETE CASCADE
);

-- Create indexes for TopicPosts
CREATE INDEX IF NOT EXISTS "IX_TopicPosts_TopicId" ON "TopicPosts" ("TopicId");
CREATE INDEX IF NOT EXISTS "IX_TopicPosts_PostId" ON "TopicPosts" ("PostId");
CREATE INDEX IF NOT EXISTS "IX_TopicPosts_UserId" ON "TopicPosts" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_TopicPosts_CreatedAt" ON "TopicPosts" ("CreatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_TopicPosts_TopicId_PostId" ON "TopicPosts" ("TopicId", "PostId");

-- Create GroupDocumentations table
CREATE TABLE IF NOT EXISTS "GroupDocumentations" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "Title" character varying(100) NOT NULL,
    "Description" character varying(500),
    "Content" text,
    "Category" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupDocumentations" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupDocumentations_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

-- Create indexes for GroupDocumentations
CREATE INDEX IF NOT EXISTS "IX_GroupDocumentations_GroupId" ON "GroupDocumentations" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupDocumentations_Category" ON "GroupDocumentations" ("Category");
CREATE INDEX IF NOT EXISTS "IX_GroupDocumentations_CreatedAt" ON "GroupDocumentations" ("CreatedAt");

-- Create GroupPolls table
CREATE TABLE IF NOT EXISTS "GroupPolls" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "TopicId" uuid,
    "Question" character varying(200) NOT NULL,
    "Options" text NOT NULL DEFAULT '[]',
    "IsActive" boolean NOT NULL DEFAULT true,
    "ExpiresAt" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupPolls" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupPolls_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GroupPolls_Topics_TopicId" FOREIGN KEY ("TopicId") REFERENCES "Topics" ("Id") ON DELETE SET NULL
);

-- Create indexes for GroupPolls
CREATE INDEX IF NOT EXISTS "IX_GroupPolls_GroupId" ON "GroupPolls" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupPolls_TopicId" ON "GroupPolls" ("TopicId");
CREATE INDEX IF NOT EXISTS "IX_GroupPolls_IsActive" ON "GroupPolls" ("IsActive");
CREATE INDEX IF NOT EXISTS "IX_GroupPolls_ExpiresAt" ON "GroupPolls" ("ExpiresAt");

-- Create PollVotes table
CREATE TABLE IF NOT EXISTS "PollVotes" (
    "Id" uuid NOT NULL,
    "PollId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "SelectedOption" character varying(100) NOT NULL,
    "VotedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_PollVotes" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PollVotes_GroupPolls_PollId" FOREIGN KEY ("PollId") REFERENCES "GroupPolls" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_PollVotes_GroupPosts_UserId" FOREIGN KEY ("UserId") REFERENCES "GroupPosts" ("UserId") ON DELETE CASCADE
);

-- Create indexes for PollVotes
CREATE INDEX IF NOT EXISTS "IX_PollVotes_PollId" ON "PollVotes" ("PollId");
CREATE INDEX IF NOT EXISTS "IX_PollVotes_UserId" ON "PollVotes" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_PollVotes_VotedAt" ON "PollVotes" ("VotedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_PollVotes_PollId_UserId" ON "PollVotes" ("PollId", "UserId");

-- Create GroupRules table
CREATE TABLE IF NOT EXISTS "GroupRules" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "Title" character varying(100) NOT NULL,
    "Description" character varying(500) NOT NULL,
    "Details" character varying(1000),
    "Category" character varying(50),
    "Order" integer NOT NULL DEFAULT 0,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupRules" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupRules_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

-- Create indexes for GroupRules
CREATE INDEX IF NOT EXISTS "IX_GroupRules_GroupId" ON "GroupRules" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupRules_GroupId_IsActive" ON "GroupRules" ("GroupId", "IsActive");
CREATE INDEX IF NOT EXISTS "IX_GroupRules_GroupId_Order" ON "GroupRules" ("GroupId", "Order");

-- Create GroupFiles table
CREATE TABLE IF NOT EXISTS "GroupFiles" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "TopicId" uuid,
    "FileName" character varying(255) NOT NULL,
    "FilePath" character varying(500) NOT NULL,
    "FileSize" bigint NOT NULL,
    "MimeType" character varying(100) NOT NULL,
    "FileCategory" character varying(50) NOT NULL,
    "Description" character varying(500),
    "UploadedBy" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupFiles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupFiles_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GroupFiles_Topics_TopicId" FOREIGN KEY ("TopicId") REFERENCES "Topics" ("Id") ON DELETE SET NULL
);

-- Create indexes for GroupFiles
CREATE INDEX IF NOT EXISTS "IX_GroupFiles_GroupId" ON "GroupFiles" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupFiles_TopicId" ON "GroupFiles" ("TopicId");
CREATE INDEX IF NOT EXISTS "IX_GroupFiles_UploadedBy" ON "GroupFiles" ("UploadedBy");
CREATE INDEX IF NOT EXISTS "IX_GroupFiles_FileCategory" ON "GroupFiles" ("FileCategory");
CREATE INDEX IF NOT EXISTS "IX_GroupFiles_CreatedAt" ON "GroupFiles" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_GroupFiles_GroupId_FileCategory" ON "GroupFiles" ("GroupId", "FileCategory");

-- Create GroupFilePermissions table
CREATE TABLE IF NOT EXISTS "GroupFilePermissions" (
    "Id" uuid NOT NULL,
    "FileId" uuid NOT NULL,
    "Role" character varying(50) NOT NULL,
    "CanView" boolean NOT NULL DEFAULT false,
    "CanDownload" boolean NOT NULL DEFAULT false,
    "CanEdit" boolean NOT NULL DEFAULT false,
    "CanDelete" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupFilePermissions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupFilePermissions_GroupFiles_FileId" FOREIGN KEY ("FileId") REFERENCES "GroupFiles" ("Id") ON DELETE CASCADE
);

-- Create indexes for GroupFilePermissions
CREATE INDEX IF NOT EXISTS "IX_GroupFilePermissions_FileId" ON "GroupFilePermissions" ("FileId");
CREATE INDEX IF NOT EXISTS "IX_GroupFilePermissions_Role" ON "GroupFilePermissions" ("Role");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_GroupFilePermissions_FileId_Role" ON "GroupFilePermissions" ("FileId", "Role");

COMMIT;



