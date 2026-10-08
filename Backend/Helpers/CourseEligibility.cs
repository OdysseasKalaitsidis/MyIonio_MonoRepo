using MyIonio.Models;
using System.Globalization;
using System.Text;

namespace MyIonio.Helpers;

public static class CourseEligibility
{
    private static readonly string[] SemesterCodes = ["Α", "Β", "Γ", "Δ", "Ε", "ΣΤ", "Ζ", "Η"];
    private static readonly HashSet<int> ActiveSemesterIds = [1, 3, 5, 7];

    public static string NormalizeSemester(string? value)
    {
        var input = (value ?? string.Empty).Trim().Replace("'", "").Replace("΄", "").ToUpperInvariant();
        return input switch
        {
            "1" or "A" or "Α" => "Α", "2" or "B" or "Β" => "Β",
            "3" or "C" or "Γ" => "Γ", "4" or "D" or "Δ" => "Δ",
            "5" or "E" or "Ε" => "Ε", "6" or "F" or "ΣΤ" => "ΣΤ",
            "7" or "G" or "Z" or "Ζ" => "Ζ", "8" or "H" or "Η" => "Η",
            _ => input
        };
    }

    public static int SemesterId(string? value)
    {
        var normalized = NormalizeSemester(value);
        var index = Array.IndexOf(SemesterCodes, normalized);
        return index < 0 ? 0 : index + 1;
    }

    public static string SemesterCode(int semesterId) =>
        semesterId is >= 1 and <= 8 ? SemesterCodes[semesterId - 1] : string.Empty;

    public static bool IsActiveSemester(int semesterId) => ActiveSemesterIds.Contains(semesterId);

    public static string NormalizePathway(string? value) => (value ?? "").Trim().ToUpperInvariant() switch
    {
        "ΒΥΝ" or "BYN" => "BYN", "ΚΔΕ" or "KDE" => "KDE",
        "ΨΜΑΔ" or "PSMAD" or "YMAD" => "PSMAD", var other => other
    };

    public static string DepartmentKey(string? value)
    {
        var text = RemoveDiacritics(value ?? "").ToUpperInvariant();
        if (text.Contains("ΠΛΗΡΟΦΟΡΙΚ") || text.Contains("INFORMATICS")) return "INFORMATICS";
        return string.Concat(text.Where(char.IsLetterOrDigit));
    }

    public static bool HasRole(CourseCatalogEntry course, string pathway, string audience, string requirement) =>
        course.Roles.Any(role => NormalizePathway(role.Pathway) == NormalizePathway(pathway)
            && role.Audience.Equals(audience, StringComparison.OrdinalIgnoreCase)
            && role.Requirement.Equals(requirement, StringComparison.OrdinalIgnoreCase));

    private static string RemoveDiacritics(string value)
    {
        var builder = new StringBuilder();
        foreach (var c in value.Normalize(NormalizationForm.FormD))
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) builder.Append(c);
        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
