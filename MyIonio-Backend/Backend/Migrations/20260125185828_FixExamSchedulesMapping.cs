using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class FixExamSchedulesMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The exam_schedules table already exists in the database with the correct schema
            // This migration is just to sync EF Core's model snapshot with the actual database
            // No changes needed
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_exam_schedules",
                table: "exam_schedules");

            migrationBuilder.RenameTable(
                name: "exam_schedules",
                newName: "ExaminationSchedules");

            migrationBuilder.RenameColumn(
                name: "semester",
                table: "ExaminationSchedules",
                newName: "Semester");

            migrationBuilder.RenameColumn(
                name: "department",
                table: "ExaminationSchedules",
                newName: "Department");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "ExaminationSchedules",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "period",
                table: "ExaminationSchedules",
                newName: "ExaminationPeriod");

            migrationBuilder.AlterColumn<int>(
                name: "Semester",
                table: "ExaminationSchedules",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "Curriculum",
                table: "ExaminationSchedules",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ExaminationSchedules",
                table: "ExaminationSchedules",
                column: "Id");
        }
    }
}
