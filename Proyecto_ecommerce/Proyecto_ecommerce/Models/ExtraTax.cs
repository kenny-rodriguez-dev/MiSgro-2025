namespace Proyecto_ecommerce.Models
{
    public class ExtraTax
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public bool IsPercentage { get; set; } = true; // si true => %; si false => importe fijo
        public decimal Value { get; set; } = 0;
        public bool IsActive { get; set; } = false;
    }
}
