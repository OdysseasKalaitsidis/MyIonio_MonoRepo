using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Helpers;
using System.Security.Claims;

namespace MyIonio.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/user/courses")]
    public class UserCoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserCoursesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetEnrolledCourses()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound("User not found");

            return Ok(user.EnrolledCourses);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateEnrolledCourses([FromBody] UserCoursesDto dto)
        {
            if (string.IsNullOrEmpty(dto.Semester)) return BadRequest("Semester is required");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound("User not found");

            if (user.EnrolledCourses == null)
            {
                user.EnrolledCourses = new Dictionary<string, List<string>>();
            }

            Console.WriteLine($"[DEBUG] UpdateEnrolledCourses: Received {dto.Courses?.Count ?? 0} courses for Semester '{dto.Semester}'");
            
            // Normalize semester key to Greek so it matches the master schedule's semester field
            var semesterNormMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "A", "Α" }, { "B", "Β" }, { "C", "Γ" }, { "D", "Δ" },
                { "E", "Ε" }, { "F", "ΣΤ" }, { "G", "Ζ" }, { "H", "Η" },
                { "ΣΤ", "ΣΤ" }, { "Z", "Ζ" },
            };
            var normalizedSemester = semesterNormMap.ContainsKey(dto.Semester) ? semesterNormMap[dto.Semester] : dto.Semester;
            
            Console.WriteLine($"[DEBUG] Normalized Semester for Save: '{normalizedSemester}'");

            user.Semester = normalizedSemester; // Update the user's current semester
            user.EnrolledCourses[normalizedSemester] = dto.Courses ?? new List<string>();

            if (!string.IsNullOrEmpty(dto.Major)) user.Major = dto.Major;
            if (!string.IsNullOrEmpty(dto.Minor)) user.Minor = dto.Minor;

            Console.WriteLine($"[DEBUG] Saving User EnrolledCourses. Keys: {string.Join(", ", user.EnrolledCourses.Keys)}");

            await _context.SaveChangesAsync();
            
            Console.WriteLine("[DEBUG] SaveChangesAsync completed.");

            return Ok(user.EnrolledCourses);
        }

        [HttpGet("schedule")]
        public async Task<IActionResult> GetMySchedule([FromQuery] string semester, [FromQuery] string? department = null)
        {
            if (string.IsNullOrEmpty(semester)) return BadRequest("Semester is required");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(Guid.Parse(userId));
            if (user == null) return NotFound("User not found");

            // Mapping for Semester (A -> Α, etc.)
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

            string targetSemester = semesterMap.ContainsKey(semester) ? semesterMap[semester] : semester;

            // 1. Determine Department and Get user's enrolled courses for this semester
            Console.WriteLine($"[DEBUG] GetMySchedule: Request for Semester='{semester}', Department='{department}'");
            
            var targetDepartment = !string.IsNullOrEmpty(department) ? department : user.Department;
            if (string.IsNullOrEmpty(targetDepartment))
            {
                Console.WriteLine("[DEBUG] User department is empty.");
                return BadRequest("User department is not set.");
            }

            var enrolledCourseNames = new List<string>();
            
            if (user.EnrolledCourses != null)
            {
                // Try exact match
                if (user.EnrolledCourses.ContainsKey(targetSemester))
                {
                    enrolledCourseNames = user.EnrolledCourses[targetSemester];
                    Console.WriteLine($"[DEBUG] Found exact match for '{targetSemester}'");
                }
                else
                {
                    // Try fuzzy match
                    var normalizedTarget = targetSemester.Trim().Replace("'", "").Replace("\u0384", "").Replace("΄", "").ToLower();
                    foreach (var key in user.EnrolledCourses.Keys)
                    {
                        var normalizedKey = key.Trim().Replace("'", "").Replace("\u0384", "").Replace("΄", "").ToLower();
                        if (normalizedKey == normalizedTarget)
                        {
                            enrolledCourseNames = user.EnrolledCourses[key];
                            Console.WriteLine($"[DEBUG] Found fuzzy match: '{key}' for requested '{targetSemester}'");
                            break;
                        }
                    }
                }
            }

            Console.WriteLine($"[DEBUG] Found {enrolledCourseNames.Count} enrolled course Names.");

            // 2. Get the master schedule for the user's department and semester
            var normalizedTargetSemester = targetSemester.Trim().Replace("'", "");
            
            // Map Greek department names to the English names stored by the AI parser
            var departmentMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Τμήμα Πληροφορικής", "Department of Informatics" },
                { "Τμήμα Τουρισμού", "Department of Tourism" },
                { "Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας", "Department of Foreign Languages, Translation and Interpreting" },
            };
            var normalizedDepartment = departmentMap.ContainsKey(targetDepartment.Trim())
                ? departmentMap[targetDepartment.Trim()]
                : targetDepartment.Trim();

             var allSchedulesMetadata = await _context.schedules
                 .AsNoTracking()
                 .Select(s => new { s.id, s.department, s.semester })
                 .ToListAsync();

            var scheduleId = allSchedulesMetadata.FirstOrDefault(s => 
                (s.department?.Trim() == normalizedDepartment) &&
                (s.semester?.Trim().Replace("'", "") == normalizedTargetSemester || s.semester == targetSemester)
            )?.id;

            if (scheduleId == null)
            {
                 Console.WriteLine("[DEBUG] No matching schedule entity found in DB.");
                 return NotFound("Schedule not found for your department and semester."); 
            }

            var scheduleEntity = await _context.schedules
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.id == scheduleId.Value);
            
            var courses = scheduleEntity.courses ?? new List<CourseEntry>();

            // 3. Filter courses if the user has enrolled in any
            if (enrolledCourseNames.Any())
            {
                courses = courses.Where(c => enrolledCourseNames.Contains(c.CourseName)).ToList();
            }

            Console.WriteLine($"[DEBUG] Returning {courses.Count} courses.");

            return Ok(courses);
        }
    }
}

