namespace Proyecto_ecommerce.Models
{
    public class User
    {
        public int Id { get; set; }

        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = "User";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Fecha/hora del último cambio de contraseña
        public DateTime? LastPasswordChange { get; set; } = null;

        // **NUEVO**: Nos indicará si la última vez que cambió la contraseña
        // fue a través de "LocalReset" (la página de código) o "AccountChange" (esta nueva vía interna).
        public string? LastPasswordChangeMethod { get; set; } = null;
    }
}
