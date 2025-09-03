using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Data;
using Proyecto_ecommerce.Models;
using System.Globalization;

namespace ProyectoEcommerce.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // <--- AÑADIDO: Protege toda la clase por defecto
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly TimeZoneInfo _ecuadorTimeZone
            = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time");
        private const string BASE_URL = "http://localhost:5009";

        public OrdersController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/orders
        [HttpGet]
        [Authorize(Roles = "Admin,Supervisor")] // <--- AÑADIDO: Más específico
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _db.Orders
                .OrderByDescending(o => o.Id)
                .ToListAsync();
            foreach (var o in orders)
            {
                o.CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(o.CreatedAt, _ecuadorTimeZone);
            }
            return Ok(orders);
        }

        // GET: api/orders/myorders?userId=123
        [HttpGet("myorders")]
        public async Task<IActionResult> GetMyOrders(int userId)
        {
            var orders = await _db.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.Id)
                .ToListAsync();
            foreach (var o in orders)
            {
                o.CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(o.CreatedAt, _ecuadorTimeZone);
            }
            var result = new List<object>();
            foreach (var order in orders)
            {
                var shipping = await _db.OrderShippings.FirstOrDefaultAsync(s => s.OrderId == order.Id);
                var billing = await _db.OrderBillings.FirstOrDefaultAsync(b => b.OrderId == order.Id);
                var client = await _db.OrderClients.FirstOrDefaultAsync(c => c.OrderId == order.Id);
                result.Add(new
                {
                    order,
                    shipping,
                    billing,
                    client
                });
            }
            return Ok(result);
        }

        // GET: api/orders/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null)
                return NotFound("Orden no encontrada.");
            order.CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(order.CreatedAt, _ecuadorTimeZone);
            var shipping = await _db.OrderShippings.FirstOrDefaultAsync(s => s.OrderId == id);
            var billing = await _db.OrderBillings.FirstOrDefaultAsync(b => b.OrderId == id);
            var client = await _db.OrderClients.FirstOrDefaultAsync(c => c.OrderId == id);
            return Ok(new
            {
                order,
                shipping,
                billing,
                client
            });
        }

        // GET: api/orders/{id}/items
        [HttpGet("{id}/items")]
        public async Task<IActionResult> GetOrderItems(int id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null)
                return NotFound("Orden no encontrada.");
            var orderItems = await _db.OrderItems
                .Where(oi => oi.OrderId == id)
                .ToListAsync();
            var productIds = orderItems.Select(oi => oi.ProductId).ToList();
            var products = await _db.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();
            var result = orderItems.Select(oi =>
            {
                var p = products.FirstOrDefault(x => x.Id == oi.ProductId);
                return new
                {
                    id = oi.Id,
                    productId = oi.ProductId,
                    name = p?.Name ?? "(desconocido)",
                    imageUrl = p?.ImageUrl,
                    price = oi.Price,
                    quantity = oi.Quantity
                };
            });
            return Ok(result);
        }

        // PUT: api/orders/{id}/status
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Supervisor")] // <--- AÑADIDO: Más específico
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string newStatus)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null)
                return NotFound("Orden no encontrada.");
            order.Status = newStatus;
            await _db.SaveChangesAsync();
            return Ok($"Estado de la orden {id} actualizado a '{newStatus}'.");
        }

        // POST: api/orders/send?orderId=XX
        [HttpPost("send")]
        [Authorize(Roles = "Admin,Supervisor")] // <--- AÑADIDO: Más específico
        public async Task<IActionResult> SendOrder(int orderId, [FromBody] SendOrderRequest req)
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order == null)
                return NotFound("Orden no encontrada.");
            var user = await _db.Users.FindAsync(order.UserId);
            if (user == null)
                return NotFound("Usuario no encontrado.");
            order.ShippingEta = req.EstimatedTime;
            order.Status = "Enviado";
            await _db.SaveChangesAsync();
            // Correo
            string subject = $"Tu pedido #{order.Id} ha sido enviado";
            string body = $@"
