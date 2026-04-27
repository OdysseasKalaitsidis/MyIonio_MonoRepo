namespace IonioPortal.Models
{
    public class RefreshToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Token { get; set; } // the actual refresh token string
        public Guid UserId { get; set; }  // owner of the token
        public User User { get; set; }
        public DateTime Expires { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRevoked { get; set; } = false;

        public bool IsActive => !IsRevoked && Expires > DateTime.UtcNow;
    }

}
