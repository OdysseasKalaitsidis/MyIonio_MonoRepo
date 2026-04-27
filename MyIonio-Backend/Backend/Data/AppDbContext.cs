using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using IonioPortal.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace IonioPortal.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<Majors> Majors { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<AnswerQuestion> AnswersQuestion { get; set; }
        public DbSet<UserAnswer> UserAnswers { get; set; }
        public DbSet<Toolboxes> Toolboxes { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<UserRecommendation> UserRecommendation { get; set; }
        public DbSet<ScoringRules> ScoringRules { get; set; }
        public DbSet<Schedules> schedules { get; set; }
        public DbSet<weekly_menus> weekly_menus { get; set; }
        public DbSet<ExaminationSchedule> ExaminationSchedules { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Composite keys
            modelBuilder.Entity<QuestionForMajor>().HasKey(qm => new { qm.QuestionId, qm.MajorId });
            modelBuilder.Entity<QuestionForToolbox>().HasKey(qt => new { qt.QuestionId, qt.ToolboxId });
            modelBuilder.Entity<AnswerQuestion>().HasKey(aq => new { aq.QuestionId, aq.AnswerId });

            modelBuilder.Entity<UserAnswer>()
                .HasOne(ua => ua.UserRecommendation)
                .WithMany(ur => ur.UserAnswers)
                .HasForeignKey(ua => ua.UserRecommendationId);

            // Dictionary<string,int> <-> JSON conversion & comparison
            var dictionaryConverter = new ValueConverter<Dictionary<string, int>, string>(
                dict => JsonSerializer.Serialize(dict, (JsonSerializerOptions?)null),
                json => JsonSerializer.Deserialize<Dictionary<string, int>>(json, (JsonSerializerOptions?)null) ?? new Dictionary<string, int>()
            );


            // Apply conversion for Question
            modelBuilder.Entity<Question>().Property(q => q.MajorPoints)
                .HasConversion(dictionaryConverter);

            modelBuilder.Entity<Question>().Property(q => q.ToolboxPoints)
                .HasConversion(dictionaryConverter);

            // Apply conversion for Answer
            modelBuilder.Entity<Answer>().Property(a => a.MajorPoints)
                .HasConversion(dictionaryConverter);

            modelBuilder.Entity<Answer>().Property(a => a.ToolboxPoints)
                .HasConversion(dictionaryConverter);

            // Relationships
            modelBuilder.Entity<AnswerQuestion>()
                .HasOne(aq => aq.Question)
                .WithMany(q => q.AnswerQuestions)
                .HasForeignKey(aq => aq.QuestionId);

            modelBuilder.Entity<AnswerQuestion>()
                .HasOne(aq => aq.Answer)
                .WithMany(a => a.AnswerQuestions)
                .HasForeignKey(aq => aq.AnswerId);

            modelBuilder.Entity<weekly_menus>()
                .Property(w => w.days)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<DailyMenu>(), (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<DailyMenu>>(v, (JsonSerializerOptions?)null) ?? new List<DailyMenu>()
                );

            modelBuilder.Ignore<DailyMenu>();

            // Ensure week_start & week_end are timestamptz
            modelBuilder.Entity<weekly_menus>()
                .Property(w => w.week_start)
                .HasColumnType("timestamptz");

            modelBuilder.Entity<weekly_menus>()
                .Property(w => w.week_end)
                .HasColumnType("timestamptz");

            // ExaminationSchedule configuration
            // Create JsonSerializerOptions that respect [JsonPropertyName] attributes
            var examJsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                WriteIndented = false
            };
            
            modelBuilder.Entity<ExaminationSchedule>()
                .ToTable("exam_schedules"); // Map to the correct table name
            
            modelBuilder.Entity<ExaminationSchedule>()
                .Property(e => e.Id)
                .HasColumnName("id");
            
            modelBuilder.Entity<ExaminationSchedule>()
                .Property(e => e.Department)
                .HasColumnName("department");
            
            modelBuilder.Entity<ExaminationSchedule>()
                .Property(e => e.Semester)
                .HasColumnName("semester");
            
            modelBuilder.Entity<ExaminationSchedule>()
                .Property(e => e.Period)
                .HasColumnName("period");
            
            modelBuilder.Entity<ExaminationSchedule>()
                .Property(e => e.Exams)
                .HasColumnName("exams")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<ExamItem>(), examJsonOptions),
                    v => JsonSerializer.Deserialize<List<ExamItem>>(v, examJsonOptions) ?? new List<ExamItem>()
                );
        


            modelBuilder.Entity<Schedules>()
                .ToTable("class_schedules");

            modelBuilder.Entity<Schedules>()
                .Property(s => s.id)
                .HasColumnName("id");

            modelBuilder.Entity<Schedules>()
                .Property(s => s.created_at)
                .HasColumnName("created_at")
                .HasColumnType("timestamptz");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.department)
                 .HasColumnName("department");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.semester)
                 .HasColumnName("semester");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.academic_year)
                 .HasColumnName("academic_year");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.period)
                 .HasColumnName("period");

            modelBuilder.Entity<Schedules>()
                .Property(s => s.courses)
                .HasColumnName("courses")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<CourseEntry>(), examJsonOptions),
                    v => JsonSerializer.Deserialize<List<CourseEntry>>(v, examJsonOptions) ?? new List<CourseEntry>()
                );
        
            // Configure User.EnrolledCourses as jsonb
            modelBuilder.Entity<User>()
                .Property(u => u.EnrolledCourses)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, List<string>>(), examJsonOptions),
                    v => JsonSerializer.Deserialize<Dictionary<string, List<string>>>(v, examJsonOptions) ?? new Dictionary<string, List<string>>()
                );

        // Seed data (make sure you implement this extension method)
        modelBuilder.Seed();
        }
    }
}
