-- Add role posting fields to GroupPosts
ALTER TABLE "GroupPosts" ADD COLUMN "PostedAsRoleId" UUID NULL;
ALTER TABLE "GroupPosts" ADD COLUMN "PostedAsRoleName" VARCHAR(100) NULL;
ALTER TABLE "GroupPosts" ADD COLUMN "PostedAsRoleAlias" VARCHAR(100) NULL;
ALTER TABLE "GroupPosts" ADD COLUMN "ShowRealUsername" BOOLEAN DEFAULT FALSE;
ALTER TABLE "GroupPosts" ADD COLUMN "RealUsername" VARCHAR(100) NULL;

-- Add role posting fields to TopicPosts
ALTER TABLE "TopicPosts" ADD COLUMN "PostedAsRoleId" UUID NULL;
ALTER TABLE "TopicPosts" ADD COLUMN "PostedAsRoleName" VARCHAR(100) NULL;
ALTER TABLE "TopicPosts" ADD COLUMN "PostedAsRoleAlias" VARCHAR(100) NULL;
ALTER TABLE "TopicPosts" ADD COLUMN "ShowRealUsername" BOOLEAN DEFAULT FALSE;
ALTER TABLE "TopicPosts" ADD COLUMN "RealUsername" VARCHAR(100) NULL;

-- Add role posting permissions to GroupRoles
ALTER TABLE "GroupRoles" ADD COLUMN "CanPostText" BOOLEAN DEFAULT TRUE;
ALTER TABLE "GroupRoles" ADD COLUMN "CanPostImages" BOOLEAN DEFAULT TRUE;
ALTER TABLE "GroupRoles" ADD COLUMN "CanPostPolls" BOOLEAN DEFAULT FALSE;
ALTER TABLE "GroupRoles" ADD COLUMN "CanPostAnnouncements" BOOLEAN DEFAULT FALSE;
ALTER TABLE "GroupRoles" ADD COLUMN "CanPostVideos" BOOLEAN DEFAULT FALSE;

-- Add foreign key constraints
ALTER TABLE "GroupPosts" ADD CONSTRAINT "FK_GroupPosts_PostedAsRole" 
    FOREIGN KEY ("PostedAsRoleId") REFERENCES "GroupRoles"("Id") ON DELETE SET NULL;

ALTER TABLE "TopicPosts" ADD CONSTRAINT "FK_TopicPosts_PostedAsRole" 
    FOREIGN KEY ("PostedAsRoleId") REFERENCES "GroupRoles"("Id") ON DELETE SET NULL;
