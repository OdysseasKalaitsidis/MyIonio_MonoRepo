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
        [OutputCache(Duration = 600, VaryByQueryKeys = new[] { "department", "semester" })]
        public async Task<IActionResult> GetSchedule([FromQuery] ScheduleRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.Department) || string.IsNullOrEmpty(dto.Semester))
            {
                return BadRequest("Department and semester are required");
            }

            var semesterMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "A", "Α" }, { "B", "Β" }, { "C", "Γ" }, { "D", "Δ" },
                { "E", "Ε" }, { "F", "ΣΤ" }, { "G", "Ζ" }, { "H", "Η" },
                { "ΣΤ", "ΣΤ" }
            };

            string targetSemester = semesterMap.ContainsKey(dto.Semester)
                ? semesterMap[dto.Semester]
                : dto.Semester;

            // Normalize function for Greek numeral signs and accents
            string NormalizeSemester(string val)
            {
                if (string.IsNullOrEmpty(val)) return "";
                return val.Trim()
                    .Replace("'", "")
                    .Replace("\"", "")
                    .Replace("\u0384", "") // GREEK TONOS
                    .Replace("\u0374", "") // GREEK NUMERAL SIGN
                    .Replace("\u00b4", "") // ACUTE ACCENT
                    .Replace("\u0345", "") // COMBINING GREEK YPOGEGRAMMENI
                    .Replace("΄", "")
                    .Replace("`", "");
            }

            var normalizedTargetSemester = NormalizeSemester(targetSemester);
            
            // Map English department to Greek if needed
            var normalizedDepartment = dto.Department?.Trim();
            if (string.Equals(normalizedDepartment, "Department of Informatics", StringComparison.OrdinalIgnoreCase)) 
            {
                normalizedDepartment = "ΤΜΗΜΑ ΠΛΗΡΟΦΟΡΙΚΗΣ";
            }

            // Prevent Nginx 502 Bad Gateway on large JSON responses by disabling proxy buffering
            Response.Headers["X-Accel-Buffering"] = "no";

            // Retrieve metadata from the database
            var allSchedulesMetadata = await _context.schedules
                .AsNoTracking()
                .Select(s => new { s.id, s.department, s.DepartmentId, s.semester })
                .ToListAsync();

            var scheduleId = allSchedulesMetadata.FirstOrDefault(s =>
            {
                // Check DepartmentId first (Modern way)
                if (dto.DepartmentId.HasValue)
                {
                    if (s.DepartmentId != dto.DepartmentId.Value) return false;
                }
                else
                {
                    // Fallback to string matching (Legacy way)
                    var sDept = s.department?.Trim();
                    bool deptMatch = string.Equals(sDept, dto.Department?.Trim(), StringComparison.OrdinalIgnoreCase) ||
                                     string.Equals(sDept, normalizedDepartment, StringComparison.OrdinalIgnoreCase) ||
                                     (dto.Department?.Contains("Informatics", StringComparison.OrdinalIgnoreCase) == true && sDept?.Contains("ΠΛΗΡΟΦΟΡΙΚΗΣ", StringComparison.OrdinalIgnoreCase) == true);
                    
                    if (!deptMatch) return false;
                }

                // Check semester
                var sSem = NormalizeSemester(s.semester);
                return string.Equals(sSem, normalizedTargetSemester, StringComparison.OrdinalIgnoreCase);
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
