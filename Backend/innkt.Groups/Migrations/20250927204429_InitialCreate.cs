using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Groups.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CoverImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    MembersCount = table.Column<int>(type: "integer", nullable: false),
                    PostsCount = table.Column<int>(type: "integer", nullable: false),
                    GroupType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    InstitutionName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    GradeLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsKidFriendly = table.Column<bool>(type: "boolean", nullable: false),
                    AllowParentParticipation = table.Column<bool>(type: "boolean", nullable: false),
                    RequireParentApproval = table.Column<bool>(type: "boolean", nullable: false),
                    Tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                    table.CheckConstraint("CK_Group_GroupType", "\"GroupType\" IN ('general', 'educational', 'family')");
                });

            migrationBuilder.CreateTable(
                name: "GroupDocumentations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    GroupId1 = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupDocumentations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupDocumentations_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupDocumentations_Groups_GroupId1",
                        column: x => x.GroupId1,
                        principalTable: "Groups",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GroupInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupInvitations", x => x.Id);
                    table.CheckConstraint("CK_GroupInvitation_Status", "\"Status\" IN ('pending', 'accepted', 'rejected', 'expired')");
                    table.ForeignKey(
                        name: "FK_GroupInvitations_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsAnnouncement = table.Column<bool>(type: "boolean", nullable: false),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPosts_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Alias = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ShowRealUsername = table.Column<bool>(type: "boolean", nullable: false),
                    CanCreateTopics = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageMembers = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageRoles = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageSubgroups = table.Column<bool>(type: "boolean", nullable: false),
                    CanPostAnnouncements = table.Column<bool>(type: "boolean", nullable: false),
                    CanModerateContent = table.Column<bool>(type: "boolean", nullable: false),
                    CanAccessAllSubgroups = table.Column<bool>(type: "boolean", nullable: false),
                    CanUseGrokAI = table.Column<bool>(type: "boolean", nullable: false),
                    CanUsePerpetualPhotos = table.Column<bool>(type: "boolean", nullable: false),
                    CanUsePaperScanning = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageFunds = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupRoles_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Details = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupRules_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    AllowMemberPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowMemberInvites = table.Column<bool>(type: "boolean", nullable: false),
                    RequireApprovalForPosts = table.Column<bool>(type: "boolean", nullable: false),
                    RequireApprovalForMembers = table.Column<bool>(type: "boolean", nullable: false),
                    AllowAnonymousPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowFileSharing = table.Column<bool>(type: "boolean", nullable: false),
                    AllowReactions = table.Column<bool>(type: "boolean", nullable: false),
                    AllowComments = table.Column<bool>(type: "boolean", nullable: false),
                    MaxMembers = table.Column<int>(type: "integer", nullable: false),
                    MaxPostLength = table.Column<int>(type: "integer", nullable: false),
                    AllowKidPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowKidVoting = table.Column<bool>(type: "boolean", nullable: false),
                    RequireParentApprovalForKidPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowTeacherPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowParentPosts = table.Column<bool>(type: "boolean", nullable: false),
                    EnableGrokAI = table.Column<bool>(type: "boolean", nullable: false),
                    EnablePerpetualPhotos = table.Column<bool>(type: "boolean", nullable: false),
                    EnablePaperScanning = table.Column<bool>(type: "boolean", nullable: false),
                    EnableHomeworkTracking = table.Column<bool>(type: "boolean", nullable: false),
                    EnableFundManagement = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    GroupId1 = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupSettings_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupSettings_Groups_GroupId1",
                        column: x => x.GroupId1,
                        principalTable: "Groups",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Subgroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ParentSubgroupId = table.Column<Guid>(type: "uuid", nullable: true),
                    Level = table.Column<int>(type: "integer", nullable: false),
                    MembersCount = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subgroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subgroups_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Subgroups_Subgroups_ParentSubgroupId",
                        column: x => x.ParentSubgroupId,
                        principalTable: "Subgroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    KidId = table.Column<Guid>(type: "uuid", nullable: true),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    AssignedRoleId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsParentActingForKid = table.Column<bool>(type: "boolean", nullable: false),
                    CanPost = table.Column<bool>(type: "boolean", nullable: false),
                    CanVote = table.Column<bool>(type: "boolean", nullable: false),
                    CanComment = table.Column<bool>(type: "boolean", nullable: false),
                    CanInvite = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMembers", x => x.Id);
                    table.CheckConstraint("CK_GroupMember_Role", "\"Role\" IN ('owner', 'admin', 'moderator', 'member')");
                    table.ForeignKey(
                        name: "FK_GroupMembers_GroupRoles_AssignedRoleId",
                        column: x => x.AssignedRoleId,
                        principalTable: "GroupRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupMembers_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubgroupRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubgroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    CanWriteInTopics = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageSubgroupMembers = table.Column<bool>(type: "boolean", nullable: false),
                    CanCreateSubgroupTopics = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubgroupRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubgroupRoles_GroupRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "GroupRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubgroupRoles_Subgroups_SubgroupId",
                        column: x => x.SubgroupId,
                        principalTable: "Subgroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Topics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubgroupId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IsAnnouncementOnly = table.Column<bool>(type: "boolean", nullable: false),
                    AllowMemberPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowKidPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowParentPosts = table.Column<bool>(type: "boolean", nullable: false),
                    AllowRolePosts = table.Column<bool>(type: "boolean", nullable: false),
                    PostsCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    PausedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ArchivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Topics", x => x.Id);
                    table.CheckConstraint("CK_Topic_Status", "\"Status\" IN ('active', 'paused', 'archived')");
                    table.ForeignKey(
                        name: "FK_Topics_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Topics_Subgroups_SubgroupId",
                        column: x => x.SubgroupId,
                        principalTable: "Subgroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubgroupMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubgroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedRoleId = table.Column<Guid>(type: "uuid", nullable: true),
                    CanWrite = table.Column<bool>(type: "boolean", nullable: false),
                    CanManageMembers = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubgroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubgroupMembers_GroupMembers_GroupMemberId",
                        column: x => x.GroupMemberId,
                        principalTable: "GroupMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubgroupMembers_GroupRoles_AssignedRoleId",
                        column: x => x.AssignedRoleId,
                        principalTable: "GroupRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SubgroupMembers_Subgroups_SubgroupId",
                        column: x => x.SubgroupId,
                        principalTable: "Subgroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupFiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: true),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MimeType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    FileCategory = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UploadedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    KidId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsParentUploadingForKid = table.Column<bool>(type: "boolean", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    IsDownloadable = table.Column<bool>(type: "boolean", nullable: false),
                    DownloadCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupFiles_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupFiles_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "GroupPolls",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: true),
                    Question = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Options = table.Column<string[]>(type: "text[]", nullable: false),
                    AllowMultipleVotes = table.Column<bool>(type: "boolean", nullable: false),
                    AllowKidVoting = table.Column<bool>(type: "boolean", nullable: false),
                    AllowParentVotingForKid = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    TotalVotes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPolls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPolls_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupPolls_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TopicPosts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    KidId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsParentPostingForKid = table.Column<bool>(type: "boolean", nullable: false),
                    IsAnnouncement = table.Column<bool>(type: "boolean", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    MediaUrls = table.Column<string[]>(type: "text[]", nullable: true),
                    Hashtags = table.Column<string[]>(type: "text[]", nullable: true),
                    Mentions = table.Column<string[]>(type: "text[]", nullable: true),
                    Location = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TopicPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TopicPosts_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupFilePermissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FileId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CanView = table.Column<bool>(type: "boolean", nullable: false),
                    CanDownload = table.Column<bool>(type: "boolean", nullable: false),
                    CanDelete = table.Column<bool>(type: "boolean", nullable: false),
                    CanEdit = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupFilePermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupFilePermissions_GroupFiles_FileId",
                        column: x => x.FileId,
                        principalTable: "GroupFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PollVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PollId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    KidId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsParentVotingForKid = table.Column<bool>(type: "boolean", nullable: false),
                    SelectedOptionIndex = table.Column<int>(type: "integer", nullable: false),
                    VotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PollVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PollVotes_GroupPolls_PollId",
                        column: x => x.PollId,
                        principalTable: "GroupPolls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupDocumentations_Category",
                table: "GroupDocumentations",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_GroupDocumentations_CreatedAt",
                table: "GroupDocumentations",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupDocumentations_GroupId",
                table: "GroupDocumentations",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupDocumentations_GroupId1",
                table: "GroupDocumentations",
                column: "GroupId1",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupFilePermissions_FileId",
                table: "GroupFilePermissions",
                column: "FileId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupFilePermissions_FileId_Role",
                table: "GroupFilePermissions",
                columns: new[] { "FileId", "Role" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupFilePermissions_Role",
                table: "GroupFilePermissions",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_GroupFiles_CreatedAt",
                table: "GroupFiles",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupFiles_FileCategory",
                table: "GroupFiles",
                column: "FileCategory");

            migrationBuilder.CreateIndex(
                name: "IX_GroupFiles_GroupId",
                table: "GroupFiles",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupFiles_GroupId_FileCategory",
                table: "GroupFiles",
                columns: new[] { "GroupId", "FileCategory" });

            migrationBuilder.CreateIndex(
                name: "IX_GroupFiles_TopicId",
                table: "GroupFiles",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupFiles_UploadedBy",
                table: "GroupFiles",
                column: "UploadedBy");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_CreatedAt",
                table: "GroupInvitations",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_ExpiresAt",
                table: "GroupInvitations",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_GroupId",
                table: "GroupInvitations",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_InvitedByUserId",
                table: "GroupInvitations",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_InvitedUserId",
                table: "GroupInvitations",
                column: "InvitedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_Status",
                table: "GroupInvitations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_AssignedRoleId",
                table: "GroupMembers",
                column: "AssignedRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_GroupId",
                table: "GroupMembers",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_GroupId_UserId",
                table: "GroupMembers",
                columns: new[] { "GroupId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_IsActive",
                table: "GroupMembers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_JoinedAt",
                table: "GroupMembers",
                column: "JoinedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_Role",
                table: "GroupMembers",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPolls_ExpiresAt",
                table: "GroupPolls",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPolls_GroupId",
                table: "GroupPolls",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPolls_IsActive",
                table: "GroupPolls",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPolls_TopicId",
                table: "GroupPolls",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_CreatedAt",
                table: "GroupPosts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_GroupId",
                table: "GroupPosts",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_GroupId_PostId",
                table: "GroupPosts",
                columns: new[] { "GroupId", "PostId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_IsAnnouncement",
                table: "GroupPosts",
                column: "IsAnnouncement");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_IsPinned",
                table: "GroupPosts",
                column: "IsPinned");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_PostId",
                table: "GroupPosts",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_UserId",
                table: "GroupPosts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupRoles_GroupId",
                table: "GroupRoles",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupRoles_Name",
                table: "GroupRoles",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_GroupRules_GroupId",
                table: "GroupRules",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupRules_GroupId_IsActive",
                table: "GroupRules",
                columns: new[] { "GroupId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_GroupRules_GroupId_Order",
                table: "GroupRules",
                columns: new[] { "GroupId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Category",
                table: "Groups",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_CreatedAt",
                table: "Groups",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_GroupType",
                table: "Groups",
                column: "GroupType");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_IsKidFriendly",
                table: "Groups",
                column: "IsKidFriendly");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_IsPublic",
                table: "Groups",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_IsVerified",
                table: "Groups",
                column: "IsVerified");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Name",
                table: "Groups",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_OwnerId",
                table: "Groups",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupSettings_GroupId",
                table: "GroupSettings",
                column: "GroupId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupSettings_GroupId1",
                table: "GroupSettings",
                column: "GroupId1",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_PollId",
                table: "PollVotes",
                column: "PollId");

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_PollId_UserId",
                table: "PollVotes",
                columns: new[] { "PollId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_UserId",
                table: "PollVotes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_VotedAt",
                table: "PollVotes",
                column: "VotedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupMembers_AssignedRoleId",
                table: "SubgroupMembers",
                column: "AssignedRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupMembers_GroupMemberId",
                table: "SubgroupMembers",
                column: "GroupMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupMembers_SubgroupId",
                table: "SubgroupMembers",
                column: "SubgroupId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupMembers_SubgroupId_GroupMemberId",
                table: "SubgroupMembers",
                columns: new[] { "SubgroupId", "GroupMemberId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoles_RoleId",
                table: "SubgroupRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoles_SubgroupId",
                table: "SubgroupRoles",
                column: "SubgroupId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoles_SubgroupId_RoleId",
                table: "SubgroupRoles",
                columns: new[] { "SubgroupId", "RoleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Subgroups_GroupId",
                table: "Subgroups",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Subgroups_IsActive",
                table: "Subgroups",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Subgroups_Level",
                table: "Subgroups",
                column: "Level");

            migrationBuilder.CreateIndex(
                name: "IX_Subgroups_ParentSubgroupId",
                table: "Subgroups",
                column: "ParentSubgroupId");

            migrationBuilder.CreateIndex(
                name: "IX_TopicPosts_CreatedAt",
                table: "TopicPosts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TopicPosts_PostId",
                table: "TopicPosts",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_TopicPosts_TopicId",
                table: "TopicPosts",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_TopicPosts_TopicId_PostId",
                table: "TopicPosts",
                columns: new[] { "TopicId", "PostId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TopicPosts_UserId",
                table: "TopicPosts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Topics_CreatedAt",
                table: "Topics",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Topics_GroupId",
                table: "Topics",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Topics_Status",
                table: "Topics",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Topics_SubgroupId",
                table: "Topics",
                column: "SubgroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupDocumentations");

            migrationBuilder.DropTable(
                name: "GroupFilePermissions");

            migrationBuilder.DropTable(
                name: "GroupInvitations");

            migrationBuilder.DropTable(
                name: "GroupPosts");

            migrationBuilder.DropTable(
                name: "GroupRules");

            migrationBuilder.DropTable(
                name: "GroupSettings");

            migrationBuilder.DropTable(
                name: "PollVotes");

            migrationBuilder.DropTable(
                name: "SubgroupMembers");

            migrationBuilder.DropTable(
                name: "SubgroupRoles");

            migrationBuilder.DropTable(
                name: "TopicPosts");

            migrationBuilder.DropTable(
                name: "GroupFiles");

            migrationBuilder.DropTable(
                name: "GroupPolls");

            migrationBuilder.DropTable(
                name: "GroupMembers");

            migrationBuilder.DropTable(
                name: "Topics");

            migrationBuilder.DropTable(
                name: "GroupRoles");

            migrationBuilder.DropTable(
                name: "Subgroups");

            migrationBuilder.DropTable(
                name: "Groups");
        }
    }
}
