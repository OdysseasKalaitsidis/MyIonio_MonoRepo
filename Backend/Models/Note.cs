using System.ComponentModel.DataAnnotations;

namespace MyIonio.Models
{
    /// <summary>
    /// Represents a student-uploaded course note PDF.
    /// After upload the note enters "processing" status while the AI service
    /// generates a summary via Kafka. Once the note-summarized event is consumed
    /// the status transitions to "ready" and the summary is stored here.
    /// </summary>
    public class Note
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string CourseName { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// Raw PDF bytes stored in PostgreSQL as bytea.
        /// Served via GET /api/notes/{id}/file for the AI service to download.
        /// </summary>
        [Required]
        public byte[] FileContent { get; set; } = Array.Empty<byte>();

        [Required]
        public Guid UploadedBy { get; set; }

        /// <summary>
        /// AI-generated 3-sentence summary. Null while status is "processing".
        /// </summary>
        public string? Summary { get; set; }

        /// <summary>
        /// Lifecycle: "processing" → "ready" | "failed"
        /// </summary>
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "processing";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual User? Uploader { get; set; }
    }
}
