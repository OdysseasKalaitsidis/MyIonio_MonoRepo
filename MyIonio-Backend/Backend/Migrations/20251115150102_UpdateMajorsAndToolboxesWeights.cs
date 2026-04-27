using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMajorsAndToolboxesWeights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 1,
                column: "Mweight",
                value: 48);

            migrationBuilder.UpdateData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 2,
                column: "Mweight",
                value: 35);

            migrationBuilder.UpdateData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 3,
                column: "Mweight",
                value: 66);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 1,
                column: "TWeight",
                value: 7);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 2,
                column: "TWeight",
                value: 23);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 3,
                column: "TWeight",
                value: 7);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 4,
                column: "TWeight",
                value: 14);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 5,
                column: "TWeight",
                value: 24);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 1,
                column: "Mweight",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 2,
                column: "Mweight",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 3,
                column: "Mweight",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 1,
                column: "TWeight",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 2,
                column: "TWeight",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 3,
                column: "TWeight",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 4,
                column: "TWeight",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 5,
                column: "TWeight",
                value: 1);
        }
    }
}
