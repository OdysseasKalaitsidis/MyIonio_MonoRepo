using MyIonio.Helpers;
using MyIonio.Models;

namespace MyIonio.Domain.Curriculum;

public enum EffectiveCourseCategory
{
    Required,
    Elective,
    NotEligible
}

public enum CourseEligibilityReason
{
    CoreRequired,
    MajorRequired,
    MinorRequired,
    MajorElective,
    ToolboxElective,
    OtherPathway,
    LaterTerm,
    DifferentTerm
}

public enum ElectiveSelectionMode
{
    None,
    Exactly,
    AtLeast
}

public sealed record CourseEligibilityContext(
    int TargetSemesterId,
    int StudentSemesterId,
    string Major,
    string Minor);

public sealed record CourseEligibilityDecision(
    EffectiveCourseCategory Category,
    CourseEligibilityReason Reason,
    string? RequirementGroup)
{
    public string CategoryCode => Category switch
    {
        EffectiveCourseCategory.Required => "REQUIRED",
        EffectiveCourseCategory.Elective => "ELECTIVE",
        _ => "NOT_ELIGIBLE"
    };

    public string ReasonCode => Reason switch
    {
        CourseEligibilityReason.CoreRequired => "CORE_REQUIRED",
        CourseEligibilityReason.MajorRequired => "MAJOR_REQUIRED",
        CourseEligibilityReason.MinorRequired => "MINOR_REQUIRED",
        CourseEligibilityReason.MajorElective => "MAJOR_ELECTIVE",
        CourseEligibilityReason.ToolboxElective => "TOOLBOX_ELECTIVE",
        CourseEligibilityReason.LaterTerm => "LATER_TERM",
        CourseEligibilityReason.DifferentTerm => "DIFFERENT_TERM",
        _ => "OTHER_PATHWAY"
    };
}

public sealed record ElectiveSelectionRule(
    ElectiveSelectionMode Mode,
    int MinimumSelections,
    int? MaximumSelections)
{
    public string ModeCode => Mode switch
    {
        ElectiveSelectionMode.Exactly => "EXACTLY",
        ElectiveSelectionMode.AtLeast => "AT_LEAST",
        _ => "NONE"
    };

    public bool IsSatisfied(int selectedCount) => Mode switch
    {
        ElectiveSelectionMode.Exactly =>
            selectedCount == MinimumSelections && selectedCount == MaximumSelections,
        ElectiveSelectionMode.AtLeast =>
            selectedCount >= MinimumSelections &&
            (!MaximumSelections.HasValue || selectedCount <= MaximumSelections.Value),
        _ => selectedCount == 0
    };
}

public static class CourseEligibilityEvaluator
{
    public static CourseEligibilityDecision Evaluate(
        CourseCatalogEntry course,
        CourseEligibilityContext context)
    {
        var courseSemesterId = course.SemesterId > 0
            ? course.SemesterId
            : CourseEligibility.SemesterId(course.Semester);

        if (courseSemesterId > context.StudentSemesterId)
            return NotEligible(CourseEligibilityReason.LaterTerm);

        if (courseSemesterId != context.TargetSemesterId)
            return NotEligible(CourseEligibilityReason.DifferentTerm);

        var major = CourseEligibility.NormalizePathway(context.Major);
        var minor = CourseEligibility.NormalizePathway(context.Minor);

        if (course.Roles.Count == 0 && course.Toolboxes.Count == 0)
            return Required(CourseEligibilityReason.CoreRequired);

        if (CourseEligibility.HasRole(course, major, "MAJOR", "REQUIRED"))
            return Required(CourseEligibilityReason.MajorRequired);

        if (CourseEligibility.HasRole(course, minor, "MINOR", "REQUIRED"))
            return Required(CourseEligibilityReason.MinorRequired);

        if (CourseEligibility.HasRole(course, major, "MAJOR", "ELECTIVE"))
            return Elective(CourseEligibilityReason.MajorElective, context.TargetSemesterId);

        if (course.Toolboxes.Count > 0)
            return Elective(CourseEligibilityReason.ToolboxElective, context.TargetSemesterId);

        return NotEligible(CourseEligibilityReason.OtherPathway);
    }

    public static ElectiveSelectionRule SelectionRule(int semesterId) => semesterId switch
    {
        3 or 4 => new(ElectiveSelectionMode.Exactly, 1, 1),
        5 => new(ElectiveSelectionMode.Exactly, 2, 2),
        6 or 7 => new(ElectiveSelectionMode.Exactly, 1, 1),
        8 => new(ElectiveSelectionMode.Exactly, 2, 2),
        _ => new(ElectiveSelectionMode.None, 0, 0)
    };

    private static CourseEligibilityDecision Required(CourseEligibilityReason reason) =>
        new(EffectiveCourseCategory.Required, reason, null);

    private static CourseEligibilityDecision Elective(
        CourseEligibilityReason reason,
        int semesterId) =>
        new(EffectiveCourseCategory.Elective, reason, $"TERM_{semesterId}_ELECTIVES");

    private static CourseEligibilityDecision NotEligible(CourseEligibilityReason reason) =>
        new(EffectiveCourseCategory.NotEligible, reason, null);
}
