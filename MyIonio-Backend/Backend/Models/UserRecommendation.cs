using IonioPortal.DTOs;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace IonioPortal.Models
{
    public class UserRecommendation
    {
        public int Id { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; } = null!;

        public string PrimaryMajor { get; set; } = null!;
        public string SecondaryMajor { get; set; } = null!;
        public string PrimaryToolbox { get; set; } = null!;
        public string SecondaryToolbox { get; set; } = null!;
        public string ConfidenceLevel { get; set; } = null!;
        public string ProfileType { get; set; } = "Standard";

        public string ReasoningJson { get; set; } = null!;
        [NotMapped]
        public ReasoningDto Reasoning
        {
            get => JsonSerializer.Deserialize<ReasoningDto>(ReasoningJson)!;
            set => ReasoningJson = JsonSerializer.Serialize(value);
        }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<UserAnswer> UserAnswers { get; set; } = new List<UserAnswer>();
    }
}
