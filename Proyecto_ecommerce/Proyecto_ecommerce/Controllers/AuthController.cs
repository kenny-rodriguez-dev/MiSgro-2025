using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using BCrypt.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration; // Required for IConfiguration
// Asegúrate de tener este using para [Authorize]
using Microsoft.AspNetCore.Authorization;


namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        // ELIMINADO: private static Dictionary<string, ResetCodeInfo> _resetCodes = new Dictionary<string, ResetCodeInfo>();

        public AuthController(AppDbContext db, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _db = db;
            _httpClient = httpClientFactory.CreateClient();
            _configuration = configuration;
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
            {
                Console.WriteLine("CRITICAL WARNING: JWT Key is missing or too short. Using an insecure default. THIS MUST BE FIXED FOR PRODUCTION.");
                jwtKey = "INSECURE_DEFAULT_KEY_CHANGE_THIS_IMMEDIATELY_TO_A_STRONG_32_CHAR_KEY";
            }
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("userId", user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role), // Este es el claim que usará [Authorize(Roles="...")]
                new Claim("firstName", user.FirstName ?? ""),
                new Claim("lastName", user.LastName ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(Convert.ToDouble(_configuration["Jwt:HoursToExpire"] ?? "1")),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = credentials
            };
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private bool IsPasswordComplex(string password)
        {
            var pattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$";
            return Regex.IsMatch(password, pattern);
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User newUser)
        {
            if (newUser == null)
                return BadRequest("Usuario no válido.");
            bool exists = await _db.Users.AnyAsync(u => u.Email == newUser.Email);
            if (exists)
            {
                return BadRequest("Ese email ya está registrado.");
            }
            if (!IsPasswordComplex(newUser.PasswordHash))
            {
                return BadRequest("La contraseña debe tener al menos 8 caracteres, " +
                                  "incluyendo mayúsculas, minúsculas, dígitos y símbolos.");
            }
            newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newUser.PasswordHash);
            newUser.CreatedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(newUser.Role))
                newUser.Role = "User";
            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();
            var emailService = new EmailService();
            await emailService.SendEmailAsync(newUser.Email, "Bienvenido a nuestro E-commerce",
                "Gracias por registrarte. Por favor confirma tu cuenta."); // Considerar implementar confirmación real
            return Ok(new { Message = "Usuario registrado con éxito." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (model == null) return BadRequest(new { success = false, message = "Solicitud inválida." });
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
                return Unauthorized(new { success = false, message = "Correo no registrado." });

            if (string.IsNullOrEmpty(user.PasswordHash)) // Caso para usuarios de social login sin contraseña local
                return Unauthorized(new { success = false, message = "Este correo fue registrado mediante un proveedor social. Por favor, inicia sesión con ese proveedor o define una contraseña local." });

            bool verified = BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash);
            if (!verified)
                return Unauthorized(new { success = false, message = "Credenciales inválidas." });

            var tokenString = GenerateJwtToken(user);
            return Ok(new
            {
                success = true,
                token = tokenString,
                userData = new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Role
                }
            });
        }

        [HttpPost("sendresetcode")]
        public async Task<IActionResult> SendResetCode([FromBody] EmailRequest req)
        {
            if (req == null || string.IsNullOrEmpty(req.Email))
                return BadRequest("Email requerido.");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user == null)
            {
                return NotFound("No existe usuario con ese correo.");
            }

            var existingCodeInfo = await _db.PasswordResetCodes.FirstOrDefaultAsync(prc => prc.Email == req.Email);

            if (existingCodeInfo != null)
            {
                if (existingCodeInfo.BlockedUntil.HasValue && existingCodeInfo.BlockedUntil.Value > DateTime.UtcNow)
                {
                    var bloqueadoPor = (existingCodeInfo.BlockedUntil.Value - DateTime.UtcNow).TotalSeconds;
                    return BadRequest($"Demasiados intentos. Intenta de nuevo en {Math.Ceiling(bloqueadoPor)} segundos.");
                }
                // Si no está bloqueado, lo eliminamos para generar uno nuevo o si ya expiró
                _db.PasswordResetCodes.Remove(existingCodeInfo);
            }

            var random = new Random();
            var code = random.Next(100000, 999999).ToString();
            var expires = DateTime.UtcNow.AddMinutes(2);

            var newCodeInfo = new PasswordResetCode
            {
                Email = req.Email,
                Code = code,
                ExpiresAt = expires,
                AttemptCount = 0,
                BlockedUntil = null // No bloqueado inicialmente
            };

            _db.PasswordResetCodes.Add(newCodeInfo);
            await _db.SaveChangesAsync();

            var emailService = new EmailService();
            var body = $@"
