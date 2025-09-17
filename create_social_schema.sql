-- Create Social Service Database Schema
-- This script creates all necessary tables for the Social service

-- Create Posts table
CREATE TABLE IF NOT EXISTS "Posts" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Content" text NOT NULL,
    "MediaUrls" text[],
    "Hashtags" text[],
    "Mentions" text[],
    "Location" varchar(255),
    "PostType" varchar(50) NOT NULL DEFAULT 'text',
    "IsPublic" boolean NOT NULL DEFAULT true,
    "IsPinned" boolean NOT NULL DEFAULT false,
    "PollOptions" text[],
    "PollDuration" integer,
    "PollExpiresAt" timestamp with time zone,
    "LikesCount" integer NOT NULL DEFAULT 0,
    "CommentsCount" integer NOT NULL DEFAULT 0,
    "SharesCount" integer NOT NULL DEFAULT 0,
    "ViewsCount" integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Posts" PRIMARY KEY ("Id")
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS "Comments" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Content" text NOT NULL,
    "ParentCommentId" uuid,
    "LikesCount" integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Comments" PRIMARY KEY ("Id")
);

-- Create Likes table
CREATE TABLE IF NOT EXISTS "Likes" (
    "Id" uuid NOT NULL,
    "PostId" uuid,
    "CommentId" uuid,
    "UserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Likes" PRIMARY KEY ("Id")
);

-- Create Follows table
CREATE TABLE IF NOT EXISTS "Follows" (
    "Id" uuid NOT NULL,
    "FollowerId" uuid NOT NULL,
    "FollowingId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Follows" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Follow_NotSelf" CHECK ("FollowerId" != "FollowingId")
);

-- Create Groups table
CREATE TABLE IF NOT EXISTS "Groups" (
    "Id" uuid NOT NULL,
    "Name" varchar(100) NOT NULL,
    "Description" text,
    "OwnerId" uuid NOT NULL,
    "IsPublic" boolean NOT NULL DEFAULT true,
    "MembersCount" integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Groups" PRIMARY KEY ("Id")
);

-- Create GroupMembers table
CREATE TABLE IF NOT EXISTS "GroupMembers" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Role" varchar(50) NOT NULL DEFAULT 'member',
    "JoinedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupMembers" PRIMARY KEY ("Id")
);

-- Create GroupPosts table
CREATE TABLE IF NOT EXISTS "GroupPosts" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupPosts" PRIMARY KEY ("Id")
);

-- Create UserReports table
CREATE TABLE IF NOT EXISTS "UserReports" (
    "Id" uuid NOT NULL,
    "ReporterId" uuid NOT NULL,
    "ReportedUserId" uuid NOT NULL,
    "Reason" varchar(100) NOT NULL,
    "Description" text,
    "Status" varchar(50) NOT NULL DEFAULT 'pending',
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_UserReports" PRIMARY KEY ("Id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "IX_Posts_UserId" ON "Posts" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Posts_CreatedAt" ON "Posts" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_IsPublic" ON "Posts" ("IsPublic");
CREATE INDEX IF NOT EXISTS "IX_Posts_IsPinned" ON "Posts" ("IsPinned");
CREATE INDEX IF NOT EXISTS "IX_Posts_PostType" ON "Posts" ("PostType");
CREATE INDEX IF NOT EXISTS "IX_Posts_PollExpiresAt" ON "Posts" ("PollExpiresAt");
CREATE INDEX IF NOT EXISTS "IX_Posts_Hashtags" ON "Posts" USING GIN ("Hashtags");
CREATE INDEX IF NOT EXISTS "IX_Posts_PollOptions" ON "Posts" USING GIN ("PollOptions");

CREATE INDEX IF NOT EXISTS "IX_Comments_PostId" ON "Comments" ("PostId");
CREATE INDEX IF NOT EXISTS "IX_Comments_UserId" ON "Comments" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Comments_ParentCommentId" ON "Comments" ("ParentCommentId");

CREATE INDEX IF NOT EXISTS "IX_Likes_PostId" ON "Likes" ("PostId");
CREATE INDEX IF NOT EXISTS "IX_Likes_CommentId" ON "Likes" ("CommentId");
CREATE INDEX IF NOT EXISTS "IX_Likes_UserId" ON "Likes" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_Follows_FollowerId" ON "Follows" ("FollowerId");
CREATE INDEX IF NOT EXISTS "IX_Follows_FollowingId" ON "Follows" ("FollowingId");

CREATE INDEX IF NOT EXISTS "IX_GroupMembers_GroupId" ON "GroupMembers" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupMembers_UserId" ON "GroupMembers" ("UserId");

CREATE INDEX IF NOT EXISTS "IX_GroupPosts_GroupId" ON "GroupPosts" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupPosts_PostId" ON "GroupPosts" ("PostId");

CREATE INDEX IF NOT EXISTS "IX_UserReports_ReporterId" ON "UserReports" ("ReporterId");
CREATE INDEX IF NOT EXISTS "IX_UserReports_ReportedUserId" ON "UserReports" ("ReportedUserId");

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Follows_FollowerId_FollowingId" ON "Follows" ("FollowerId", "FollowingId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_GroupMembers_GroupId_UserId" ON "GroupMembers" ("GroupId", "UserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_GroupPosts_GroupId_PostId" ON "GroupPosts" ("GroupId", "PostId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserReports_ReporterId_ReportedUserId" ON "UserReports" ("ReporterId", "ReportedUserId");

-- Insert some sample data for testing
INSERT INTO "Posts" ("Id", "UserId", "Content", "PostType", "IsPublic", "CreatedAt", "UpdatedAt") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'bdfc4c41-c42e-42e0-a57b-d8301a37b1fe', 'Hello world! This is my first post on INNKT! 🚀', 'text', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'bdfc4c41-c42e-42e0-a57b-d8301a37b1fe', 'Just finished building this amazing social platform! #coding #innkt #socialmedia', 'text', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
('550e8400-e29b-41d4-a716-446655440003', 'c1234567-1234-5678-9abc-def012345684', 'What do you think about the new features?', 'poll', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
ON CONFLICT ("Id") DO NOTHING;

-- Insert sample poll data
UPDATE "Posts" SET 
    "PollOptions" = ARRAY['Love them!', 'They are okay', 'Need improvement', 'Not sure'],
    "PollDuration" = 24,
    "PollExpiresAt" = NOW() + INTERVAL '24 hours'
WHERE "Id" = '550e8400-e29b-41d4-a716-446655440003';

-- Insert sample follows
INSERT INTO "Follows" ("Id", "FollowerId", "FollowingId", "CreatedAt") VALUES
('660e8400-e29b-41d4-a716-446655440001', 'c1234567-1234-5678-9abc-def012345684', 'bdfc4c41-c42e-42e0-a57b-d8301a37b1fe', NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440002', 'bdfc4c41-c42e-42e0-a57b-d8301a37b1fe', 'c1234567-1234-5678-9abc-def012345684', NOW() - INTERVAL '2 days')
ON CONFLICT ("Id") DO NOTHING;

