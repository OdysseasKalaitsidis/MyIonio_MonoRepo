using System.ComponentModel.DataAnnotations;

namespace MyIonio.DTOs
{
    public class RegisterRequestDto
    {
        [Required, StringLength(80, MinimumLength = 1)]
        public string Name { get; set; } = null!;   

        [Required, StringLength(80, MinimumLength = 1)]
        public string Surname { get; set; } = null!;

        [Required, EmailAddress, MaxLength(254)]
        public string Email { get; set; } = null!;

        [Required, RegularExpression("^(Α|Γ|Ε|Ζ)$", ErrorMessage = "Only active semesters Α, Γ, Ε and Ζ are available.")]
        public string Semester { get; set; } = null!;

        [Required, MaxLength(120)]
        public string? Department { get; set; }

        [Required, StringLength(128, MinimumLength = 8)]
        [RegularExpression("^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,128}$", ErrorMessage = "Password must contain an uppercase letter and a symbol.")]
        public string Password { get; set; } = null!;

        [Required, MaxLength(128)]
        public string ConfirmPassword { get; set; } = null!;

        public bool AcceptTerms { get; set; }
        public bool AcknowledgePrivacy { get; set; }

        [Required, MaxLength(32)]
        public string TermsVersion { get; set; } = null!;

        [Required, MaxLength(32)]
        public string PrivacyVersion { get; set; } = null!;
    }
}
