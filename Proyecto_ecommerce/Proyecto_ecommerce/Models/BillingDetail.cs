namespace Proyecto_ecommerce.Models
{
    public class BillingDetail
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Country { get; set; } = null!;
        public string Region { get; set; } = null!;
        public string City { get; set; } = null!;
        public string AddressLine1 { get; set; } = null!;
        public string? AddressLine2 { get; set; }
    }
}
