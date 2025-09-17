-- Drop and recreate Posts table with correct structure
DROP TABLE IF EXISTS "Posts" CASCADE;

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
    "PollOptions" TEXT[],
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

-- Create indexes
CREATE INDEX "IX_Posts_UserId" ON "Posts" ("UserId");
CREATE INDEX "IX_Posts_CreatedAt" ON "Posts" ("CreatedAt");
CREATE INDEX "IX_Posts_IsPublic" ON "Posts" ("IsPublic");
CREATE INDEX "IX_Posts_IsPinned" ON "Posts" ("IsPinned");
CREATE INDEX "IX_Posts_PostType" ON "Posts" ("PostType");
CREATE INDEX "IX_Posts_PollExpiresAt" ON "Posts" ("PollExpiresAt");

-- GIN indexes for array fields
CREATE INDEX "IX_Posts_Hashtags" ON "Posts" USING gin ("Hashtags");
CREATE INDEX "IX_Posts_PollOptions" ON "Posts" USING gin ("PollOptions");
