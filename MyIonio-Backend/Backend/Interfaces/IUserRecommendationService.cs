using IonioPortal.DTOs;
using IonioPortal.Models;

namespace IonioPortal.Interfaces
{
    public interface IUserRecommendationService
    {
        Task<UserRecommendationDto?> GetByUserIdAsync(Guid userId);
    }
}
