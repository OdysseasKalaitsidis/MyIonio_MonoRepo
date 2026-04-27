using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddedAnswerQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "AnswersQuestion",
                columns: new[] { "AnswerId", "QuestionId" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 2, 1 },
                    { 3, 1 },
                    { 4, 1 },
                    { 5, 2 },
                    { 6, 2 },
                    { 7, 3 },
                    { 8, 3 },
                    { 9, 3 },
                    { 10, 3 },
                    { 11, 3 },
                    { 12, 3 },
                    { 13, 4 },
                    { 14, 4 },
                    { 15, 4 },
                    { 16, 4 },
                    { 17, 5 },
                    { 18, 5 },
                    { 19, 5 },
                    { 20, 5 },
                    { 21, 6 },
                    { 22, 6 },
                    { 23, 6 },
                    { 24, 6 },
                    { 25, 7 },
                    { 26, 7 },
                    { 27, 7 },
                    { 28, 7 },
                    { 29, 8 },
                    { 30, 8 },
                    { 31, 8 },
                    { 32, 8 },
                    { 33, 8 },
                    { 34, 8 },
                    { 35, 9 },
                    { 36, 9 },
                    { 37, 9 },
                    { 38, 9 },
                    { 39, 10 },
                    { 40, 10 },
                    { 41, 10 },
                    { 42, 10 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 1, 1 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 2, 1 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 3, 1 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 4, 1 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 5, 2 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 6, 2 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 7, 3 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 8, 3 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 9, 3 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 10, 3 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 11, 3 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 12, 3 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 13, 4 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 14, 4 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 15, 4 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 16, 4 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 17, 5 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 18, 5 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 19, 5 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 20, 5 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 21, 6 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 22, 6 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 23, 6 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 24, 6 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 25, 7 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 26, 7 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 27, 7 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 28, 7 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 29, 8 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 30, 8 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 31, 8 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 32, 8 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 33, 8 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 34, 8 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 35, 9 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 36, 9 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 37, 9 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 38, 9 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 39, 10 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 40, 10 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 41, 10 });

            migrationBuilder.DeleteData(
                table: "AnswersQuestion",
                keyColumns: new[] { "AnswerId", "QuestionId" },
                keyValues: new object[] { 42, 10 });
        }
    }
}
