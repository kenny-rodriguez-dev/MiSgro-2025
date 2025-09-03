using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using Microsoft.AspNetCore.Authorization; // Importar

namespace Proyecto_ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductImagesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public ProductImagesController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        // GET: api/productimages/{productId} - Público o según necesidad
        [HttpGet("{productId}")]
        public async Task<IActionResult> GetProductImages(int productId)
        {
            var list = await _db.ProductImages
                .Where(pi => pi.ProductId == productId)
                .OrderBy(pi => pi.Id) // O por CreatedAt si lo prefieres
                .ToListAsync();
            return Ok(list);
        }

        // POST: api/productimages/{productId}
        [HttpPost("{productId}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        [RequestSizeLimit(200_000_000)]
        public async Task<IActionResult> AddImagesToProduct(int productId) // ELIMINADO: [FromQuery] string role
        {
            // ELIMINADO: if (role != "Admin") ...
            var product = await _db.Products.FindAsync(productId);
            if (product == null)
                return NotFound("Producto no encontrado.");

            var existingCount = await _db.ProductImages.CountAsync(pi => pi.ProductId == productId);
            if (existingCount >= 20)
                return BadRequest("Este producto ya tiene 20 imágenes, no se pueden agregar más.");

            if (!Request.HasFormContentType)
                return BadRequest("Debe enviar multipart/form-data.");

            var form = await Request.ReadFormAsync();
            var files = form.Files;
            var urlFields = form["imageUrl"];
            List<ProductImage> newImages = new List<ProductImage>();

            foreach (var file in files)
            {
                if (existingCount + newImages.Count >= 20) break;
                if (file.Length > 0)
                {
                    var fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName); // Nombre único
                    var uploads = Path.Combine(_env.WebRootPath, "images");
                    if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);
                    var filePath = Path.Combine(uploads, fileName);
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                    newImages.Add(new ProductImage { ProductId = productId, ImageUrl = $"/images/{fileName}" });
                }
            }

            foreach (var url in urlFields)
            {
                if (existingCount + newImages.Count >= 20) break;
                if (!string.IsNullOrEmpty(url) && Uri.TryCreate(url, UriKind.Absolute, out _)) // Validar URL básica
                {
                    newImages.Add(new ProductImage { ProductId = productId, ImageUrl = url });
                }
            }

            if (newImages.Count == 0)
                return BadRequest("No se agregaron archivos ni URLs válidos.");

            _db.ProductImages.AddRange(newImages);
            await _db.SaveChangesAsync();
            return Ok("Imágenes agregadas correctamente.");
        }

        // DELETE: api/productimages/{productId}/{imageId}
        [HttpDelete("{productId}/{imageId}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> DeleteImageFromProduct(int productId, int imageId) // ELIMINADO: [FromQuery] string role
        {
            // ELIMINADO: if (role != "Admin") ...
            var img = await _db.ProductImages
                .FirstOrDefaultAsync(pi => pi.Id == imageId && pi.ProductId == productId);
            if (img == null)
                return NotFound("No se encontró esa imagen asociada al producto.");

            // Opcional: borrar imagen del servidor si es local
            if (!img.ImageUrl.StartsWith("http"))
            {
                var imagePath = Path.Combine(_env.WebRootPath, img.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            _db.ProductImages.Remove(img);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
