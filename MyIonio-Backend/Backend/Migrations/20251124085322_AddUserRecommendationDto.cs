using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRecommendationDto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Answers",
                keyColumn: "Id",
                keyValue: 5,
                column: "Text",
                value: " When coding, I'm more 1=Theory/Elegant, 10=Practical/Ships");

            migrationBuilder.UpdateData(
                table: "Questions",
                keyColumn: "QuestionId",
                keyValue: 2,
                column: "Text",
                value: "📊 When coding, I'm more 1=Theory/Elegant, 10=Practical");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Answers",
                keyColumn: "Id",
                keyValue: 5,
                column: "Text",
                value: "Slider 1: When coding, I'm more (1=Theory/Elegant, 10=Practical/Ships)");

            migrationBuilder.UpdateData(
                table: "Questions",
                keyColumn: "QuestionId",
                keyValue: 2,
                column: "Text",
                value: "📊 Honest moment - where do you actually land?");
        }
    }
}
