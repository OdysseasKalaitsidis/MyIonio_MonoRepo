namespace MyIonio.Kafka.Events
{
    /// <summary>
    /// Kafka event payload published when a user submits or updates a course review.
    /// Consumed asynchronously by the AI service for sentiment analysis.
    /// </summary>
    public record CourseReviewSubmittedEvent(
        Guid ReviewId,
        string CourseName,
        int Rating,
        string? Comment,
        Guid UserId,
        DateTime SubmittedAt
    );
}
