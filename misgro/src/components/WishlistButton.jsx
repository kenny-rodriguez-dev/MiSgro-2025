"use client";

import { useContext } from "react";
import { WishlistContext } from "../context/WishlistContext";
import { AuthContext } from "../context/AuthContext";
import { Button } from "@mui/material";

export default function WishlistButton({ product }) {
  const { addToWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);

  const handleClick = () => {
    if (!user) {
      alert("Debes iniciar sesión para añadir a favoritos.");
      return;
    }
    addToWishlist(product);
  };

  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={handleClick}
      sx={{
        textTransform: "none",
        fontWeight: "bold",
      }}
    >
      Favorito
    </Button>
  );
}
