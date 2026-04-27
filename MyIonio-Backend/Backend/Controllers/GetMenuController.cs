using IonioPortal.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IonioPortal.Controllers
{
    [ApiController]
    [Route("api/")]
    public class GetMenuController: ControllerBase
    {
        private readonly AppDbContext _context; 

        public GetMenuController(AppDbContext context)
        {
            _context = context;
        }
        
        [HttpGet("menu")]
        public async Task<IActionResult> getMenu()
        {
            try
            {
                var greeceTimeZone = TimeZoneInfo.FindSystemTimeZoneById("GTB Standard Time");
                var nowLocal = TimeZoneInfo.ConvertTime(DateTime.UtcNow, greeceTimeZone);
                var startOfToday = nowLocal.Date;
                var endOfToday = startOfToday.AddDays(1).AddTicks(-1);

                // convert to UTC for PostgreSQL
                var startUtc = startOfToday.ToUniversalTime();
                var endUtc = endOfToday.ToUniversalTime();

                // async query
                var menus = await _context.weekly_menus
                    .Where(x => x.week_start <= endUtc && x.week_end >= startUtc)
                    .ToListAsync();

                if (!menus.Any())
                    return NotFound("No menus found for today");

                return Ok(menus);
            }
            catch (Exception ex)
            {
                // log exception
                return StatusCode(500, ex.Message);
            }
        }


    }
}
