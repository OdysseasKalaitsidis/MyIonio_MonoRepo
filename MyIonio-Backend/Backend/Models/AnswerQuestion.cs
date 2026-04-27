namespace IonioPortal.Models
{
    public class AnswerQuestion
    {
     
        public int QuestionId { get; set; }
        public Question Question { get; set; } = null!;

        public int AnswerId { get; set; }
        public Answer Answer { get; set; } = null!;

    }
}
