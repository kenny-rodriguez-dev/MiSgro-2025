using System;
using System.ComponentModel.DataAnnotations;

namespace Proyecto_ecommerce.Models
{
    public class PasswordResetCode
    {
        [Key]
        public string Email { get; set; } = null!;
        public string Code { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
        public int AttemptCount { get; set; }
        public DateTime? BlockedUntil { get; set; } // Nullable para indicar que no está bloqueado
    }
}
