using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentMethodsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PaymentMethodsController(AppDbContext db)
        {
            _db = db;
        }

        // POST: api/paymentmethods/save?userId=1
        [HttpPost("save")]
        public async Task<IActionResult> SavePaymentMethod(int userId, [FromBody] PaymentMethod pm)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound("Usuario no encontrado.");

            pm.UserId = userId;
            pm.CreatedAt = DateTime.UtcNow;
            _db.PaymentMethods.Add(pm);
            await _db.SaveChangesAsync();
            return Ok("Método de pago guardado.");
        }

        // GET: api/paymentmethods?userId=1
        [HttpGet]
        public async Task<IActionResult> GetMyPaymentMethods(int userId)
        {
            var list = await _db.PaymentMethods
                .Where(p => p.UserId == userId)
                .ToListAsync();
            return Ok(list);
        }
    }
}
