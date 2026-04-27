using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddMajorsAndToolboxesSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 6, 2 });

            migrationBuilder.DeleteData(
                table: "Answers",
                keyColumn: "Id",
                keyValue: 6);

            // Insert Majors if they don't exist
            migrationBuilder.Sql(@"
                INSERT INTO ""Majors"" (""Id"", ""Description"", ""Mweight"", ""Name"")
                VALUES 
                    (1, 'Bioinformatics and Computational Intelligence', 1, 'ΒΥΝ'),
                    (2, 'Cyber-security and Communication Networks', 1, 'ΚΔΕ'),
                    (3, 'Digital Transformation and Data Analytics', 1, 'ΨΜΑΔ')
                ON CONFLICT (""Id"") DO NOTHING;
            ");

            // Insert Toolboxes if they don't exist
            migrationBuilder.Sql(@"
                INSERT INTO ""Toolboxes"" (""Id"", ""Description"", ""Name"", ""TWeight"")
                VALUES 
                    (1, 'Theoretical Computer Science', 'TB1', 1),
                    (2, 'Interaction', 'TB2', 1),
                    (3, 'Pedagogy', 'TB3', 1),
                    (4, 'Software', 'TB4', 1),
                    (5, 'Humanistic Dimensions of Computer Science', 'TB5', 1)
                ON CONFLICT (""Id"") DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Majors",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Toolboxes",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.InsertData(
                table: "Answers",
                columns: new[] { "Id", "MajorPoints", "QuestionId", "RankingOptions", "SliderMax", "SliderMin", "Text", "ToolboxPoints", "Weight" },
                values: new object[] { 6, "{}", 2, null, 10, 1, "Slider 2: I get energy from (1=Solving puzzles alone, 10=Showing people cool stuff)", "{}", 1 });

            migrationBuilder.InsertData(
                table: "AnswersQuestion",
                columns: new[] { "AnswerId", "QuestionId" },
                values: new object[] { 6, 2 });
        }
    }
}
