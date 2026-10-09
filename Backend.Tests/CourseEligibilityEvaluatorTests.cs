using MyIonio.Domain.Curriculum;
using MyIonio.Helpers;
using MyIonio.Models;

namespace MyIonio.Tests;

public class CourseEligibilityEvaluatorTests
{
    [Theory]
    [InlineData(1, true)]
    [InlineData(2, false)]
    [InlineData(3, true)]
    [InlineData(4, false)]
    [InlineData(5, true)]
    [InlineData(6, false)]
    [InlineData(7, true)]
    [InlineData(8, false)]
    public void ActiveAcademicPeriod_AllowsOnlyOddSemesters(int semesterId, bool expected) =>
        Assert.Equal(expected, CourseEligibility.IsActiveSemester(semesterId));

    [Theory]
    [InlineData(1, ElectiveSelectionMode.None, 0, 0)]
    [InlineData(2, ElectiveSelectionMode.None, 0, 0)]
    [InlineData(3, ElectiveSelectionMode.Exactly, 1, 1)]
    [InlineData(4, ElectiveSelectionMode.Exactly, 1, 1)]
    [InlineData(5, ElectiveSelectionMode.Exactly, 2, 2)]
    [InlineData(6, ElectiveSelectionMode.Exactly, 1, 1)]
    [InlineData(7, ElectiveSelectionMode.Exactly, 1, 1)]
    [InlineData(8, ElectiveSelectionMode.Exactly, 2, 2)]
    public void SelectionRule_MatchesOfficialProgramme(
        int semesterId,
        ElectiveSelectionMode expectedMode,
        int expectedMinimum,
        int? expectedMaximum)
    {
        var rule = CourseEligibilityEvaluator.SelectionRule(semesterId);

        Assert.Equal(expectedMode, rule.Mode);
        Assert.Equal(expectedMinimum, rule.MinimumSelections);
        Assert.Equal(expectedMaximum, rule.MaximumSelections);
    }

    [Fact]
    public void CoreCourse_IsRequired()
    {
        var decision = Evaluate(Course(5));

        Assert.Equal(EffectiveCourseCategory.Required, decision.Category);
        Assert.Equal(CourseEligibilityReason.CoreRequired, decision.Reason);
    }

    [Theory]
    [InlineData("BYN", "ΒΥΝ")]
    [InlineData("KDE", "ΚΔΕ")]
    [InlineData("PSMAD", "ΨΜΑΔ")]
    public void MajorRequiredCourse_IsRequired_ForMatchingPathway(string storedPathway, string selectedMajor)
    {
        var course = Course(6, Role(storedPathway, "MAJOR", "REQUIRED"));

        var decision = Evaluate(course, major: selectedMajor, minor: "KDE");

        Assert.Equal(EffectiveCourseCategory.Required, decision.Category);
        Assert.Equal(CourseEligibilityReason.MajorRequired, decision.Reason);
    }

    [Theory]
    [InlineData("BYN", "ΒΥΝ")]
    [InlineData("KDE", "ΚΔΕ")]
    [InlineData("PSMAD", "ΨΜΑΔ")]
    public void MinorRequiredCourse_IsRequired_ForMatchingPathway(string storedPathway, string selectedMinor)
    {
        var course = Course(7, Role(storedPathway, "MINOR", "REQUIRED"));

        var decision = Evaluate(course, major: "KDE", minor: selectedMinor);

        Assert.Equal(EffectiveCourseCategory.Required, decision.Category);
        Assert.Equal(CourseEligibilityReason.MinorRequired, decision.Reason);
    }

    [Theory]
    [InlineData("BYN", "ΒΥΝ")]
    [InlineData("KDE", "ΚΔΕ")]
    [InlineData("PSMAD", "ΨΜΑΔ")]
    public void MajorElective_IsElective_OnlyForMatchingMajor(string storedPathway, string selectedMajor)
    {
        var course = Course(8, Role(storedPathway, "MAJOR", "ELECTIVE"));

        var matching = Evaluate(course, major: selectedMajor, minor: "KDE");
        var other = Evaluate(course, major: "UNRELATED", minor: "KDE");

        Assert.Equal(EffectiveCourseCategory.Elective, matching.Category);
        Assert.Equal(CourseEligibilityReason.MajorElective, matching.Reason);
        Assert.Equal(EffectiveCourseCategory.NotEligible, other.Category);
        Assert.Equal(CourseEligibilityReason.OtherPathway, other.Reason);
    }

    [Theory]
    [InlineData("TB1")]
    [InlineData("TB2")]
    [InlineData("TB3")]
    [InlineData("TB4")]
    [InlineData("TB5")]
    public void EveryOfficialToolbox_IsElective(string toolbox)
    {
        var course = Course(5);
        course.Toolboxes.Add(toolbox);

        var decision = Evaluate(course);

        Assert.Equal(EffectiveCourseCategory.Elective, decision.Category);
        Assert.Equal(CourseEligibilityReason.ToolboxElective, decision.Reason);
        Assert.Equal("TERM_5_ELECTIVES", decision.RequirementGroup);
    }

    [Fact]
    public void CourseFromLaterSemester_IsNotEligible()
    {
        var course = Course(8);

        var decision = CourseEligibilityEvaluator.Evaluate(
            course,
            new CourseEligibilityContext(8, 7, "BYN", "KDE"));

        Assert.Equal(EffectiveCourseCategory.NotEligible, decision.Category);
        Assert.Equal(CourseEligibilityReason.LaterTerm, decision.Reason);
    }

    [Theory]
    [InlineData(3, 0, false)]
    [InlineData(3, 1, true)]
    [InlineData(3, 2, false)]
    [InlineData(5, 1, false)]
    [InlineData(5, 2, true)]
    [InlineData(5, 3, false)]
    [InlineData(6, 0, false)]
    [InlineData(6, 1, true)]
    [InlineData(6, 3, false)]
    [InlineData(8, 1, false)]
    [InlineData(8, 2, true)]
    public void SelectionRule_ValidatesExactAndMinimumCounts(
        int semesterId,
        int selectedCount,
        bool expected)
    {
        Assert.Equal(
            expected,
            CourseEligibilityEvaluator.SelectionRule(semesterId).IsSatisfied(selectedCount));
    }

    private static CourseEligibilityDecision Evaluate(
        CourseCatalogEntry course,
        string major = "BYN",
        string minor = "KDE") =>
        CourseEligibilityEvaluator.Evaluate(
            course,
            new CourseEligibilityContext(course.SemesterId, course.SemesterId, major, minor));

    private static CourseCatalogEntry Course(int semesterId, params CourseRole[] roles) =>
        new()
        {
            CourseId = Guid.NewGuid().ToString(),
            SemesterId = semesterId,
            Semester = semesterId.ToString(),
            Roles = roles.ToList()
        };

    private static CourseRole Role(string pathway, string audience, string requirement) =>
        new() { Pathway = pathway, Audience = audience, Requirement = requirement };
}
