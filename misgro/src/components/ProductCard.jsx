"use client";

import { useContext } from "react";
import Link from "next/link";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";

import { Card, CardContent, CardMedia, Typography, Button } from "@mui/material";

export default function ProductCard({ product }) {
  const { cartItems, addToCart } = useContext(CartContext);
  const { wishlistItems, addToWishlist } = useContext(WishlistContext);

  const isInCart = cartItems.some((item) => item.id === product.id);
  const isInWishlist = wishlistItems.some((item) => item.id === product.id);
  const outOfStock = product.stock <= 0;

  let finalPrice = product.price;
  if (product.isDiscountActive && product.discountPercent > 0) {
    finalPrice = finalPrice - (finalPrice * (product.discountPercent / 100));
  }

  const handleAddToCart = () => {
    if (!isInCart && !outOfStock) {
      addToCart(product, 1);
    }
  };

  const handleAddToWishlist = () => {
    if (!isInWishlist) {
      addToWishlist(product);
    }
  };

  const getImageSrc = () => {
    if (!product.imageUrl) return "";
    return product.imageUrl.startsWith("http")
      ? product.imageUrl
      : `http://localhost:5009${product.imageUrl}`;
  };

  return (
    <Card
      sx={{
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        borderRadius: "8px",
      }}
    >
      <CardMedia
        component="img"
        image={getImageSrc() || "/no-image.png"}
        alt={product.name}
        sx={{
          height: 180,
          objectFit: "cover",
        }}
      />
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {product.description}
        </Typography>

        {product.isDiscountActive && product.discountPercent > 0 ? (
          <div className="mb-2">
            <Typography variant="caption" color="error">
              -{product.discountPercent}%
            </Typography>
            <Typography variant="caption" sx={{ textDecoration: "line-through", ml: 1 }}>
              ${product.price}
            </Typography>
            <Typography variant="subtitle1" color="success.main" sx={{ fontWeight: "bold" }}>
              ${finalPrice.toFixed(2)}
            </Typography>
          </div>
        ) : (
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            ${product.price}
          </Typography>
        )}

        <Typography variant="body2" sx={{ mb: 1 }}>
          Stock: {product.stock}
        </Typography>

        <div className="flex gap-2">
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddToCart}
            disabled={isInCart || outOfStock}
            sx={{ textTransform: "none", fontWeight: "bold" }}
          >
            {outOfStock ? "Sin stock" : isInCart ? "En Carrito" : "Agregar"}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            onClick={handleAddToWishlist}
            disabled={isInWishlist}
            sx={{ textTransform: "none", fontWeight: "bold" }}
          >
            {isInWishlist ? "En Wishlist" : "Favorito"}
          </Button>
        </div>

        <Link href={`/products/${product.id}`} className="text-blue-500 mt-2 inline-block">
          Ver Detalles
        </Link>
      </CardContent>
    </Card>
  );
}
