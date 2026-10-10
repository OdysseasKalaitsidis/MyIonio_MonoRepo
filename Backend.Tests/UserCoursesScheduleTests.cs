using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Controllers;
using MyIonio.Data;
using MyIonio.Models;

namespace MyIonio.Tests;

public class UserCoursesScheduleTests
{
    [Fact]
    public async Task AuthenticatedSchedule_UnionsCurrentIdsWithLegacyNameFallback()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"user-schedule-mixed-{Guid.NewGuid()}")
            .Options;
        await using var db = new AppDbContext(options);
        await OfficialCurriculumCatalog.SeedAsync(db);
        await OfficialClassScheduleCatalog.SeedAsync(db);

        var language = await db.CourseCatalog.SingleAsync(course =>
            course.AcademicYear == "2026-2027" && course.CourseName == "Γλωσσική Τεχνολογία");
        var user = new User
        {
            Email = "mixed-schedule@example.com",
            PasswordHash = "unused",
            Department = "Department of Informatics",
            Semester = "Ζ",
            EnrolledCourseIds = new Dictionary<string, List<string>>
            {
                ["Ζ"] = new() { language.CourseId, "IU-INF-2025-2026-STALE-ID" }
            },
            EnrolledCourses = new Dictionary<string, List<string>>
            {
                ["Ζ"] = new() { "Γλωσσική Τεχνολογία", "Τεχνολογία Ψυχαγωγικού Λογισμικού" }
            }
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = Controller(db, user);
        var result = await controller.GetMySchedule(semesterId: 7, department: "Department of Informatics");

        var ok = Assert.IsType<OkObjectResult>(result);
        var courses = Assert.IsAssignableFrom<List<CourseEntry>>(ok.Value);
        Assert.Contains(courses, course => course.CourseName == "Γλωσσική Τεχνολογία");
        Assert.Contains(courses, course => course.CourseName == "Τεχνολογία Ψυχαγωγικού Λογισμικού");
    }

    [Fact]
    public async Task AuthenticatedSchedule_FallsBackToNamesWhenStoredIdsBelongToPreviousCatalog()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"user-schedule-{Guid.NewGuid()}")
            .Options;
        await using var db = new AppDbContext(options);
        await OfficialCurriculumCatalog.SeedAsync(db);
        await OfficialClassScheduleCatalog.SeedAsync(db);

        var user = new User
        {
            Email = "schedule@example.com",
            PasswordHash = "unused",
            Department = "Department of Informatics",
            Semester = "Ζ",
            EnrolledCourseIds = new Dictionary<string, List<string>>
            {
                ["Ζ"] = new() { "IU-INF-2025-2026-STALE-ID" }
            },
            EnrolledCourses = new Dictionary<string, List<string>>
            {
                ["Ζ"] = new() { "Γλωσσική Τεχνολογία" }
            }
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = Controller(db, user);

        var result = await controller.GetMySchedule(semesterId: 7, department: "Department of Informatics");

        var ok = Assert.IsType<OkObjectResult>(result);
        var courses = Assert.IsAssignableFrom<List<CourseEntry>>(ok.Value);
        Assert.NotEmpty(courses);
        Assert.All(courses, course => Assert.Equal("Γλωσσική Τεχνολογία", course.CourseName));
    }

    private static UserCoursesController Controller(AppDbContext db, User user) => new(db)
    {
        ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
                }, "test"))
            }
        }
    };
}
