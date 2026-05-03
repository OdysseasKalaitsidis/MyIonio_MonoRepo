using MyIonio.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MyIonio.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserRecommendationController : ControllerBase 
    {
        private readonly IUserRecommendationService _service;
        private readonly ILogger<UserRecommendationController> _logger;

        public UserRecommendationController(IUserRecommendationService service, ILogger<UserRecommendationController> logger)
        {
            _service = service;
            _logger = logger;
        }


        [HttpGet("results/{userId:guid}")]
        public async Task<IActionResult> GetByUserId(Guid userId)
        {
            _logger.LogInformation("Fetching results for userId: {UserId}", userId);
            var recommendation = await _service.GetByUserIdAsync(userId);
            if (recommendation == null)
            {
                _logger.LogWarning("Recommendation not found for userId: {UserId}", userId);
                return NotFound(new { message = "Recommendation not found for this user." });
            }

            return Ok(recommendation);
        }
    }
}

