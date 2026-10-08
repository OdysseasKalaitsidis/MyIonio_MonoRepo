using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MyIonio.Data;

#nullable disable
namespace MyIonio.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261001170000_AddSemesterIds")]
public partial class AddSemesterIds : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "semesters",
            columns: table => new
            {
                id = table.Column<int>(type: "integer", nullable: false),
                code = table.Column<string>(type: "text", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_semesters", x => x.id));

        migrationBuilder.CreateIndex(name: "IX_semesters_code", table: "semesters", column: "code", unique: true);
        migrationBuilder.Sql(
            "INSERT INTO semesters (id, code) VALUES " +
            "(1, 'Α'), (2, 'Β'), (3, 'Γ'), (4, 'Δ'), " +
            "(5, 'Ε'), (6, 'ΣΤ'), (7, 'Ζ'), (8, 'Η');");

        migrationBuilder.AddColumn<int>(name: "department_id", table: "class_schedules", type: "integer", nullable: false, defaultValue: 1);
        migrationBuilder.AddColumn<int>(name: "semester_id", table: "class_schedules", type: "integer", nullable: false, defaultValue: 1);
        migrationBuilder.AddColumn<int>(name: "department_id", table: "exam_schedules", type: "integer", nullable: false, defaultValue: 1);
        migrationBuilder.AddColumn<int>(name: "semester_id", table: "exam_schedules", type: "integer", nullable: false, defaultValue: 1);
        migrationBuilder.AddColumn<int>(name: "semester_id", table: "course_catalog", type: "integer", nullable: false, defaultValue: 1);

        const string semesterCase = "CASE UPPER(TRIM(semester)) WHEN 'Α' THEN 1 WHEN 'A' THEN 1 WHEN '1' THEN 1 " +
            "WHEN 'Β' THEN 2 WHEN 'B' THEN 2 WHEN '2' THEN 2 WHEN 'Γ' THEN 3 WHEN 'C' THEN 3 WHEN '3' THEN 3 " +
            "WHEN 'Δ' THEN 4 WHEN 'D' THEN 4 WHEN '4' THEN 4 WHEN 'Ε' THEN 5 WHEN 'E' THEN 5 WHEN '5' THEN 5 " +
            "WHEN 'ΣΤ' THEN 6 WHEN 'F' THEN 6 WHEN '6' THEN 6 WHEN 'Ζ' THEN 7 WHEN 'Z' THEN 7 WHEN 'G' THEN 7 WHEN '7' THEN 7 " +
            "WHEN 'Η' THEN 8 WHEN 'H' THEN 8 WHEN '8' THEN 8 ELSE 1 END";
        migrationBuilder.Sql($"UPDATE class_schedules SET semester_id = {semesterCase};");
        migrationBuilder.Sql($"UPDATE exam_schedules SET semester_id = {semesterCase};");
        migrationBuilder.Sql($"UPDATE course_catalog SET semester_id = {semesterCase};");

        migrationBuilder.AddForeignKey(name: "FK_class_schedules_semesters_semester_id", table: "class_schedules", column: "semester_id", principalTable: "semesters", principalColumn: "id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_exam_schedules_semesters_semester_id", table: "exam_schedules", column: "semester_id", principalTable: "semesters", principalColumn: "id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.AddForeignKey(name: "FK_course_catalog_semesters_semester_id", table: "course_catalog", column: "semester_id", principalTable: "semesters", principalColumn: "id", onDelete: ReferentialAction.Restrict);
        migrationBuilder.CreateIndex(name: "IX_class_schedules_semester_id", table: "class_schedules", column: "semester_id");
        migrationBuilder.CreateIndex(name: "IX_exam_schedules_semester_id", table: "exam_schedules", column: "semester_id");
        migrationBuilder.CreateIndex(name: "IX_course_catalog_semester_id", table: "course_catalog", column: "semester_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_class_schedules_semesters_semester_id", table: "class_schedules");
        migrationBuilder.DropForeignKey(name: "FK_exam_schedules_semesters_semester_id", table: "exam_schedules");
        migrationBuilder.DropForeignKey(name: "FK_course_catalog_semesters_semester_id", table: "course_catalog");
        migrationBuilder.DropIndex(name: "IX_class_schedules_semester_id", table: "class_schedules");
        migrationBuilder.DropIndex(name: "IX_exam_schedules_semester_id", table: "exam_schedules");
        migrationBuilder.DropIndex(name: "IX_course_catalog_semester_id", table: "course_catalog");
        migrationBuilder.DropColumn(name: "department_id", table: "class_schedules");
        migrationBuilder.DropColumn(name: "semester_id", table: "class_schedules");
        migrationBuilder.DropColumn(name: "department_id", table: "exam_schedules");
        migrationBuilder.DropColumn(name: "semester_id", table: "exam_schedules");
        migrationBuilder.DropColumn(name: "semester_id", table: "course_catalog");
        migrationBuilder.DropTable(name: "semesters");
    }
}
