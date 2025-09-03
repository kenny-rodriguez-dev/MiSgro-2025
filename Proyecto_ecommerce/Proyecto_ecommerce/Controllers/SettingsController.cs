using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using Microsoft.AspNetCore.Authorization; // Importar

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public SettingsController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/settings - Público o según necesidad (usualmente público para que el frontend sepa el IVA, etc.)
        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var setting = await _db.Settings.FirstOrDefaultAsync();
            if (setting == null)
            {
                setting = new Setting { TaxRate = 12, ShippingCost = 0, GlobalDiscountPercent = 0 };
                _db.Settings.Add(setting);
                await _db.SaveChangesAsync();
            }
            return Ok(setting);
        }

        // PUT: api/settings
        [HttpPut]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> UpdateSettings([FromBody] Setting setting) // ELIMINADO: [FromQuery] string role
        {
            // ELIMINADO: if (role != "Admin") ...
            var existing = await _db.Settings.FirstOrDefaultAsync();
            if (existing == null)
            {
                existing = new Setting
                {
                    TaxRate = setting.TaxRate,
                    ShippingCost = setting.ShippingCost,
                    GlobalDiscountPercent = setting.GlobalDiscountPercent
                };
                _db.Settings.Add(existing);
            }
            else
            {
                existing.TaxRate = setting.TaxRate;
                existing.ShippingCost = setting.ShippingCost;
                existing.GlobalDiscountPercent = setting.GlobalDiscountPercent;
            }
            await _db.SaveChangesAsync();
            return Ok(existing);
        }
    }
}
