using IonioPortal.Data;
using IonioPortal.DTOs;
using IonioPortal.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/")]
public class RecommendationsController : ControllerBase
{
    private readonly IRecommendationService _recommendationService;
    private readonly AppDbContext _context;
    private readonly ILogger<RecommendationsController> _logger;

    public RecommendationsController(IRecommendationService recommendationService, AppDbContext context, ILogger<RecommendationsController> logger)
    {
        _recommendationService = recommendationService;
        _context = context;
        _logger = logger;
    }

    [HttpPost("submit")]
    [Authorize]
    public async Task<IActionResult> SubmitTest([FromBody] List<UserAnswerDto> answers)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("SubmitTest called. Claims UserId: {UserIdString}", userIdString);

        if (!Guid.TryParse(userIdString, out var userId))
        {
            _logger.LogWarning("SubmitTest failed: Invalid or missing User ID in claims.");
            return Unauthorized("User ID not found");
        }
        
        _logger.LogInformation("Processing submission for validated User ID: {UserId}", userId);

        var recommendation = _recommendationService.CalculateResult(answers);

        // Create recommendation entity once
        var userRec = new UserRecommendation
        {
            UserId = userId,
            PrimaryMajor = recommendation.PrimaryMajor,
            SecondaryMajor = recommendation.SecondaryMajor,
            PrimaryToolbox = recommendation.PrimaryToolbox,
            SecondaryToolbox = recommendation.SecondaryToolbox,
            ConfidenceLevel = recommendation.ConfidenceLevel,
            ProfileType = recommendation.ProfileType,
            Reasoning = recommendation.Reasoning
        };

        // Map answers
        foreach (var ans in answers)
        {
            foreach (var answerId in ans.AnswerIds)
            {
                userRec.UserAnswers.Add(new UserAnswer
                {
                    QuestionId = ans.QuestionId,
                    AnswerId = answerId
                });
            }
        }

        _context.UserRecommendation.Add(userRec);
        await _context.SaveChangesAsync();

        return Ok(recommendation);
    }

    [HttpPost("submit-anonymous")]
    public IActionResult SubmitAnonymousTest([FromBody] List<UserAnswerDto> answers)
    {
        var recommendation = _recommendationService.CalculateResult(answers);
        return Ok(recommendation);
    }

    //[HttpPost("save-anonymous")]
    //[Authorize]
    //public async Task<IActionResult> SaveAnonymousTest([FromBody] AnonymousSaveDto dto)
    //{
    //    var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

    //    foreach (var ans in dto.Answers)
    //    {
    //        foreach (var answerId in ans.AnswerIds)
    //        {
    //            var userRec = new UserRecommendation
    //            {
    //                UserId = userId,
    //                QuestionId = ans.QuestionId,
    //                AnswerId = answerId,
    //                Major = dto.Recommendation.PrimaryMajor,
    //                Minor = dto.Recommendation.SecondaryMajor,
    //                Toolbox1 = dto.Recommendation.PrimaryToolbox,
    //                Toolbox2 = dto.Recommendation.SecondaryToolbox,
    //                Text = "Anonymous test imported"
    //            };
    //            _context.UserRecommendations.Add(userRec);
    //        }
        }

    //    await _context.SaveChangesAsync();
    //    return Ok(dto.Recommendation);
    //}

    