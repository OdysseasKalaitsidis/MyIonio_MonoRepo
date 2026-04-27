using MyIonio.Data;
using MyIonio.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Helpers;

namespace MyIonio.Controllers
{
    [ApiController]
    [Route("api/")]
    public class GetScheduleController : ControllerBase
    {

        private readonly AppDbContext _context;

        public GetScheduleController(AppDbContext context)
        {
            _context = context;
        }



        [HttpGet("schedule")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSchedule([FromQuery] ScheduleRequestDto dto)
        {
             if (string.IsNullOrEmpty(dto.Department) || string.IsNullOrEmpty(dto.Semester))
    {
                return BadRequest("Department and semester are required");
    }

          
        

            var semesterMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        { "A", "Á" }, { "B", "Â" }, { "C", "Ã" }, { "D", "Ä" },
        { "E", "Å" }, { "F", "ÓÔ" }, { "G", "Æ" }, { "H", "Ç" },
        { "ÓÔ", "ÓÔ" }
    };

            string targetSemester = semesterMap.ContainsKey(dto.Semester)
        ? semesterMap[dto.Semester]
        : dto.Semester;

            // Normalize: removing single quotes AND Greek tonos
            var normalizedTargetSemester = targetSemester?.Trim().Replace("'", "").Replace("\u0384", "").Replace("´", "");
            
            // Map English department to Greek if needed
            var normalizedDepartment = dto.Department?.Trim();
            if (normalizedDepartment == "Department of Informatics") 
            {
                normalizedDepartment = "ÔÌÇÌÁ ÐËÇÑÏÖÏÑÉÊÇÓ";
            }

            var allSchedules = await _context.schedules.ToListAsync();

            var scheduleEntity = allSchedules.FirstOrDefault(s =>
            {
                var sDept = s.department?.Trim();
                var sSem = s.semester?.Trim().Replace("'", "").Replace("\u0384", "").Replace("´", "");
                
                // Check department (match either original or mapped Greek name)
                bool deptMatch = string.Equals(sDept, dto.Department?.Trim(), StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(sDept, normalizedDepartment, StringComparison.OrdinalIgnoreCase);

                // Check semester
                bool semMatch = string.Equals(sSem, normalizedTargetSemester, StringComparison.OrdinalIgnoreCase);

                return deptMatch && semMatch;
            });
            
            if (scheduleEntity == null || scheduleEntity.courses == null)
            {
                return Ok(new List<CourseEntry>());
            }

            // Generate deterministic IDs for all courses
            foreach (var course in scheduleEntity.courses)
            {
                course.Id = CourseIdHelper.GenerateId(
                    course.CourseName,
                    course.Day,
                    course.TimeStart,
                    course.TimeEnd,
                    course.Room
                );
            }

            return Ok(scheduleEntity.courses);
        }




    } 
}

