using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OutputCaching;

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
        [OutputCache(Duration = 3600)]
        public async Task<IActionResult> GetProfessors()
        {
            var coursesLists = await _context.schedules
                .AsNoTracking()
                .Where(s => s.courses != null)
                .Select(s => s.courses)
                .ToListAsync();

            var professors = coursesLists
                .SelectMany(c => c)
                .Select(c => c.Professor?.Trim())
                .Where(p => !string.IsNullOrEmpty(p))
                .Distinct()
                .OrderBy(p => p)
                .ToList();

            return Ok(professors);
        }

        [HttpGet("all")]
        [AllowAnonymous]
        [OutputCache(Duration = 3600)]
        public async Task<IActionResult> GetAllProfessorsWithSchedules()
        {
            var coursesLists = await _context.schedules
                .AsNoTracking()
                .Where(s => s.courses != null)
                .Select(s => s.courses)
                .ToListAsync();
            
            var grouped = coursesLists
                .SelectMany(c => c)
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
        [OutputCache(Duration = 3600, VaryByRouteValueNames = new[] { "name" })]
        public async Task<IActionResult> GetProfessorSchedule(string name)
        {
            if (string.IsNullOrEmpty(name))
            {
                return BadRequest("Professor name is required");
            }

            var decodedName = Uri.UnescapeDataString(name);

            var coursesLists = await _context.schedules
                .AsNoTracking()
                .Where(s => s.courses != null)
                .Select(s => s.courses)
                .ToListAsync();

            var courses = coursesLists
                .SelectMany(c => c)
                .Where(c => string.Equals(c.Professor?.Trim(), decodedName.Trim(), StringComparison.OrdinalIgnoreCase))
                .ToList();

            return Ok(courses);
        }
    }
}
