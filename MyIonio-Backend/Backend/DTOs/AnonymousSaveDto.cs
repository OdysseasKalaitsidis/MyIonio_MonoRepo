namespace IonioPortal.DTOs
{
    public class AnonymousSaveDto
    {
        public RecommendationDto Recommendation { get; set; } = null!;
        public List<UserAnswerDto> Answers { get; set; } = new();
    }
}
