using Microsoft.EntityFrameworkCore;
using MyIonio.Data;

namespace MyIonio.Tests;

public class OfficialClassScheduleCatalogTests
{
    private readonly IReadOnlyList<Models.Schedules> _schedules = OfficialClassScheduleCatalog.Load();

    [Fact]
    public void OfficialSchedules_ContainEveryActiveSemesterAndPublishedEntry()
    {
        Assert.Equal(new[] { 1, 3, 5, 7 }, _schedules.Select(item => item.SemesterId).Order());
        Assert.Equal(new[] { 18, 27, 27, 47 }, _schedules.OrderBy(item => item.SemesterId)
            .Select(item => item.courses.Count));
        Assert.All(_schedules, item =>
        {
            Assert.Equal("2026-2027", item.academic_year);
            Assert.Equal("Χειμερινό", item.period);
            Assert.NotEmpty(item.courses);
            Assert.All(item.courses, course =>
            {
                Assert.False(string.IsNullOrWhiteSpace(course.Day));
                Assert.False(string.IsNullOrWhiteSpace(course.CourseName));
                Assert.False(string.IsNullOrWhiteSpace(course.TimeStart));
                Assert.False(string.IsNullOrWhiteSpace(course.TimeEnd));
            });
        });
    }

    [Theory]
    [InlineData(1, 2)]
    [InlineData(3, 6)]
    [InlineData(5, 5)]
    [InlineData(7, 9)]
    public void Friday_HasThePublishedClasses(int semesterId, int expected)
    {
        var schedule = Assert.Single(_schedules, item => item.SemesterId == semesterId);
        Assert.Equal(expected, schedule.courses.Count(course => course.Day == "Παρασκευή"));
    }

    [Fact]
    public async Task SeedAsync_IsIdempotentAndEnrichesCourseIds()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"official-schedules-{Guid.NewGuid()}")
            .Options;
        await using var db = new AppDbContext(options);

        await OfficialCurriculumCatalog.SeedAsync(db);
        await OfficialClassScheduleCatalog.SeedAsync(db);
        await OfficialClassScheduleCatalog.SeedAsync(db);

        var schedules = await db.schedules.AsNoTracking().OrderBy(item => item.SemesterId).ToListAsync();
        Assert.Equal(4, schedules.Count);
        Assert.Equal(119, schedules.Sum(item => item.courses.Count));
        Assert.All(schedules.SelectMany(item => item.courses), course =>
            Assert.False(string.IsNullOrWhiteSpace(course.CourseId)));

        var seventh = Assert.Single(schedules, item => item.SemesterId == 7);
        var languageTechnology = Assert.Single(seventh.courses, course =>
            course.CourseName == "Γλωσσική Τεχνολογία" && course.Day == "Δευτέρα");
        Assert.Contains(languageTechnology.Roles, role =>
            role.Pathway == "BYN" && role.Audience == "MAJOR" && role.Requirement == "REQUIRED");

        var entertainmentTechnology = seventh.courses.Where(course =>
            course.CourseName == "Τεχνολογία Ψυχαγωγικού Λογισμικού").ToArray();
        Assert.NotEmpty(entertainmentTechnology);
        Assert.All(entertainmentTechnology, course => Assert.Contains(course.Roles, role =>
            role.Pathway == "PSMAD" && role.Audience == "MAJOR" && role.Requirement == "ELECTIVE"));
    }
}
