using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;

namespace Proyecto_ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Supervisor")] // <--- AÑADIDO: Protege toda la clase para Admins y Supervisor
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetAll()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }

        // PATCH: api/users/{id}/role
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleUpdateRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.NewRole))
                return BadRequest("El rol no puede ser nulo o vacío.");

            var user = await _context.Users.FindAsync(id);

            if (user == null)
                return NotFound("Usuario no encontrado.");

            user.Role = request.NewRole;
            await _context.SaveChangesAsync();
            return Ok(new { Message = "Rol actualizado con éxito.", User = user });
        }
    }

    public class RoleUpdateRequest
    {
        public string NewRole { get; set; } = null!;
    }
}
