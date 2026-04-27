namespace IonioPortal.DTOs
{
    public class QuestionsDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = null!;

        public int Index {  get; set; }

        public string Type { get; set; } = null!;
        public List<AnswerOptionDto> AnswerOptions { get; set; } = null!;
       
    }
}
