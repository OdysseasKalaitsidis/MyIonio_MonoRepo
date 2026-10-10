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
        private readonly DefaultHttpContext _httpContext;
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
            _httpContext = new DefaultHttpContext();
            _httpContext.Request.Scheme = "https";
            _mockHttpAccessor.SetupGet(a => a.HttpContext).Returns(_httpContext);

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
                ConfirmPassword = "Password123!",
                Name = "Duplicate",
                Surname = "User",
                Semester = "Α",
                Department = "Τμήμα Πληροφορικής"
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

        [Fact]
        public async Task AuthRegisterAsync_ShouldNormalizeEmailAndNames()
        {
            var request = new RegisterRequestDto
            {
                Email = "  Student@Example.COM ",
                Password = "Password!",
                ConfirmPassword = "Password!",
                Name = "  Ada ",
                Surname = " Lovelace  ",
                Semester = "Α",
                Department = "Τμήμα Πληροφορικής"
            };
            _mockPassHasher.Setup(h => h.HashPassword(It.IsAny<string>())).Returns("hashed_password");

            await _service.AuthRegisterAsync(request);

            var user = await _context.Users.SingleAsync();
            Assert.Equal("student@example.com", user.Email);
            Assert.Equal("Ada", user.FirstName);
            Assert.Equal("Lovelace", user.LastName);
        }

        [Fact]
        public async Task AuthLoginAsync_ShouldStoreHashedRefreshTokenAndSetHttpOnlyCookies()
        {
            var user = new User
            {
                Email = "student@example.com",
                PasswordHash = "stored_hash",
                FirstName = "Ada",
                LastName = "Lovelace",
                Semester = "Α",
                Department = "Τμήμα Πληροφορικής"
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            _mockPassHasher.Setup(h => h.VerifyPassword("Password!", "stored_hash")).Returns(true);

            var response = await _service.AuthLoginAsync(new LoginRequestDto
            {
                Email = " STUDENT@EXAMPLE.COM ",
                Password = "Password!"
            });

            var storedRefreshToken = await _context.RefreshTokens.SingleAsync();
            Assert.Null(response.RefreshToken);
            Assert.Equal(64, storedRefreshToken.Token.Length);
            Assert.All(storedRefreshToken.Token, character => Assert.True(Uri.IsHexDigit(character)));

            var setCookie = _httpContext.Response.Headers["Set-Cookie"].ToString();
            Assert.Contains($"{AuthService.AccessCookieName}=", setCookie);
            Assert.Contains($"{AuthService.RefreshCookieName}=", setCookie);
            Assert.Contains("httponly", setCookie, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("samesite=lax", setCookie, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("secure", setCookie, StringComparison.OrdinalIgnoreCase);
        }

    }
}
