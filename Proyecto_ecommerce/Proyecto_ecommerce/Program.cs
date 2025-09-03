using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Http.Features;
using Proyecto_ecommerce.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Aumentar límite de subida
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 200_000_000;
});

// CORS
var frontendOrigin = builder.Configuration["FrontendOrigin"];
if (string.IsNullOrEmpty(frontendOrigin))
{
    Console.WriteLine("Warning: FrontendOrigin not configured in appsettings.json. CORS might not work as expected in production.");
    // Fallback for local development if not set, but ensure it's set for production.
    frontendOrigin = "http://localhost:3000";
}

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("ProductionPolicy", policy => // Renamed for clarity
    {
        policy.WithOrigins(frontendOrigin) // Use configured origin
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Proyecto E-commerce API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

builder.Services.AddHttpClient();

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
{
    Console.WriteLine("CRITICAL WARNING: JWT Key is not configured or is too short in appsettings.json. Using an insecure default. THIS MUST BE FIXED FOR PRODUCTION.");
    jwtKey = "INSECURE_DEFAULT_KEY_CHANGE_THIS_IMMEDIATELY_TO_A_STRONG_32_CHAR_KEY"; // Fallback - DANGEROUS FOR PRODUCTION
}

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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddAuthorization();

var app = builder.Build();

app.MapGet("/routes", (IEnumerable<EndpointDataSource> endpointSources) =>
{
    var endpoints = endpointSources.SelectMany(es => es.Endpoints);
    return Results.Ok(endpoints.Select(e => e.DisplayName).ToList());
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("ProductionPolicy"); // Use the named policy
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("Aplicación .NET iniciada. Entorno: " + app.Environment.EnvironmentName);
Console.WriteLine($"CORS policy configured for origin: {frontendOrigin}");
app.Run();
