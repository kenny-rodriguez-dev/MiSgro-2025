namespace Proyecto_ecommerce.Models
{
    public class OrderShipping
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string Country { get; set; } = "";
        public string Province { get; set; } = "";
        public string City { get; set; } = "";
        public string PostalCode { get; set; } = "";
        public string AddressLine { get; set; } = "";
    }

}
