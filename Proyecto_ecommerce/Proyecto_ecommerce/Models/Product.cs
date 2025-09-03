namespace Proyecto_ecommerce.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = null!;
        public int Stock { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Descuento individual
        public decimal DiscountPercent { get; set; } = 0;
        public bool IsDiscountActive { get; set; } = false;

        // NUEVO: Descripción corta (opcional)
        public string? ShortDescription { get; set; } // con límite 40 palabras / 100 chars
    }
}
