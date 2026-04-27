public class RegisterGoogleRequestDto
{
    public string IdToken { get; set; } = null!;
    public string Semester { get; set; }= null!;
    
    public string? Department { get; set; }
    
    public RecommendationDto? Recommendation { get; set; } 
}