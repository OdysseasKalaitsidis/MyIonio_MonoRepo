using MyIonio.Data;
using MyIonio.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Helpers;
using Microsoft.AspNetCore.OutputCaching;

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
        [OutputCache(Duration = 600, VaryByQueryKeys = new[] { "department", "departmentId", "semester", "semesterId" })]
        public async Task<IActionResult> GetSchedule([FromQuery] ScheduleRequestDto dto)
        {
            var requestedSemesterId = dto.SemesterId ?? CourseEligibility.SemesterId(dto.Semester);
            if (string.IsNullOrWhiteSpace(dto.Department) || requestedSemesterId is < 1 or > 8)
            {
                return BadRequest("Department and a valid semesterId (1-8) are required");
            }
            
            // Map English and Mixed-Case Greek department to Uppercase Greek
            var normalizedDepartment = dto.Department?.Trim();
            if (string.Equals(normalizedDepartment, "Department of Informatics", StringComparison.OrdinalIgnoreCase) || 
                string.Equals(normalizedDepartment, "Τμήμα Πληροφορικής", StringComparison.OrdinalIgnoreCase)) 
            {
                normalizedDepartment = "ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ";
            }
            else 
            {
                normalizedDepartment = normalizedDepartment?.ToUpper();
            }

            // Prevent Nginx 502 Bad Gateway on large JSON responses by disabling proxy buffering
            Response.Headers["X-Accel-Buffering"] = "no";

            // Retrieve metadata from the database
            var allSchedulesMetadata = await _context.schedules
                .AsNoTracking()
                .Select(s => new { s.id, s.department, s.DepartmentId, s.semester, s.SemesterId })
                .ToListAsync();

            var scheduleId = allSchedulesMetadata.OrderByDescending(s => s.id).FirstOrDefault(s =>
            {
                var sDept = s.department?.Trim();
                bool deptMatch = (dto.DepartmentId.HasValue && s.DepartmentId == dto.DepartmentId.Value) ||
                                 string.Equals(sDept, dto.Department?.Trim(), StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(sDept, normalizedDepartment, StringComparison.OrdinalIgnoreCase) ||
                                 (dto.Department?.Contains("Informatics", StringComparison.OrdinalIgnoreCase) == true && sDept?.Contains("ΠΛΗΡΟΦΟΡΙΚΗΣ", StringComparison.OrdinalIgnoreCase) == true);
                
                if (!deptMatch) return false;
                return s.SemesterId == requestedSemesterId || CourseEligibility.SemesterId(s.semester) == requestedSemesterId;
            })?.id;

            var scheduleEntity = scheduleId.HasValue 
                ? await _context.schedules.AsNoTracking().FirstOrDefaultAsync(s => s.id == scheduleId.Value) 
                : null;
            
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
