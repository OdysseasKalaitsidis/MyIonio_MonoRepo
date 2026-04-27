using IonioPortal.DTOs;
using IonioPortal.Interfaces;
using Microsoft.AspNetCore.Mvc;
namespace IonioPortal.Controllers
{
    [Route("api/")]
    [ApiController]
    public class QuestionController: ControllerBase
    {
        private readonly IQuestionsService _questionsService;

        public QuestionController(IQuestionsService questionsService)
        {
            _questionsService = questionsService ?? throw new ArgumentNullException(nameof(questionsService));
        }

        [HttpGet("questions")]
        public async Task<ActionResult<List<QuestionsDto>>> GetAllQuestionsAsync()
        {

            var questions = await _questionsService.GetAllQuestionsAsync();
            return Ok(questions);   
        }
        


        


    }
}
