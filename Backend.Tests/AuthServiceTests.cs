using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http;
using Moq;
using MyIonio.Auth.Services;
using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Models;
using Xunit;

namespace MyIonio.Tests
{
    public class AuthServiceTests
    {
        private readonly AppDbContext _context;
        private readonly Mock<PasswordHasherauth> _mockPassHasher;
        private readonly Mock<IOptions<JwtSettings>> _mockJwtOptions;
        private readonly Mock<IConfiguration> _mockConfig;
        private readonly Mock<IHttpContextAccessor> _mockHttpAccessor;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            // Set up In-Memory Database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            _context = new AppDbContext(options);

            // Mock Dependencies
            _mockPassHasher = new Mock<PasswordHasherauth>();
            _mockJwtOptions = new Mock<IOptions<JwtSettings>>();
            _mockConfig = new Mock<IConfiguration>();
            _mockHttpAccessor = new Mock<IHttpContextAccessor>();

            _mockJwtOptions.Setup(o => o.Value).Returns(new JwtSettings 
            { 
                Key = "super_secret_key_for_testing_purposes_only",
                Issuer = "test",
                Audience = "test",
                ExpiryHours = 1
            });

            _service = new AuthService(
                _context, 
                _mockPassHasher.Object, 
                _mockJwtOptions.Object, 
                _mockConfig.Object, 
                new HttpClient(), 
                _mockHttpAccessor.Object);
        }

        [Fact]
        public async Task AuthRegisterAsync_ShouldCreateUser_WhenInputIsCorrect()
        {
            // Arrange
            var request = new RegisterRequestDto
            {
                Email = "test@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                Name = "John",
                Surname = "Doe"
            };
            _mockPassHasher.Setup(h => h.HashPassword(It.IsAny<string>())).Returns("hashed_password");

            // Act
            var result = await _service.AuthRegisterAsync(request);

            // Assert
            Assert.NotNull(result);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            Assert.NotNull(user);
            Assert.Equal("John", user.FirstName);
        }

        [Fact]
        public async Task AuthRegisterAsync_ShouldThrowException_WhenEmailAlreadyExists()
        {
            // Arrange
            _context.Users.Add(new User { Email = "duplicate@example.com", PasswordHash = "hash" });
            await _context.SaveChangesAsync();

            var request = new RegisterRequestDto
            {
                Email = "duplicate@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(() => _service.AuthRegisterAsync(request));
            Assert.Equal("This email already exists", exception.Message);
        }

        [Fact]
        public async Task AuthLoginAsync_ShouldThrowException_WhenPasswordIsIncorrect()
        {
            // Arrange
            var email = "login@example.com";
            _context.Users.Add(new User { Email = email, PasswordHash = "correct_hash" });
            await _context.SaveChangesAsync();

            _mockPassHasher.Setup(h => h.VerifyPassword("wrong_pass", "correct_hash")).Returns(false);

            var request = new LoginRequestDto { Email = email, Password = "wrong_pass" };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(() => _service.AuthLoginAsync(request));
            Assert.Equal("Invalid email or password", exception.Message);
        }
    }
}
