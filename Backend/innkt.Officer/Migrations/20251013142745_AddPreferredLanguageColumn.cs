using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace innkt.Officer.Migrations
{
    /// <inheritdoc />
    public partial class AddPreferredLanguageColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 10, 13, 14, 27, 44, 882, DateTimeKind.Utc).AddTicks(3132),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 379, DateTimeKind.Utc).AddTicks(1041));

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 10, 13, 14, 27, 44, 882, DateTimeKind.Utc).AddTicks(1758),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 378, DateTimeKind.Utc).AddTicks(8770));

            migrationBuilder.AddColumn<string>(
                name: "PreferredLanguage",
                table: "AspNetUsers",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true,
                defaultValue: "en");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredLanguage",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 379, DateTimeKind.Utc).AddTicks(1041),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 10, 13, 14, 27, 44, 882, DateTimeKind.Utc).AddTicks(3132));

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(2025, 9, 10, 12, 9, 5, 378, DateTimeKind.Utc).AddTicks(8770),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValue: new DateTime(2025, 10, 13, 14, 27, 44, 882, DateTimeKind.Utc).AddTicks(1758));
        }
    }
}
