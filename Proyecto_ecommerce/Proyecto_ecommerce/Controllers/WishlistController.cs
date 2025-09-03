using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // <--- AÑADIDO: Protege toda la clase
    public class WishlistController : ControllerBase
    {
        private readonly AppDbContext _db;

        public WishlistController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/wishlist?userId=1
        [HttpGet]
        public async Task<IActionResult> GetWishlist(int userId)
        {
            var items = await _db.WishlistItems
                .Where(w => w.UserId == userId)
                .ToListAsync();

            // Detalles del producto
            var productIds = items.Select(i => i.ProductId).ToList();
            var products = await _db.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            return Ok(products);
        }

        // POST: api/wishlist?userId=1&productId=2
        [HttpPost]
        public async Task<IActionResult> AddToWishlist(int userId, int productId)
        {
            var exists = await _db.WishlistItems.AnyAsync(w => w.UserId == userId && w.ProductId == productId);
            if (exists) return BadRequest("Ya existe en wishlist.");

            _db.WishlistItems.Add(new WishListItem { UserId = userId, ProductId = productId });
            await _db.SaveChangesAsync();
            return Ok("Agregado a wishlist.");
        }

        // DELETE: api/wishlist?userId=1&productId=2
        [HttpDelete]
        public async Task<IActionResult> RemoveFromWishlist(int userId, int productId)
        {
            var item = await _db.WishlistItems
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

            if (item == null) return NotFound("No existe en wishlist.");

            _db.WishlistItems.Remove(item);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
