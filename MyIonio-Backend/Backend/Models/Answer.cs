using System.Collections.Generic;

namespace IonioPortal.Models
{
    public class Answer
    {
        public int Id { get; set; }

        public int QuestionId { get; set; }

        public Question? Question { get; set; }

        public string Text { get; set; } = null!;

        public int Weight { get; set; }

        public Dictionary<string, int> MajorPoints { get; set; } = new();

        public Dictionary<string, int> ToolboxPoints { get; set; } = new();

        public int? SliderMin { get; set; }

        public int? SliderMax { get; set; }

        public List<int>? RankingOptions { get; set; }
        public ICollection<AnswerQuestion> AnswerQuestions { get; set; } = new List<AnswerQuestion>();

    }
}
