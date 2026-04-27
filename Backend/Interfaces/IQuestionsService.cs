using MyIonio.DTOs;

namespace MyIonio.Interfaces
{
    public interface IQuestionsService
    {

        //Get all questions 
        Task<List<QuestionsDto>> GetAllQuestionsAsync();


    }

}

