namespace IonioPortal.DTOs
{
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? Semester { get; set; }
        public string? Department { get; set; }
        public Guid UserId { get; set; }

        public string RefreshToken { get; set; }
        public string? Major { get; set; }
        public string? Minor { get; set; }
    }
}
