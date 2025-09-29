-- Create Groups table
CREATE TABLE IF NOT EXISTS "Groups" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(1000),
    "AvatarUrl" character varying(500),
    "CoverImageUrl" character varying(500),
    "OwnerId" uuid NOT NULL,
    "IsPublic" boolean NOT NULL,
    "IsVerified" boolean NOT NULL,
    "MembersCount" integer NOT NULL,
    "PostsCount" integer NOT NULL,
    "GroupType" character varying(20) NOT NULL,
    "Category" character varying(50),
    "InstitutionName" character varying(100),
    "GradeLevel" character varying(20),
    "IsKidFriendly" boolean NOT NULL,
    "AllowParentParticipation" boolean NOT NULL,
    "RequireParentApproval" boolean NOT NULL,
    "Tags" text[] NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Groups" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Group_GroupType" CHECK ("GroupType" IN ('general', 'educational', 'family'))
);

-- Create GroupMembers table
CREATE TABLE IF NOT EXISTS "GroupMembers" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Role" character varying(20) NOT NULL,
    "JoinedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "IsActive" boolean NOT NULL DEFAULT true,
    "CanPost" boolean NOT NULL DEFAULT true,
    "CanComment" boolean NOT NULL DEFAULT true,
    "CanInvite" boolean NOT NULL DEFAULT false,
    "CanVote" boolean NOT NULL DEFAULT true,
    "AssignedRoleId" uuid,
    "IsParentActingForKid" boolean NOT NULL DEFAULT false,
    "ParentId" uuid,
    "KidId" uuid,
    "LastSeenAt" timestamp with time zone,
    CONSTRAINT "PK_GroupMembers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupMembers_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_GroupMember_Role" CHECK ("Role" IN ('admin', 'moderator', 'member', 'guest'))
);

-- Create GroupSettings table
CREATE TABLE IF NOT EXISTS "GroupSettings" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "AllowMemberPosts" boolean NOT NULL DEFAULT true,
    "RequireApprovalForPosts" boolean NOT NULL DEFAULT false,
    "AllowComments" boolean NOT NULL DEFAULT true,
    "AllowPolls" boolean NOT NULL DEFAULT true,
    "AllowFileUploads" boolean NOT NULL DEFAULT true,
    "MaxFileSize" integer NOT NULL DEFAULT 10485760,
    "AllowedFileTypes" text[] NOT NULL DEFAULT '{}',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupSettings" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupSettings_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

-- Create GroupRules table
CREATE TABLE IF NOT EXISTS "GroupRules" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Description" character varying(1000),
    "Order" integer NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupRules" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupRules_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

-- Create migration history table
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- Insert migration record
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20250927204429_InitialCreate', '9.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

