using BCrypt.Net;

namespace IonioPortal.Auth.Services
{
    public class PasswordHasherauth
    {
        // Hash a password
        public string HashPassword(string password)
        {
            // The WorkFactor 12 is a good balance between security and performance
            return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
        }

        // Verify a password against a hash
        public bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }
    }
}
