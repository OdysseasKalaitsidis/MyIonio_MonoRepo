using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace IonioPortal.Models
{
    public class Question
    {
        [Key]
        public int QuestionId { get; set; }

        [Required]
        public string Text { get; set; } = null!;

        [Required]
        public string Type { get; set; } = null!;

        public int Index { get; set; }

        public int Weight { get; set; }

        public Dictionary<string, int> MajorPoints { get; set; } = new();

        public Dictionary<string, int> ToolboxPoints { get; set; } = new();

        public int? SliderMin { get; set; }

        public int? SliderMax { get; set; }

        public List<int>? RankingOptions { get; set; }

        public ICollection<Answer> Answers { get; set; } = new List<Answer>();

        public ICollection<AnswerQuestion> AnswerQuestions { get; set; } = new List<AnswerQuestion>();
    }
}
