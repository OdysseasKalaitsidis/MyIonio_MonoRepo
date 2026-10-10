using System.Text.Json.Serialization;

namespace MyIonio.Models;

public class CourseCatalogEntry
{
    public int Id { get; set; }
    public string CourseId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Semester { get; set; } = string.Empty;
    public int SemesterId { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int TheoryHours { get; set; }
    public int LabHours { get; set; }
    public int TutorialHours { get; set; }
    public int TeachingUnits { get; set; }
    public int Ects { get; set; }
    public bool IsElective { get; set; }
    public List<CourseRole> Roles { get; set; } = new();
    public List<string> Toolboxes { get; set; } = new();
}

public class CourseRole
{
    [JsonPropertyName("pathway")]
    public string Pathway { get; set; } = string.Empty;
    [JsonPropertyName("audience")]
    public string Audience { get; set; } = string.Empty;
    [JsonPropertyName("requirement")]
    public string Requirement { get; set; } = string.Empty;
}
