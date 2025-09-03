-------------------------------------------------------
-- 1. Crear la Base de Datos (si no existe)
-------------------------------------------------------
IF NOT EXISTS(SELECT name FROM sys.databases WHERE name = 'Proyecto_ecommerce')
BEGIN
    CREATE DATABASE Proyecto_ecommerce;
    PRINT 'Base de datos Proyecto_ecommerce creada.';
END
ELSE
BEGIN
    PRINT 'La base de datos Proyecto_ecommerce ya existe.';
END;
GO

USE Proyecto_ecommerce;
GO

-------------------------------------------------------
-- 2. TABLA: Users
-------------------------------------------------------
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL
    DROP TABLE dbo.Users;
GO

CREATE TABLE dbo.Users
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'User',
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),

    LastPasswordChange DATETIME NULL,
    LastPasswordChangeMethod NVARCHAR(20) NULL
);
GO

-------------------------------------------------------
-- 3. TABLA: Products
-------------------------------------------------------
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL
    DROP TABLE dbo.Products;
GO

CREATE TABLE dbo.Products
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(150) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    Price DECIMAL(18,2) NOT NULL,
    ImageUrl NVARCHAR(300) NOT NULL,
    Stock INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),

    -- Campos para descuento individual
    DiscountPercent DECIMAL(5,2) NOT NULL DEFAULT 0,
    IsDiscountActive BIT NOT NULL DEFAULT 0,

    -- NUEVO: Columna para la 'ShortDescription' (opcional)
    ShortDescription NVARCHAR(100) NULL
);
GO

-------------------------------------------------------
-- 4. TABLA: CartItems
-------------------------------------------------------
IF OBJECT_ID('dbo.CartItems', 'U') IS NOT NULL
    DROP TABLE dbo.CartItems;
GO

CREATE TABLE dbo.CartItems
(
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,

    CONSTRAINT PK_CartItems PRIMARY KEY (UserId, ProductId)
);

ALTER TABLE dbo.CartItems
ADD CONSTRAINT FK_CartItems_Users
FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
ON DELETE CASCADE;

ALTER TABLE dbo.CartItems
ADD CONSTRAINT FK_CartItems_Products
FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 5. TABLA: Orders
-------------------------------------------------------
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL
    DROP TABLE dbo.Orders;
GO

CREATE TABLE dbo.Orders
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId INT NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pendiente',

    ShippingEta NVARCHAR(100) NULL,
    CancelReason NVARCHAR(255) NULL
);

ALTER TABLE dbo.Orders
ADD CONSTRAINT FK_Orders_Users
FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 6. TABLA: OrderItems
-------------------------------------------------------
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL
    DROP TABLE dbo.OrderItems;
GO

CREATE TABLE dbo.OrderItems
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL
);

ALTER TABLE dbo.OrderItems
ADD CONSTRAINT FK_OrderItems_Orders
FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id)
ON DELETE CASCADE;

ALTER TABLE dbo.OrderItems
ADD CONSTRAINT FK_OrderItems_Products
FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 7. TABLA: WishlistItems
-------------------------------------------------------
IF OBJECT_ID('dbo.WishlistItems', 'U') IS NOT NULL
    DROP TABLE dbo.WishlistItems;
GO

CREATE TABLE dbo.WishlistItems
(
    UserId INT NOT NULL,
    ProductId INT NOT NULL,

    CONSTRAINT PK_WishlistItems PRIMARY KEY (UserId, ProductId)
);

ALTER TABLE dbo.WishlistItems
ADD CONSTRAINT FK_WishlistItems_Users
FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
ON DELETE CASCADE;

ALTER TABLE dbo.WishlistItems
ADD CONSTRAINT FK_WishlistItems_Products
FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 8. TABLA: Categories
-------------------------------------------------------
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL
    DROP TABLE dbo.Categories;
GO

CREATE TABLE dbo.Categories
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL
);
GO

-------------------------------------------------------
-- 9. TABLA: ProductCategories
-------------------------------------------------------
IF OBJECT_ID('dbo.ProductCategories', 'U') IS NOT NULL
    DROP TABLE dbo.ProductCategories;
GO

CREATE TABLE dbo.ProductCategories
(
    ProductId INT NOT NULL,
    CategoryId INT NOT NULL,
    CONSTRAINT PK_ProductCategories PRIMARY KEY (ProductId, CategoryId)
);

ALTER TABLE dbo.ProductCategories
ADD CONSTRAINT FK_ProductCategories_Products
FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
ON DELETE CASCADE;

ALTER TABLE dbo.ProductCategories
ADD CONSTRAINT FK_ProductCategories_Categories
FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 10. TABLA: Settings
-------------------------------------------------------
IF OBJECT_ID('dbo.Settings', 'U') IS NOT NULL
    DROP TABLE dbo.Settings;
GO

CREATE TABLE dbo.Settings
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    TaxRate DECIMAL(5,2) NOT NULL DEFAULT 12,
    ShippingCost DECIMAL(18,2) NOT NULL DEFAULT 0,

    -- Descuento global
    GlobalDiscountPercent DECIMAL(5,2) NOT NULL DEFAULT 0
);
GO

