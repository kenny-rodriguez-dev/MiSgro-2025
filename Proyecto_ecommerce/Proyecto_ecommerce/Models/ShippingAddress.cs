namespace Proyecto_ecommerce.Models
{
    public class ShippingAddress
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Country { get; set; } = null!;
        public string Province { get; set; } = null!;
        public string City { get; set; } = null!;
        public string PostalCode { get; set; } = null!;
        public string AddressLine { get; set; } = null!;
    }
}
