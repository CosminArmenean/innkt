CREATE TABLE IF NOT EXISTS "GroupPolls" (
    "Id" uuid NOT NULL,
    "GroupId" uuid NOT NULL,
    "Question" character varying(500) NOT NULL,
    "Options" text NOT NULL,
    "TotalVotes" integer NOT NULL DEFAULT 0,
    "IsActive" boolean NOT NULL DEFAULT true,
    "AllowMultipleVotes" boolean NOT NULL DEFAULT false,
    "AllowKidVoting" boolean NOT NULL DEFAULT true,
    "AllowParentVotingForKid" boolean NOT NULL DEFAULT false,
    "ExpiresAt" timestamp with time zone,
    "TopicId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_GroupPolls" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GroupPolls_Groups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "Groups" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_GroupPolls_GroupId" ON "GroupPolls" ("GroupId");
CREATE INDEX IF NOT EXISTS "IX_GroupPolls_IsActive" ON "GroupPolls" ("IsActive");
CREATE INDEX IF NOT EXISTS "IX_GroupPolls_TopicId" ON "GroupPolls" ("TopicId");
CREATE INDEX IF NOT EXISTS "IX_GroupPolls_ExpiresAt" ON "GroupPolls" ("ExpiresAt");

