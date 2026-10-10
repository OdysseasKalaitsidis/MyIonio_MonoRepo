using Microsoft.EntityFrameworkCore;
using MyIonio.Data;
using MyIonio.Models;

namespace MyIonio.Tests;

public class OfficialCurriculumCatalogTests
{
    private readonly IReadOnlyList<Models.CourseCatalogEntry> _courses = OfficialCurriculumCatalog.Load();

    [Fact]
    public async Task SeedAsync_IsIdempotentAndRemovesStaleOfficialRows()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"official-curriculum-{Guid.NewGuid()}")
            .Options;
        await using var db = new AppDbContext(options);
        db.CourseCatalog.Add(new CourseCatalogEntry
        {
            CourseId = "IU-INF-2026-2027-STALE",
            Department = "Department of Informatics",
            Semester = "Ζ",
            SemesterId = 7,
            AcademicYear = "2026-2027",
            CourseName = "Stale official course"
        });
        await db.SaveChangesAsync();

        await OfficialCurriculumCatalog.SeedAsync(db);
        await OfficialCurriculumCatalog.SeedAsync(db);

        var stored = await db.CourseCatalog.AsNoTracking().ToListAsync();
        Assert.Equal(89, stored.Count);
        Assert.Equal(89, stored.Select(course => course.CourseId).Distinct().Count());
        Assert.DoesNotContain(stored, course => course.CourseName == "Stale official course");
    }

    [Fact]
    public void OfficialProgramme_ContainsEverySemesterAndPublishedCourse()
    {
        Assert.Equal(89, _courses.Count);
        Assert.Equal(Enumerable.Range(1, 8), _courses.Select(course => course.SemesterId).Distinct().Order());
        Assert.All(_courses, course => Assert.Equal("2026-2027", course.AcademicYear));
        Assert.All(_courses, course => Assert.Equal("Department of Informatics", course.Department));
    }

    [Fact]
    public void NewGenericElectives_AreCategorizedAsElective()
    {
        var thirdSemester = Assert.Single(_courses, course =>
            course.CourseName == "Βασικές Έννοιες και Εφαρμογές Τεχνητής Νοημοσύνης");
        var fourthSemester = Assert.Single(_courses, course =>
            course.CourseName == "Τεχνητή Νοημοσύνη: Ηθική, Κίνδυνοι και Βέλτιστες Πρακτικές");

        Assert.True(thirdSemester.IsElective);
        Assert.True(fourthSemester.IsElective);
        Assert.Empty(thirdSemester.Toolboxes);
        Assert.Empty(fourthSemester.Toolboxes);
    }

    [Fact]
    public void SeventhSemester_ExposesAllOfficialPathways()
    {
        var pathways = _courses.Where(course => course.SemesterId == 7)
            .SelectMany(course => course.Roles)
            .Select(role => role.Pathway)
            .Distinct()
            .Order()
            .ToArray();

        Assert.Equal(new[] { "BYN", "KDE", "PSMAD" }, pathways);
    }

    [Fact]
    public void OfficialMajorMinorAndElectiveTags_AreMappedToRoles()
    {
        var required = Assert.Single(_courses, course => course.CourseName == "Προσομοίωση και Μοντελοποίηση");
        Assert.Contains(required.Roles, role => role.Pathway == "BYN" && role.Audience == "MAJOR" && role.Requirement == "REQUIRED");
        Assert.Contains(required.Roles, role => role.Pathway == "BYN" && role.Audience == "MINOR" && role.Requirement == "REQUIRED");

        var elective = Assert.Single(_courses, course => course.CourseName == "Ανάπτυξη Κινητών Εφαρμογών");
        Assert.Contains(elective.Roles, role => role.Pathway == "PSMAD" && role.Audience == "MAJOR" && role.Requirement == "ELECTIVE");
    }

    [Fact]
    public void OfficialToolboxTags_AreMappedToAllFiveToolboxes()
    {
        var toolboxes = _courses.SelectMany(course => course.Toolboxes).Distinct().Order().ToArray();
        Assert.Equal(new[] { "TB1", "TB2", "TB3", "TB4", "TB5" }, toolboxes);
    }

    [Fact]
    public void Thesis_IsRequiredAndWorthSixEcts()
    {
        var theses = _courses.Where(course => course.CourseName == "Πτυχιακή Εργασία").ToArray();
        Assert.Equal(2, theses.Length);
        Assert.All(theses, course =>
        {
            Assert.Equal(6, course.Ects);
            Assert.Empty(course.Roles);
            Assert.Empty(course.Toolboxes);
        });
    }
}
