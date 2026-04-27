using IonioPortal.Models;

public class UserAnswer
{


    public int Id { get; set; }
    public int UserRecommendationId { get; set; }
    public UserRecommendation UserRecommendation { get; set; } = null!;
    public int QuestionId { get; set; }
    public int AnswerId { get; set; }
}
    