using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using Microsoft.AspNetCore.Authorization; // Importar

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExtraTaxesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ExtraTaxesController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/extrataxes - Público o según necesidad
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _db.ExtraTaxes.OrderBy(e => e.Id).ToListAsync();
            return Ok(list);
        }

        // POST: api/extrataxes
        [HttpPost]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> CreateExtraTax([FromBody] ExtraTax tax)
        {
            // ELIMINADO: if (role != "Admin") ...
            if (string.IsNullOrEmpty(tax.Name))
                return BadRequest("Nombre no válido.");

            int existingCount = await _db.ExtraTaxes.CountAsync();
            if (existingCount >= 8)
                return BadRequest("Límite de 8 impuestos extra alcanzado.");

            var all = await _db.ExtraTaxes.OrderBy(e => e.Id).ToListAsync();
            int nextId = 0;
            for (int i = 1; i <= 8; i++)
            {
                if (!all.Any(x => x.Id == i))
                {
                    nextId = i;
                    break;
                }
            }
            if (nextId == 0)
            {
                return BadRequest("No hay ID disponible. Límite de 8.");
            }
            tax.Id = nextId;

            using (var tran = await _db.Database.BeginTransactionAsync())
            {
                await _db.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT ExtraTaxes ON");
                _db.ExtraTaxes.Add(tax);
                await _db.SaveChangesAsync();
                await _db.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT ExtraTaxes OFF");
                await tran.CommitAsync();
            }
            return Ok(tax);
        }

        // PUT: api/extrataxes/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> UpdateExtraTax(int id, [FromBody] ExtraTax updated)
        {
            // ELIMINADO: if (role != "Admin") ...
            var existing = await _db.ExtraTaxes.FindAsync(id);
            if (existing == null) return NotFound("Impuesto extra no encontrado.");

            existing.Name = updated.Name;
            existing.IsPercentage = updated.IsPercentage;
            existing.Value = updated.Value;
            existing.IsActive = updated.IsActive;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        // DELETE: api/extrataxes/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> DeleteExtraTax(int id)
        {
            // ELIMINADO: if (role != "Admin") ...
            var existing = await _db.ExtraTaxes.FindAsync(id);
            if (existing == null) return NotFound("Impuesto extra no encontrado.");

            _db.ExtraTaxes.Remove(existing);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
