-- Create Follows table
CREATE TABLE "Follows" (
    "Id" uuid NOT NULL,
    "FollowerId" uuid NOT NULL,
    "FollowingId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Follows" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Follow_NotSelf" CHECK ("FollowerId" != "FollowingId")
);

-- Create Comments table
CREATE TABLE "Comments" (
    "Id" uuid NOT NULL,
    "PostId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "Content" character varying(2000) NOT NULL,
    "ParentCommentId" uuid,
    "LikesCount" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Comments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Comments_Comments_ParentCommentId" FOREIGN KEY ("ParentCommentId") REFERENCES "Comments" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Comments_Posts_PostId" FOREIGN KEY ("PostId") REFERENCES "Posts" ("Id") ON DELETE CASCADE
);

-- Create Likes table
CREATE TABLE "Likes" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "PostId" uuid,
    "CommentId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Likes" PRIMARY KEY ("Id"),
    CONSTRAINT "CK_Like_PostOrComment" CHECK (("PostId" IS NOT NULL AND "CommentId" IS NULL) OR ("PostId" IS NULL AND "CommentId" IS NOT NULL)),
    CONSTRAINT "FK_Likes_Comments_CommentId" FOREIGN KEY ("CommentId") REFERENCES "Comments" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Likes_Posts_PostId" FOREIGN KEY ("PostId") REFERENCES "Posts" ("Id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "IX_Comments_CreatedAt" ON "Comments" ("CreatedAt");
CREATE INDEX "IX_Comments_ParentCommentId" ON "Comments" ("ParentCommentId");
CREATE INDEX "IX_Comments_PostId" ON "Comments" ("PostId");
CREATE INDEX "IX_Comments_UserId" ON "Comments" ("UserId");
CREATE INDEX "IX_Follows_CreatedAt" ON "Follows" ("CreatedAt");
CREATE INDEX "IX_Follows_FollowerId" ON "Follows" ("FollowerId");
CREATE INDEX "IX_Follows_FollowerId_FollowingId" ON "Follows" ("FollowerId", "FollowingId") UNIQUE;
CREATE INDEX "IX_Follows_FollowingId" ON "Follows" ("FollowingId");
CREATE INDEX "IX_Likes_CommentId" ON "Likes" ("CommentId");
CREATE INDEX "IX_Likes_PostId" ON "Likes" ("PostId");
CREATE INDEX "IX_Likes_UserId_CommentId" ON "Likes" ("UserId", "CommentId") UNIQUE WHERE "CommentId" IS NOT NULL;
CREATE INDEX "IX_Likes_UserId_PostId" ON "Likes" ("UserId", "PostId") UNIQUE WHERE "PostId" IS NOT NULL;
CREATE INDEX "IX_Posts_CreatedAt" ON "Posts" ("CreatedAt");
CREATE INDEX "IX_Posts_Hashtags" ON "Posts" USING gin ("Hashtags");
CREATE INDEX "IX_Posts_IsPinned" ON "Posts" ("IsPinned");
CREATE INDEX "IX_Posts_IsPublic" ON "Posts" ("IsPublic");
CREATE INDEX "IX_Posts_PollExpiresAt" ON "Posts" ("PollExpiresAt");
CREATE INDEX "IX_Posts_PollOptions" ON "Posts" USING gin ("PollOptions");
CREATE INDEX "IX_Posts_PostType" ON "Posts" ("PostType");
CREATE INDEX "IX_Posts_UserId" ON "Posts" ("UserId");
