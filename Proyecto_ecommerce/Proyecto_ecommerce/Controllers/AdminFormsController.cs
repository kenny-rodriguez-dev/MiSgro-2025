using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using Microsoft.AspNetCore.Authorization; // Importar para [Authorize]

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Supervisor")] // Protección a nivel de controlador
    public class AdminFormsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AdminFormsController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/adminforms/orders (devuelve info de shipping/billing/client de las ordenes)
        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrderForms()
        {
            var shippings = await _db.OrderShippings.ToListAsync();
            var billings = await _db.OrderBillings.ToListAsync();
            var clients = await _db.OrderClients.ToListAsync();

            var response = new
            {
                Shippings = shippings,
                Billings = billings,
                Clients = clients
            };
            return Ok(response);
        }

        [HttpGet("addresses")]
        public async Task<IActionResult> GetAllAddresses()
        {
            var all = await _db.ShippingAddresses.ToListAsync();
            return Ok(all);
        }

        [HttpGet("billing")]
        public async Task<IActionResult> GetAllBilling()
        {
            var all = await _db.BillingDetails.ToListAsync();
            return Ok(all);
        }

        [HttpGet("clients")]
        public async Task<IActionResult> GetAllClients()
        {
            var all = await _db.ClientDatas.ToListAsync();
            return Ok(all);
        }
    }
}
