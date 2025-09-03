namespace Proyecto_ecommerce.Models
{
    public class Setting
    {
        public int Id { get; set; }
        public decimal TaxRate { get; set; } = 12;
        public decimal ShippingCost { get; set; } = 0;

        // Descuento global
        public decimal GlobalDiscountPercent { get; set; } = 0;
    }
}
