using System.ComponentModel.DataAnnotations;

namespace IonioPortal.DTOs
{
    public class GoogleLoginDto
    {
        [Required]
        public string IdToken { get; set; }

        public string? Semester { get; set; }
        public string? Major { get; set; }
        public string? Minor { get; set; }
        public string? Department { get; set; }
        public List<string>? EnrolledCourses { get; set; }
    }
}
