using IonioPortal.Data;
using IonioPortal.Interfaces;
using IonioPortal.Models;
using Microsoft.EntityFrameworkCore;

namespace IonioPortal.Services
{
    public class ExaminationScheduleService : IExaminationScheduleService
    {
        private readonly AppDbContext _context;

        public ExaminationScheduleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ExaminationSchedule> AddScheduleAsync(ExaminationSchedule schedule)
        {
            // Check if schedule exists for this department/semester/period to update instead of insert?
            // For now, simpler approach: just add. 
            // Or maybe replace if exists?
            
            var existing = await _context.ExaminationSchedules
                .FirstOrDefaultAsync(s => s.Department == schedule.Department 
                                       && s.Semester == schedule.Semester);

            if (existing != null)
            {
                existing.Exams = schedule.Exams;
                existing.Period = schedule.Period;
                _context.ExaminationSchedules.Update(existing);
            }
            else
            {
                await _context.ExaminationSchedules.AddAsync(schedule);
            }

            await _context.SaveChangesAsync();
            return schedule;
        }

        public async Task<ExaminationSchedule?> GetScheduleAsync(string department, string semester)
        {
            return await _context.ExaminationSchedules
                .FirstOrDefaultAsync(s => s.Department == department && s.Semester == semester);
        }

        public async Task<List<ExaminationSchedule>> GetSchedulesAsync(string? department, string? semester)
        {
            var query = _context.ExaminationSchedules.AsQueryable();

            if (!string.IsNullOrEmpty(department))
            {
                query = query.Where(s => s.Department == department);
            }

            if (!string.IsNullOrEmpty(semester))
            {
                query = query.Where(s => s.Semester == semester);
            }

            return await query.ToListAsync();
        }

        public async Task<List<ExaminationSchedule>> GetAllSchedulesAsync()
        {
            return await _context.ExaminationSchedules.ToListAsync();
        }
    }
}
