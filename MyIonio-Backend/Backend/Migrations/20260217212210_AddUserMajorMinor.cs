using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddUserMajorMinor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Major",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Minor",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Major",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Minor",
                table: "Users");
        }
    }
}
