using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Kinder.Migrations
{
    /// <inheritdoc />
    public partial class InitialKinderMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "content_safety_rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RuleType = table.Column<string>(type: "text", nullable: false),
                    RuleContent = table.Column<string>(type: "text", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    MinAge = table.Column<int>(type: "integer", nullable: false),
                    MaxAge = table.Column<int>(type: "integer", nullable: false),
                    ApplicableContexts = table.Column<string>(type: "text", nullable: false),
                    ConfidenceThreshold = table.Column<double>(type: "double precision", nullable: false),
                    RequiresHumanReview = table.Column<bool>(type: "boolean", nullable: false),
                    AiModelVersion = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Examples = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_content_safety_rules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "kid_accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Age = table.Column<int>(type: "integer", nullable: false),
                    SafetyLevel = table.Column<string>(type: "text", nullable: false),
                    MaxDailyTimeMinutes = table.Column<int>(type: "integer", nullable: false),
                    AllowedHoursStart = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    AllowedHoursEnd = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    SchoolModeEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    MaxConnections = table.Column<int>(type: "integer", nullable: false),
                    AgeGapLimitYears = table.Column<int>(type: "integer", nullable: false),
                    ParentNetworkOnly = table.Column<bool>(type: "boolean", nullable: false),
                    RequireParentApproval = table.Column<bool>(type: "boolean", nullable: false),
                    EducationalContentOnly = table.Column<bool>(type: "boolean", nullable: false),
                    BlockMatureContent = table.Column<bool>(type: "boolean", nullable: false),
                    MinContentSafetyScore = table.Column<double>(type: "double precision", nullable: false),
                    AllowedTopics = table.Column<string>(type: "text", nullable: false),
                    BlockedTopics = table.Column<string>(type: "text", nullable: false),
                    IndependenceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IndependenceDateSet = table.Column<bool>(type: "boolean", nullable: false),
                    CurrentMaturityScore = table.Column<double>(type: "double precision", nullable: false),
                    RequiredMaturityScore = table.Column<double>(type: "double precision", nullable: false),
                    AdaptiveSafetyEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    BehaviorScore = table.Column<double>(type: "double precision", nullable: false),
                    TrustScore = table.Column<double>(type: "double precision", nullable: false),
                    EducationalEngagement = table.Column<double>(type: "double precision", nullable: false),
                    LastBehaviorAssessment = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EmergencyContacts = table.Column<string>(type: "text", nullable: false),
                    PanicButtonEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LocationSharingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kid_accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "teacher_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    VerificationStatus = table.Column<string>(type: "text", nullable: false),
                    SchoolName = table.Column<string>(type: "text", nullable: false),
                    SchoolDistrict = table.Column<string>(type: "text", nullable: false),
                    EducatorLicenseNumber = table.Column<string>(type: "text", nullable: true),
                    SubjectsTeaching = table.Column<string[]>(type: "text[]", nullable: false),
                    GradeLevels = table.Column<string[]>(type: "text[]", nullable: false),
                    VerificationDocuments = table.Column<string>(type: "text", nullable: true),
                    CanCreateStudyGroups = table.Column<bool>(type: "boolean", nullable: false),
                    CanAssignHomework = table.Column<bool>(type: "boolean", nullable: false),
                    CanCommunicateWithParents = table.Column<bool>(type: "boolean", nullable: false),
                    CanAccessStudentProfiles = table.Column<bool>(type: "boolean", nullable: false),
                    BackgroundCheckCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    BackgroundCheckDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SafetyCertifications = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VerifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_profiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "behavior_assessments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DigitalCitizenship = table.Column<double>(type: "double precision", nullable: false),
                    ResponsibleBehavior = table.Column<double>(type: "double precision", nullable: false),
                    ParentTrust = table.Column<double>(type: "double precision", nullable: false),
                    EducationalEngagement = table.Column<double>(type: "double precision", nullable: false),
                    SocialInteraction = table.Column<double>(type: "double precision", nullable: false),
                    ContentQuality = table.Column<double>(type: "double precision", nullable: false),
                    OverallMaturityScore = table.Column<double>(type: "double precision", nullable: false),
                    SafetyRisk = table.Column<double>(type: "double precision", nullable: false),
                    IndependenceReadiness = table.Column<double>(type: "double precision", nullable: false),
                    AssessmentMethod = table.Column<string>(type: "text", nullable: false),
                    AssessmentData = table.Column<string>(type: "text", nullable: false),
                    AssessorNotes = table.Column<string>(type: "text", nullable: true),
                    RecommendedActions = table.Column<string>(type: "text", nullable: false),
                    SafetyRecommendations = table.Column<string>(type: "text", nullable: false),
                    NextAssessmentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_behavior_assessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_behavior_assessments_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "educational_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    GradeLevel = table.Column<string>(type: "text", nullable: false),
                    SchoolName = table.Column<string>(type: "text", nullable: true),
                    SchoolDistrict = table.Column<string>(type: "text", nullable: true),
                    TeacherId = table.Column<Guid>(type: "uuid", nullable: true),
                    Subjects = table.Column<string>(type: "text", nullable: false),
                    LearningGoals = table.Column<string>(type: "text", nullable: false),
                    AcademicPerformance = table.Column<double>(type: "double precision", nullable: false),
                    DigitalLiteracy = table.Column<double>(type: "double precision", nullable: false),
                    CollaborationSkills = table.Column<double>(type: "double precision", nullable: false),
                    CreativityScore = table.Column<double>(type: "double precision", nullable: false),
                    ParentTeacherChatEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    HomeworkCollaborationEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ProgressSharingEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_educational_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_educational_profiles_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "independence_transitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: false),
                    IndependenceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TransitionPhase = table.Column<string>(type: "text", nullable: false),
                    RequiredMaturityScore = table.Column<double>(type: "double precision", nullable: false),
                    CurrentMaturityScore = table.Column<double>(type: "double precision", nullable: false),
                    EducationalGoalsMet = table.Column<bool>(type: "boolean", nullable: false),
                    SafetyTestPassed = table.Column<bool>(type: "boolean", nullable: false),
                    ParentFinalApproval = table.Column<bool>(type: "boolean", nullable: false),
                    WarningPeriodDays = table.Column<int>(type: "integer", nullable: false),
                    PreparationPeriodDays = table.Column<int>(type: "integer", nullable: false),
                    MonitoringPeriodDays = table.Column<int>(type: "integer", nullable: false),
                    CanRevert = table.Column<bool>(type: "boolean", nullable: false),
                    ParentMessage = table.Column<string>(type: "text", nullable: true),
                    DigitalCertificateGenerated = table.Column<bool>(type: "boolean", nullable: false),
                    CelebrationData = table.Column<string>(type: "text", nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    WasReverted = table.Column<bool>(type: "boolean", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevertReason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_independence_transitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_independence_transitions_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "kid_login_codes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    QRCodeData = table.Column<string>(type: "text", nullable: true),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpirationDays = table.Column<int>(type: "integer", nullable: false),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeviceInfo = table.Column<string>(type: "text", nullable: true),
                    LastLoginAttempt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kid_login_codes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_kid_login_codes_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "kid_password_settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    HasPassword = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordSetByParent = table.Column<bool>(type: "boolean", nullable: false),
                    FirstPasswordSetAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastPasswordChangeAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PasswordChangedByKid = table.Column<bool>(type: "boolean", nullable: false),
                    IndependenceDay = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CanChangePassword = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RevocationReason = table.Column<string>(type: "text", nullable: true),
                    NotifyParentOnPasswordChange = table.Column<bool>(type: "boolean", nullable: false),
                    IndependenceDayReached = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordChangeCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_kid_password_settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_kid_password_settings_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "maturity_scores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    AgeScore = table.Column<int>(type: "integer", nullable: false),
                    ParentAssessment = table.Column<int>(type: "integer", nullable: false),
                    ParentRating = table.Column<int>(type: "integer", nullable: false),
                    BehavioralScore = table.Column<int>(type: "integer", nullable: false),
                    TotalScore = table.Column<int>(type: "integer", nullable: false),
                    Level = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    TimeManagement = table.Column<double>(type: "double precision", nullable: false),
                    ContentAppropriateness = table.Column<double>(type: "double precision", nullable: false),
                    SocialInteraction = table.Column<double>(type: "double precision", nullable: false),
                    ResponsibilityScore = table.Column<double>(type: "double precision", nullable: false),
                    SecurityAwareness = table.Column<double>(type: "double precision", nullable: false),
                    AssessmentNotes = table.Column<string>(type: "text", nullable: true),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    AssessmentMethod = table.Column<string>(type: "text", nullable: false),
                    PreviousLevel = table.Column<string>(type: "text", nullable: true),
                    LevelChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maturity_scores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_maturity_scores_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "parent_approvals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestType = table.Column<string>(type: "text", nullable: false),
                    TargetUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    RequestData = table.Column<string>(type: "text", nullable: false),
                    ParentNotes = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SafetyScore = table.Column<double>(type: "double precision", nullable: false),
                    SafetyFlags = table.Column<string>(type: "text", nullable: false),
                    AutoApproved = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_parent_approvals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_parent_approvals_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "safety_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KidAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    EventData = table.Column<string>(type: "text", nullable: false),
                    ParentNotified = table.Column<bool>(type: "boolean", nullable: false),
                    Resolved = table.Column<bool>(type: "boolean", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "text", nullable: true),
                    RiskScore = table.Column<double>(type: "double precision", nullable: false),
                    AiFlags = table.Column<string>(type: "text", nullable: false),
                    RequiresHumanReview = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_safety_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_safety_events_kid_accounts_KidAccountId",
                        column: x => x.KidAccountId,
                        principalTable: "kid_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_behavior_assessments_KidAccountId_AssessmentDate",
                table: "behavior_assessments",
                columns: new[] { "KidAccountId", "AssessmentDate" });

            migrationBuilder.CreateIndex(
                name: "IX_behavior_assessments_NextAssessmentDate",
                table: "behavior_assessments",
                column: "NextAssessmentDate");

            migrationBuilder.CreateIndex(
                name: "IX_content_safety_rules_MinAge_MaxAge",
                table: "content_safety_rules",
                columns: new[] { "MinAge", "MaxAge" });

            migrationBuilder.CreateIndex(
                name: "IX_content_safety_rules_Priority_IsActive",
                table: "content_safety_rules",
                columns: new[] { "Priority", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_content_safety_rules_RuleType_IsActive",
                table: "content_safety_rules",
                columns: new[] { "RuleType", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_educational_profiles_KidAccountId",
                table: "educational_profiles",
                column: "KidAccountId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_educational_profiles_TeacherId",
                table: "educational_profiles",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_independence_transitions_IndependenceDate_TransitionPhase",
                table: "independence_transitions",
                columns: new[] { "IndependenceDate", "TransitionPhase" });

            migrationBuilder.CreateIndex(
                name: "IX_independence_transitions_KidAccountId",
                table: "independence_transitions",
                column: "KidAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_kid_accounts_ParentId",
                table: "kid_accounts",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_kid_accounts_ParentId_IsActive",
                table: "kid_accounts",
                columns: new[] { "ParentId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_kid_accounts_UserId",
                table: "kid_accounts",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_kid_login_codes_Code",
                table: "kid_login_codes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_kid_login_codes_ExpiresAt",
                table: "kid_login_codes",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_kid_login_codes_KidAccountId_IsRevoked_IsUsed",
                table: "kid_login_codes",
                columns: new[] { "KidAccountId", "IsRevoked", "IsUsed" });

            migrationBuilder.CreateIndex(
                name: "IX_kid_login_codes_ParentId_CreatedAt",
                table: "kid_login_codes",
                columns: new[] { "ParentId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_kid_password_settings_IndependenceDay",
                table: "kid_password_settings",
                column: "IndependenceDay");

            migrationBuilder.CreateIndex(
                name: "IX_kid_password_settings_KidAccountId",
                table: "kid_password_settings",
                column: "KidAccountId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_maturity_scores_KidAccountId",
                table: "maturity_scores",
                column: "KidAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_maturity_scores_Level_LastUpdated",
                table: "maturity_scores",
                columns: new[] { "Level", "LastUpdated" });

            migrationBuilder.CreateIndex(
                name: "IX_maturity_scores_TotalScore",
                table: "maturity_scores",
                column: "TotalScore");

            migrationBuilder.CreateIndex(
                name: "IX_parent_approvals_ExpiresAt",
                table: "parent_approvals",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_parent_approvals_KidAccountId_Status",
                table: "parent_approvals",
                columns: new[] { "KidAccountId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_parent_approvals_ParentId_Status",
                table: "parent_approvals",
                columns: new[] { "ParentId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_safety_events_EventType_CreatedAt",
                table: "safety_events",
                columns: new[] { "EventType", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_safety_events_KidAccountId_Severity",
                table: "safety_events",
                columns: new[] { "KidAccountId", "Severity" });

            migrationBuilder.CreateIndex(
                name: "IX_safety_events_Resolved_Severity",
                table: "safety_events",
                columns: new[] { "Resolved", "Severity" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "behavior_assessments");

            migrationBuilder.DropTable(
                name: "content_safety_rules");

            migrationBuilder.DropTable(
                name: "educational_profiles");

            migrationBuilder.DropTable(
                name: "independence_transitions");

            migrationBuilder.DropTable(
                name: "kid_login_codes");

            migrationBuilder.DropTable(
                name: "kid_password_settings");

            migrationBuilder.DropTable(
                name: "maturity_scores");

            migrationBuilder.DropTable(
                name: "parent_approvals");

            migrationBuilder.DropTable(
                name: "safety_events");

            migrationBuilder.DropTable(
                name: "teacher_profiles");

            migrationBuilder.DropTable(
                name: "kid_accounts");
        }
    }
}
