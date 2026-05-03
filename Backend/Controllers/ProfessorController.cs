using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Models;
using Microsoft.AspNetCore.Authorization;

namespace MyIonio.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfessorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProfessorController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfessors()
        {
            var allSchedules = await _context.schedules.ToListAsync();
            var professors = allSchedules
                .Where(s => s.courses != null)
                .SelectMany(s => s.courses)
                .Select(c => c.Professor?.Trim())
                .Where(p => !string.IsNullOrEmpty(p))
                .Distinct()
                .OrderBy(p => p)
                .ToList();

            return Ok(professors);
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllProfessorsWithSchedules()
        {
            var allSchedules = await _context.schedules.ToListAsync();
            
            var grouped = allSchedules
                .Where(s => s.courses != null)
                .SelectMany(s => s.courses)
                .Where(c => !string.IsNullOrEmpty(c.Professor))
                .GroupBy(c => c.Professor.Trim())
                .Select(g => new ProfessorScheduleDto
                {
                    Name = g.Key,
                    Courses = g.ToList()
                })
                .OrderBy(x => x.Name)
                .ToList();

            return Ok(grouped);
        }

        [HttpGet("{name}/schedule")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfessorSchedule(string name)
        {
            if (string.IsNullOrEmpty(name))
            {
                return BadRequest("Professor name is required");
            }

            var decodedName = Uri.UnescapeDataString(name);

            var allSchedules = await _context.schedules.ToListAsync();
            var courses = allSchedules
                .Where(s => s.courses != null)
                .SelectMany(s => s.courses)
                .Where(c => string.Equals(c.Professor?.Trim(), decodedName.Trim(), StringComparison.OrdinalIgnoreCase))
                .ToList();

            return Ok(courses);
        }
    }
}
