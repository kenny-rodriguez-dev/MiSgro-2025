using Microsoft.EntityFrameworkCore;
using Proyecto_ecommerce.Models;

namespace Proyecto_ecommerce.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<WishListItem> WishlistItems { get; set; } = null!;
        public DbSet<CartItem> CartItems { get; set; } = null!;
        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<ProductCategory> ProductCategories { get; set; } = null!;
        public DbSet<Setting> Settings { get; set; } = null!;
        public DbSet<ShippingAddress> ShippingAddresses { get; set; } = null!;
        public DbSet<PaymentMethod> PaymentMethods { get; set; } = null!;
        public DbSet<BillingDetail> BillingDetails { get; set; } = null!;
        public DbSet<ClientData> ClientDatas { get; set; } = null!;
        public DbSet<OrderShipping> OrderShippings { get; set; } = null!;
        public DbSet<OrderBilling> OrderBillings { get; set; } = null!;
        public DbSet<OrderClient> OrderClients { get; set; } = null!;
        public DbSet<ExtraTax> ExtraTaxes { get; set; } = null!;
        public DbSet<ProductImage> ProductImages { get; set; } = null!;

        // NUEVO: DbSet para los códigos de restablecimiento de contraseña
        public DbSet<PasswordResetCode> PasswordResetCodes { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<WishListItem>()
                .HasKey(w => new { w.UserId, w.ProductId });

            modelBuilder.Entity<CartItem>()
                .HasKey(c => new { c.UserId, c.ProductId });

            modelBuilder.Entity<ProductCategory>()
                .HasKey(pc => new { pc.ProductId, pc.CategoryId });

            modelBuilder.Entity<ProductImage>()
                .HasKey(pi => pi.Id);

            // NUEVO: Configuración para la entidad PasswordResetCode (Email como PK)
            modelBuilder.Entity<PasswordResetCode>()
                .HasKey(prc => prc.Email);
        }
    }
}
