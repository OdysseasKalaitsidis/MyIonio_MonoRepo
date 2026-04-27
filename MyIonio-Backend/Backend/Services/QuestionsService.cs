using IonioPortal.Data;
using IonioPortal.DTOs;
using IonioPortal.Interfaces;
using Microsoft.EntityFrameworkCore;

public class QuestionsService : IQuestionsService
{
    private readonly AppDbContext _context;

    public QuestionsService(AppDbContext context)
    {
        _context = context;
    }
    public async Task<List<QuestionsDto>> GetAllQuestionsAsync()
    {
        var questions = await _context.Questions
            .Include(q => q.AnswerQuestions)
                .ThenInclude(aq => aq.Answer)
            .OrderBy(q => q.Index)
            .Select(q => new QuestionsDto
            {
                Id = q.QuestionId,
                Text = q.Text,
                Type = q.Type,
                Index = q.Index,
                AnswerOptions = q.AnswerQuestions
                    .OrderBy(aq => aq.AnswerId)
                    .Select(aq => new AnswerOptionDto
                    {
                        Id = aq.Answer.Id,
                        Text = aq.Answer.Text,
                        Weight = aq.Answer.Weight,
                        // Include Major/Toolbox points as dictionaries
                        MajorPoints = aq.Answer.MajorPoints,     // Dictionary<string,int>
                        ToolboxPoints = aq.Answer.ToolboxPoints, // Dictionary<string,int>
                        SliderMin = aq.Answer.SliderMin,         // optional, if slider question
                        SliderMax = aq.Answer.SliderMax,
                        RankingOptions = aq.Answer.RankingOptions // optional, list of int IDs for ranking
                    })
                    .ToList()
            })
            .ToListAsync();

        return questions;
    }   

}