<html>
<head><meta charset='UTF-8'/></head>
<body style='font-family:Arial,sans-serif; text-align:center;'>
  <h2 style='color:#007bff;'>Pedido Enviado</h2>
  <p>El pedido #{order.Id} ahora está en camino.</p>
  <p>Tiempo estimado de llegada: <strong>{req.EstimatedTime}</strong></p>
  <p>Gracias por tu compra.</p>
</body>
</html>";
            var emailService = new EmailService();
            await emailService.SendEmailAsync(user.Email, subject, body);
            return Ok("Correo de envío enviado con éxito.");
        }

        // POST: api/orders/cancel?orderId=XX
        [HttpPost("cancel")]
        [Authorize(Roles = "Admin,Supervisor")] // <--- AÑADIDO: Más específico
        public async Task<IActionResult> CancelOrder(int orderId, [FromBody] CancelOrderRequest req)
        {
            var order = await _db.Orders.FindAsync(orderId);
            if (order == null)
                return NotFound("Orden no encontrada.");
            var user = await _db.Users.FindAsync(order.UserId);
            if (user == null)
                return NotFound("Usuario no encontrado.");
            order.CancelReason = req.CancelReason;
            order.Status = "Cancelado";
            await _db.SaveChangesAsync();
            string subject = $"Tu pedido #{order.Id} ha sido cancelado";
            string body = $@"
<html>
<head><meta charset='UTF-8'/></head>
<body style='font-family:Arial,sans-serif; text-align:center;'>
  <h2 style='color:#cc0000;'>Pedido Cancelado</h2>
  <p>El pedido #{order.Id} se ha marcado como Cancelado.</p>
  <p>Motivo: <strong>{req.CancelReason}</strong></p>
</body>
</html>";
            var emailService = new EmailService();
            await emailService.SendEmailAsync(user.Email, subject, body);
            return Ok("Correo de cancelación enviado con éxito.");
        }

        // POST: api/orders/checkout
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
        {
            var userId = request.UserId;
            if (userId <= 0)
                return BadRequest("UserId inválido.");
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound("Usuario no encontrado.");
            var cartItems = await _db.CartItems
                .Where(c => c.UserId == userId)
                .ToListAsync();
            if (!cartItems.Any())
                return BadRequest("Carrito vacío.");
            var productIds = cartItems.Select(ci => ci.ProductId).ToList();
            var products = await _db.Products
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();
            var setting = await _db.Settings.FirstOrDefaultAsync();
            decimal taxRate = setting?.TaxRate ?? 0;
            decimal shippingCost = setting?.ShippingCost ?? 0;
            decimal globalDiscount = setting?.GlobalDiscountPercent ?? 0;
            var extraTaxes = await _db.ExtraTaxes
                .Where(et => et.IsActive)
                .ToListAsync();
            decimal subtotal = 0;
            var orderItemList = new List<OrderItem>();
            foreach (var ci in cartItems)
            {
                var prod = products.FirstOrDefault(p => p.Id == ci.ProductId);
                if (prod == null) continue;
                if (prod.Stock < ci.Quantity)
                {
                    return BadRequest($"No hay suficiente stock para {prod.Name}.");
                }
                decimal finalPrice = prod.Price;
                if (globalDiscount > 0)
                {
                    finalPrice -= finalPrice * (globalDiscount / 100m);
                }
                else if (prod.IsDiscountActive && prod.DiscountPercent > 0)
                {
                    finalPrice -= finalPrice * (prod.DiscountPercent / 100m);
                }
                if (finalPrice < 0) finalPrice = 0;
                subtotal += finalPrice * ci.Quantity;
                orderItemList.Add(new OrderItem
                {
                    ProductId = prod.Id,
                    Quantity = ci.Quantity,
                    Price = finalPrice
                });
            }
            decimal taxAmount = subtotal * (taxRate / 100);
            decimal extraTaxesTotal = 0;
            foreach (var et in extraTaxes)
            {
                if (et.IsPercentage)
                {
                    extraTaxesTotal += subtotal * (et.Value / 100m);
                }
                else
                {
                    extraTaxesTotal += et.Value;
                }
            }
            decimal total = subtotal + taxAmount + extraTaxesTotal + shippingCost;
            // Contador por usuario => displayIndex
            int userOrderCount = await _db.Orders.CountAsync(o => o.UserId == userId);
            int displayIndex = userOrderCount + 1;
            var order = new Order
            {
                UserId = userId,
                TotalAmount = total,
                CreatedAt = DateTime.UtcNow,
                Status = "Pendiente"
            };
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();
            foreach (var oi in orderItemList)
            {
                oi.OrderId = order.Id;
                var prod = products.FirstOrDefault(p => p.Id == oi.ProductId);
                if (prod != null)
                {
                    prod.Stock -= oi.Quantity;
                }
                _db.OrderItems.Add(oi);
            }
            await _db.SaveChangesAsync();
            _db.CartItems.RemoveRange(cartItems);
            await _db.SaveChangesAsync();
            OrderShipping? orderShipping = null;
            OrderBilling? orderBilling = null;
            OrderClient? orderClient = null;
            if (request.Shipping != null)
            {
                orderShipping = new OrderShipping
                {
                    OrderId = order.Id,
                    FirstName = request.Shipping.FirstName,
                    LastName = request.Shipping.LastName,
                    Country = request.Shipping.Country,
                    Province = request.Shipping.Province,
                    City = request.Shipping.City,
                    PostalCode = request.Shipping.PostalCode,
                    AddressLine = request.Shipping.AddressLine
                };
                _db.OrderShippings.Add(orderShipping);
            }
            if (request.Billing != null)
            {
                orderBilling = new OrderBilling
                {
                    OrderId = order.Id,
                    Country = request.Billing.Country,
                    Region = request.Billing.Region,
                    City = request.Billing.City,
                    AddressLine1 = request.Billing.AddressLine1,
                    AddressLine2 = request.Billing.AddressLine2
                };
                _db.OrderBillings.Add(orderBilling);
            }
            if (request.Client != null)
            {
                orderClient = new OrderClient
                {
                    OrderId = order.Id,
                    FirstName = request.Client.FirstName,
                    LastName = request.Client.LastName,
                    CompanyName = request.Client.CompanyName,
                    Phone = request.Client.Phone,
                    Email = request.Client.Email,
                    Identification = request.Client.Identification,
                    OrderNotes = request.Client.OrderNotes // guardamos todo, se recorta en el correo
                };
                _db.OrderClients.Add(orderClient);
            }
            await _db.SaveChangesAsync();
            var emailBody = BuildOrderEmailDetailed(
                order,
                orderItemList,
                products,
                subtotal,
                taxRate,
                taxAmount,
                shippingCost,
                extraTaxes,
                orderShipping,
                orderBilling,
                orderClient,
                user,
                displayIndex
            );
            var emailService = new EmailService();
            await emailService.SendEmailAsync(user.Email, $"Confirmación de Compra #{displayIndex}", emailBody);
            return Ok(new { message = "Compra procesada.", orderId = order.Id });
        }
        private string BuildOrderEmailDetailed(
            Order order,
            List<OrderItem> orderItems,
            List<Product> products,
            decimal subtotal,
            decimal taxRate,
            decimal taxAmount,
            decimal shippingCost,
            List<ExtraTax> activeExtraTaxes,
            OrderShipping? shipping,
            OrderBilling? billing,
            OrderClient? client,
            User user,
            int displayIndex
        )
        {
            // Limitamos las notas a 200 chars / 30 words
            string safeNotes = client?.OrderNotes ?? "";
            safeNotes = LimitTextWordsAndChars(safeNotes, 30, 200);
            decimal totalExtraTaxSum = 0;
            var listExtraTaxesHtml = "";
            foreach (var et in activeExtraTaxes)
            {
                decimal val = et.IsPercentage
                    ? (subtotal * (et.Value / 100))
                    : et.Value;
                totalExtraTaxSum += val;
                var label = et.IsPercentage
                    ? $"{et.Name} ({et.Value}%)"
                    : $"{et.Name} (fijo)";
                listExtraTaxesHtml += $@"
<tr>
  <td style='padding:8px; border:1px solid #ddd; text-align:right;' colspan='4'>
    <strong>{label}:</strong>
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    +${val.ToString("F2")}
  </td>
</tr>";
            }
            decimal total = subtotal + taxAmount + totalExtraTaxSum + shippingCost;
            var nowEcuador = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _ecuadorTimeZone);
            // Construir filas de productos
            var productRows = "";
            foreach (var oi in orderItems)
            {
                var prod = products.FirstOrDefault(p => p.Id == oi.ProductId);
                if (prod == null) continue;
                var lineSubtotal = oi.Price * oi.Quantity;
                string finalImg = "";
                if (!string.IsNullOrEmpty(prod.ImageUrl))
                {
                    if (prod.ImageUrl.StartsWith("http"))
                        finalImg = prod.ImageUrl;
                    else
                        finalImg = BASE_URL + prod.ImageUrl;
                }
                productRows += $@"
<tr>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    {(string.IsNullOrEmpty(finalImg)
      ? "(Sin imagen)"
      : $"<img src='{finalImg}' alt='prod-img' style='width:60px;height:60px;object-fit:cover;'/>")}
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    {prod.Name}
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    {oi.Quantity}
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    ${oi.Price.ToString("F2")}
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    ${lineSubtotal.ToString("F2")}
  </td>
</tr>";
            }
            // Resumen
            var summaryRows = $@"
