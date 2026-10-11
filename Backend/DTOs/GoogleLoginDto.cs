using System.ComponentModel.DataAnnotations;

namespace MyIonio.DTOs
{
    public class GoogleLoginDto
    {
        [Required]
        public string IdToken { get; set; }

        [Required, StringLength(128, MinimumLength = 16)]
        public string Nonce { get; set; } = null!;

        public string? Semester { get; set; }
        public string? Major { get; set; }
        public string? Minor { get; set; }
        public string? Department { get; set; }
        public List<string>? EnrolledCourses { get; set; }
    }
}

