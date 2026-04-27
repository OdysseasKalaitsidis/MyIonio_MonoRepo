using IonioPortal.DTOs;

namespace IonioPortal.Interfaces
{
    public interface IQuestionsService
    {

        //Get all questions 
        Task<List<QuestionsDto>> GetAllQuestionsAsync();


    }

}
