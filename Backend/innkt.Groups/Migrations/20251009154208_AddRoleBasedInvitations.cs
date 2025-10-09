using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Groups.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleBasedInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InvitedByRoleAlias",
                table: "GroupInvitations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvitedByRoleId",
                table: "GroupInvitations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvitedByRoleName",
                table: "GroupInvitations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RealUsername",
                table: "GroupInvitations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowRealUsername",
                table: "GroupInvitations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "SubgroupId",
                table: "GroupInvitations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SubgroupRoleAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SubgroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubgroupRoleAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubgroupRoleAssignments_GroupRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "GroupRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubgroupRoleAssignments_Subgroups_SubgroupId",
                        column: x => x.SubgroupId,
                        principalTable: "Subgroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoleAssignments_AssignedByUserId",
                table: "SubgroupRoleAssignments",
                column: "AssignedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoleAssignments_IsActive",
                table: "SubgroupRoleAssignments",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoleAssignments_RoleId",
                table: "SubgroupRoleAssignments",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoleAssignments_SubgroupId",
                table: "SubgroupRoleAssignments",
                column: "SubgroupId");

            migrationBuilder.CreateIndex(
                name: "IX_SubgroupRoleAssignments_SubgroupId_RoleId",
                table: "SubgroupRoleAssignments",
                columns: new[] { "SubgroupId", "RoleId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubgroupRoleAssignments");

            migrationBuilder.DropColumn(
                name: "InvitedByRoleAlias",
                table: "GroupInvitations");

            migrationBuilder.DropColumn(
                name: "InvitedByRoleId",
                table: "GroupInvitations");

            migrationBuilder.DropColumn(
                name: "InvitedByRoleName",
                table: "GroupInvitations");

            migrationBuilder.DropColumn(
                name: "RealUsername",
                table: "GroupInvitations");

            migrationBuilder.DropColumn(
                name: "ShowRealUsername",
                table: "GroupInvitations");

            migrationBuilder.DropColumn(
                name: "SubgroupId",
                table: "GroupInvitations");
        }
    }
}
