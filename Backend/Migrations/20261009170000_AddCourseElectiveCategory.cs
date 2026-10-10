using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MyIonio.Data;

#nullable disable
namespace MyIonio.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261009170000_AddCourseElectiveCategory")]
public partial class AddCourseElectiveCategory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "is_elective",
            table: "course_catalog",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "is_elective", table: "course_catalog");
    }
}
