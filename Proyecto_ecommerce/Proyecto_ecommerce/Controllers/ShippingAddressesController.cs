using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippingAddressesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ShippingAddressesController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/shippingaddresses/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetAddress(int userId)
        {
            var addr = await _db.ShippingAddresses.FirstOrDefaultAsync(a => a.UserId == userId);
            if (addr == null) return NotFound("No se encontró dirección de envío para este usuario.");
            return Ok(addr);
        }

        // POST: api/shippingaddresses/save?userId=1
        [HttpPost("save")]
        public async Task<IActionResult> SaveAddress(int userId, [FromBody] ShippingAddress request)
        {
            var existing = await _db.ShippingAddresses.FirstOrDefaultAsync(a => a.UserId == userId);
            if (existing == null)
            {
                // crear uno
                var newAddress = new ShippingAddress
                {
                    UserId = userId,
                    Country = request.Country,
                    Province = request.Province,
                    City = request.City,
                    PostalCode = request.PostalCode,
                    AddressLine = request.AddressLine
                };
                _db.ShippingAddresses.Add(newAddress);
            }
            else
            {
                // actualizar
                existing.Country = request.Country;
                existing.Province = request.Province;
                existing.City = request.City;
                existing.PostalCode = request.PostalCode;
                existing.AddressLine = request.AddressLine;
            }
            await _db.SaveChangesAsync();
            return Ok("Dirección de envío guardada/actualizada.");
        }
    }
}
