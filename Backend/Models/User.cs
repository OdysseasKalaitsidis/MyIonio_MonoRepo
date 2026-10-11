using MyIonio.DTOs;
using System.ComponentModel.DataAnnotations;

namespace MyIonio.Models
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

        [MaxLength(255)]
        public string? GoogleSubject { get; set; }

        [MaxLength(32)]
        public string? AcceptedTermsVersion { get; set; }
        public DateTime? TermsAcceptedAt { get; set; }

        [MaxLength(32)]
        public string? AcknowledgedPrivacyVersion { get; set; }
        public DateTime? PrivacyAcknowledgedAt { get; set; }

        [Required]
        [MaxLength(254)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool HasCompletedTest { get; set; } = false;

        public ICollection<UserRecommendation> Recommendations { get; set; } = new List<UserRecommendation>();

        // Stores courses per semester: Key = Semester (e.g., "A", "ΣΤ"), Value = List of Course IDs
        public Dictionary<string, List<string>> EnrolledCourses { get; set; } = new Dictionary<string, List<string>>();
        public Dictionary<string, List<string>> EnrolledCourseIds { get; set; } = new Dictionary<string, List<string>>();

    }
}

