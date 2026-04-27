namespace IonioPortal.DTOs
{
    public class RegisterRequestDto
    {
        public string Name { get; set; } = null!;   
        public string Surname { get; set; } = null!;
        public string Email { get; set; } = null!; 

        public string Semester { get; set; } = null!;
        public string? Department { get; set; }
        public string Password { get; set; } = null!;
        public string ConfirmPassword { get; set; } = null!; 
    }
}
