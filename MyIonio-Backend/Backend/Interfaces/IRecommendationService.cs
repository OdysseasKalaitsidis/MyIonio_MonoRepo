using IonioPortal.DTOs;

public interface IRecommendationService
{
    RecommendationDto CalculateResult(List<UserAnswerDto> answers);

    //string CalculateConfidence(Dictionary<string, int> majorScores);

    //ReasoningDto GenerateReasoning(
    //    Dictionary<string, int> majorScores,
    //    Dictionary<string, int> toolboxScores);

}
