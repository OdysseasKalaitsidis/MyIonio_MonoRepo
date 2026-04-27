// Services/UserRecommendationService.cs
using IonioPortal.Data;
using IonioPortal.DTOs;
using IonioPortal.Interfaces;
using IonioPortal.Models;
using Microsoft.EntityFrameworkCore;

public class UserRecommendationService : IUserRecommendationService
{
    private readonly AppDbContext _context;

    public UserRecommendationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UserRecommendationDto?> GetByUserIdAsync(Guid userId)
    {
        var result = await _context.UserRecommendation
            .Where(r => r.UserId == userId)
            .Select(r => new
            {
                r.PrimaryMajor,
                r.SecondaryMajor,
                r.PrimaryToolbox,
                r.SecondaryToolbox,
                r.ConfidenceLevel,
                r.ProfileType,
                r.ReasoningJson 
            })
            .FirstOrDefaultAsync();

        if (result == null) return null;

        return new UserRecommendationDto
        {
            PrimaryMajor = result.PrimaryMajor,
            SecondaryMajor = result.SecondaryMajor,
            PrimaryToolbox = result.PrimaryToolbox,
            SecondaryToolbox = result.SecondaryToolbox,
            ConfidenceLevel = result.ConfidenceLevel,
            ProfileType = result.ProfileType,
            Reasoning = System.Text.Json.JsonSerializer.Deserialize<ReasoningDto>(result.ReasoningJson)!
        };
    }
}
