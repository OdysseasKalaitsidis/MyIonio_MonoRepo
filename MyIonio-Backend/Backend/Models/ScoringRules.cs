using IonioPortal.DTOs;
using System.ComponentModel.DataAnnotations.Schema;

namespace IonioPortal.Models
{
    public class ScoringRules
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        [NotMapped]


        public Func<List<UserAnswerDto>, bool> Condition { get; set; } = null!;
        [NotMapped]


        public Action<ScoreTracker> Apply { get; set; } = null!;
    }
}
