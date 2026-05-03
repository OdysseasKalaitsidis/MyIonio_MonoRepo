namespace MyIonio.DTOs
{
    public class CourseReviewDto
    {
        public Guid Id { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SubmitReviewDto
    {
        public string CourseName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }

    public class CourseRatingSummaryDto
    {
        public string CourseName { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }
}