<tr>
  <td style='padding:8px; border:1px solid #ddd; text-align:right;' colspan='4'>
    <strong>Subtotal:</strong>
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    ${subtotal.ToString("F2")}
  </td>
</tr>
<tr>
  <td style='padding:8px; border:1px solid #ddd; text-align:right;' colspan='4'>
    <strong>IVA ({taxRate}%)</strong>
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    +${taxAmount.ToString("F2")}
  </td>
</tr>
{listExtraTaxesHtml}
<tr>
  <td style='padding:8px; border:1px solid #ddd; text-align:right;' colspan='4'>
    <strong>Envío:</strong>
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center;'>
    +${shippingCost.ToString("F2")}
  </td>
</tr>
<tr>
  <td style='padding:8px; border:1px solid #ddd; text-align:right;font-weight:bold;' colspan='4'>
    <strong>TOTAL:</strong>
  </td>
  <td style='padding:8px; border:1px solid #ddd; text-align:center; font-weight:bold; color:green;'>
    ${total.ToString("F2")}
  </td>
</tr>";
            // Sección con datos de compra
            var datosCliente = client == null
                ? "(Sin datos de cliente)"
                : $@"
<div style='text-align:left; margin-bottom:12px;'>
  <p><strong>Nombre:</strong> {client.FirstName} {client.LastName}</p>
  <p><strong>Empresa:</strong> {client.CompanyName}</p>
  <p><strong>Tel:</strong> {client.Phone}</p>
  <p><strong>Email:</strong> {client.Email}</p>
  <p><strong>Identificación:</strong> {client.Identification}</p>
  <p><strong>Notas:</strong>
    <span style='white-space: pre-wrap; display: inline-block; margin-left:5px;'>{safeNotes}</span>
  </p>
