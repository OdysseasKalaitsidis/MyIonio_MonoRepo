using BCrypt.Net;

namespace MyIonio.Auth.Services
{
    public class PasswordHasherauth
    {
        // Hash a password
        public virtual string HashPassword(string password)
        {
            // The WorkFactor 12 is a good balance between security and performance
            return BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);
        }

        // Verify a password against a hash
        public virtual bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }
    }
}

