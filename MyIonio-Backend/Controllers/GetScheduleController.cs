using IonioPortal.Data;
using IonioPortal.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;
using System.Text.Json;

namespace IonioPortal.Controllers
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
        { "A", "Α" },
        { "B", "Β" },
        { "C", "Γ" },
        { "D", "Δ" },
        { "E", "Ε" },
        { "F", "ΣΤ" },
        { "G", "Ζ" },
        { "H", "Η" }
    };

            string targetSemester = semesterMap.ContainsKey(dto.Semester)
        ? semesterMap[dto.Semester]
        : dto.Semester;

           
            var allSemesters = await _context.schedules.Select(s => s.semester).ToListAsync();

            var scheduleEntity = await _context.schedules
       .FirstOrDefaultAsync(s =>
           s.department == dto.Department &&
           s.semester == targetSemester);
            
            if (scheduleEntity == null)
            {
                return Ok(new List<CourseEntry>());
            }


            if (string.IsNullOrEmpty(scheduleEntity.courses))
            {
                return Ok(new List<CourseEntry>());
            }

            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var courses = JsonSerializer.Deserialize<List<CourseEntry>>(scheduleEntity.courses, options);

                return Ok(courses);
            }
            catch 
            {
                return StatusCode(500, "Error parsing course data.");
            }
        }




    } 
}
