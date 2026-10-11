using System.ComponentModel.DataAnnotations;

public class RegisterGoogleRequestDto
{
    [Required]
    public string IdToken { get; set; } = null!;

    [Required, StringLength(128, MinimumLength = 16)]
    public string Nonce { get; set; } = null!;

    [Required, RegularExpression("^(Α|Γ|Ε|Ζ)$")]
    public string Semester { get; set; } = null!;

    [Required, MaxLength(120)]
    public string? Department { get; set; }

    public bool AcceptTerms { get; set; }
    public bool AcknowledgePrivacy { get; set; }

    [Required, MaxLength(32)]
    public string TermsVersion { get; set; } = null!;

    [Required, MaxLength(32)]
    public string PrivacyVersion { get; set; } = null!;

    public RecommendationDto? Recommendation { get; set; }
}
