namespace Proyecto_ecommerce.Models
{
    public class WishList
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public ICollection<WishListItem> WishListItems { get; set; } = new List<WishListItem>();
    }
}