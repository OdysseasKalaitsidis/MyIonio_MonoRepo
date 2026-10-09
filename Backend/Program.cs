using MyIonio;
using MyIonio.Auth.Services;
using MyIonio.Services;
using MyIonio.Data;
using MyIonio.Interfaces;
using MyIonio.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using Prometheus;




var builder = WebApplication.CreateBuilder(args);

// FORCE PORT 80 for Docker compatibility
builder.WebHost.UseUrls("http://0.0.0.0:80", "http://0.0.0.0:8080");

Console.WriteLine("MyIonio Backend Starting...");
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");

// Configuration
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddUserSecrets<Program>(optional: true)
    .AddEnvironmentVariables();

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Configuration
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));


// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 60,
                QueueLimit = 5,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.AddPolicy<string>("Signup", httpContext =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 3,
                QueueLimit = 0,
                Window = TimeSpan.FromHours(1)
            }));

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// JWT Authentication setup
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
if (jwtSettings == null || string.IsNullOrEmpty(jwtSettings.Key))
    throw new InvalidOperationException("JWT key is missing in configuration!");

var keyBytes = Encoding.UTF8.GetBytes(jwtSettings.Key);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ClockSkew = TimeSpan.Zero
    };
    
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.ContainsKey("jwt"))
            {
                context.Token = context.Request.Cookies["jwt"];
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireClaim(System.Security.Claims.ClaimTypes.Role, "Admin"));
});

// CORS
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? "https://myionio.site,http://myionio.site,http://localhost:5173";
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries);
        var finalOrigins = new List<string>();
        foreach (var origin in origins)
        {
            var trimmed = origin.Trim().TrimEnd('/');
            if (!string.IsNullOrWhiteSpace(trimmed))
                finalOrigins.Add(trimmed);
        }

        policy.WithOrigins(finalOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Application Services
builder.Services.AddScoped<IQuestionsService, QuestionsService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<IUserRecommendationService, UserRecommendationService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<PasswordHasherauth>();
builder.Services.AddScoped<IExaminationScheduleService, ExaminationScheduleService>();
builder.Services.AddHttpClient();
builder.Services.AddHttpContextAccessor();


builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.ConfigureWarnings(warnings => warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddOutputCache();

var app = builder.Build();

// Middleware
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

// Use CORS MUST be before OutputCache and Authentication
app.UseCors("AllowFrontend");

app.UseOutputCache();

app.UseMiddleware<MyIonio.Middleware.ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}




// Rate Limiter
app.UseRateLimiter();


// app.UseHttpsRedirection(); // Disabled because Nginx handles SSL

app.UseAuthentication();
app.UseAuthorization();

// Prometheus Metrics
app.UseHttpMetrics(); 
app.MapMetrics();

app.MapControllers();

// Add a simple health check endpoint for Docker
app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));

// Auto-Migrate Database on Startup with Retries
for (int i = 0; i < 5; i++)
{
    try
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            if (db.Database.GetPendingMigrations().Any())
            {
                Console.WriteLine("Applying pending migrations...");
                db.Database.Migrate();
                Console.WriteLine("Migrations applied successfully.");
            }

            await OfficialCurriculumCatalog.SeedAsync(db);
            Console.WriteLine("Official 2025-2026 curriculum catalog is synchronized.");
            break;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration attempt {i + 1} failed: {ex.Message}");
        if (i == 4) 
        {
            Console.WriteLine("FATAL: Database migration or official curriculum synchronization failed after 5 attempts.");
            throw;
        }
        System.Threading.Thread.Sleep(5000);
    }
}

app.Run();
