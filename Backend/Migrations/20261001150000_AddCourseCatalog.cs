using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MyIonio.Data;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable
namespace MyIonio.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261001150000_AddCourseCatalog")]
public partial class AddCourseCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "EnrolledCourseIds", table: "Users", type: "jsonb", nullable: false, defaultValue: "{}");
        migrationBuilder.CreateTable(name: "course_catalog", columns: table => new
        {
            id = table.Column<int>(type: "integer", nullable: false).Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            course_id = table.Column<string>(type: "text", nullable: false), department = table.Column<string>(type: "text", nullable: false),
            semester = table.Column<string>(type: "text", nullable: false), academic_year = table.Column<string>(type: "text", nullable: false),
            course_name = table.Column<string>(type: "text", nullable: false), theory_hours = table.Column<int>(type: "integer", nullable: false),
            lab_hours = table.Column<int>(type: "integer", nullable: false), tutorial_hours = table.Column<int>(type: "integer", nullable: false),
            teaching_units = table.Column<int>(type: "integer", nullable: false), ects = table.Column<int>(type: "integer", nullable: false),
            roles = table.Column<string>(type: "jsonb", nullable: false), toolboxes = table.Column<string>(type: "jsonb", nullable: false)
        }, constraints: table => table.PrimaryKey("PK_course_catalog", x => x.id));
        migrationBuilder.CreateIndex(name: "IX_course_catalog_identity", table: "course_catalog",
            columns: new[] { "course_id", "department", "semester", "academic_year" }, unique: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "course_catalog");
        migrationBuilder.DropColumn(name: "EnrolledCourseIds", table: "Users");
    }
}
