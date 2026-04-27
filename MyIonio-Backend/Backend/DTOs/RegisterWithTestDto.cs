using IonioPortal.Models;

namespace IonioPortal.DTOs
{
    public class RegisterWithTestDto
    {
        public RegisterRequestDto UserData { get; set; }
        public RecommendationDto Recommendation { get; set; } 

        public List<UserAnswerDto> UserAnswers { get; set; } 
    }
}
