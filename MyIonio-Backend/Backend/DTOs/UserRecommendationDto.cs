namespace IonioPortal.DTOs
{
    public class UserRecommendationDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string PrimaryMajor { get; set; } = string.Empty;
        public string SecondaryMajor { get; set; } = string.Empty;
        public string PrimaryToolbox { get; set; } = string.Empty;
        public string SecondaryToolbox { get; set; } = string.Empty;
        public string ConfidenceLevel { get; set; } = "Standard";
        public string? ProfileType { get; set; }
        public ReasoningDto? Reasoning { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
