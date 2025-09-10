using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Officer.Migrations
{
    /// <inheritdoc />
    public partial class FixMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GroupInvitations");

            migrationBuilder.DropTable(
                name: "GroupMembers");

            migrationBuilder.DropTable(
                name: "GroupPostComments");

            migrationBuilder.DropTable(
                name: "GroupPostReactions");

            migrationBuilder.DropTable(
                name: "GroupPosts");

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 379, DateTimeKind.Utc).AddTicks(1041),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 361, DateTimeKind.Utc).AddTicks(5682));

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 378, DateTimeKind.Utc).AddTicks(8770),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 361, DateTimeKind.Utc).AddTicks(4615));

            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverImageUrl",
                table: "AspNetUsers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPrivate",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bio",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "CoverImageUrl",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsPrivate",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 361, DateTimeKind.Utc).AddTicks(5682),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 379, DateTimeKind.Utc).AddTicks(1041));

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 361, DateTimeKind.Utc).AddTicks(4615),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 378, DateTimeKind.Utc).AddTicks(8770));

            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    OwnerId = table.Column<string>(type: "text", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 363, DateTimeKind.Utc).AddTicks(576)),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GroupAvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Privacy = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 363, DateTimeKind.Utc).AddTicks(1242))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Groups_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GroupInvitations",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    GroupId = table.Column<string>(type: "text", nullable: false),
                    InvitedByUserId = table.Column<string>(type: "text", nullable: false),
                    InvitedUserId = table.Column<string>(type: "text", nullable: false),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true),
                    QrCodeScannedByUserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 372, DateTimeKind.Utc).AddTicks(3800)),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InvitedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 372, DateTimeKind.Utc).AddTicks(3082)),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    QrCodeData = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    QrCodeGeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QrCodeLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    QrCodeScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequiresParentalApproval = table.Column<bool>(type: "boolean", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 372, DateTimeKind.Utc).AddTicks(4251))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupInvitations_AspNetUsers_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupInvitations_AspNetUsers_InvitedUserId",
                        column: x => x.InvitedUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupInvitations_AspNetUsers_ParentalApprovalByUserId",
                        column: x => x.ParentalApprovalByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupInvitations_AspNetUsers_QrCodeScannedByUserId",
                        column: x => x.QrCodeScannedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupInvitations_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupMembers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    GroupId = table.Column<string>(type: "text", nullable: false),
                    InvitedByUserId = table.Column<string>(type: "text", nullable: true),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 365, DateTimeKind.Utc).AddTicks(5943)),
                    LastActivityAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "text", nullable: true),
                    ParentalApprovalRequired = table.Column<bool>(type: "boolean", nullable: true),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupMembers_AspNetUsers_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupMembers_AspNetUsers_ParentalApprovalByUserId",
                        column: x => x.ParentalApprovalByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupMembers_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupPosts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    DeletedByUserId = table.Column<string>(type: "text", nullable: true),
                    GroupId = table.Column<string>(type: "text", nullable: false),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true),
                    QrCodeScannedByUserId = table.Column<string>(type: "text", nullable: true),
                    ContentType = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 369, DateTimeKind.Utc).AddTicks(3521)),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletionReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    DocumentUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EditReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EditedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsEdited = table.Column<bool>(type: "boolean", nullable: false),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    QrCodeIdentifier = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    QrCodeLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    QrCodeScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RequiresParentalApproval = table.Column<bool>(type: "boolean", nullable: true),
                    TextContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 369, DateTimeKind.Utc).AddTicks(4274)),
                    VideoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Visibility = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPosts_AspNetUsers_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupPosts_AspNetUsers_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupPosts_AspNetUsers_ParentalApprovalByUserId",
                        column: x => x.ParentalApprovalByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupPosts_AspNetUsers_QrCodeScannedByUserId",
                        column: x => x.QrCodeScannedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupPosts_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupPostComments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    DeletedByUserId = table.Column<string>(type: "text", nullable: true),
                    GroupPostId = table.Column<string>(type: "text", nullable: false),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true),
                    ParentCommentId = table.Column<string>(type: "text", nullable: true),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 377, DateTimeKind.Utc).AddTicks(163)),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletionReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EditReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    EditedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsEdited = table.Column<bool>(type: "boolean", nullable: false),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RequiresParentalApproval = table.Column<bool>(type: "boolean", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 377, DateTimeKind.Utc).AddTicks(762))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPostComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPostComments_AspNetUsers_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupPostComments_AspNetUsers_DeletedByUserId",
                        column: x => x.DeletedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupPostComments_AspNetUsers_ParentalApprovalByUserId",
                        column: x => x.ParentalApprovalByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GroupPostComments_GroupPostComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "GroupPostComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GroupPostComments_GroupPosts_GroupPostId",
                        column: x => x.GroupPostId,
                        principalTable: "GroupPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupPostReactions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    GroupPostId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 374, DateTimeKind.Utc).AddTicks(4384)),
                    ReactionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 374, DateTimeKind.Utc).AddTicks(4948))
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupPostReactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupPostReactions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupPostReactions_GroupPosts_GroupPostId",
                        column: x => x.GroupPostId,
                        principalTable: "GroupPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_ExpiresAt",
                table: "GroupInvitations",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_GroupId",
                table: "GroupInvitations",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_InvitedAt",
                table: "GroupInvitations",
                column: "InvitedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_InvitedByUserId",
                table: "GroupInvitations",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_InvitedUserId",
                table: "GroupInvitations",
                column: "InvitedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_ParentalApprovalByUserId",
                table: "GroupInvitations",
                column: "ParentalApprovalByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_QrCodeData",
                table: "GroupInvitations",
                column: "QrCodeData");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_QrCodeScannedByUserId",
                table: "GroupInvitations",
                column: "QrCodeScannedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupInvitations_Status",
                table: "GroupInvitations",
                column: "Status");

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
                name: "IX_GroupMembers_InvitedByUserId",
                table: "GroupMembers",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_JoinedAt",
                table: "GroupMembers",
                column: "JoinedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_ParentalApprovalByUserId",
                table: "GroupMembers",
                column: "ParentalApprovalByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_Role",
                table: "GroupMembers",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_Status",
                table: "GroupMembers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostComments_AuthorId",
                table: "GroupPostComments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostComments_CreatedAt",
                table: "GroupPostComments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostComments_DeletedByUserId",
                table: "GroupPostComments",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostComments_GroupPostId",
                table: "GroupPostComments",
                column: "GroupPostId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostComments_ParentalApprovalByUserId",
                table: "GroupPostComments",
                column: "ParentalApprovalByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostComments_ParentCommentId",
                table: "GroupPostComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostReactions_CreatedAt",
                table: "GroupPostReactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostReactions_GroupPostId",
                table: "GroupPostReactions",
                column: "GroupPostId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostReactions_GroupPostId_UserId_ReactionType",
                table: "GroupPostReactions",
                columns: new[] { "GroupPostId", "UserId", "ReactionType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostReactions_ReactionType",
                table: "GroupPostReactions",
                column: "ReactionType");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPostReactions_UserId",
                table: "GroupPostReactions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_AuthorId",
                table: "GroupPosts",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_ContentType",
                table: "GroupPosts",
                column: "ContentType");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_CreatedAt",
                table: "GroupPosts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_DeletedByUserId",
                table: "GroupPosts",
                column: "DeletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_GroupId",
                table: "GroupPosts",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_IsPinned",
                table: "GroupPosts",
                column: "IsPinned");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_ParentalApprovalByUserId",
                table: "GroupPosts",
                column: "ParentalApprovalByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_QrCodeIdentifier",
                table: "GroupPosts",
                column: "QrCodeIdentifier");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_QrCodeScannedByUserId",
                table: "GroupPosts",
                column: "QrCodeScannedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_Visibility",
                table: "GroupPosts",
                column: "Visibility");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_CreatedAt",
                table: "Groups",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_IsActive",
                table: "Groups",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_OwnerId",
                table: "Groups",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Privacy",
                table: "Groups",
                column: "Privacy");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Type",
                table: "Groups",
                column: "Type");
        }
    }
}
