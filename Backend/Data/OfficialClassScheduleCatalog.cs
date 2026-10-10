using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyIonio.Helpers;
using MyIonio.Models;

namespace MyIonio.Data;

public static class OfficialClassScheduleCatalog
{
    private const string ResourceSuffix = "Data.Static.official_class_schedules_2026_2027.json";
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static IReadOnlyList<Schedules> Load()
    {
        var assembly = typeof(OfficialClassScheduleCatalog).Assembly;
        var resourceName = assembly.GetManifestResourceNames()
            .Single(name => name.EndsWith(ResourceSuffix, StringComparison.Ordinal));
        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded schedule resource '{resourceName}' was not found.");
        return Parse(stream);
    }

    public static IReadOnlyList<Schedules> Parse(Stream stream)
    {
        using var document = JsonDocument.Parse(stream);
        var root = document.RootElement;
        var department = root.GetProperty("department").GetString() ?? string.Empty;
        var departmentId = root.GetProperty("department_id").GetInt32();
        var academicYear = root.GetProperty("academic_year").GetString() ?? string.Empty;
        var period = root.GetProperty("period").GetString() ?? string.Empty;
        var schedules = new List<Schedules>();

        foreach (var item in root.GetProperty("schedules").EnumerateArray())
        {
            var semester = item.GetProperty("semester").GetString() ?? string.Empty;
            var semesterId = item.GetProperty("semester_id").GetInt32();
            var courses = JsonSerializer.Deserialize<List<CourseEntry>>(
                item.GetProperty("courses").GetRawText(), JsonOptions) ?? new List<CourseEntry>();
            schedules.Add(new Schedules
            {
                department = department,
                DepartmentId = departmentId,
                semester = semester,
                SemesterId = semesterId,
                academic_year = academicYear,
                period = period,
                courses = courses
            });
        }

        return schedules;
    }

    public static async Task SeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        if (!db.Database.IsRelational())
        {
            await SeedCoreAsync(db, cancellationToken);
            return;
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await db.Database.ExecuteSqlRawAsync(
            "SELECT pg_advisory_xact_lock(20261010120000)", cancellationToken);
        await SeedCoreAsync(db, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private static async Task SeedCoreAsync(AppDbContext db, CancellationToken cancellationToken)
    {
        var schedules = Load();
        var catalog = await db.CourseCatalog.AsNoTracking().ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;

        foreach (var schedule in schedules)
        {
            Enrich(schedule, catalog);
            var matches = await db.schedules.Where(row =>
                row.DepartmentId == schedule.DepartmentId &&
                row.SemesterId == schedule.SemesterId &&
                row.academic_year == schedule.academic_year &&
                row.period == schedule.period).ToListAsync(cancellationToken);
            var stored = matches.OrderByDescending(row => row.id).FirstOrDefault();
            if (stored == null)
            {
                schedule.created_at = now;
                db.schedules.Add(schedule);
            }
            else
            {
                stored.department = schedule.department;
                stored.semester = schedule.semester;
                stored.courses = schedule.courses;
                stored.created_at = now;
                db.schedules.RemoveRange(matches.Where(row => row.id != stored.id));
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static void Enrich(Schedules schedule, IReadOnlyList<CourseCatalogEntry> catalog)
    {
        var byName = catalog
            .Where(course => course.SemesterId == schedule.SemesterId)
            .GroupBy(course => CourseNameKey(course.CourseName))
            .ToDictionary(group => group.Key, group => group.MaxBy(course => CourseEligibility.AcademicYearStart(course.AcademicYear))!);

        foreach (var course in schedule.courses)
        {
            byName.TryGetValue(CourseNameKey(course.CourseName), out var metadata);
            course.CourseId = metadata?.CourseId ?? BuildStableCourseId(
                schedule.academic_year, schedule.SemesterId, course.CourseName);
            course.Roles = metadata?.Roles.Select(role => new CourseRole
            {
                Pathway = role.Pathway,
                Audience = role.Audience,
                Requirement = role.Requirement
            }).ToList() ?? new List<CourseRole>();
            course.Toolboxes = metadata?.Toolboxes.ToList() ?? new List<string>();
            course.Type = BuildType(metadata);
            course.Id = CourseIdHelper.GenerateId(
                course.CourseName, course.Day, course.TimeStart, course.TimeEnd, course.Room);
        }
    }

    private static string BuildType(CourseCatalogEntry? course)
    {
        if (course == null) return string.Empty;
        var tags = course.Toolboxes.ToList();
        tags.AddRange(course.Roles.Select(role => role.Requirement == "ELECTIVE"
            ? $"E-{role.Pathway}"
            : role.Audience == "MINOR" ? $"MIN-{role.Pathway}" : $"Y-{role.Pathway}"));
        if (course.IsElective && tags.Count == 0) tags.Add("Elective");
        return string.Join(", ", tags.Distinct());
    }

    private static string BuildStableCourseId(string academicYear, int semesterId, string courseName)
    {
        var digest = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{semesterId}:{courseName}")))[..12];
        return $"IU-INF-{academicYear}-S{semesterId:00}-{digest}";
    }

    private static string CourseNameKey(string? value)
    {
        var text = RemoveDiacritics(value ?? string.Empty).ToUpperInvariant()
            .Replace("ΥΠΟΛΟΓΙΣΤΩΝ", "Η/Υ", StringComparison.Ordinal)
            .Replace("H/Y", "Η/Υ", StringComparison.Ordinal);
        var key = string.Concat(text.Where(char.IsLetterOrDigit));
        return key == "ΤΕΧΝΟΛΟΓΙΑΨΥΧΑΓΩΓΙΚΟΥΛΟΓΙΣΜΙΚΟΥ"
            ? "ΤΕΧΝΟΛΟΓΙΕΣΨΥΧΑΓΩΓΙΚΟΥΛΟΓΙΣΜΙΚΟΥ"
            : key;
    }

    private static string RemoveDiacritics(string value)
    {
        var builder = new StringBuilder();
        foreach (var character in value.Normalize(NormalizationForm.FormD))
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                builder.Append(character);
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
