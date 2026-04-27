namespace IonioPortal.DTOs
{
    public class UserAnswerDto
    {
        public int QuestionId { get; set; }
        public List<int> AnswerIds { get; set; } = new(); // supports multiple answers
        public int? SliderValue { get; set; } // optional for slider questions
        public List<int>? Ranking { get; set; } // optional for ranking questions
    }
}
