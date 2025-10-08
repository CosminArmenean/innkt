using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Groups.Migrations
{
    /// <inheritdoc />
    public partial class AddRolePostingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PostedAsRoleAlias",
                table: "TopicPosts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PostedAsRoleId",
                table: "TopicPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostedAsRoleName",
                table: "TopicPosts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RealUsername",
                table: "TopicPosts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowRealUsername",
                table: "TopicPosts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanPostImages",
                table: "GroupRoles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanPostPolls",
                table: "GroupRoles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanPostText",
                table: "GroupRoles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanPostVideos",
                table: "GroupRoles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PostedAsRoleAlias",
                table: "GroupPosts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PostedAsRoleId",
                table: "GroupPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostedAsRoleName",
                table: "GroupPosts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RealUsername",
                table: "GroupPosts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowRealUsername",
                table: "GroupPosts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_TopicPosts_PostedAsRoleId",
                table: "TopicPosts",
                column: "PostedAsRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupPosts_PostedAsRoleId",
                table: "GroupPosts",
                column: "PostedAsRoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupPosts_GroupRoles_PostedAsRoleId",
                table: "GroupPosts",
                column: "PostedAsRoleId",
                principalTable: "GroupRoles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TopicPosts_GroupRoles_PostedAsRoleId",
                table: "TopicPosts",
                column: "PostedAsRoleId",
                principalTable: "GroupRoles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GroupPosts_GroupRoles_PostedAsRoleId",
                table: "GroupPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_TopicPosts_GroupRoles_PostedAsRoleId",
                table: "TopicPosts");

            migrationBuilder.DropIndex(
                name: "IX_TopicPosts_PostedAsRoleId",
                table: "TopicPosts");

            migrationBuilder.DropIndex(
                name: "IX_GroupPosts_PostedAsRoleId",
                table: "GroupPosts");

            migrationBuilder.DropColumn(
                name: "PostedAsRoleAlias",
                table: "TopicPosts");

            migrationBuilder.DropColumn(
                name: "PostedAsRoleId",
                table: "TopicPosts");

            migrationBuilder.DropColumn(
                name: "PostedAsRoleName",
                table: "TopicPosts");

            migrationBuilder.DropColumn(
                name: "RealUsername",
                table: "TopicPosts");

            migrationBuilder.DropColumn(
                name: "ShowRealUsername",
                table: "TopicPosts");

            migrationBuilder.DropColumn(
                name: "CanPostImages",
                table: "GroupRoles");

            migrationBuilder.DropColumn(
                name: "CanPostPolls",
                table: "GroupRoles");

            migrationBuilder.DropColumn(
                name: "CanPostText",
                table: "GroupRoles");

            migrationBuilder.DropColumn(
                name: "CanPostVideos",
                table: "GroupRoles");

            migrationBuilder.DropColumn(
                name: "PostedAsRoleAlias",
                table: "GroupPosts");

            migrationBuilder.DropColumn(
                name: "PostedAsRoleId",
                table: "GroupPosts");

            migrationBuilder.DropColumn(
                name: "PostedAsRoleName",
                table: "GroupPosts");

            migrationBuilder.DropColumn(
                name: "RealUsername",
                table: "GroupPosts");

            migrationBuilder.DropColumn(
                name: "ShowRealUsername",
                table: "GroupPosts");
        }
    }
}
