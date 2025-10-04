-- Create SubgroupRoles table
CREATE TABLE IF NOT EXISTS "SubgroupRoles" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "SubgroupId" uuid NOT NULL,
    "RoleId" uuid NOT NULL,
    "CanWriteInTopics" boolean NOT NULL DEFAULT true,
    "CanManageSubgroupMembers" boolean NOT NULL DEFAULT false,
    "CanCreateSubgroupTopics" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "FK_SubgroupRoles_Subgroups_SubgroupId" FOREIGN KEY ("SubgroupId") REFERENCES "Subgroups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_SubgroupRoles_GroupRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "GroupRoles" ("Id") ON DELETE CASCADE
);

-- Create SubgroupMembers table
CREATE TABLE IF NOT EXISTS "SubgroupMembers" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "SubgroupId" uuid NOT NULL,
    "GroupMemberId" uuid NOT NULL,
    "AssignedRoleId" uuid,
    "CanWrite" boolean NOT NULL DEFAULT true,
    "CanManageMembers" boolean NOT NULL DEFAULT false,
    "JoinedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "IsActive" boolean NOT NULL DEFAULT true,
    CONSTRAINT "FK_SubgroupMembers_Subgroups_SubgroupId" FOREIGN KEY ("SubgroupId") REFERENCES "Subgroups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_SubgroupMembers_GroupMembers_GroupMemberId" FOREIGN KEY ("GroupMemberId") REFERENCES "GroupMembers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_SubgroupMembers_GroupRoles_AssignedRoleId" FOREIGN KEY ("AssignedRoleId") REFERENCES "GroupRoles" ("Id") ON DELETE SET NULL
);

-- Create TopicPosts table
CREATE TABLE IF NOT EXISTS "TopicPosts" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "TopicId" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "KidId" uuid,
    "IsParentPostingForKid" boolean NOT NULL DEFAULT false,
    "IsAnnouncement" boolean NOT NULL DEFAULT false,
    "Content" varchar(2000) NOT NULL,
    "MediaUrls" text[],
    "Hashtags" text[],
    "Mentions" text[],
    "Location" varchar(100),
    "IsPinned" boolean NOT NULL DEFAULT false,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "FK_TopicPosts_Topics_TopicId" FOREIGN KEY ("TopicId") REFERENCES "Topics" ("Id") ON DELETE CASCADE
);

-- Create PollVotes table
CREATE TABLE IF NOT EXISTS "PollVotes" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "PollId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "KidId" uuid,
    "IsParentVotingForKid" boolean NOT NULL DEFAULT false,
    "SelectedOptionIndex" integer NOT NULL,
    "VotedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "FK_PollVotes_GroupPolls_PollId" FOREIGN KEY ("PollId") REFERENCES "GroupPolls" ("Id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "IX_SubgroupRoles_SubgroupId" ON "SubgroupRoles" ("SubgroupId");
CREATE INDEX IF NOT EXISTS "IX_SubgroupRoles_RoleId" ON "SubgroupRoles" ("RoleId");
CREATE INDEX IF NOT EXISTS "IX_SubgroupMembers_SubgroupId" ON "SubgroupMembers" ("SubgroupId");
CREATE INDEX IF NOT EXISTS "IX_SubgroupMembers_GroupMemberId" ON "SubgroupMembers" ("GroupMemberId");
CREATE INDEX IF NOT EXISTS "IX_TopicPosts_TopicId" ON "TopicPosts" ("TopicId");
CREATE INDEX IF NOT EXISTS "IX_PollVotes_PollId" ON "PollVotes" ("PollId");