</div>";
            var datosEnvio = shipping == null
                ? "(Sin datos de envío)"
                : $@"
<div style='text-align:left; margin-bottom:12px;'>
  <p><strong>País:</strong> {shipping.Country}</p>
  <p><strong>Provincia:</strong> {shipping.Province}</p>
  <p><strong>Ciudad:</strong> {shipping.City}</p>
  <p><strong>Código Postal:</strong> {shipping.PostalCode}</p>
  <p><strong>Dirección:</strong> {shipping.AddressLine}</p>
</div>";
            var datosFacturacion = billing == null
                ? "(Sin datos de facturación)"
                : $@"
<div style='text-align:left; margin-bottom:12px;'>
  <p><strong>País:</strong> {billing.Country}</p>
  <p><strong>Región:</strong> {billing.Region}</p>
  <p><strong>Ciudad:</strong> {billing.City}</p>
  <p><strong>Dirección 1:</strong> {billing.AddressLine1}</p>
  <p><strong>Dirección 2:</strong> {billing.AddressLine2}</p>
</div>";
            var tableStyle = @"
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
thead {
  background: #f2f2f2;
}
td, th {
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 14px;
  text-align: center;
}
@media only screen and (max-width:600px) {
  td, th {
    font-size: 12px;
  }
}
.section-title {
  font-size: 1.2em;
  margin: 12px 0 6px 0;
  text-align: left;
  font-weight: bold;
}
";
            var html = $@"
