using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyIonio.Interfaces;
using MyIonio.Kafka;
using MyIonio.Kafka.Events;
using System.Security.Claims;

namespace MyIonio.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotesController : ControllerBase
    {
        private readonly INotesService _notesService;
        private readonly IKafkaProducerService _kafkaProducer;
        private readonly ILogger<NotesController> _logger;

        public NotesController(INotesService notesService, IKafkaProducerService kafkaProducer, ILogger<NotesController> logger)
        {
            _notesService = notesService;
            _kafkaProducer = kafkaProducer;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotes([FromQuery] string? courseName)
        {
            var notes = await _notesService.GetNotesAsync(courseName);
            return Ok(notes.Select(n => new {
                n.Id,
                n.CourseName,
                n.FileName,
                n.Summary,
                n.Status,
                n.CreatedAt,
                UploaderName = n.Uploader != null ? $"{n.Uploader.FirstName} {n.Uploader.LastName}" : "Unknown"
            }));
        }

        [HttpGet("{id}/file")]
        public async Task<IActionResult> GetNoteFile(Guid id)
        {
            var fileBytes = await _notesService.GetNoteFileAsync(id);
            if (fileBytes == null) return NotFound();

            // AI service will use this to download the PDF
            return File(fileBytes, "application/pdf");
        }

        [HttpPost("upload")]
        [Authorize]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
        public async Task<IActionResult> UploadNote([FromForm] IFormFile file, [FromForm] string courseName)
        {
            if (file == null || file.Length == 0) return BadRequest("No file uploaded");
            if (string.IsNullOrWhiteSpace(courseName)) return BadRequest("Course name is required");

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId)) return Unauthorized();

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var fileBytes = ms.ToArray();

            var note = await _notesService.SaveNoteAsync(courseName, file.FileName, fileBytes, userId);

            // Publish to Kafka: Decoupled AI processing
            await _kafkaProducer.ProduceAsync("note-uploaded", new NoteUploadedEvent(
                note.Id,
                note.CourseName,
                note.FileName,
                note.CreatedAt
            ));

            _logger.LogInformation("Note {NoteId} uploaded and published to Kafka for processing.", note.Id);

            return CreatedAtAction(nameof(GetNotes), new { id = note.Id }, new { 
                id = note.Id, 
                message = "Note uploaded successfully and is being processed by AI." 
            });
        }
    }
}
