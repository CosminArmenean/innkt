using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace innkt.Officer.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CountryCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    BirthDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Gender = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "en"),
                    Theme = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "light"),
                    ProfilePictureUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RegisteredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastLogin = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Address = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsProfilePicturePng = table.Column<bool>(type: "boolean", nullable: false),
                    ProfilePicturePngUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ProfilePictureCroppedUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsMfaEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MfaSecretKey = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    MfaEnabledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastMfaVerification = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsIdentityVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IdentityVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerificationMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreditCardLastFour = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    DriverLicensePhotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    VerificationStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    VerificationRejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsKidAccount = table.Column<bool>(type: "boolean", nullable: false),
                    ParentUserId = table.Column<string>(type: "text", nullable: true),
                    KidQrCode = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    KidPairingCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    KidAccountCreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    KidIndependenceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsKidAccountIndependent = table.Column<bool>(type: "boolean", nullable: false),
                    KidAccountStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    IsJointAccount = table.Column<bool>(type: "boolean", nullable: false),
                    LinkedUserId = table.Column<string>(type: "text", nullable: true),
                    JointAccountEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    JointAccountPassword = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    JointAccountCreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    JointAccountStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsEmailVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IsPhoneVerified = table.Column<bool>(type: "boolean", nullable: false),
                    EmailVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PhoneVerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsLocked = table.Column<bool>(type: "boolean", nullable: false),
                    LockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LockReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AcceptTerms = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptPrivacyPolicy = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptMarketing = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptCookies = table.Column<bool>(type: "boolean", nullable: false),
                    TermsAcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PrivacyPolicyAcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MarketingAcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CookiesAcceptedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 361, DateTimeKind.Utc).AddTicks(4615)),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 361, DateTimeKind.Utc).AddTicks(5682)),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    UpdatedBy = table.Column<string>(type: "text", nullable: true),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUsers_AspNetUsers_LinkedUserId",
                        column: x => x.LinkedUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AspNetUsers_AspNetUsers_ParentUserId",
                        column: x => x.ParentUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Privacy = table.Column<int>(type: "integer", nullable: false),
                    OwnerId = table.Column<string>(type: "text", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GroupAvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 363, DateTimeKind.Utc).AddTicks(576)),
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
                    InvitedUserId = table.Column<string>(type: "text", nullable: false),
                    InvitedByUserId = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    InvitedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 372, DateTimeKind.Utc).AddTicks(3082)),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    QrCodeData = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    QrCodeLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    QrCodeGeneratedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QrCodeScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QrCodeScannedByUserId = table.Column<string>(type: "text", nullable: true),
                    RequiresParentalApproval = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 372, DateTimeKind.Utc).AddTicks(3800)),
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
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 365, DateTimeKind.Utc).AddTicks(5943)),
                    LastActivityAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    InvitedByUserId = table.Column<string>(type: "text", nullable: true),
                    ParentalApprovalRequired = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "text", nullable: true),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true)
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
                    GroupId = table.Column<string>(type: "text", nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    TextContent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    VideoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DocumentUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ContentType = table.Column<int>(type: "integer", nullable: false),
                    Visibility = table.Column<int>(type: "integer", nullable: false),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    IsEdited = table.Column<bool>(type: "boolean", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EditReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedByUserId = table.Column<string>(type: "text", nullable: true),
                    DeletionReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 369, DateTimeKind.Utc).AddTicks(3521)),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 369, DateTimeKind.Utc).AddTicks(4274)),
                    QrCodeIdentifier = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    QrCodeScannedByUserId = table.Column<string>(type: "text", nullable: true),
                    QrCodeScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    QrCodeLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RequiresParentalApproval = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true)
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
                    GroupPostId = table.Column<string>(type: "text", nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ParentCommentId = table.Column<string>(type: "text", nullable: true),
                    IsEdited = table.Column<bool>(type: "boolean", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EditReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedByUserId = table.Column<string>(type: "text", nullable: true),
                    DeletionReason = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 377, DateTimeKind.Utc).AddTicks(163)),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 377, DateTimeKind.Utc).AddTicks(762)),
                    RequiresParentalApproval = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalGranted = table.Column<bool>(type: "boolean", nullable: true),
                    ParentalApprovalNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ParentalApprovalDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ParentalApprovalByUserId = table.Column<string>(type: "text", nullable: true)
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
                    ReactionType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValue: new DateTime(2025, 8, 29, 17, 12, 9, 374, DateTimeKind.Utc).AddTicks(4384)),
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
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_CreatedAt",
                table: "AspNetUsers",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsActive",
                table: "AspNetUsers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsIdentityVerified",
                table: "AspNetUsers",
                column: "IsIdentityVerified");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsJointAccount",
                table: "AspNetUsers",
                column: "IsJointAccount");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsKidAccount",
                table: "AspNetUsers",
                column: "IsKidAccount");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsMfaEnabled",
                table: "AspNetUsers",
                column: "IsMfaEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_JointAccountEmail",
                table: "AspNetUsers",
                column: "JointAccountEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_JointAccountStatus",
                table: "AspNetUsers",
                column: "JointAccountStatus");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_KidAccountStatus",
                table: "AspNetUsers",
                column: "KidAccountStatus");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_KidIndependenceDate",
                table: "AspNetUsers",
                column: "KidIndependenceDate");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_LastLogin",
                table: "AspNetUsers",
                column: "LastLogin");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_LinkedUserId",
                table: "AspNetUsers",
                column: "LinkedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_ParentUserId",
                table: "AspNetUsers",
                column: "ParentUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_RegisteredAt",
                table: "AspNetUsers",
                column: "RegisteredAt");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_VerificationStatus",
                table: "AspNetUsers",
                column: "VerificationStatus");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "GroupInvitations");

            migrationBuilder.DropTable(
                name: "GroupMembers");

            migrationBuilder.DropTable(
                name: "GroupPostComments");

            migrationBuilder.DropTable(
                name: "GroupPostReactions");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "GroupPosts");

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.DropTable(
                name: "AspNetUsers");
        }
    }
}
