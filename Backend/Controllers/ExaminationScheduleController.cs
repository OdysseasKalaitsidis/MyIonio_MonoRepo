using MyIonio.Interfaces;
using MyIonio.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
using MyIonio.Helpers;

namespace MyIonio.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExaminationScheduleController : ControllerBase
    {
        private readonly IExaminationScheduleService _service;

        public ExaminationScheduleController(IExaminationScheduleService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? department, [FromQuery] string? semester,
            [FromQuery] int? semesterId = null)
        {
            var requestedSemester = semesterId.HasValue ? CourseEligibility.SemesterCode(semesterId.Value) : semester;
            var schedules = await _service.GetSchedulesAsync(department, requestedSemester);
            return Ok(schedules);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ExaminationScheduleRequestDto dto)
        {
            if (dto == null || dto.Exams == null)
            {
                return BadRequest("Invalid data");
            }

            var semesterId = dto.SemesterId ?? CourseEligibility.SemesterId(dto.Semester);
            if (semesterId is < 1 or > 8) return BadRequest("A valid semesterId (1-8) is required.");

            var schedule = new ExaminationSchedule
            {
                Department = dto.Department ?? "Τμήμα Πληροφορικής",
                DepartmentId = dto.DepartmentId ?? 1,
                Semester = CourseEligibility.SemesterCode(semesterId),
                SemesterId = semesterId,
                Period = dto.Period,
                Exams = dto.Exams.Select(e => new ExamItem
                {
                    CourseId = e.CourseId,
                    Date = e.Date,
                    Room = e.Room,
                    TimeStart = e.TimeStart,
                    TimeEnd = e.TimeEnd,
                    CourseName = e.CourseName,
                    Professors = e.Professors
                }).ToList()
            };

            var result = await _service.AddScheduleAsync(schedule);
            return Ok(result);
        }
    }

    public class ExaminationScheduleRequestDto
    {
        [JsonPropertyName("department")]
        public string Department { get; set; }

        [JsonPropertyName("departmentId")]
        public int? DepartmentId { get; set; }
        
        [JsonPropertyName("semester")]
        public string Semester { get; set; }

        [JsonPropertyName("semesterId")]
        public int? SemesterId { get; set; }
        
        [JsonPropertyName("period")]
        public string Period { get; set; }
        
        [JsonPropertyName("exams")]
        public List<ExamItemRequestDto> Exams { get; set; }
    }

    public class ExamItemRequestDto
    {
        [JsonPropertyName("course_id")]
        public string CourseId { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; }

        [JsonPropertyName("room")]
        public string Room { get; set; }

        [JsonPropertyName("time_start")]
        public string TimeStart { get; set; }

        [JsonPropertyName("time_end")]
        public string TimeEnd { get; set; }

        [JsonPropertyName("course_name")]
        public string CourseName { get; set; }

        [JsonPropertyName("professors")]
        public List<string> Professors { get; set; }
    }
}
