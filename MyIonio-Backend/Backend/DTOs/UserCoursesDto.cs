using System.Collections.Generic;

namespace IonioPortal.DTOs
{
    public class UserCoursesDto
    {
        public string Semester { get; set; }
        public List<string> Courses { get; set; }
        public string? Major { get; set; }
        public string? Minor { get; set; }
    }
}
