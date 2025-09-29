using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Groups.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingGroupMemberProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Settings",
                table: "Subgroups",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "CanSeeRealUsername",
                table: "GroupRoles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Permissions",
                table: "GroupRoles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsParentAccount",
                table: "GroupMembers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "KidAccountId",
                table: "GroupMembers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RoleId",
                table: "GroupMembers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SubgroupId",
                table: "GroupMembers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "GroupMembers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Settings",
                table: "Subgroups");

            migrationBuilder.DropColumn(
                name: "CanSeeRealUsername",
                table: "GroupRoles");

            migrationBuilder.DropColumn(
                name: "Permissions",
                table: "GroupRoles");

            migrationBuilder.DropColumn(
                name: "IsParentAccount",
                table: "GroupMembers");

            migrationBuilder.DropColumn(
                name: "KidAccountId",
                table: "GroupMembers");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "GroupMembers");

            migrationBuilder.DropColumn(
                name: "SubgroupId",
                table: "GroupMembers");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "GroupMembers");
        }
    }
}
