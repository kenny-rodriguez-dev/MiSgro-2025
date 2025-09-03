using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;

namespace Proyecto_ecommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // <--- AÑADIDO: Protege toda la clase
    public class MyAccountController : ControllerBase
    {
        private readonly AppDbContext _db;

        public MyAccountController(AppDbContext db)
        {
            _db = db;
        }

        // DIRECCIONES -------------------------------------
        // GET: api/MyAccount/addresses?userId=1
        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses(int userId)
        {
            var addresses = await _db.ShippingAddresses
                .Where(a => a.UserId == userId)
                .ToListAsync();
            return Ok(addresses);
        }

        // POST: api/MyAccount/addresses/save?userId=1
        // Límite de 5 direcciones
        [HttpPost("addresses/save")]
        public async Task<IActionResult> SaveAddress(int userId, [FromBody] ShippingAddress request)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("Usuario no encontrado.");

            // Ver cuántas direcciones tiene
            var count = await _db.ShippingAddresses.CountAsync(a => a.UserId == userId);
            if (count >= 5)
                return BadRequest("Límite de 5 direcciones alcanzado.");

            request.UserId = userId;
            _db.ShippingAddresses.Add(request);
            await _db.SaveChangesAsync();
            return Ok("Dirección guardada.");
        }

        // DELETE: api/MyAccount/addresses/delete?userId=1&addressId=2
        [HttpDelete("addresses/delete")]
        public async Task<IActionResult> DeleteAddress(int userId, int addressId)
        {
            var address = await _db.ShippingAddresses
                .FirstOrDefaultAsync(a => a.UserId == userId && a.Id == addressId);
            if (address == null)
                return NotFound("Dirección no encontrada.");

            _db.ShippingAddresses.Remove(address);
            await _db.SaveChangesAsync();
            return Ok("Dirección eliminada.");
        }

        // MÉTODOS DE PAGO ----------------------------------
        // GET: api/MyAccount/paymentmethods?userId=1
        [HttpGet("paymentmethods")]
        public async Task<IActionResult> GetPaymentMethods(int userId)
        {
            var list = await _db.PaymentMethods
                .Where(pm => pm.UserId == userId)
                .ToListAsync();
            return Ok(list);
        }

        // POST: api/MyAccount/paymentmethods/save?userId=1
        // Límite de 5 métodos
        [HttpPost("paymentmethods/save")]
        public async Task<IActionResult> SavePaymentMethod(int userId, [FromBody] PaymentMethod pm)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("Usuario no encontrado.");

            // Contar
            var count = await _db.PaymentMethods.CountAsync(p => p.UserId == userId);
            if (count >= 5)
                return BadRequest("Límite de 5 métodos de pago alcanzado.");

            pm.UserId = userId;
            pm.CreatedAt = DateTime.UtcNow;
            _db.PaymentMethods.Add(pm);
            await _db.SaveChangesAsync();
            return Ok("Método de pago guardado.");
        }

        // DELETE: api/MyAccount/paymentmethods/delete?userId=1&methodId=2
        [HttpDelete("paymentmethods/delete")]
        public async Task<IActionResult> DeletePaymentMethod(int userId, int methodId)
        {
            var pm = await _db.PaymentMethods
                .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == methodId);
            if (pm == null)
                return NotFound("Método de pago no encontrado.");

            _db.PaymentMethods.Remove(pm);
            await _db.SaveChangesAsync();
            return Ok("Método de pago eliminado.");
        }

        // *** DETALLES DE FACTURACIÓN (máx 5) ***
        // GET: api/MyAccount/billingdetails?userId=1
        [HttpGet("billingdetails")]
        public async Task<IActionResult> GetBillingDetails(int userId)
        {
            var list = await _db.BillingDetails
                .Where(b => b.UserId == userId)
                .ToListAsync();
            return Ok(list);
        }

        // POST: api/MyAccount/billingdetails/save?userId=1
        [HttpPost("billingdetails/save")]
        public async Task<IActionResult> SaveBillingDetail(int userId, [FromBody] BillingDetail bd)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("Usuario no encontrado.");

            // Límite de 5
            var count = await _db.BillingDetails.CountAsync(b => b.UserId == userId);
            if (count >= 5)
                return BadRequest("Límite de 5 detalles de facturación alcanzado.");

            bd.UserId = userId;
            _db.BillingDetails.Add(bd);
            await _db.SaveChangesAsync();
            return Ok("Detalles de facturación guardados.");
        }

        // DELETE: api/MyAccount/billingdetails/delete?userId=1&billingId=2
        [HttpDelete("billingdetails/delete")]
        public async Task<IActionResult> DeleteBillingDetail(int userId, int billingId)
        {
            var bd = await _db.BillingDetails
                .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == billingId);
            if (bd == null)
                return NotFound("Detalle de facturación no encontrado.");

            _db.BillingDetails.Remove(bd);
            await _db.SaveChangesAsync();
            return Ok("Eliminado.");
        }

        // *** DATOS DEL CLIENTE (máx 5) ***
        // GET: api/MyAccount/clientdata?userId=1
        [HttpGet("clientdata")]
        public async Task<IActionResult> GetClientDatas(int userId)
        {
            var list = await _db.ClientDatas
                .Where(c => c.UserId == userId)
                .ToListAsync();
            return Ok(list);
        }

        // POST: api/MyAccount/clientdata/save?userId=1
        [HttpPost("clientdata/save")]
        public async Task<IActionResult> SaveClientData(int userId, [FromBody] ClientData cd)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("Usuario no encontrado.");

            // Límite de 5
            var count = await _db.ClientDatas.CountAsync(c => c.UserId == userId);
            if (count >= 5)
                return BadRequest("Límite de 5 datos de cliente alcanzado.");

            cd.UserId = userId;
            _db.ClientDatas.Add(cd);
            await _db.SaveChangesAsync();
            return Ok("Datos de cliente guardados.");
        }

        // DELETE: api/MyAccount/clientdata/delete?userId=1&clientDataId=2
        [HttpDelete("clientdata/delete")]
        public async Task<IActionResult> DeleteClientData(int userId, int clientDataId)
        {
            var cd = await _db.ClientDatas
                .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == clientDataId);
            if (cd == null)
                return NotFound("Datos de cliente no encontrados.");

            _db.ClientDatas.Remove(cd);
            await _db.SaveChangesAsync();
            return Ok("Eliminado.");
        }
    }
}
