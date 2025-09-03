namespace Proyecto_ecommerce.Models
{

    public class OrderClient
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public string? CompanyName { get; set; }
        public string Phone { get; set; } = "";
        public string Email { get; set; } = "";
        public string Identification { get; set; } = "";
        public string? OrderNotes { get; set; }
    }
}
