using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace IonioPortal.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Majors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Mweight = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Majors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Questions",
                columns: table => new
                {
                    QuestionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Text = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Index = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<int>(type: "integer", nullable: false),
                    MajorPoints = table.Column<string>(type: "text", nullable: false),
                    ToolboxPoints = table.Column<string>(type: "text", nullable: false),
                    SliderMin = table.Column<int>(type: "integer", nullable: true),
                    SliderMax = table.Column<int>(type: "integer", nullable: true),
                    RankingOptions = table.Column<List<int>>(type: "integer[]", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.QuestionId);
                });

            migrationBuilder.CreateTable(
                name: "ScoringRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScoringRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Toolboxes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    TWeight = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Toolboxes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Semester = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HasCompletedTest = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Answers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    Weight = table.Column<int>(type: "integer", nullable: false),
                    MajorPoints = table.Column<string>(type: "text", nullable: false),
                    ToolboxPoints = table.Column<string>(type: "text", nullable: false),
                    SliderMin = table.Column<int>(type: "integer", nullable: true),
                    SliderMax = table.Column<int>(type: "integer", nullable: true),
                    RankingOptions = table.Column<List<int>>(type: "integer[]", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Answers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Answers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionForMajor",
                columns: table => new
                {
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    MajorId = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionForMajor", x => new { x.QuestionId, x.MajorId });
                    table.ForeignKey(
                        name: "FK_QuestionForMajor_Majors_MajorId",
                        column: x => x.MajorId,
                        principalTable: "Majors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionForMajor_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuestionForToolbox",
                columns: table => new
                {
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    ToolboxId = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionForToolbox", x => new { x.QuestionId, x.ToolboxId });
                    table.ForeignKey(
                        name: "FK_QuestionForToolbox_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionForToolbox_Toolboxes_ToolboxId",
                        column: x => x.ToolboxId,
                        principalTable: "Toolboxes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Expires = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRecommendation",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PrimaryMajor = table.Column<string>(type: "text", nullable: false),
                    SecondaryMajor = table.Column<string>(type: "text", nullable: false),
                    PrimaryToolbox = table.Column<string>(type: "text", nullable: false),
                    SecondaryToolbox = table.Column<string>(type: "text", nullable: false),
                    ConfidenceLevel = table.Column<string>(type: "text", nullable: false),
                    ProfileType = table.Column<string>(type: "text", nullable: false),
                    ReasoningJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRecommendation", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRecommendation_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AnswersQuestion",
                columns: table => new
                {
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    AnswerId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnswersQuestion", x => new { x.QuestionId, x.AnswerId });
                    table.ForeignKey(
                        name: "FK_AnswersQuestion_Answers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "Answers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnswersQuestion_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserRecommendationId = table.Column<int>(type: "integer", nullable: false),
                    QuestionId = table.Column<int>(type: "integer", nullable: false),
                    AnswerId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAnswers_UserRecommendation_UserRecommendationId",
                        column: x => x.UserRecommendationId,
                        principalTable: "UserRecommendation",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Questions",
                columns: new[] { "QuestionId", "Index", "MajorPoints", "RankingOptions", "SliderMax", "SliderMin", "Text", "ToolboxPoints", "Type", "Weight" },
                values: new object[,]
                {
                    { 1, 1, "{}", null, null, null, "🎮 Saturday night, laptop open. What are you actually doing?", "{}", "single", 1 },
                    { 2, 2, "{}", null, null, null, "📊 Honest moment - where do you actually land?", "{}", "slider", 1 },
                    { 3, 3, "{}", null, null, null, "🔥 You're doom-scrolling at 2am. What makes you stop and actually click?", "{}", "multiple", 1 },
                    { 4, 4, "{}", null, null, null, "💭 Real talk - which thought do you have most often?", "{}", "single", 1 },
                    { 5, 5, "{}", null, null, null, "🎯 Your laptop can only run ONE thing for a month. Choose wisely:", "{}", "single", 1 },
                    { 6, 6, "{}", null, null, null, "🎪 Group project time. Which role do you secretly hope to avoid?", "{}", "single", 1 },
                    { 7, 7, "{}", null, null, null, "🎬 Five years from now, which headline makes you feel something?", "{}", "single", 1 },
                    { 8, 8, "{}", null, null, null, "🔮 You get a magic 4-hour block where you're guaranteed to learn anything. What do you pick?", "{}", "rank", 1 },
                    { 9, 9, "{}", null, null, null, "💬 Your friend asks \"what are you working on?\" - what's your honest answer?", "{}", "single", 1 },
                    { 10, 10, "{}", null, null, null, "🎯 Real scenario: You just discovered a bug. What's your first actual thought?", "{}", "single", 1 }
                });

            migrationBuilder.InsertData(
                table: "Answers",
                columns: new[] { "Id", "MajorPoints", "QuestionId", "RankingOptions", "SliderMax", "SliderMin", "Text", "ToolboxPoints", "Weight" },
                values: new object[,]
                {
                    { 1, "{\"\\u0392\\u03A5\\u039D\":4,\"\\u039A\\u0394\\u0395\":1}", 1, null, null, null, "Training an AI on some weird dataset to see what happens", "{}", 1 },
                    { 2, "{\"\\u039A\\u0394\\u0395\":1,\"\\u03A8\\u039C\\u0391\\u0394\":4}", 1, null, null, null, "Building that app idea that's been living rent-free in your head", "{\"TB4\":3}", 1 },
                    { 3, "{\"\\u039A\\u0394\\u0395\":4}", 1, null, null, null, "Setting up a home security lab or trying to crack your own system", "{\"TB5\":2}", 1 },
                    { 4, "{\"\\u0392\\u03A5\\u039D\":2,\"\\u03A8\\u039C\\u0391\\u0394\":3}", 1, null, null, null, "Making something visual/interactive that makes people go \"wait, how'd you do that?\"", "{\"TB2\":3}", 1 },
                    { 5, "{}", 2, null, 10, 1, "Slider 1: When coding, I'm more (1=Theory/Elegant, 10=Practical/Ships)", "{}", 1 },
                    { 6, "{}", 2, null, 10, 1, "Slider 2: I get energy from (1=Solving puzzles alone, 10=Showing people cool stuff)", "{}", 1 },
                    { 7, "{\"\\u0392\\u03A5\\u039D\":3}", 3, null, null, null, "🤖 \"AI just discovered something doctors missed for 50 years\"", "{}", 1 },
                    { 8, "{\"\\u03A8\\u039C\\u0391\\u0394\":3}", 3, null, null, null, "💰 \"College dropout's app just hit $10M revenue\"", "{}", 1 },
                    { 9, "{\"\\u039A\\u0394\\u0395\":3}", 3, null, null, null, "🔓 \"How hackers stole $600M in cryptocurrency\"", "{\"TB5\":3}", 1 },
                    { 10, "{\"\\u0392\\u03A5\\u039D\":2,\"\\u03A8\\u039C\\u0391\\u0394\":1}", 3, null, null, null, "🎨 \"The insane tech behind that movie scene\"", "{\"TB2\":3}", 1 },
                    { 11, "{\"\\u0392\\u03A5\\u039D\":3,\"\\u039A\\u0394\\u0395\":1}", 3, null, null, null, "🧮 \"The beautiful math that makes the internet work\"", "{\"TB1\":3}", 1 },
                    { 12, "{\"\\u03A8\\u039C\\u0391\\u0394\":2}", 3, null, null, null, "📚 \"Why students can't learn [subject] and how to fix it\"", "{\"TB3\":4}", 1 },
                    { 13, "{\"\\u0392\\u03A5\\u039D\":4}", 4, null, null, null, "\"I wonder if I could predict/model/analyze this...\"", "{}", 1 },
                    { 14, "{\"\\u03A8\\u039C\\u0391\\u0394\":4}", 4, null, null, null, "\"I could build something that solves this problem\"", "{}", 1 },
                    { 15, "{\"\\u039A\\u0394\\u0395\":4}", 4, null, null, null, "\"That's definitely a security risk waiting to happen\"", "{}", 1 },
                    { 16, "{\"\\u03A8\\u039C\\u0391\\u0394\":3,\"\\u0392\\u03A5\\u039D\":1}", 4, null, null, null, "\"Why is this so hard to use? I could make this better\"", "{}", 1 },
                    { 17, "{\"\\u0392\\u03A5\\u039D\":4}", 5, null, null, null, "🔬 Jupyter Notebook + unlimited datasets", "{\"TB1\":2}", 1 },
                    { 18, "{\"\\u03A8\\u039C\\u0391\\u0394\":4}", 5, null, null, null, "☁️ Full cloud deployment setup + API access", "{\"TB4\":4}", 1 },
                    { 19, "{\"\\u039A\\u0394\\u0395\":4}", 5, null, null, null, "🛡️ Kali Linux + all the hacking tools (ethical, obviously)", "{\"TB5\":4}", 1 },
                    { 20, "{\"\\u03A8\\u039C\\u0391\\u0394\":3,\"\\u0392\\u03A5\\u039D\":1}", 5, null, null, null, "🎮 Unity/Unreal Engine OR your favorite creative suite", "{\"TB2\":3}", 1 },
                    { 21, "{\"\\u0392\\u03A5\\u039D\":3}", 6, null, null, null, "The 'make it look pretty' person", "{\"TB2\":2}", 1 },
                    { 22, "{\"\\u03A8\\u039C\\u0391\\u0394\":3}", 6, null, null, null, "The pure researcher", "{\"TB1\":2}", 1 },
                    { 23, "{\"\\u039A\\u0394\\u0395\":3}", 6, null, null, null, "The 'move fast break things' person", "{\"TB5\":2}", 1 },
                    { 24, "{\"\\u03A8\\u039C\\u0391\\u0394\":2,\"\\u0392\\u03A5\\u039D\":1}", 6, null, null, null, "The backend-only person", "{\"TB4\":1}", 1 },
                    { 25, "{\"\\u0392\\u03A5\\u039D\":4}", 7, null, null, null, "🧬 Researcher's Algorithm Breakthrough Advances Medicine", "{}", 1 },
                    { 26, "{\"\\u03A8\\u039C\\u0391\\u0394\":4}", 7, null, null, null, "📈 Startup's Platform Now Serves 10M Users Daily", "{}", 1 },
                    { 27, "{\"\\u039A\\u0394\\u0395\":4}", 7, null, null, null, "🛡️ Security Expert Prevents Billion-Dollar Data Breach", "{}", 1 },
                    { 28, "{\"\\u03A8\\u039C\\u0391\\u0394\":3,\"\\u0392\\u03A5\\u039D\":1}", 7, null, null, null, "🌟 Creator's Work Changes How 100k People Learn/Play", "{\"TB2\":2}", 1 },
                    { 29, "{\"\\u0392\\u03A5\\u039D\":4}", 8, null, null, null, "🧠 How to make AI actually intelligent", "{}", 1 },
                    { 30, "{\"\\u03A8\\u039C\\u0391\\u0394\":3}", 8, null, null, null, "🚀 How to build systems that don't crash", "{\"TB4\":3}", 1 },
                    { 31, "{\"\\u039A\\u0394\\u0395\":4}", 8, null, null, null, "🔐 How hackers think and how to stop them", "{\"TB5\":4}", 1 },
                    { 32, "{\"\\u03A8\\u039C\\u0391\\u0394\":3,\"\\u0392\\u03A5\\u039D\":1}", 8, null, null, null, "🎨 How to make interfaces that feel magical", "{\"TB2\":4}", 1 },
                    { 33, "{\"\\u0392\\u03A5\\u039D\":4}", 8, null, null, null, "🧮 The deep theory that makes everything else possible", "{}", 1 },
                    { 34, "{\"\\u03A8\\u039C\\u0391\\u0394\":2}", 8, null, null, null, "👨‍🏫 How to explain complex stuff so anyone can get it", "{\"TB3\":3}", 1 },
                    { 35, "{\"\\u0392\\u03A5\\u039D\":4}", 9, null, null, null, "Launches into the technical details of the algorithm/problem", "{}", 1 },
                    { 36, "{\"\\u03A8\\u039C\\u0391\\u0394\":4}", 9, null, null, null, "\"Something that could actually be useful for [specific people]\"", "{}", 1 },
                    { 37, "{\"\\u039A\\u0394\\u0395\":4}", 9, null, null, null, "\"Trying to break/secure this system\" shows security logs", "{\"TB5\":3}", 1 },
                    { 38, "{\"\\u03A8\\u039C\\u0391\\u0394\":3,\"\\u0392\\u03A5\\u039D\":1}", 9, null, null, null, "Just shows them the demo/interface \"Check this out!\"", "{\"TB2\":4}", 1 },
                    { 39, "{\"\\u0392\\u03A5\\u039D\":4}", 10, null, null, null, "\"Wait... why is it doing THAT? This is actually interesting\"", "{}", 1 },
                    { 40, "{\"\\u03A8\\u039C\\u0391\\u0394\":4}", 10, null, null, null, "\"Ugh, this delays the launch timeline\"", "{\"TB4\":3}", 1 },
                    { 41, "{\"\\u039A\\u0394\\u0395\":4}", 10, null, null, null, "\"Could someone exploit this? Let me check...\"", "{\"TB5\":3}", 1 },
                    { 42, "{\"\\u03A8\\u039C\\u0391\\u0394\":3,\"\\u0392\\u03A5\\u039D\":1}", 10, null, null, null, "\"How do I explain this to users without causing panic?\"", "{\"TB2\":4}", 1 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QuestionId",
                table: "Answers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_AnswersQuestion_AnswerId",
                table: "AnswersQuestion",
                column: "AnswerId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionForMajor_MajorId",
                table: "QuestionForMajor",
                column: "MajorId");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionForToolbox_ToolboxId",
                table: "QuestionForToolbox",
                column: "ToolboxId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UserId",
                table: "RefreshTokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAnswers_UserRecommendationId",
                table: "UserAnswers",
                column: "UserRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendation_UserId",
                table: "UserRecommendation",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnswersQuestion");

            migrationBuilder.DropTable(
                name: "QuestionForMajor");

            migrationBuilder.DropTable(
                name: "QuestionForToolbox");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "ScoringRules");

            migrationBuilder.DropTable(
                name: "UserAnswers");

            migrationBuilder.DropTable(
                name: "Answers");

            migrationBuilder.DropTable(
                name: "Majors");

            migrationBuilder.DropTable(
                name: "Toolboxes");

            migrationBuilder.DropTable(
                name: "UserRecommendation");

            migrationBuilder.DropTable(
                name: "Questions");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
