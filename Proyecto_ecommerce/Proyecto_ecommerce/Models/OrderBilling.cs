namespace Proyecto_ecommerce.Models
{

    public class OrderBilling
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string Country { get; set; } = "";
        public string Region { get; set; } = "";
        public string City { get; set; } = "";
        public string AddressLine1 { get; set; } = "";
        public string AddressLine2 { get; set; } = "";
    }

}
