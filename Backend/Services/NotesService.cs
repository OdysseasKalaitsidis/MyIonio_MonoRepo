using MyIonio.Data;
using MyIonio.Interfaces;
using MyIonio.Models;
using Microsoft.EntityFrameworkCore;

namespace MyIonio.Services
{
    public class NotesService : INotesService
    {
        private readonly AppDbContext _context;

        public NotesService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Note> SaveNoteAsync(string courseName, string fileName, byte[] fileContent, Guid uploadedBy)
        {
            var note = new Note
            {
                CourseName = courseName,
                FileName = fileName,
                FileContent = fileContent,
                UploadedBy = uploadedBy,
                Status = "processing"
            };

            await _context.Notes.AddAsync(note);
            await _context.SaveChangesAsync();
            return note;
        }

        public async Task<List<Note>> GetNotesAsync(string? courseName)
        {
            var query = _context.Notes
                .AsNoTracking()
                .Include(n => n.Uploader)
                .OrderByDescending(n => n.CreatedAt)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(courseName))
                query = query.Where(n => n.CourseName == courseName);

            return await query.ToListAsync();
        }

        public async Task<byte[]?> GetNoteFileAsync(Guid noteId)
        {
            var note = await _context.Notes
                .AsNoTracking()
                .Select(n => new { n.Id, n.FileContent })
                .FirstOrDefaultAsync(n => n.Id == noteId);

            return note?.FileContent;
        }

        public async Task UpdateNoteSummaryAsync(Guid noteId, string? summary, bool success, string? errorMessage)
        {
            var note = await _context.Notes.FindAsync(noteId);
            if (note == null) return;

            note.Summary = success ? summary : $"Processing failed: {errorMessage}";
            note.Status = success ? "ready" : "failed";

            _context.Notes.Update(note);
            await _context.SaveChangesAsync();
        }
    }
}
