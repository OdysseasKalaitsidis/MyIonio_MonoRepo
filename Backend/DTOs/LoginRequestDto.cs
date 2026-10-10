using System.ComponentModel.DataAnnotations;

namespace MyIonio.DTOs
{
    public class LoginRequestDto
    {
        [Required, EmailAddress, MaxLength(254)]
        public string Email { get; set; } = null!;

        [Required, MaxLength(128)]
        public string Password { get; set; } = null!;
    }
}
