using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyIonio.Helpers;
using MyIonio.Models;

namespace MyIonio.Data;

public static class OfficialCurriculumCatalog
{
    private const string ResourceSuffix = "Data.Static.course_mapping_all.json";
    private const string DefaultDepartment = "Department of Informatics";
    private const string DefaultAcademicYear = "2025-2026";

    public static IReadOnlyList<CourseCatalogEntry> Load()
    {
        var assembly = typeof(OfficialCurriculumCatalog).Assembly;
        var resourceName = assembly.GetManifestResourceNames()
            .Single(name => name.EndsWith(ResourceSuffix, StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded curriculum resource '{resourceName}' was not found.");
        return Parse(stream);
    }

    public static IReadOnlyList<CourseCatalogEntry> Parse(Stream stream)
    {
        using var document = JsonDocument.Parse(stream);
        var curriculum = document.RootElement.GetProperty("curriculum");
        var department = ReadString(curriculum, "department") ?? DefaultDepartment;
        var academicYear = ReadString(curriculum, "academic_year") ?? DefaultAcademicYear;
        var entries = new List<CourseCatalogEntry>();

        foreach (var semesterElement in curriculum.GetProperty("semesters").EnumerateArray())
        {
            var semesterCode = semesterElement.GetProperty("id").GetString() ?? string.Empty;
            var semesterId = CourseEligibility.SemesterId(semesterCode);
            if (semesterId is < 1 or > 8)
                throw new InvalidDataException($"Unknown semester code '{semesterCode}' in official curriculum.");

            foreach (var courseElement in semesterElement.GetProperty("courses").EnumerateArray())
            {
                var courseName = courseElement.GetProperty("title").GetString()?.Trim() ?? string.Empty;
                var course = new CourseCatalogEntry
                {
                    CourseId = BuildStableCourseId(academicYear, semesterId, courseName),
                    Department = department,
                    Semester = CourseEligibility.SemesterCode(semesterId),
                    SemesterId = semesterId,
                    AcademicYear = academicYear,
                    CourseName = courseName,
                    TheoryHours = ReadInt(courseElement, "theory_hours"),
                    LabHours = ReadInt(courseElement, "lab_hours"),
                    TutorialHours = ReadInt(courseElement, "tutorial_hours"),
                    TeachingUnits = ReadInt(courseElement, "teaching_units"),
                    Ects = ReadInt(courseElement, "ects", 5)
                };

                ApplyTags(course, courseElement.GetProperty("tag").GetString());
                entries.Add(course);
            }
        }

        return entries;
    }

    public static async Task SeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        var officialEntries = Load();
        var academicYear = officialEntries.First().AcademicYear;
        var department = officialEntries.First().Department;
        var existingRows = await db.CourseCatalog
            .Where(course => course.AcademicYear == academicYear && course.Department == department)
            .ToListAsync(cancellationToken);
        var officialIds = officialEntries.Select(course => course.CourseId).ToHashSet(StringComparer.Ordinal);
        var existing = existingRows
            .Where(course => officialIds.Contains(course.CourseId))
            .ToDictionary(course => course.CourseId, StringComparer.Ordinal);

        foreach (var official in officialEntries)
        {
            if (!existing.TryGetValue(official.CourseId, out var stored))
            {
                db.CourseCatalog.Add(official);
                continue;
            }

            stored.Semester = official.Semester;
            stored.SemesterId = official.SemesterId;
            stored.CourseName = official.CourseName;
            stored.TheoryHours = official.TheoryHours;
            stored.LabHours = official.LabHours;
            stored.TutorialHours = official.TutorialHours;
            stored.TeachingUnits = official.TeachingUnits;
            stored.Ects = official.Ects;
            stored.Roles = official.Roles;
            stored.Toolboxes = official.Toolboxes;
        }

        db.CourseCatalog.RemoveRange(existingRows.Where(course =>
            course.CourseId.StartsWith($"IU-INF-{academicYear}-", StringComparison.Ordinal)
            && !officialIds.Contains(course.CourseId)));

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string BuildStableCourseId(string academicYear, int semesterId, string courseName)
    {
        var input = Encoding.UTF8.GetBytes($"{semesterId}:{courseName}");
        var digest = Convert.ToHexString(SHA256.HashData(input))[..12];
        return $"IU-INF-{academicYear}-S{semesterId:00}-{digest}";
    }

    private static void ApplyTags(CourseCatalogEntry course, string? value)
    {
        foreach (var rawTag in (value ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var tag = rawTag.ToUpperInvariant();
            if (tag.Equals("COMPULSORY", StringComparison.Ordinal)) continue;
            if (tag.StartsWith("TB", StringComparison.Ordinal))
            {
                course.Toolboxes.Add(tag);
                continue;
            }

            var separator = tag.IndexOf('-');
            if (separator < 1 || separator == tag.Length - 1)
                throw new InvalidDataException($"Unknown curriculum tag '{rawTag}' for '{course.CourseName}'.");

            var category = tag[..separator];
            var pathway = CourseEligibility.NormalizePathway(tag[(separator + 1)..]);
            var role = category switch
            {
                "Y" or "Υ" => new CourseRole { Pathway = pathway, Audience = "MAJOR", Requirement = "REQUIRED" },
                "E" or "Ε" => new CourseRole { Pathway = pathway, Audience = "MAJOR", Requirement = "ELECTIVE" },
                "MIN" or "ΜΙΝ" => new CourseRole { Pathway = pathway, Audience = "MINOR", Requirement = "REQUIRED" },
                _ => throw new InvalidDataException($"Unknown curriculum tag '{rawTag}' for '{course.CourseName}'.")
            };
            course.Roles.Add(role);
        }
    }

    private static string? ReadString(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) ? value.GetString() : null;

    private static int ReadInt(JsonElement element, string property, int defaultValue = 0) =>
        element.TryGetProperty(property, out var value) && value.TryGetInt32(out var number) ? number : defaultValue;
}
