using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddClassScheduleTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_schedules",
                table: "schedules");

            migrationBuilder.RenameTable(
                name: "schedules",
                newName: "class_schedule");

            // Manually handle the conversion from text to jsonb
            migrationBuilder.Sql("ALTER TABLE \"class_schedule\" ALTER COLUMN \"courses\" TYPE jsonb USING \"courses\"::jsonb;");

            migrationBuilder.AddColumn<string>(
                name: "academic_year",
                table: "class_schedule",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at",
                table: "class_schedule",
                type: "timestamptz",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "period",
                table: "class_schedule",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_class_schedule",
                table: "class_schedule",
                column: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_class_schedule",
                table: "class_schedule");

            migrationBuilder.DropColumn(
                name: "academic_year",
                table: "class_schedule");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "class_schedule");

            migrationBuilder.DropColumn(
                name: "period",
                table: "class_schedule");

            migrationBuilder.RenameTable(
                name: "class_schedule",
                newName: "schedules");

            migrationBuilder.AlterColumn<string>(
                name: "courses",
                table: "schedules",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AddPrimaryKey(
                name: "PK_schedules",
                table: "schedules",
                column: "id");
        }
    }
}
