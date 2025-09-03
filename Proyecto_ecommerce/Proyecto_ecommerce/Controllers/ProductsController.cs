using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using Microsoft.AspNetCore.Authorization; // Importar

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public ProductsController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        // GET: api/products - Público
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetAll()
        {
            var products = await _db.Products.ToListAsync();
            return Ok(products);
        }

        // GET: api/products/5 - Público
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetOne(int id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null)
                return NotFound("Producto no encontrado.");
            return Ok(product);
        }

        // POST: api/products
        [HttpPost]
        [Authorize(Roles = "Admin")] // Solo Admin
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> CreateProduct() // ELIMINADO: [FromQuery] string role
        {
            // ELIMINADO: if (role != "Admin") ...
            if (Request.ContentType != null && Request.ContentType.Contains("multipart/form-data"))
            {
                var formCollection = await Request.ReadFormAsync();
                var files = formCollection.Files;
                var name = formCollection["name"].ToString() ?? "";
                var shortDesc = formCollection["shortDescription"].ToString() ?? "";
                var description = formCollection["description"].ToString() ?? "";
                decimal.TryParse(formCollection["price"].ToString(), out decimal priceVal);
                int.TryParse(formCollection["stock"].ToString(), out int stockVal);
                var imageUrl = formCollection["imageUrl"].ToString() ?? "";
                decimal.TryParse(formCollection["discountPercent"].ToString(), out decimal discVal);
                bool discActive = false;
                var isDiscActiveStr = formCollection["isDiscountActive"].ToString();
                if (isDiscActiveStr == "true" || isDiscActiveStr == "1") discActive = true;

                if (!string.IsNullOrEmpty(imageUrl) && files.Count > 0)
                    return BadRequest("Solo URL o archivo local, no ambas.");
                if (string.IsNullOrEmpty(imageUrl) && files.Count == 0)
                    return BadRequest("Debe proporcionar URL o archivo local.");

                var product = new Product
                {
                    Name = name,
                    ShortDescription = shortDesc,
                    Description = description,
                    Price = priceVal,
                    Stock = stockVal,
                    DiscountPercent = discVal,
                    IsDiscountActive = discActive,
                    CreatedAt = DateTime.UtcNow
                };

                if (files.Count > 0)
                {
                    var file = files[0];
                    if (file.Length > 0)
                    {
                        var fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName); // Nombre de archivo único
                        var uploads = Path.Combine(_env.WebRootPath, "images");
                        if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);
                        var filePath = Path.Combine(uploads, fileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        product.ImageUrl = $"/images/{fileName}";
                    }
                }
                else
                {
                    product.ImageUrl = imageUrl;
                }
                _db.Products.Add(product);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetOne), new { id = product.Id }, product);
            }
            else // JSON
            {
                var productBody = await HttpContext.Request.ReadFromJsonAsync<Product>();
                if (productBody == null)
                    return BadRequest("Producto no válido (JSON).");
                if (string.IsNullOrEmpty(productBody.ImageUrl))
                {
                    return BadRequest("Debe proporcionar imagen (URL).");
                }
                productBody.CreatedAt = DateTime.UtcNow;
                _db.Products.Add(productBody);
                await _db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetOne), new { id = productBody.Id }, productBody);
            }
        }

        // PUT: api/products/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> UpdateProduct(int id) // ELIMINADO: [FromQuery] string role
        {
            // ELIMINADO: if (role != "Admin") ...
            var existing = await _db.Products.FindAsync(id);
            if (existing == null)
                return NotFound("Producto no encontrado.");

            if (Request.ContentType != null && Request.ContentType.Contains("multipart/form-data"))
            {
                var formCollection = await Request.ReadFormAsync();
                var files = formCollection.Files;
                existing.Name = formCollection["name"].ToString() ?? existing.Name;
                existing.ShortDescription = formCollection["shortDescription"].ToString() ?? existing.ShortDescription;
                existing.Description = formCollection["description"].ToString() ?? existing.Description;
                if (decimal.TryParse(formCollection["price"], out decimal tmpPrice)) existing.Price = tmpPrice;
                if (int.TryParse(formCollection["stock"], out int tmpStock)) existing.Stock = tmpStock;
                var imageUrl = formCollection["imageUrl"].ToString() ?? "";
                if (decimal.TryParse(formCollection["discountPercent"], out decimal tmpDisc)) existing.DiscountPercent = tmpDisc;
                var isDiscActiveStr = formCollection["isDiscountActive"].ToString();
                if (!string.IsNullOrEmpty(isDiscActiveStr))
                {
                    existing.IsDiscountActive = (isDiscActiveStr == "true" || isDiscActiveStr == "1");
                }

                if (!string.IsNullOrEmpty(imageUrl) && files.Count > 0)
                    return BadRequest("Solo URL o archivo local, no ambas.");
                if (string.IsNullOrEmpty(imageUrl) && files.Count == 0 && string.IsNullOrEmpty(existing.ImageUrl))
                {
                    // Si no se envía nueva imagen (URL o archivo) Y el producto NO TENÍA imagen previa, entonces error.
                    // Si tenía imagen previa y no se envía nueva, se conserva la anterior.
                    return BadRequest("Debe proporcionar una imagen si el producto no tiene una asignada.");
                }


                if (files.Count > 0)
                {
                    var file = files[0];
                    if (file.Length > 0)
                    {
                        // Opcional: borrar imagen antigua del servidor si existe y es local
                        if (!string.IsNullOrEmpty(existing.ImageUrl) && !existing.ImageUrl.StartsWith("http") && System.IO.File.Exists(Path.Combine(_env.WebRootPath, existing.ImageUrl.TrimStart('/'))))
                        {
                            System.IO.File.Delete(Path.Combine(_env.WebRootPath, existing.ImageUrl.TrimStart('/')));
                        }
                        var fileName = Path.GetRandomFileName() + Path.GetExtension(file.FileName);
                        var uploads = Path.Combine(_env.WebRootPath, "images");
                        if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);
                        var filePath = Path.Combine(uploads, fileName);
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        existing.ImageUrl = $"/images/{fileName}";
                    }
                }
                else if (!string.IsNullOrEmpty(imageUrl))
                {
                    existing.ImageUrl = imageUrl;
                }
            }
            else // JSON
            {
                var productBody = await HttpContext.Request.ReadFromJsonAsync<Product>();
                if (productBody == null) return BadRequest("Datos no válidos (Update).");
                existing.Name = productBody.Name;
                existing.ShortDescription = productBody.ShortDescription;
                existing.Description = productBody.Description;
                existing.Price = productBody.Price;
                existing.Stock = productBody.Stock;
                existing.DiscountPercent = productBody.DiscountPercent;
                existing.IsDiscountActive = productBody.IsDiscountActive;
                existing.ImageUrl = productBody.ImageUrl; // Asume que si es JSON, ImageUrl es una URL
            }
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/products/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> DeleteProduct(int id) // ELIMINADO: [FromQuery] string role
        {
            // ELIMINADO: if (role != "Admin") ...
            var product = await _db.Products.FindAsync(id);
            if (product == null)
                return NotFound();

            // Opcional: borrar imagen del servidor si es local
            if (!string.IsNullOrEmpty(product.ImageUrl) && !product.ImageUrl.StartsWith("http"))
            {
                var imagePath = Path.Combine(_env.WebRootPath, product.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            _db.Products.Remove(product);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/products/{id}/image
        [HttpDelete("{id}/image")]
        [Authorize(Roles = "Admin")] // Solo Admin
        public async Task<IActionResult> DeleteImage(int id) // ELIMINADO: [FromQuery] string role
        {
            // ELIMINADO: if (role != "Admin") ...
            var product = await _db.Products.FindAsync(id);
            if (product == null) return NotFound("Producto no encontrado.");

            // Opcional: borrar imagen del servidor si es local
            if (!string.IsNullOrEmpty(product.ImageUrl) && !product.ImageUrl.StartsWith("http"))
            {
                var imagePath = Path.Combine(_env.WebRootPath, product.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            product.ImageUrl = ""; // O null, dependiendo de tu modelo
            await _db.SaveChangesAsync();
            return Ok("Imagen principal borrada del producto.");
        }

        // GET: api/products/search?term=xxx - Público
        [HttpGet("search")]
        public async Task<IActionResult> Search(string term)
        {
            if (string.IsNullOrWhiteSpace(term))
            {
                return Ok(new List<Product>());
            }
            var products = await _db.Products
                .Where(p => p.Name.Contains(term) || (p.ShortDescription != null && p.ShortDescription.Contains(term)))
                .ToListAsync();
            return Ok(products);
        }
    }
}
