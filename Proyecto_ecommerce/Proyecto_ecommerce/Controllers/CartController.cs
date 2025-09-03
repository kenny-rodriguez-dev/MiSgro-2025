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
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CartController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/cart?userId=1
        // => devolvemos { id, name, price, imageUrl, stock, discount info, quantity, ... }
        [HttpGet]
        public async Task<IActionResult> GetCart(int userId)
        {
            // Unimos CartItems con Products para retornar más info
            var query = from c in _db.CartItems
                        join p in _db.Products on c.ProductId equals p.Id
                        where c.UserId == userId
                        select new
                        {
                            productId = p.Id,
                            name = p.Name,
                            description = p.Description,
                            price = p.Price,
                            imageUrl = p.ImageUrl,
                            stock = p.Stock,
                            discountPercent = p.DiscountPercent,
                            isDiscountActive = p.IsDiscountActive,
                            quantity = c.Quantity
                        };

            var items = await query.ToListAsync();
            return Ok(items);
        }

        // POST: api/cart?userId=1&productId=2&qty=1
        [HttpPost]
        public async Task<IActionResult> AddToCart(int userId, int productId, int qty = 1)
        {
            var cartItem = await _db.CartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);

            if (cartItem == null)
            {
                cartItem = new CartItem { UserId = userId, ProductId = productId, Quantity = qty };
                _db.CartItems.Add(cartItem);
            }
            else
            {
                cartItem.Quantity += qty;
            }

            await _db.SaveChangesAsync();
            return Ok("Agregado al carrito.");
        }

        // DELETE: api/cart?userId=1&productId=2
        [HttpDelete]
        public async Task<IActionResult> RemoveFromCart(int userId, int productId)
        {
            var item = await _db.CartItems
                .FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId);

            if (item == null) return NotFound("No existe en el carrito.");

            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
