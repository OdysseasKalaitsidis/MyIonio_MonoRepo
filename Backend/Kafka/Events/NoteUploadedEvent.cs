namespace MyIonio.Kafka.Events
{
    /// <summary>
    /// Published to the "note-uploaded" Kafka topic when a student uploads a PDF note.
    /// The AI service consumes this event, downloads the file from the backend,
    /// generates a Gemini summary, and publishes a NoteSummarizedEvent in response.
    ///
    /// Note: the event carries only metadata (no file bytes) — the AI service
    /// fetches the file via GET /api/notes/{NoteId}/file.
    /// This is the correct pattern: Kafka messages carry IDs, not large payloads.
    /// </summary>
    public record NoteUploadedEvent(
        Guid NoteId,
        string CourseName,
        string FileName,
        DateTime UploadedAt
    );
}
