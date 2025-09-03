namespace Proyecto_ecommerce.Models
{
    public class PaymentMethod
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Type { get; set; } = null!; // "Tarjeta", "PayPal"
        public string MaskedData { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
