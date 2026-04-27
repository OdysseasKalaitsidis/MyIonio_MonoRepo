using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddedDepUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"Department\" text NOT NULL DEFAULT '';");

            migrationBuilder.Sql("DROP TABLE IF EXISTS \"schedules\";");
            migrationBuilder.CreateTable(
                name: "schedules",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    department = table.Column<string>(type: "text", nullable: false),
                    semester = table.Column<string>(type: "text", nullable: false),
                    courses = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedules", x => x.id);
                });

            migrationBuilder.Sql("DROP TABLE IF EXISTS \"weekly_menus\";");
            migrationBuilder.CreateTable(
                name: "weekly_menus",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    week_start = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    week_end = table.Column<DateTime>(type: "timestamptz", nullable: false),
                    days = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_weekly_menus", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "schedules");

            migrationBuilder.DropTable(
                name: "weekly_menus");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "Users");
        }
    }
}
