-- Create a test group for Patrick Jane
INSERT INTO "Groups" (
    "Id", "Name", "Description", "OwnerId", "IsPublic", "IsVerified", 
    "MembersCount", "PostsCount", "GroupType", "Category", "IsKidFriendly", 
    "AllowParentParticipation", "RequireParentApproval", "Tags", "CreatedAt", "UpdatedAt"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Scoala Testoasa',
    'Test educational group',
    '550e8400-e29b-41d4-a716-446655440001', -- Patrick Jane's user ID
    false, -- Educational groups should be private
    false,
    1,
    0,
    'educational',
    'Education',
    true,
    true,
    true,
    ARRAY['education', 'school'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add Patrick Jane as admin member
INSERT INTO "GroupMembers" (
    "Id", "GroupId", "UserId", "Role", "JoinedAt", "IsActive", 
    "CanPost", "CanComment", "CanInvite", "CanVote"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001', -- Patrick Jane's user ID
    'admin',
    CURRENT_TIMESTAMP,
    true,
    true,
    true,
    true,
    true
);

-- Create group settings
INSERT INTO "GroupSettings" (
    "Id", "GroupId", "AllowMemberPosts", "RequireApprovalForPosts", 
    "AllowComments", "AllowPolls", "AllowFileUploads", "MaxFileSize", 
    "AllowedFileTypes", "CreatedAt", "UpdatedAt"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    true,
    false,
    true,
    true,
    true,
    10485760,
    ARRAY['jpg', 'png', 'pdf', 'doc'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