-------------------------------------------------------
-- 11. TABLA: ShippingAddresses
-------------------------------------------------------
IF OBJECT_ID('dbo.ShippingAddresses', 'U') IS NOT NULL
    DROP TABLE dbo.ShippingAddresses;
GO

CREATE TABLE dbo.ShippingAddresses
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId INT NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    Province NVARCHAR(100) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    PostalCode NVARCHAR(50) NOT NULL,
    AddressLine NVARCHAR(255) NOT NULL
);

ALTER TABLE dbo.ShippingAddresses
ADD CONSTRAINT FK_ShippingAddresses_Users
FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 12. TABLA: PaymentMethods
-------------------------------------------------------
IF OBJECT_ID('dbo.PaymentMethods', 'U') IS NOT NULL
    DROP TABLE dbo.PaymentMethods;
GO

CREATE TABLE dbo.PaymentMethods
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId INT NOT NULL,
    [Type] NVARCHAR(50) NOT NULL,
    MaskedData NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE()
);

ALTER TABLE dbo.PaymentMethods
ADD CONSTRAINT FK_PaymentMethods_Users
FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 13. TABLA: BillingDetails
-------------------------------------------------------
IF OBJECT_ID('dbo.BillingDetails', 'U') IS NOT NULL
    DROP TABLE dbo.BillingDetails;
GO

CREATE TABLE dbo.BillingDetails
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId INT NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    Region NVARCHAR(100) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    AddressLine1 NVARCHAR(255) NOT NULL,
    AddressLine2 NVARCHAR(255) NULL
);

ALTER TABLE dbo.BillingDetails
ADD CONSTRAINT FK_BillingDetails_Users
FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 14. TABLA: ClientDatas
-------------------------------------------------------
IF OBJECT_ID('dbo.ClientDatas', 'U') IS NOT NULL
    DROP TABLE dbo.ClientDatas;
GO

CREATE TABLE dbo.ClientDatas
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId INT NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    CompanyName NVARCHAR(200) NULL,
    Phone NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Identification NVARCHAR(100) NOT NULL,
    OrderNotes NVARCHAR(MAX) NULL
);

ALTER TABLE dbo.ClientDatas
ADD CONSTRAINT FK_ClientDatas_Users
FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 15. TABLAS: OrderShippings, OrderBillings, OrderClients
-------------------------------------------------------
IF OBJECT_ID('dbo.OrderShippings', 'U') IS NOT NULL
    DROP TABLE dbo.OrderShippings;
GO

CREATE TABLE dbo.OrderShippings
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId INT NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    Province NVARCHAR(100) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    PostalCode NVARCHAR(50) NOT NULL,
    AddressLine NVARCHAR(255) NOT NULL
);

ALTER TABLE dbo.OrderShippings
ADD CONSTRAINT FK_OrderShippings_Orders
FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id)
ON DELETE CASCADE;
GO

IF OBJECT_ID('dbo.OrderBillings', 'U') IS NOT NULL
    DROP TABLE dbo.OrderBillings;
GO

CREATE TABLE dbo.OrderBillings
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId INT NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    Region NVARCHAR(100) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    AddressLine1 NVARCHAR(255) NOT NULL,
    AddressLine2 NVARCHAR(255) NULL
);

ALTER TABLE dbo.OrderBillings
ADD CONSTRAINT FK_OrderBillings_Orders
FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id)
ON DELETE CASCADE;
GO

IF OBJECT_ID('dbo.OrderClients', 'U') IS NOT NULL
    DROP TABLE dbo.OrderClients;
GO

CREATE TABLE dbo.OrderClients
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId INT NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    CompanyName NVARCHAR(200) NULL,
    Phone NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Identification NVARCHAR(100) NOT NULL,
    OrderNotes NVARCHAR(MAX) NULL
);

ALTER TABLE dbo.OrderClients
ADD CONSTRAINT FK_OrderClients_Orders
FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- 16. TABLA: ExtraTaxes
-------------------------------------------------------
IF OBJECT_ID('dbo.ExtraTaxes', 'U') IS NOT NULL
    DROP TABLE dbo.ExtraTaxes;
GO

CREATE TABLE dbo.ExtraTaxes
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(100) NOT NULL,
    IsPercentage BIT NOT NULL DEFAULT 1,
    Value DECIMAL(18,2) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 0
);
GO

-------------------------------------------------------
-- 17. TABLA: ProductImages
-- (Para múltiples imágenes de un producto)
-------------------------------------------------------
IF OBJECT_ID('dbo.ProductImages', 'U') IS NOT NULL
    DROP TABLE dbo.ProductImages;
GO

CREATE TABLE dbo.ProductImages
(
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductId INT NOT NULL,
    ImageUrl NVARCHAR(300) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE()
);

ALTER TABLE dbo.ProductImages
ADD CONSTRAINT FK_ProductImages_Products
FOREIGN KEY (ProductId) REFERENCES dbo.Products(Id)
ON DELETE CASCADE;
GO

-------------------------------------------------------
-- FIN
-------------------------------------------------------
PRINT 'Estructura de tablas creada/actualizada exitosamente. Incluye ShortDescription y ProductImages.';
