namespace Proyecto_ecommerce.Models
{
    public class Order
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public string Status { get; set; } = "Pendiente";
        public string? ShippingEta { get; set; }  // e.g. "2 días", "24h", etc.
        public string? CancelReason { get; set; } // Motivo de la cancelación
    }
}
