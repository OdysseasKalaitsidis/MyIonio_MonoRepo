using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MyIonio.Data;

#nullable disable
namespace MyIonio.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261010120000_AddScheduleNaturalKey")]
public partial class AddScheduleNaturalKey : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DELETE FROM class_schedules older
            USING class_schedules newer
            WHERE older.id < newer.id
              AND older.department_id = newer.department_id
              AND older.semester_id = newer.semester_id
              AND older.academic_year = newer.academic_year
              AND older.period = newer.period;
            """);
        migrationBuilder.CreateIndex(
            name: "IX_class_schedules_natural_key",
            table: "class_schedules",
            columns: new[] { "department_id", "semester_id", "academic_year", "period" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_class_schedules_natural_key", table: "class_schedules");
    }
}
