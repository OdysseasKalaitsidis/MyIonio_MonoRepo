using MyIonio.DTOs;
using MyIonio.Models;

namespace MyIonio.Interfaces
{
    public interface IUserRecommendationService
    {
        Task<UserRecommendationDto?> GetByUserIdAsync(Guid userId);
    }
}

