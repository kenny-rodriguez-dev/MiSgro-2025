using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using Microsoft.AspNetCore.Authorization; // Importar

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CategoriesController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/categories - Público o según necesidad
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var cats = await _db.Categories.ToListAsync();
            return Ok(cats);
        }

        // GET: api/categories/{id}/products - Público o según necesidad
        [HttpGet("{id}/products")]
        public async Task<IActionResult> GetProductsByCategory(int id)
        {
            var productIds = await _db.ProductCategories
                .Where(pc => pc.CategoryId == id)
                .Select(pc => pc.ProductId)
                .ToListAsync();

            var products = await _db.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();
            return Ok(products);
        }

        [HttpGet("productcat")]
        public async Task<IActionResult> GetProductCategories([FromQuery] int productId)
        {
            var catIds = await _db.ProductCategories
                .Where(pc => pc.ProductId == productId)
                .Select(pc => pc.CategoryId)
                .ToListAsync();
            return Ok(catIds);
        }

        [HttpGet("allassignments")]
        public async Task<IActionResult> GetAllAssignments()
        {
            var assignments = await _db.ProductCategories.ToListAsync();
            return Ok(assignments);
        }

        // POST: api/categories
        [HttpPost]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> CreateCategory([FromBody] Category cat)
        {
            // ELIMINADO: if (role != "Admin") ...
            if (cat == null || string.IsNullOrEmpty(cat.Name))
                return BadRequest("Nombre de la categoría inválido.");

            _db.Categories.Add(cat);
            await _db.SaveChangesAsync();
            return Ok(cat);
        }

        // POST: api/categories/assign?productId=xx
        [HttpPost("assign")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> AssignCategories(
            [FromQuery] int productId,
            [FromBody] AssignCategoryRequest req)
        {
            // ELIMINADO: if (role != "Admin") ...
            var product = await _db.Products.FindAsync(productId);
            if (product == null) return NotFound("Producto no encontrado.");

            var oldAssignments = await _db.ProductCategories
                .Where(pc => pc.ProductId == productId)
                .ToListAsync();
            _db.ProductCategories.RemoveRange(oldAssignments);

            if (req.CategoryIds != null && req.CategoryIds.Any())
            {
                foreach (var catId in req.CategoryIds)
                {
                    _db.ProductCategories.Add(new ProductCategory
                    {
                        ProductId = productId,
                        CategoryId = catId
                    });
                }
            }
            await _db.SaveChangesAsync();
            return Ok("Categorías asignadas correctamente.");
        }

        // PUT: api/categories/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category cat)
        {
            // ELIMINADO: if (role != "Admin") ...
            var existing = await _db.Categories.FindAsync(id);
            if (existing == null) return NotFound("Categoría no encontrada.");
            if (string.IsNullOrEmpty(cat.Name))
                return BadRequest("Nombre inválido.");

            existing.Name = cat.Name;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/categories/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> DeleteCategory(int id)
        {
            // ELIMINADO: if (role != "Admin") ...
            var category = await _db.Categories
                .Include(c => c.ProductCategories)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return NotFound("Categoría no encontrada.");

            _db.ProductCategories.RemoveRange(category.ProductCategories);
            _db.Categories.Remove(category);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return BadRequest("La categoría ya fue eliminada o modificada.");
            }
            return NoContent();
        }
    }

    public class AssignCategoryRequest
    {
        public List<int> CategoryIds { get; set; } = new List<int>();
    }
}
