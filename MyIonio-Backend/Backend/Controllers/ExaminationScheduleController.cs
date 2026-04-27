using IonioPortal.Interfaces;
using IonioPortal.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace IonioPortal.Controllers
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
        public async Task<IActionResult> Get([FromQuery] string? department, [FromQuery] string? semester)
        {
            var schedules = await _service.GetSchedulesAsync(department, semester);
            return Ok(schedules);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ExaminationScheduleRequestDto dto)
        {
            if (dto == null || dto.Exams == null)
            {
                return BadRequest("Invalid data");
            }

            var schedule = new ExaminationSchedule
            {
                Department = dto.Department ?? "Τμήμα Πληροφορικής",
                Semester = dto.Semester ?? "1", // Default if not provided
                Period = dto.Period,
                Exams = dto.Exams.Select(e => new ExamItem
                {
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
        
        [JsonPropertyName("semester")]
        public string Semester { get; set; }
        
        [JsonPropertyName("period")]
        public string Period { get; set; }
        
        [JsonPropertyName("exams")]
        public List<ExamItemRequestDto> Exams { get; set; }
    }

    public class ExamItemRequestDto
    {
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
