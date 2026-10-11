using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyIonio.Data;

namespace MyIonio.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/account")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class AccountController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AuthService _authService;

        public AccountController(AppDbContext context, AuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export()
        {
            if (!TryGetUserId(out var userId)) return Unauthorized();
            var user = await _context.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();

            var recommendations = await _context.UserRecommendation.AsNoTracking()
                .Include(r => r.UserAnswers).Where(r => r.UserId == userId).ToListAsync();
            var reviews = await _context.CourseReviews.AsNoTracking()
                .Where(r => r.UserId == userId).ToListAsync();

            return Ok(new
            {
                exportedAt = DateTime.UtcNow,
                account = new
                {
                    user.Id, user.Email, user.FirstName, user.LastName, user.Department, user.Semester,
                    user.Major, user.Minor, user.CreatedAt, user.HasCompletedTest, user.EnrolledCourses,
                    user.EnrolledCourseIds, authProvider = user.GoogleSubject == null ? "password" : "google",
                    user.AcceptedTermsVersion, user.TermsAcceptedAt,
                    user.AcknowledgedPrivacyVersion, user.PrivacyAcknowledgedAt
                },
                recommendations = recommendations.Select(r => new
                {
                    r.PrimaryMajor, r.SecondaryMajor, r.PrimaryToolbox, r.SecondaryToolbox,
                    r.ConfidenceLevel, r.ProfileType, r.Reasoning, r.CreatedAt,
                    answers = r.UserAnswers.Select(a => new { a.QuestionId, a.AnswerId })
                }),
                reviews = reviews.Select(r => new { r.CourseName, r.Rating, r.Comment, r.CreatedAt })
            });
        }

        [HttpDelete]
        public async Task<IActionResult> Delete([FromBody] DeleteAccountRequest request)
        {
            if (request.Confirmation != "DELETE")
                return BadRequest(new { message = "Type DELETE to confirm account deletion." });
            if (!TryGetUserId(out var userId)) return Unauthorized();

            var user = await _context.Users.SingleOrDefaultAsync(u => u.Id == userId);
            if (user == null) return NotFound();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            _authService.ClearAuthCookies();
            return NoContent();
        }

        private bool TryGetUserId(out Guid userId) =>
            Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
    }

    public sealed class DeleteAccountRequest
    {
        public string Confirmation { get; set; } = string.Empty;
    }
}
