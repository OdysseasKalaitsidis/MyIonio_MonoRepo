namespace MyIonio.DTOs
{
    public class RegisterResponseWithTestDto
    {
        public string Token { get; set; }
        public Guid UserId {get; set;}
        public RecommendationDto? Recommendation { get; set; }
    }
}

