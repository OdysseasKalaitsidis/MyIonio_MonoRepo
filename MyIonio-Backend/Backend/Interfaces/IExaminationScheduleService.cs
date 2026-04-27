using IonioPortal.Models;

namespace IonioPortal.Interfaces
{
    public interface IExaminationScheduleService
    {
        Task<ExaminationSchedule> AddScheduleAsync(ExaminationSchedule schedule);
        Task<ExaminationSchedule?> GetScheduleAsync(string department, string semester);
        Task<List<ExaminationSchedule>> GetSchedulesAsync(string? department, string? semester);
        Task<List<ExaminationSchedule>> GetAllSchedulesAsync();
    }
}