<html>
<head>
  <meta charset='UTF-8'/>
  <style>
    body {{
      font-family: Arial, sans-serif;
      background-color: #f7f7f7;
      margin: 0;
      padding: 0;
      text-align: center;
    }}
    .container {{
      max-width: 600px;
      margin: 20px auto;
      background: #fff;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }}
    .header {{
      background: #007bff;
      color: #fff;
      padding: 16px;
      text-align: center;
    }}
    .header h1 {{
      margin: 0;
    }}
    .content {{
      padding: 16px;
      text-align: center;
    }}
    .footer {{
      background: #f2f2f2;
      padding: 16px;
      text-align: center;
      font-size: 13px;
      color: #777;
    }}
    {tableStyle}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>Confirmación de Compra</h1>
    </div>
    <div class='content'>
      <p>Hola <strong>{user.FirstName}</strong>, tu orden #{displayIndex} se ha procesado correctamente.</p>
      <p>Fecha: {nowEcuador:dd/MM/yyyy HH:mm} (hora Ecuador)</p>
      <h3 style='margin-top:20px;'>Productos Comprados</h3>
      <table>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Producto</th>
            <th>Cant.</th>
            <th>P. U.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {productRows}
          {summaryRows}
        </tbody>
      </table>
      <h2 class='section-title' style='margin-top:28px;'>Datos de compra</h2>
      <h3 class='section-title'>Datos de Cliente</h3>
      {datosCliente}
      <h3 class='section-title'>Dirección de Envío</h3>
      {datosEnvio}
      <h3 class='section-title'>Facturación</h3>
      {datosFacturacion}
      <p style='margin-top:20px;'>¡Gracias por comprar con nosotros!</p>
    </div>
    <div class='footer'>
      <p>© {DateTime.Now.Year} Mi E-commerce. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>";
            return html;
        }
        // Función auxiliar para limitar a 30 palabras / 200 chars
        private string LimitTextWordsAndChars(string str, int maxWords, int maxChars)
        {
            if (str.Length > maxChars)
            {
                str = str[..maxChars];
            }
            var words = str.Split(new[] { ' ', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Length > maxWords)
            {
                words = words.Take(maxWords).ToArray();
                str = string.Join(" ", words);
            }
            return str;
        }
        public class CheckoutRequest
        {
            public string PaymentMethod { get; set; } = "";
            public int UserId { get; set; }
            public ShippingInfo? Shipping { get; set; }
            public BillingInfo? Billing { get; set; }
            public ClientInfo? Client { get; set; }
        }
        public class ShippingInfo
        {
            public string FirstName { get; set; } = "";
            public string LastName { get; set; } = "";
            public string Country { get; set; } = "";
            public string Province { get; set; } = "";
            public string City { get; set; } = "";
            public string PostalCode { get; set; } = "";
            public string AddressLine { get; set; } = "";
        }
        public class BillingInfo
        {
            public string Country { get; set; } = "";
            public string Region { get; set; } = "";
            public string City { get; set; } = "";
            public string AddressLine1 { get; set; } = "";
            public string AddressLine2 { get; set; } = "";
        }
        public class ClientInfo
        {
            public string FirstName { get; set; } = "";
            public string LastName { get; set; } = "";
            public string CompanyName { get; set; } = "";
            public string Phone { get; set; } = "";
            public string Email { get; set; } = "";
            public string Identification { get; set; } = "";
            public string OrderNotes { get; set; } = "";
        }
        public class SendOrderRequest
        {
            public string EstimatedTime { get; set; } = "";
        }
        public class CancelOrderRequest
        {
            public string CancelReason { get; set; } = "";
        }
    }
}
