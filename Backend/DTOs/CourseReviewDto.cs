using System.ComponentModel.DataAnnotations;

namespace MyIonio.DTOs
{
    public class CourseReviewDto
    {
        public Guid Id { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string UserName { get; set; } = "Επαληθευμένος φοιτητής";
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SubmitReviewDto
    {
        [Required, StringLength(200, MinimumLength = 1)]
        public string CourseName { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }

    public class CourseRatingSummaryDto
    {
        public string CourseName { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }
}
