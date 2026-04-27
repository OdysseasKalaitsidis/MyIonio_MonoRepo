using IonioPortal.DTOs;
using System.ComponentModel.DataAnnotations;

namespace IonioPortal.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [MaxLength(50)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        public string? LastName { get; set; }
        public string? Department { get; set; }
        public string? Major { get; set; }
        public string? Minor { get; set; }

        public string? Semester { get; set; }

        [Required]
        [MaxLength(100)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool HasCompletedTest { get; set; } = false;

        public ICollection<UserRecommendation> Recommendations { get; set; } = new List<UserRecommendation>();

        // Stores courses per semester: Key = Semester (e.g., "A", "ΣΤ"), Value = List of Course IDs
        public Dictionary<string, List<string>> EnrolledCourses { get; set; } = new Dictionary<string, List<string>>();

    }
}
