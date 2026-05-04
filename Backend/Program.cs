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
using OpenAI;
using Microsoft.AspNetCore.RateLimiting;




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

// External Services
builder.Services.AddSingleton(_ =>
{
    var apiKey = builder.Configuration["OpenAI:ApiKey"];
    return new OpenAIClient(apiKey);
});

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

// CORS
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173";
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries);
        var finalOrigins = new List<string>();
        foreach (var origin in origins)
        {
            var trimmed = origin.Trim().TrimEnd('/');
            finalOrigins.Add(trimmed);
            finalOrigins.Add(trimmed + "/");
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
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Middleware
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

app.UseMiddleware<MyIonio.Middleware.ExceptionHandlingMiddleware>();

// Use CORS should be as early as possible
app.UseCors("AllowFrontend");

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

app.MapControllers();

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
            break;
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration attempt {i + 1} failed: {ex.Message}");
        if (i == 4) throw;
        System.Threading.Thread.Sleep(5000);
    }
}

app.Run();
