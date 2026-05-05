namespace MyIonio.Kafka.Events
{
    /// <summary>
    /// Published to the "note-summarized" Kafka topic by the AI service
    /// after Gemini generates a summary for a student note.
    ///
    /// The backend's KafkaConsumerService (IHostedService) consumes this event
    /// and updates the Note record in PostgreSQL.
    /// </summary>
    public record NoteSummarizedEvent(
        Guid NoteId,
        string? Summary,
        bool Success,
        string? ErrorMessage
    );
}