Tu código de verificación es: {code}
Vence en 2 minutos.
Si fallas 5 veces, se bloqueará por 2 minutos.";
            await emailService.SendEmailAsync(req.Email, "Código para cambiar contraseña", body);

            return Ok("Código enviado al correo.");
        }

        [HttpPost("verifyresetcode")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyCodeRequest req)
        {
            if (req == null || string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Code))
                return BadRequest("Datos inválidos.");

            var stored = await _db.PasswordResetCodes.FirstOrDefaultAsync(prc => prc.Email == req.Email);
            if (stored == null)
                return NotFound("No se ha enviado código a ese correo o ya fue usado/expirado.");

            if (stored.BlockedUntil.HasValue && stored.BlockedUntil.Value > DateTime.UtcNow)
            {
                var bloqueadoPor = (stored.BlockedUntil.Value - DateTime.UtcNow).TotalSeconds;
                return BadRequest($"Demasiados intentos. Intenta de nuevo en {Math.Ceiling(bloqueadoPor)} segundos.");
            }

            if (DateTime.UtcNow > stored.ExpiresAt)
            {
                _db.PasswordResetCodes.Remove(stored);
                await _db.SaveChangesAsync();
                return BadRequest("El código ha expirado. Por favor, solicita uno nuevo.");
            }

            if (stored.Code != req.Code)
            {
                stored.AttemptCount++;
                if (stored.AttemptCount >= 5)
                {
                    stored.BlockedUntil = DateTime.UtcNow.AddMinutes(2);
                }
                await _db.SaveChangesAsync(); // Guardar el incremento de intentos y posible bloqueo

                if (stored.BlockedUntil.HasValue && stored.BlockedUntil.Value > DateTime.UtcNow)
                    return BadRequest("Código incorrecto. Demasiados intentos fallidos. Intenta de nuevo en 2 minutos.");
                else
                    return BadRequest($"Código incorrecto. Intentos restantes: {5 - stored.AttemptCount}");
            }
            // Código correcto, pero no lo eliminamos aún. Se eliminará al cambiar la contraseña.
            return Ok("Código válido. Puedes proceder a cambiar la contraseña.");
        }

        [HttpPost("setlocalpassword")]
        public async Task<IActionResult> SetLocalPassword([FromBody] SetPasswordRequest req)
        {
            if (req == null || string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.NewPassword))
                return BadRequest("Datos inválidos para definir/cambiar contraseña.");

            var codeInfo = await _db.PasswordResetCodes.FirstOrDefaultAsync(prc => prc.Email == req.Email);
            if (codeInfo == null)
            {
                return BadRequest("No se encontró una solicitud de restablecimiento de contraseña válida o el código ya fue usado/expiró. Solicita uno nuevo.");
            }
            if (DateTime.UtcNow > codeInfo.ExpiresAt)
            {
                _db.PasswordResetCodes.Remove(codeInfo);
                await _db.SaveChangesAsync();
                return BadRequest("El código ha expirado. Por favor, solicita uno nuevo.");
            }
            if (codeInfo.BlockedUntil.HasValue && codeInfo.BlockedUntil.Value > DateTime.UtcNow)
            {
                return BadRequest("La verificación de código está bloqueada debido a demasiados intentos. Solicita uno nuevo después del período de bloqueo.");
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
            if (user == null)
                return NotFound("Usuario no encontrado.");

            if (!IsPasswordComplex(req.NewPassword))
            {
                return BadRequest("La contraseña debe tener al menos 8 caracteres, " +
                                  "incluyendo mayúsculas, minúsculas, dígitos y símbolos.");
            }

            const double HOURS_BETWEEN_CHANGES = 24; // O el valor que consideres apropiado
            if (user.LastPasswordChange.HasValue && user.LastPasswordChangeMethod == "LocalReset") // Chequea solo si el último fue LocalReset
            {
                var timeSinceLast = DateTime.UtcNow - user.LastPasswordChange.Value;
                if (timeSinceLast.TotalHours < HOURS_BETWEEN_CHANGES)
                {
                    var falta = HOURS_BETWEEN_CHANGES - timeSinceLast.TotalHours;
                    return BadRequest($"No puedes cambiar tu contraseña tan seguido usando este método. Espera {falta:F1} horas más.");
                }
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            user.LastPasswordChange = DateTime.UtcNow;
            user.LastPasswordChangeMethod = "LocalReset";

            _db.PasswordResetCodes.Remove(codeInfo); // Eliminar el código después de un uso exitoso
            await _db.SaveChangesAsync();

            var emailService = new EmailService();
            await emailService.SendEmailAsync(
                req.Email,
                "Contraseña Actualizada",
                "Tu contraseña ha sido cambiada con éxito usando el código de verificación. Si no fuiste tú, ponte en contacto con soporte."
            );
            return Ok("Contraseña local modificada con éxito.");
        }

        [HttpPut("changepassword")]
        [Authorize] // Solo usuarios autenticados pueden acceder
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            // Obtener el userId del token JWT para mayor seguridad
            var userIdFromToken = User.FindFirstValue("userId");
            if (string.IsNullOrEmpty(userIdFromToken) || !int.TryParse(userIdFromToken, out int tokenUserId))
            {
                return Unauthorized("Token inválido o userId no encontrado en el token.");
            }

            if (req == null ||
                string.IsNullOrEmpty(req.OldPassword) ||
                string.IsNullOrEmpty(req.NewPassword) ||
                string.IsNullOrEmpty(req.ConfirmPassword))
            {
                return BadRequest("Datos incompletos para cambiar contraseña.");
            }
            // req.UserId ahora es solo para verificación, la autoridad es el tokenUserId
            if (req.UserId != tokenUserId)
            {
                return Forbid("No puedes cambiar la contraseña de otro usuario.");
            }

            if (req.NewPassword != req.ConfirmPassword)
            {
                return BadRequest("Las contraseñas nuevas no coinciden.");
            }

            var user = await _db.Users.FindAsync(tokenUserId); // Usar userId del token
            if (user == null)
                return NotFound("Usuario no encontrado."); // Esto no debería pasar si el token es válido

            if (string.IsNullOrEmpty(user.PasswordHash)) // Usuario de social login sin contraseña local definida
            {
                return BadRequest("Este usuario no tiene una contraseña local definida. Use la opción 'Definir Contraseña Local'.");
            }

            bool verified = BCrypt.Net.BCrypt.Verify(req.OldPassword, user.PasswordHash);
            if (!verified)
                return BadRequest("La contraseña actual no coincide.");

            const double HOURS_BETWEEN_CHANGES = 24;
            if (user.LastPasswordChange.HasValue && user.LastPasswordChangeMethod == "AccountChange") // Chequea solo si el último fue AccountChange
            {
                var timeSinceLast = DateTime.UtcNow - user.LastPasswordChange.Value;
                if (timeSinceLast.TotalHours < HOURS_BETWEEN_CHANGES)
                {
                    var falta = HOURS_BETWEEN_CHANGES - timeSinceLast.TotalHours;
                    return BadRequest($"No puedes cambiar tu contraseña tan seguido desde tu cuenta. Espera {falta:F1} horas más.");
                }
            }

            if (!IsPasswordComplex(req.NewPassword))
            {
                return BadRequest("La contraseña nueva debe tener al menos 8 caracteres, " +
                                  "incluyendo mayúsculas, minúsculas, dígitos y símbolos.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            user.LastPasswordChange = DateTime.UtcNow;
            user.LastPasswordChangeMethod = "AccountChange";
            await _db.SaveChangesAsync();

            var emailService = new EmailService();
            await emailService.SendEmailAsync(
                user.Email,
                "Contraseña Actualizada desde tu Cuenta",
                "Has cambiado tu contraseña exitosamente desde la configuración de tu cuenta. Si no fuiste tú, contáctanos de inmediato."
            );
            return Ok("Contraseña actualizada correctamente.");
        }


        // Social Logins (Google, Facebook, X) - La lógica interna de estos no necesita cambiar para los puntos solicitados
        // Pero es importante que el JWT que generan incluya el rol para que [Authorize(Roles="...")] funcione.
        // ... (código de GoogleCallback, FacebookCallback, XCallback y sus helpers sin cambios)
        [HttpGet("google/callback")]
        public async Task<IActionResult> GoogleCallback([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code))
                return Ok(new { success = false, message = "No code from Google." });
            var tokenResponse = await ExchangeGoogleCodeForToken(code);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.access_token))
            {
                return Ok(new { success = false, message = "Google token exchange failed." });
            }
            var userProfile = await GetGoogleUserProfile(tokenResponse.access_token);
            if (userProfile == null || string.IsNullOrEmpty(userProfile.email))
            {
                return Ok(new { success = false, message = "Error al obtener perfil de Google o email no disponible." });
            }
            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == userProfile.email);
            bool isNew = false;
            if (existingUser == null)
            {
                existingUser = new User
                {
                    FirstName = userProfile.given_name ?? userProfile.name ?? userProfile.email.Split('@')[0],
                    LastName = userProfile.family_name ?? "",
                    Email = userProfile.email,
                    PasswordHash = "", // Vacío o placeholder seguro para cuentas sociales
                    Role = "User", // Rol por defecto
                    CreatedAt = DateTime.UtcNow
                };
                _db.Users.Add(existingUser);
                await _db.SaveChangesAsync();
                isNew = true;
            }
            else // Usuario existente
            {
                if (string.IsNullOrEmpty(existingUser.PasswordHash)) // Si el PasswordHash está vacío, es un usuario social
                {
                    // Opcional: Actualizar nombre/apellido si cambiaron en Google
                    bool profileUpdated = false;
                    if ((existingUser.FirstName != (userProfile.given_name ?? userProfile.name ?? userProfile.email.Split('@')[0])) ||
                        (existingUser.LastName != (userProfile.family_name ?? "")))
                    {
                        existingUser.FirstName = userProfile.given_name ?? userProfile.name ?? userProfile.email.Split('@')[0];
                        existingUser.LastName = userProfile.family_name ?? "";
                        profileUpdated = true;
                    }
                    if (profileUpdated) await _db.SaveChangesAsync();
                }
                // Si tiene PasswordHash, es un usuario local que también usa Google para loguearse. No hacer nada con el perfil.
            }

            if (isNew)
            {
                var emailService = new EmailService();
                await emailService.SendEmailAsync(existingUser.Email, "Bienvenido a nuestro E-commerce",
                    "Gracias por registrarte (vía Google).");
            }
            var tokenString = GenerateJwtToken(existingUser); // Asegúrate que esto genere el token con el ROL
            return Ok(new
            {
                success = true,
                token = tokenString,
                userData = new
                {
                    existingUser.Id,
                    existingUser.FirstName,
                    existingUser.LastName,
                    existingUser.Email,
                    existingUser.Role
                }
            });
        }

        [HttpGet("facebook/callback")]
        public async Task<IActionResult> FacebookCallback([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code))
                return Ok(new { success = false, message = "No code from Facebook." });
            var tokenResponse = await ExchangeFacebookCodeForToken(code);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.access_token))
            {
                return Ok(new { success = false, message = "Facebook token exchange failed." });
            }
            var userProfile = await GetFacebookUserProfile(tokenResponse.access_token);
            if (userProfile == null || string.IsNullOrEmpty(userProfile.id))
            {
                return Ok(new { success = false, message = "Error al obtener perfil de Facebook o ID no disponible." });
            }
            if (string.IsNullOrEmpty(userProfile.email))
            {
                // Generar un email placeholder si Facebook no lo provee
                userProfile.email = $"{userProfile.id}@facebook-placeholder.com";
                Console.WriteLine($"Warning: Placeholder email generated for Facebook user ID {userProfile.id}");
            }

            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == userProfile.email);
            bool isNew = false;
            if (existingUser == null)
            {
                var nameParts = (userProfile.name ?? "").Split(' ', 2);
                existingUser = new User
                {
                    FirstName = nameParts.Length > 0 ? nameParts[0] : userProfile.email.Split('@')[0],
                    LastName = nameParts.Length > 1 ? nameParts[1] : "",
                    Email = userProfile.email,
                    PasswordHash = "", // Vacío o placeholder seguro
                    Role = "User",
                    CreatedAt = DateTime.UtcNow
                };
                _db.Users.Add(existingUser);
                await _db.SaveChangesAsync();
                isNew = true;
            }
            else // Usuario existente
            {
                if (string.IsNullOrEmpty(existingUser.PasswordHash)) // Usuario social
                {
                    bool profileUpdated = false;
                    var nameParts = (userProfile.name ?? "").Split(' ', 2);
                    string fbFirstName = nameParts.Length > 0 ? nameParts[0] : userProfile.email.Split('@')[0];
                    string fbLastName = nameParts.Length > 1 ? nameParts[1] : "";

                    if (existingUser.FirstName != fbFirstName || existingUser.LastName != fbLastName)
                    {
                        existingUser.FirstName = fbFirstName;
                        existingUser.LastName = fbLastName;
                        profileUpdated = true;
                    }
                    if (profileUpdated) await _db.SaveChangesAsync();
                }
            }
            if (isNew)
            {
                var emailService = new EmailService();
                await emailService.SendEmailAsync(existingUser.Email, "Bienvenido a nuestro E-commerce",
                    "Gracias por registrarte (vía Facebook).");
            }
            var tokenString = GenerateJwtToken(existingUser);
            return Ok(new
            {
                success = true,
                token = tokenString,
                userData = new
                {
                    existingUser.Id,
                    existingUser.FirstName,
                    existingUser.LastName,
                    existingUser.Email,
                    existingUser.Role
                }
            });
        }

        [HttpGet("x/callback")]
        public async Task<IActionResult> XCallback([FromQuery] string code, [FromQuery] string code_verifier)
        {
            if (string.IsNullOrEmpty(code))
                return Ok(new { success = false, message = "No code from X." });
            if (string.IsNullOrEmpty(code_verifier)) // Necesario para PKCE
                return Ok(new { success = false, message = "No code_verifier provided for X PKCE flow." });

            var tokenResponse = await ExchangeXCodeForToken(code, code_verifier);
            if (tokenResponse == null || string.IsNullOrEmpty(tokenResponse.access_token))
            {
                return Ok(new { success = false, message = "X token exchange failed." });
            }

            XUserProfile? userProfile = null;
            XUserV2Response? xUserV2 = await GetXUserV2Details(tokenResponse.access_token);

            if (xUserV2 != null && !string.IsNullOrEmpty(xUserV2.id))
            {
                userProfile = new XUserProfile
                {
                    id = xUserV2.id,
                    displayName = xUserV2.name, // 'name' en v2 es el display name
                    username = xUserV2.username,
                    email = xUserV2.email // El campo email podría no estar disponible
                };
            }

            if (userProfile == null || string.IsNullOrEmpty(userProfile.id))
            {
                return Ok(new { success = false, message = "Error al obtener identificador único del perfil de X." });
            }

            if (string.IsNullOrEmpty(userProfile.email))
            {
                userProfile.email = $"{userProfile.id}@x-placeholder.com";
                Console.WriteLine($"Warning: Placeholder email generated for X user ID {userProfile.id}");
            }

            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == userProfile.email);
            bool isNew = false;
            if (existingUser == null)
            {
                existingUser = new User
                {
                    FirstName = !string.IsNullOrEmpty(userProfile.displayName) ? userProfile.displayName
                                : !string.IsNullOrEmpty(userProfile.username) ? userProfile.username
                                : userProfile.id, // Fallback al ID si no hay nombre
                    LastName = "", // X no separa first/last name
                    Email = userProfile.email,
                    PasswordHash = "", // Vacío o placeholder seguro
                    Role = "User",
                    CreatedAt = DateTime.UtcNow
                };
                _db.Users.Add(existingUser);
                await _db.SaveChangesAsync();
                isNew = true;
            }
            else // Usuario existente
            {
                if (string.IsNullOrEmpty(existingUser.PasswordHash)) // Usuario social
                {
                    bool profileUpdated = false;
                    string xDisplayName = !string.IsNullOrEmpty(userProfile.displayName) ? userProfile.displayName
                                        : !string.IsNullOrEmpty(userProfile.username) ? userProfile.username
                                        : userProfile.id;
                    if (existingUser.FirstName != xDisplayName)
                    {
                        existingUser.FirstName = xDisplayName;
                        existingUser.LastName = ""; // X no tiene last name separado
                        profileUpdated = true;
                    }
                    if (profileUpdated) await _db.SaveChangesAsync();
                }
            }
            if (isNew)
            {
                var emailService = new EmailService();
                await emailService.SendEmailAsync(existingUser.Email, "Bienvenido a nuestro E-commerce",
                    "Gracias por registrarte (vía X).");
            }

            var tokenString = GenerateJwtToken(existingUser);
            return Ok(new
            {
                success = true,
                token = tokenString,
                userData = new
                {
                    existingUser.Id,
                    existingUser.FirstName,
                    existingUser.LastName,
                    existingUser.Email,
                    existingUser.Role
                }
            });
        }


        private async Task<TokenResponse?> ExchangeGoogleCodeForToken(string code)
        {
            var clientId = _configuration["Authentication:Google:ClientId"];
            var clientSecret = _configuration["Authentication:Google:ClientSecret"];
            var redirectUri = _configuration["Authentication:Google:RedirectUri"]; // Asegúrate que este sea el que usa el frontend
            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(redirectUri))
            {
                Console.WriteLine("Error: Google OAuth configuration is missing in appsettings.");
                return null;
            }
            var tokenEndpoint = "https://oauth2.googleapis.com/token";
            var requestBody = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "code", code },
                { "client_id", clientId },
                { "client_secret", clientSecret },
                { "redirect_uri", redirectUri },
                { "grant_type", "authorization_code" }
            });
            var response = await _httpClient.PostAsync(tokenEndpoint, requestBody);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Error exchanging Google code: {response.StatusCode} - {errorContent}");
                return null;
            }
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TokenResponse>(content);
        }
        private async Task<GoogleUserProfile?> GetGoogleUserProfile(string accessToken)
        {
            _httpClient.DefaultRequestHeaders.Authorization =
               new AuthenticationHeaderValue("Bearer", accessToken);
            var res = await _httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
            if (!res.IsSuccessStatusCode) return null;
            var content = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<GoogleUserProfile>(content);
        }

        private async Task<TokenResponse?> ExchangeFacebookCodeForToken(string code)
        {
            var fbClientId = _configuration["Authentication:Facebook:ClientId"];
            var fbClientSecret = _configuration["Authentication:Facebook:ClientSecret"];
            var fbRedirectUri = _configuration["Authentication:Facebook:RedirectUri"];
            if (string.IsNullOrEmpty(fbClientId) || string.IsNullOrEmpty(fbClientSecret) || string.IsNullOrEmpty(fbRedirectUri))
            {
                Console.WriteLine("Error: Facebook OAuth configuration is missing in appsettings.");
                return null;
            }
            var tokenUrl = $"https://graph.facebook.com/v16.0/oauth/access_token?client_id={fbClientId}&redirect_uri={fbRedirectUri}&client_secret={fbClientSecret}&code={code}";
            var response = await _httpClient.GetAsync(tokenUrl);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Error exchanging Facebook code: {response.StatusCode} - {errorContent}");
                return null;
            }
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TokenResponse>(content);
        }

        private async Task<FacebookUserProfile?> GetFacebookUserProfile(string accessToken)
        {
            var fields = "id,name,email,first_name,last_name";
            var profileUrl = $"https://graph.facebook.com/v16.0/me?fields={fields}&access_token={accessToken}";
            var res = await _httpClient.GetAsync(profileUrl);
            if (!res.IsSuccessStatusCode) return null;
            var content = await res.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<FacebookUserProfile>(content);
        }
        private async Task<TokenResponse?> ExchangeXCodeForToken(string code, string codeVerifier)
        {
            var xClientId = _configuration["Authentication:X:ClientId"];
            var xRedirectUri = _configuration["Authentication:X:RedirectUri"];

            if (string.IsNullOrEmpty(xClientId) || string.IsNullOrEmpty(xRedirectUri))
            {
                Console.WriteLine("Error: X OAuth configuration (ClientId or RedirectUri) is missing in appsettings.");
                return null;
            }
            var tokenEndpoint = "https://api.twitter.com/2/oauth2/token";
            var requestBody = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                { "code", code },
                { "grant_type", "authorization_code" },
                { "client_id", xClientId },
                { "redirect_uri", xRedirectUri },
                { "code_verifier", codeVerifier }
            });
            // Para clientes públicos (como una SPA que maneja el callback directamente) con PKCE,
            // no se usa Basic Auth (Client ID + Secret) para el intercambio de token.
            // Si tu cliente X está configurado como "Confidencial", entonces sí necesitarías Basic Auth.
            // Por ahora, asumimos cliente público tal como lo gestiona el frontend.
            _httpClient.DefaultRequestHeaders.Authorization = null;
            var response = await _httpClient.PostAsync(tokenEndpoint, requestBody);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Error exchanging X token: {response.StatusCode} - {errorContent}");
                return null;
            }
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TokenResponse>(content);
        }
        private async Task<XUserV2Response?> GetXUserV2Details(string accessToken)
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", accessToken);
            // Especificamos los campos que queremos, incluyendo 'email' si está disponible y verificado.
            var response = await _httpClient.GetAsync("https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url,email,created_at");

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Error fetching X user details (v2): {response.StatusCode} - {errorContent}");
                return null;
            }
            var content = await response.Content.ReadAsStringAsync();
            try
            {
                var xUserV2Data = JsonSerializer.Deserialize<XUserV2Container>(content);
                return xUserV2Data?.data;
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"Error deserializing XUserV2Container: {ex.Message} - Content: {content}");
                return null;
            }
        }


        // Clases internas para solicitudes y perfiles
        public class LoginRequest
        {
            public string Email { get; set; } = "";
            public string Password { get; set; } = "";
        }
        public class EmailRequest
        {
            public string Email { get; set; } = "";
        }
        public class VerifyCodeRequest
        {
            public string Email { get; set; } = "";
            public string Code { get; set; } = "";
        }
        public class SetPasswordRequest
        {
            public string Email { get; set; } = "";
            public string NewPassword { get; set; } = "";
        }
        // ELIMINADO: public class ResetCodeInfo (ahora es el modelo PasswordResetCode)
        public class TokenResponse
        {
            public string access_token { get; set; } = "";
            public string token_type { get; set; } = "";
            public string? refresh_token { get; set; } = "";
            public int expires_in { get; set; }
            public string? id_token { get; set; } = ""; // Google lo usa
            public string? scope { get; set; } // X lo usa
        }
        public class GoogleUserProfile
        {
            public string id { get; set; } = "";
            public string email { get; set; } = "";
            public bool email_verified { get; set; }
            public string name { get; set; } = "";
            public string given_name { get; set; } = "";
            public string family_name { get; set; } = "";
            public string picture { get; set; } = "";
        }
        public class FacebookUserProfile
        {
            public string id { get; set; } = "";
            public string name { get; set; } = "";
            public string? email { get; set; } = ""; // Puede ser null
            public string? first_name { get; set; } = "";
            public string? last_name { get; set; } = "";
        }
        public class XUserV2Response // Para la respuesta de /2/users/me
        {
            public string? id { get; set; }
            public string? name { get; set; } // Display name
            public string? username { get; set; } // Handle
            public string? email { get; set; } // Puede ser null
            public string? profile_image_url { get; set; }
            public string? created_at { get; set; }
        }
        public class XUserV2Container // El objeto 'data' que envuelve la respuesta de X
        {
            public XUserV2Response? data { get; set; }
        }
        public class XUserProfile // Clase simplificada para manejar datos de X
        {
            public string? id { get; set; }
            public string? email { get; set; } = "";
            public string? displayName { get; set; } = "";
            public string? username { get; set; }
        }
        public class ChangePasswordRequest
        {
            public int UserId { get; set; } // Este campo se vuelve redundante si usamos el ID del token
            public string OldPassword { get; set; } = "";
            public string NewPassword { get; set; } = "";
            public string ConfirmPassword { get; set; } = "";
        }
    }
}
