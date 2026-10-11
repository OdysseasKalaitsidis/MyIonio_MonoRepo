using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MyIonio;
using MyIonio.Controllers;
using MyIonio.Data;
using MyIonio.DTOs;
using MyIonio.Middleware;
using MyIonio.Models;

namespace MyIonio.Tests;

public sealed class LaunchSafetyTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task PublicReviews_DoNotExposeIdentityOrFreeText()
    {
        await using var context = CreateContext();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@example.com",
            FirstName = "Real",
            LastName = "Name",
            PasswordHash = "hash"
        };
        context.Users.Add(user);
        context.CourseReviews.Add(new CourseReview
        {
            CourseName = "Ασφάλεια",
            UserId = user.Id,
            User = user,
            Rating = 5,
            Comment = "private text"
        });
        await context.SaveChangesAsync();

        var result = await new CourseReviewController(context).GetReviews("Ασφάλεια");

        var ok = Assert.IsType<OkObjectResult>(result);
        var review = Assert.Single(Assert.IsAssignableFrom<IEnumerable<CourseReviewDto>>(ok.Value));
        Assert.Equal("Επαληθευμένος φοιτητής", review.UserName);
        Assert.Null(review.Comment);
    }

    [Fact]
    public async Task ReviewSubmission_RejectsFreeText()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var controller = new CourseReviewController(context)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) },
                        "test"))
                }
            }
        };

        var result = await controller.SubmitReview(new SubmitReviewDto
        {
            CourseName = "Μάθημα",
            Rating = 4,
            Comment = "free text"
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(context.CourseReviews);
    }

    [Fact]
    public async Task CookieAuthenticatedUnsafeRequest_WithoutOrigin_IsBlocked()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AllowedOrigins"] = "https://myionio.site"
            })
            .Build();
        var called = false;
        var middleware = new CookieOriginValidationMiddleware(_ =>
        {
            called = true;
            return Task.CompletedTask;
        }, configuration);
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Headers.Cookie = AuthService.AccessCookieName + "=token";

        await middleware.InvokeAsync(context);

        Assert.False(called);
        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
    }

    [Fact]
    public async Task CookieAuthenticatedUnsafeRequest_FromAllowedOrigin_Continues()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AllowedOrigins"] = "https://myionio.site"
            })
            .Build();
        var called = false;
        var middleware = new CookieOriginValidationMiddleware(_ =>
        {
            called = true;
            return Task.CompletedTask;
        }, configuration);
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Post;
        context.Request.Headers.Cookie = AuthService.AccessCookieName + "=token";
        context.Request.Headers.Origin = "https://myionio.site";
        context.Request.Headers["Sec-Fetch-Site"] = "same-site";

        await middleware.InvokeAsync(context);

        Assert.True(called);
    }
}
