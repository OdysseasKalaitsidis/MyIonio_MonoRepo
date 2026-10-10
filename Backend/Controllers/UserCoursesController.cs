using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Helpers;
using MyIonio.Domain.Curriculum;
using System.Security.Claims;

namespace MyIonio.Controllers;

[Authorize]
[ApiController]
[Route("api/user/courses")]
public class UserCoursesController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserCoursesController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetEnrolledCourses()
    {
        var user = await CurrentUser();
        return user == null ? Unauthorized() : Ok(user.EnrolledCourses);
    }

    [HttpPost]
    public async Task<IActionResult> UpdateEnrolledCourses([FromBody] UserCoursesDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Semester)) return BadRequest("Semester is required.");

        var user = await CurrentUser();
        if (user == null) return Unauthorized();

        var semester = CourseEligibility.NormalizeSemester(dto.Semester);
        var semesterId = CourseEligibility.SemesterId(semester);
        if (semesterId is < 1 or > 8) return BadRequest("A valid semester is required.");
        if (!CourseEligibility.IsActiveSemester(semesterId))
            return BadRequest("Only semesters Α, Γ, Ε and Ζ are available in the current academic period.");
        var major = CourseEligibility.NormalizePathway(dto.Major);
        var minor = CourseEligibility.NormalizePathway(dto.Minor);

        if (major.Length > 0 && major == minor)
            return BadRequest("Major and minor must be different.");

        var names = (dto.Courses ?? new List<string>())
            .Where(name => !string.IsNullOrWhiteSpace(name)).Distinct().ToList();
        var ids = (dto.CourseIds ?? new List<string>())
            .Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList();

        if (ids.Count > 0)
        {
            var validation = await ValidateSelection(user.Department, semester, major, minor, ids);
            if (validation.Error != null) return BadRequest(validation.Error);
            names = validation.Courses!.Select(course => course.CourseName).Distinct().ToList();
        }

        user.EnrolledCourses ??= new Dictionary<string, List<string>>();
        user.EnrolledCourseIds ??= new Dictionary<string, List<string>>();
        user.Semester = semester;
        user.EnrolledCourses[semester] = names;
        user.EnrolledCourseIds[semester] = ids;
        if (major.Length > 0) user.Major = major;
        if (minor.Length > 0) user.Minor = minor;
        _context.Entry(user).Property(item => item.EnrolledCourses).IsModified = true;
        _context.Entry(user).Property(item => item.EnrolledCourseIds).IsModified = true;

        await _context.SaveChangesAsync();
        return Ok(new { semester, courses = names, courseIds = ids, major = user.Major, minor = user.Minor });
    }

    [HttpGet("schedule")]
    public async Task<IActionResult> GetMySchedule([FromQuery] int? semesterId = null,
        [FromQuery] string? semester = null, [FromQuery] string? department = null)
    {
        var targetSemesterId = semesterId ?? CourseEligibility.SemesterId(semester);
        if (targetSemesterId is < 1 or > 8) return BadRequest("A valid semesterId (1-8) is required.");

        var user = await CurrentUser();
        if (user == null) return Unauthorized();

        var targetSemester = CourseEligibility.SemesterCode(targetSemesterId);
        var targetDepartment = string.IsNullOrWhiteSpace(department) ? user.Department : department;
        if (string.IsNullOrWhiteSpace(targetDepartment)) return BadRequest("User department is not set.");

        var metadata = await _context.schedules.AsNoTracking()
            .Select(schedule => new { schedule.id, schedule.department, schedule.semester, schedule.SemesterId, schedule.academic_year, schedule.period }).ToListAsync();

        var departmentKey = CourseEligibility.DepartmentKey(targetDepartment);
        var scheduleId = metadata
            .OrderByDescending(item => CourseEligibility.AcademicYearStart(item.academic_year))
            .ThenByDescending(item => CourseEligibility.IsExpectedPeriod(item.period, targetSemesterId))
            .ThenByDescending(item => item.id)
            .FirstOrDefault(item =>
            CourseEligibility.DepartmentKey(item.department) == departmentKey &&
            (item.SemesterId == targetSemesterId || CourseEligibility.SemesterId(item.semester) == targetSemesterId))?.id;

        if (scheduleId == null) return NotFound("Schedule not found for your department and semester.");

        var entity = await _context.schedules.AsNoTracking()
            .FirstOrDefaultAsync(schedule => schedule.id == scheduleId.Value);
        var courses = entity?.courses ?? new List<CourseEntry>();

        var selectedIds = DictionaryValue(user.EnrolledCourseIds, targetSemester);
        var selectedNames = DictionaryValue(user.EnrolledCourses, targetSemester);
        if (selectedIds.Count > 0)
        {
            var allowed = selectedIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var matchingIds = courses.Where(course =>
                !string.IsNullOrWhiteSpace(course.CourseId) && allowed.Contains(course.CourseId));
            courses = matchingIds.Concat(FilterByNames(courses, selectedNames))
                .DistinctBy(course => course.Id)
                .ToList();
        }
        else if (selectedNames.Count > 0)
        {
            courses = FilterByNames(courses, selectedNames);
        }

        return Ok(courses);
    }

    private async Task<User?> CurrentUser()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var id) ? await _context.Users.FindAsync(id) : null;
    }

    private async Task<(List<CourseCatalogEntry>? Courses, object? Error)> ValidateSelection(
        string? department, string semester, string major, string minor, List<string> selectedIds)
    {
        if (string.IsNullOrWhiteSpace(department))
            return (null, new { message = "User department is not set." });

        var candidates = await _context.CourseCatalog.AsNoTracking()
            .Where(course => course.Semester == semester).ToListAsync();
        var departmentKey = CourseEligibility.DepartmentKey(department);
        candidates = candidates.Where(course => CourseEligibility.DepartmentKey(course.Department) == departmentKey).ToList();

        var academicYear = candidates.MaxBy(course => CourseEligibility.AcademicYearStart(course.AcademicYear))?.AcademicYear;
        var catalog = academicYear == null
            ? new List<CourseCatalogEntry>()
            : candidates.Where(course => course.AcademicYear == academicYear).ToList();

        if (catalog.Count == 0)
            return (null, new { message = "No curriculum catalog exists for this department and semester yet." });

        var byId = catalog.ToDictionary(course => course.CourseId, StringComparer.OrdinalIgnoreCase);
        var unknown = selectedIds.Where(id => !byId.ContainsKey(id)).ToList();
        if (unknown.Count > 0)
            return (null, new { message = "Some selected courses do not belong to the active curriculum.", unknownCourseIds = unknown });

        var selected = selectedIds.Select(id => byId[id]).ToList();
        var semesterId = CourseEligibility.SemesterId(semester);
        var context = new CourseEligibilityContext(semesterId, semesterId, major, minor);
        var decisions = catalog.ToDictionary(
            course => course.CourseId,
            course => CourseEligibilityEvaluator.Evaluate(course, context),
            StringComparer.OrdinalIgnoreCase);

        var invalid = selected
            .Where(course => decisions[course.CourseId].Category == EffectiveCourseCategory.NotEligible)
            .Select(course => course.CourseName)
            .ToList();
        if (invalid.Count > 0)
            return (null, new { message = "Courses from another pathway or semester cannot be selected.", courses = invalid });

        var selectedSet = selectedIds.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var missing = catalog
            .Where(course => decisions[course.CourseId].Category == EffectiveCourseCategory.Required)
            .Where(course => !selectedSet.Contains(course.CourseId))
            .Select(course => course.CourseName)
            .ToList();
        if (missing.Count > 0)
            return (null, new { message = "Required courses are missing.", courses = missing });

        var selectedElectives = selected.Count(
            course => decisions[course.CourseId].Category == EffectiveCourseCategory.Elective);
        var rule = CourseEligibilityEvaluator.SelectionRule(semesterId);
        if (!rule.IsSatisfied(selectedElectives))
        {
            var message = rule.Mode == ElectiveSelectionMode.Exactly
                ? $"Select exactly {rule.MinimumSelections} elective course(s)."
                : $"Select at least {rule.MinimumSelections} elective course(s).";
            return (null, new
            {
                message,
                selectionMode = rule.ModeCode,
                minimumElectives = rule.MinimumSelections,
                maximumElectives = rule.MaximumSelections
            });
        }

        return (selected, null);
    }

    private static List<CourseEntry> FilterByNames(List<CourseEntry> courses, List<string> selectedNames)
    {
        if (selectedNames.Count == 0) return new List<CourseEntry>();
        var allowed = selectedNames.Select(CourseNameKey).ToHashSet(StringComparer.Ordinal);
        return courses.Where(course => allowed.Contains(CourseNameKey(course.CourseName))).ToList();
    }

    private static string CourseNameKey(string? value)
    {
        var key = string.Concat((value ?? string.Empty)
            .Replace("ΥΠΟΛΟΓΙΣΤΩΝ", "Η/Υ", StringComparison.OrdinalIgnoreCase)
            .Replace("H/Y", "Η/Υ", StringComparison.OrdinalIgnoreCase)
            .Where(char.IsLetterOrDigit)
            .Select(char.ToUpperInvariant));
        return key == "ΤΕΧΝΟΛΟΓΙΑΨΥΧΑΓΩΓΙΚΟΥΛΟΓΙΣΜΙΚΟΥ"
            ? "ΤΕΧΝΟΛΟΓΙΕΣΨΥΧΑΓΩΓΙΚΟΥΛΟΓΙΣΜΙΚΟΥ"
            : key;
    }

    private static List<string> DictionaryValue(Dictionary<string, List<string>>? source, string semester)
    {
        if (source == null) return new List<string>();
        var pair = source.FirstOrDefault(item => CourseEligibility.NormalizeSemester(item.Key) == semester);
        return pair.Value ?? new List<string>();
    }
}
