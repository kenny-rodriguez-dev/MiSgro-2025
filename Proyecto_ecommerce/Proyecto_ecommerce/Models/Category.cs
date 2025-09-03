namespace Proyecto_ecommerce.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;

        // Propiedad de navegación que relaciona la categoría con sus asignaciones de productos
        public virtual ICollection<ProductCategory> ProductCategories { get; set; } = new List<ProductCategory>();
    }
}
