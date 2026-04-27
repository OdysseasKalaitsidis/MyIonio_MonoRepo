using IonioPortal.Data;
using IonioPortal.DTOs;
using IonioPortal.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IonioPortal.Helpers;
using System.Security.Claims;

namespace IonioPortal.Controllers
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
        public async Task<IActionResult> GetMySchedule([FromQuery] string semester)
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

            // 1. Get user's enrolled courses for this semester
            Console.WriteLine($"[DEBUG] GetMySchedule: Request for Semester='{semester}'");
            
            if (user.EnrolledCourses == null)
            {
                Console.WriteLine("[DEBUG] User.EnrolledCourses is NULL");
                return Ok(new List<CourseEntry>());
            }
            
            Console.WriteLine($"[DEBUG] User.EnrolledCourses Keys: {string.Join(", ", user.EnrolledCourses.Keys)}");
            Console.WriteLine($"[DEBUG] TargetSemester (Mapped): '{targetSemester}'");

            // Fuzzy match for semester key
            var enrolledCourseNames = new List<string>();
            bool foundKey = false;
            
            // 1. Try exact match
            if (user.EnrolledCourses.ContainsKey(targetSemester))
            {
                enrolledCourseNames = user.EnrolledCourses[targetSemester];
                foundKey = true;
                Console.WriteLine($"[DEBUG] Found exact match for '{targetSemester}'");
            }
            else
            {
                // 2. Try to find a key that matches if we ignore accents and quotes
                var normalizedTarget = targetSemester.Trim().Replace("'", "").Replace("\u0384", "").Replace("΄", "").ToLower();
                
                foreach (var key in user.EnrolledCourses.Keys)
                {
                    var normalizedKey = key.Trim().Replace("'", "").Replace("\u0384", "").Replace("΄", "").ToLower();
                    if (normalizedKey == normalizedTarget)
                    {
                        enrolledCourseNames = user.EnrolledCourses[key];
                        foundKey = true;
                        Console.WriteLine($"[DEBUG] Found fuzzy match: '{key}' for requested '{targetSemester}'");
                        break;
                    }
                }
            }

            if (!foundKey)
            {
                Console.WriteLine($"[DEBUG] User has no courses for semester '{targetSemester}' (checked fuzzy matches too)");
                // Return empty list if no courses enrolled for this specific semester
                return Ok(new List<CourseEntry>()); 
            }
            Console.WriteLine($"[DEBUG] Found {enrolledCourseNames.Count} enrolled course Names.");

            // 2. Get the master schedule for the user's department and semester
            var normalizedTargetSemester = targetSemester.Trim().Replace("'", "");
            
            if (string.IsNullOrEmpty(user.Department))
            {
                Console.WriteLine("[DEBUG] User department is empty.");
                return BadRequest("User department is not set.");
            }

            Console.WriteLine($"[DEBUG] User Department: '{user.Department}'");

            // Map Greek department names to the English names stored by the AI parser
            var departmentMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Τμήμα Πληροφορικής", "Department of Informatics" },
                { "Τμήμα Τουρισμού", "Department of Tourism" },
                { "Τμήμα Ξένων Γλωσσών, Μετάφρασης και Διερμηνείας", "Department of Foreign Languages, Translation and Interpreting" },
            };
            var normalizedDepartment = departmentMap.ContainsKey(user.Department.Trim())
                ? departmentMap[user.Department.Trim()]
                : user.Department.Trim();

             Console.WriteLine($"[DEBUG] Normalized Dept: '{normalizedDepartment}', Normalized Sem: '{normalizedTargetSemester}'");

             var allSchedules = await _context.schedules.ToListAsync();
             Console.WriteLine($"[DEBUG] Total Schedules in DB: {allSchedules.Count}");

            var scheduleEntity = allSchedules.FirstOrDefault(s => 
                (s.department?.Trim() == normalizedDepartment) &&
                (s.semester?.Trim().Replace("'", "") == normalizedTargetSemester || s.semester == targetSemester)
            );

            if (scheduleEntity == null)
            {
                 Console.WriteLine("[DEBUG] No matching schedule entity found in DB.");
                 // Log available schedules for debugging
                 foreach(var s in allSchedules)
                 {
                     Console.WriteLine($"[DEBUG] DB Schedule: Dept='{s.department}', Sem='{s.semester}'");
                 }
                 return NotFound("Schedule not found for your department and semester."); 
            }

            if (scheduleEntity.courses == null)
            {
                Console.WriteLine("[DEBUG] Schedule entity found, but courses list is null.");
            }
            
            // 3. Filter courses - Match by Name
            var filteredCourses = scheduleEntity.courses?
                .Where(c => enrolledCourseNames.Contains(c.CourseName)) 
                .ToList() ?? new List<CourseEntry>();

            Console.WriteLine($"[DEBUG] Returning {filteredCourses.Count} courses after filtering.");

            // Return flattened list of courses
            return Ok(filteredCourses);
        }
    }
}
