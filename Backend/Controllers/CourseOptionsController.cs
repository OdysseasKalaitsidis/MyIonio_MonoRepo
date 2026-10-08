using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Data;
using MyIonio.Domain.Curriculum;
using MyIonio.Helpers;
using MyIonio.Models;

namespace MyIonio.Controllers;

[ApiController]
[Route("api/course-options")]
public class CourseOptionsController : ControllerBase
{
    private readonly AppDbContext _context;
    public CourseOptionsController(AppDbContext context) => _context = context;

    [HttpGet, AllowAnonymous]
    public async Task<IActionResult> Get([FromQuery] string department, [FromQuery] int? semesterId = null,
        [FromQuery] string? semester = null,
        [FromQuery] string? major = null, [FromQuery] string? minor = null)
    {
        var semId = semesterId ?? CourseEligibility.SemesterId(semester);
        if (string.IsNullOrWhiteSpace(department) || semId is < 1 or > 8)
            return BadRequest("Department and a valid semesterId (1-8) are required.");
        if (!CourseEligibility.IsActiveSemester(semId))
            return BadRequest("Only semesters Α, Γ, Ε and Ζ are available in the current academic period.");

        var sem = CourseEligibility.SemesterCode(semId);
        var dept = CourseEligibility.DepartmentKey(department);
        var candidates = await _context.CourseCatalog.AsNoTracking().Where(c => c.SemesterId == semId).ToListAsync();
        candidates = candidates.Where(c => CourseEligibility.DepartmentKey(c.Department) == dept).ToList();
        var latestYear = candidates.MaxBy(c => c.AcademicYear)?.AcademicYear;
        var courses = latestYear == null ? new List<CourseCatalogEntry>() : candidates.Where(c => c.AcademicYear == latestYear).ToList();
        var majorCode = CourseEligibility.NormalizePathway(major);
        var minorCode = CourseEligibility.NormalizePathway(minor);
        var pathways = courses.SelectMany(c => c.Roles).Select(r => CourseEligibility.NormalizePathway(r.Pathway))
            .Where(code => code.Length > 0).Distinct().OrderBy(code => code).ToList();
        var context = new CourseEligibilityContext(semId, semId, majorCode, minorCode);
        var decisions = courses.ToDictionary(c => c.CourseId, c => CourseEligibilityEvaluator.Evaluate(c, context));
        var rule = CourseEligibilityEvaluator.SelectionRule(semId);

        object Option(CourseCatalogEntry course)
        {
            var decision = decisions[course.CourseId];
            return new
            {
                courseId = course.CourseId,
                courseName = course.CourseName,
                course.Semester,
                course.Ects,
                course.Roles,
                course.Toolboxes,
                effectiveCategory = decision.CategoryCode,
                reasonCode = decision.ReasonCode,
                requirementGroup = decision.RequirementGroup
            };
        }

        return Ok(new
        {
            academicYear = latestYear,
            semesterId = semId,
            semester = sem,
            availableMajors = pathways,
            availableMinors = pathways.Where(code => code != majorCode),
            common = courses.Where(c => decisions[c.CourseId].Reason == CourseEligibilityReason.CoreRequired).Select(Option),
            requiredMajor = courses.Where(c => decisions[c.CourseId].Reason == CourseEligibilityReason.MajorRequired).Select(Option),
            requiredMinor = courses.Where(c => decisions[c.CourseId].Reason == CourseEligibilityReason.MinorRequired).Select(Option),
            majorElectives = courses.Where(c => decisions[c.CourseId].Reason == CourseEligibilityReason.MajorElective).Select(Option),
            toolboxElectives = courses.Where(c => decisions[c.CourseId].Reason == CourseEligibilityReason.ToolboxElective).Select(Option),
            constraints = new
            {
                selectionMode = rule.ModeCode,
                minimumElectives = rule.MinimumSelections,
                maximumElectives = rule.MaximumSelections
            }
        });
    }
}
