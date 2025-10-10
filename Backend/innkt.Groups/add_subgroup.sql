INSERT INTO "Subgroups" ("Id", "GroupId", "Name", "Description", "Level", "MembersCount", "IsActive", "Settings", "CreatedAt", "UpdatedAt") 
VALUES ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'CLASA I GROUP', 'Class I educational subgroup for students and teachers', 1, 0, true, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Topics" ("Id", "GroupId", "SubgroupId", "Name", "Description", "Status", "PostsCount", "CreatedAt", "UpdatedAt") 
VALUES ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'General Discussion', 'General discussion topic for Class I', 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
