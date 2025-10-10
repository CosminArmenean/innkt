using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Groups.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvancedTopicSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowAnonymous",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowComments",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowMedia",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowPolls",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowReactions",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowScheduling",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AutoArchive",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DocumentationMode",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsLocked",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPinned",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "MuteNotifications",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RequireApproval",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TimeRestricted",
                table: "Topics",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowAnonymous",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "AllowComments",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "AllowMedia",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "AllowPolls",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "AllowReactions",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "AllowScheduling",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "AutoArchive",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "DocumentationMode",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "IsLocked",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "IsPinned",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "MuteNotifications",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "RequireApproval",
                table: "Topics");

            migrationBuilder.DropColumn(
                name: "TimeRestricted",
                table: "Topics");
        }
    }
}
