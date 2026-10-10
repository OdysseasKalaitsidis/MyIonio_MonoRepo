using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using MyIonio.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace MyIonio.Data
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
        public DbSet<CourseReview> CourseReviews { get; set; }
        public DbSet<CourseCatalogEntry> CourseCatalog { get; set; }
        public DbSet<SemesterDefinition> Semesters { get; set; }

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

            // Shared JSON configuration
            // Create JsonSerializerOptions that respect [JsonPropertyName] attributes
            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                WriteIndented = false
            };

            modelBuilder.Entity<SemesterDefinition>().ToTable("semesters");
            modelBuilder.Entity<SemesterDefinition>().Property(s => s.Id).HasColumnName("id");
            modelBuilder.Entity<SemesterDefinition>().Property(s => s.Code).HasColumnName("code");
            modelBuilder.Entity<SemesterDefinition>().HasIndex(s => s.Code).IsUnique();
            modelBuilder.Entity<SemesterDefinition>().HasData(
                new SemesterDefinition { Id = 1, Code = "Α" },
                new SemesterDefinition { Id = 2, Code = "Β" },
                new SemesterDefinition { Id = 3, Code = "Γ" },
                new SemesterDefinition { Id = 4, Code = "Δ" },
                new SemesterDefinition { Id = 5, Code = "Ε" },
                new SemesterDefinition { Id = 6, Code = "ΣΤ" },
                new SemesterDefinition { Id = 7, Code = "Ζ" },
                new SemesterDefinition { Id = 8, Code = "Η" });

            modelBuilder.Entity<ExaminationSchedule>()
                .ToTable("exam_schedules");

            modelBuilder.Entity<ExaminationSchedule>().Property(e => e.Id).HasColumnName("id");
            modelBuilder.Entity<ExaminationSchedule>().Property(e => e.Department).HasColumnName("department");
            modelBuilder.Entity<ExaminationSchedule>().Property(e => e.DepartmentId).HasColumnName("department_id");
            modelBuilder.Entity<ExaminationSchedule>().Property(e => e.Semester).HasColumnName("semester");
            modelBuilder.Entity<ExaminationSchedule>().Property(e => e.SemesterId).HasColumnName("semester_id");
            modelBuilder.Entity<ExaminationSchedule>().Property(e => e.Period).HasColumnName("period");
            modelBuilder.Entity<ExaminationSchedule>()
                .Property(e => e.Exams)
                .HasColumnName("exams")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<ExamItem>(), jsonOptions),
                    v => JsonSerializer.Deserialize<List<ExamItem>>(v, jsonOptions) ?? new List<ExamItem>()
                );

            modelBuilder.Entity<CourseCatalogEntry>().ToTable("course_catalog");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.Id).HasColumnName("id");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.CourseId).HasColumnName("course_id");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.Department).HasColumnName("department");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.Semester).HasColumnName("semester");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.SemesterId).HasColumnName("semester_id");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.AcademicYear).HasColumnName("academic_year");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.CourseName).HasColumnName("course_name");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.TheoryHours).HasColumnName("theory_hours");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.LabHours).HasColumnName("lab_hours");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.TutorialHours).HasColumnName("tutorial_hours");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.TeachingUnits).HasColumnName("teaching_units");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.Ects).HasColumnName("ects");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.IsElective).HasColumnName("is_elective");
            modelBuilder.Entity<CourseCatalogEntry>().HasIndex(c => new { c.CourseId, c.Department, c.Semester, c.AcademicYear }).IsUnique().HasDatabaseName("IX_course_catalog_identity");
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.Roles).HasColumnName("roles").HasColumnType("jsonb").HasConversion(
                v => JsonSerializer.Serialize(v ?? new List<CourseRole>(), jsonOptions),
                v => JsonSerializer.Deserialize<List<CourseRole>>(v, jsonOptions) ?? new List<CourseRole>());
            modelBuilder.Entity<CourseCatalogEntry>().Property(c => c.Toolboxes).HasColumnName("toolboxes").HasColumnType("jsonb").HasConversion(
                v => JsonSerializer.Serialize(v ?? new List<string>(), jsonOptions),
                v => JsonSerializer.Deserialize<List<string>>(v, jsonOptions) ?? new List<string>());
            modelBuilder.Ignore<CourseRole>();

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
                 .Property(s => s.DepartmentId)
                 .HasColumnName("department_id");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.semester)
                 .HasColumnName("semester");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.SemesterId)
                 .HasColumnName("semester_id");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.academic_year)
                 .HasColumnName("academic_year");

            modelBuilder.Entity<Schedules>()
                 .Property(s => s.period)
                 .HasColumnName("period");

            modelBuilder.Entity<Schedules>()
                .HasIndex(s => new { s.DepartmentId, s.SemesterId, s.academic_year, s.period })
                .IsUnique()
                .HasDatabaseName("IX_class_schedules_natural_key");

            modelBuilder.Entity<Schedules>()
                .Property(s => s.courses)
                .HasColumnName("courses")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new List<CourseEntry>(), jsonOptions),
                    v => JsonSerializer.Deserialize<List<CourseEntry>>(v, jsonOptions) ?? new List<CourseEntry>()
                );
        
            // Configure User.EnrolledCourses as jsonb
            modelBuilder.Entity<User>()
                .Property(u => u.EnrolledCourses)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v ?? new Dictionary<string, List<string>>(), jsonOptions),
                    v => JsonSerializer.Deserialize<Dictionary<string, List<string>>>(v, jsonOptions) ?? new Dictionary<string, List<string>>()
                );


            modelBuilder.Entity<User>().Property(u => u.EnrolledCourseIds).HasColumnType("jsonb").HasConversion(
                v => JsonSerializer.Serialize(v ?? new Dictionary<string, List<string>>(), jsonOptions),
                v => JsonSerializer.Deserialize<Dictionary<string, List<string>>>(v, jsonOptions) ?? new Dictionary<string, List<string>>());

            // Seed data
            modelBuilder.Seed();
        }
    }
}
