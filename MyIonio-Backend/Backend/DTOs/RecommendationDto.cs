using IonioPortal.DTOs;

public class RecommendationDto
{
    public string PrimaryMajor { get; set; } = null!;
    public string SecondaryMajor { get; set; } = null!;
    public string PrimaryToolbox { get; set; } = null!;
    public string SecondaryToolbox { get; set; } = null!;
    public string ConfidenceLevel { get; set; } = null!;
    public string ProfileType { get; set; } = "Standard";
    public ReasoningDto Reasoning { get; set; } = null!;
    public Dictionary<string, int> UserMajorScores { get; set; }
    public Dictionary<string, int> MaxMajorScores { get; set; }
    public Dictionary<string, int> UserToolboxScores { get; set; }
    public Dictionary<string, int> MaxToolboxScores { get; set; }
    public Guid UserId { get; internal set; }
}
