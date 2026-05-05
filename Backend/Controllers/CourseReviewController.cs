using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Kafka;
using MyIonio.Kafka.Events;
using MyIonio.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MyIonio.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseReviewController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IKafkaProducerService _kafkaProducer;

        public CourseReviewController(AppDbContext context, IKafkaProducerService kafkaProducer)
        {
            _context = context;
            _kafkaProducer = kafkaProducer;
        }

        [HttpGet("{courseName}")]
        [OutputCache(Duration = 300, VaryByRouteValueNames = new[] { "courseName" })]
        public async Task<IActionResult> GetReviews(string courseName)
        {
            var reviews = await _context.CourseReviews
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.CourseName == courseName)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new CourseReviewDto
                {
                    Id = r.Id,
                    CourseName = r.CourseName,
                    UserName = r.User != null ? $"{r.User.FirstName} {r.User.LastName}" : "Anonymous",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }

        [HttpGet("{courseName}/summary")]
        [OutputCache(Duration = 600, VaryByRouteValueNames = new[] { "courseName" })]
        public async Task<IActionResult> GetSummary(string courseName)
        {
            var reviews = await _context.CourseReviews
                .AsNoTracking()
                .Where(r => r.CourseName == courseName)
                .ToListAsync();

            if (!reviews.Any())
            {
                return Ok(new CourseRatingSummaryDto
                {
                    CourseName = courseName,
                    AverageRating = 0,
                    TotalReviews = 0
                });
            }

            return Ok(new CourseRatingSummaryDto
            {
                CourseName = courseName,
                AverageRating = Math.Round(reviews.Average(r => r.Rating), 1),
                TotalReviews = reviews.Count
            });
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewDto dto)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            // Check if user already reviewed this course
            var existingReview = await _context.CourseReviews
                .FirstOrDefaultAsync(r => r.CourseName == dto.CourseName && r.UserId == userId);

            if (existingReview != null)
            {
                // Update existing review
                existingReview.Rating = dto.Rating;
                existingReview.Comment = dto.Comment;
                existingReview.CreatedAt = DateTime.UtcNow;
                _context.CourseReviews.Update(existingReview);
            }
            else
            {
                // Create new review
                var review = new CourseReview
                {
                    CourseName = dto.CourseName,
                    UserId = userId,
                    Rating = dto.Rating,
                    Comment = dto.Comment
                };
                await _context.CourseReviews.AddAsync(review);
            }

            await _context.SaveChangesAsync();

            // Publish a Kafka event so the AI service can process the review asynchronously.
            // This is fire-and-forget: Kafka failures are logged but never fail the HTTP response.
            var reviewId = existingReview?.Id ?? _context.CourseReviews
                .Local
                .FirstOrDefault(r => r.CourseName == dto.CourseName && r.UserId == userId)?.Id
                ?? Guid.Empty;

            _ = _kafkaProducer.ProduceAsync("course-review-submitted", new CourseReviewSubmittedEvent(
                ReviewId: reviewId,
                CourseName: dto.CourseName,
                Rating: dto.Rating,
                Comment: dto.Comment,
                UserId: userId,
                SubmittedAt: DateTime.UtcNow
            ));

            return Ok(new { message = "Review submitted successfully." });
        }
    }
}
