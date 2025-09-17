-- Create Posts table with all required columns
CREATE TABLE "Posts" (
    "Id" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Content" CHARACTER VARYING(5000) NOT NULL,
    "MediaUrls" TEXT[] NOT NULL DEFAULT '{}',
    "Hashtags" TEXT[] NOT NULL DEFAULT '{}',
    "Mentions" TEXT[] NOT NULL DEFAULT '{}',
    "Location" CHARACTER VARYING(255),
    "PostType" CHARACTER VARYING(50) NOT NULL DEFAULT 'text',
    "IsPublic" BOOLEAN NOT NULL DEFAULT true,
    "IsPinned" BOOLEAN NOT NULL DEFAULT false,
    "PollOptions" TEXT[] DEFAULT '{}',
    "PollDuration" INTEGER,
    "PollExpiresAt" TIMESTAMP WITH TIME ZONE,
    "LikesCount" INTEGER NOT NULL DEFAULT 0,
    "CommentsCount" INTEGER NOT NULL DEFAULT 0,
    "SharesCount" INTEGER NOT NULL DEFAULT 0,
    "ViewsCount" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Posts" PRIMARY KEY ("Id")
);

-- Create Follows table
CREATE TABLE "Follows" (
    "Id" UUID NOT NULL,
    "FollowerId" UUID NOT NULL,
    "FollowingId" UUID NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Follows" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Follow_NotSelf" CHECK ("FollowerId" != "FollowingId")
);

-- Create Comments table
CREATE TABLE "Comments" (
    "Id" UUID NOT NULL,
    "PostId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "Content" CHARACTER VARYING(2000) NOT NULL,
    "ParentCommentId" UUID,
    "LikesCount" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Comments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Comments_Posts_PostId" FOREIGN KEY ("PostId") REFERENCES "Posts" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Comments_Comments_ParentCommentId" FOREIGN KEY ("ParentCommentId") REFERENCES "Comments" ("Id") ON DELETE CASCADE
);

-- Create Likes table
CREATE TABLE "Likes" (
    "Id" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "PostId" UUID,
    "CommentId" UUID,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Likes" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Like_PostOrComment" CHECK (("PostId" IS NOT NULL AND "CommentId" IS NULL) OR ("PostId" IS NULL AND "CommentId" IS NOT NULL)),
    CONSTRAINT "FK_Likes_Posts_PostId" FOREIGN KEY ("PostId") REFERENCES "Posts" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Likes_Comments_CommentId" FOREIGN KEY ("CommentId") REFERENCES "Comments" ("Id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "IX_Posts_UserId" ON "Posts" ("UserId");
CREATE INDEX "IX_Posts_CreatedAt" ON "Posts" ("CreatedAt");
CREATE INDEX "IX_Posts_IsPublic" ON "Posts" ("IsPublic");
CREATE INDEX "IX_Posts_IsPinned" ON "Posts" ("IsPinned");
CREATE INDEX "IX_Posts_PostType" ON "Posts" ("PostType");
CREATE INDEX "IX_Posts_PollExpiresAt" ON "Posts" ("PollExpiresAt");
CREATE INDEX "IX_Posts_Hashtags" ON "Posts" USING GIN ("Hashtags");
CREATE INDEX "IX_Posts_PollOptions" ON "Posts" USING GIN ("PollOptions");

CREATE INDEX "IX_Follows_FollowerId" ON "Follows" ("FollowerId");
CREATE INDEX "IX_Follows_FollowingId" ON "Follows" ("FollowingId");
CREATE INDEX "IX_Follows_CreatedAt" ON "Follows" ("CreatedAt");

CREATE INDEX "IX_Comments_PostId" ON "Comments" ("PostId");
CREATE INDEX "IX_Comments_UserId" ON "Comments" ("UserId");
CREATE INDEX "IX_Comments_CreatedAt" ON "Comments" ("CreatedAt");
CREATE INDEX "IX_Comments_ParentCommentId" ON "Comments" ("ParentCommentId");

CREATE INDEX "IX_Likes_UserId" ON "Likes" ("UserId");
CREATE INDEX "IX_Likes_PostId" ON "Likes" ("PostId");
CREATE INDEX "IX_Likes_CommentId" ON "Likes" ("CommentId");
CREATE INDEX "IX_Likes_CreatedAt" ON "Likes" ("CreatedAt");
