using MyIonio.Models;

namespace MyIonio.Interfaces
{
    public interface INotesService
    {
        Task<Note> SaveNoteAsync(string courseName, string fileName, byte[] fileContent, Guid uploadedBy);
        Task<List<Note>> GetNotesAsync(string? courseName);
        Task<byte[]?> GetNoteFileAsync(Guid noteId);
        Task UpdateNoteSummaryAsync(Guid noteId, string? summary, bool success, string? errorMessage);
    }
}
