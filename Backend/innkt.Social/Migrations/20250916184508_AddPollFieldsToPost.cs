using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Social.Migrations
{
    /// <inheritdoc />
    public partial class AddPollFieldsToPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.RenameTable(
                name: "Posts",
                newName: "Posts",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "Likes",
                newName: "Likes",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "Follows",
                newName: "Follows",
                newSchema: "public");

            migrationBuilder.RenameTable(
                name: "Comments",
                newName: "Comments",
                newSchema: "public");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "Posts",
                schema: "public",
                newName: "Posts");

            migrationBuilder.RenameTable(
                name: "Likes",
                schema: "public",
                newName: "Likes");

            migrationBuilder.RenameTable(
                name: "Follows",
                schema: "public",
                newName: "Follows");

            migrationBuilder.RenameTable(
                name: "Comments",
                schema: "public",
                newName: "Comments");
        }
    }
}
