using MyIonio.Models;

namespace MyIonio.DTOs
{
    public class ProfessorScheduleDto
    {
        public string Name { get; set; }
        public List<CourseEntry> Courses { get; set; } = new List<CourseEntry>();
    }
}
