"use client";

import { useContext, useEffect, useState } from "react";
import { WishlistContext } from "../../context/WishlistContext";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import API from "../../services/api";

/* MUI */
import {
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";

/* Breadcrumb */
import Breadcrumb from "../../components/Breadcrumb";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);
  const { cartItems, addToCart } = useContext(CartContext);
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [globalDiscount, setGlobalDiscount] = useState(0);

  // Snackbars
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("success");

  const showSnack = (msg, type = "success") => {
    setSnackMsg(msg);
    setSnackType(type);
    setOpenSnack(true);
  };
  const closeSnack = () => {
    setOpenSnack(false);
  };

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [removeItemId, setRemoveItemId] = useState(null);

  const handleOpenDialog = (id) => {
    setRemoveItemId(id);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setRemoveItemId(null);
    setOpenDialog(false);
  };
  const handleConfirmDelete = () => {
    if (removeItemId !== null) {
      removeFromWishlist(removeItemId);
      showSnack("Producto eliminado de la lista de deseos.", "success");
    }
    setRemoveItemId(null);
    setOpenDialog(false);
  };

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.replace("/login");
        return;
      }
      fetchSettings();
    }
  }, [loadingAuth, user, router]);

  const fetchSettings = async () => {
    try {
      const res = await API.get("/settings");
      setGlobalDiscount(res.data.globalDiscountPercent || 0);
    } catch (error) {
      console.error("Error al cargar settings:", error);
    }
  };

  if (loadingAuth) {
    return <p className="mt-8 text-center">Cargando autenticación...</p>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Wishlist", href: "/wishlist" },
        ]}
      />

      {(!wishlistItems || wishlistItems.length === 0) ? (
        <div className="text-center mt-8">
          <Typography variant="h6" color="text.secondary">
            Tu lista de deseos está vacía.
          </Typography>
        </div>
      ) : (
        <>
          <Typography variant="h5" fontWeight="bold" mb={3} className="flex items-center gap-2">
            <FavoriteIcon /> Lista de Deseos
          </Typography>

          <div className="space-y-4">
            {wishlistItems.map((item) => {
              const disabled = cartItems.some((i) => i.id === item.id);

              // Calcular precio con global discount
              let finalPrice = item.price;
              let discountLabel = "";
              if (globalDiscount > 0) {
                finalPrice -= finalPrice * (globalDiscount / 100);
                discountLabel = `-${globalDiscount}% (Global)`;
              } else if (item.isDiscountActive && item.discountPercent > 0) {
                finalPrice -= finalPrice * (item.discountPercent / 100);
                discountLabel = `-${item.discountPercent}%`;
              }

              return (
                <Card key={item.id} className="shadow-md">
                  <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          item.imageUrl?.startsWith("http")
                            ? item.imageUrl
                            : `http://localhost:5009${item.imageUrl}`
                        }
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div>
                        <Typography fontWeight="bold">{item.name}</Typography>
                        {discountLabel ? (
                          <div>
                            <Typography
                              variant="caption"
                              sx={{ textDecoration: "line-through", marginRight: "8px" }}
                            >
                              ${item.price.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="green" fontWeight="bold">
                              ${finalPrice.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="error">
                              {discountLabel}
                            </Typography>
                          </div>
                        ) : (
                          <Typography variant="body2" fontWeight="bold">
                            ${item.price.toFixed(2)}
                          </Typography>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (!disabled) {
                            addToCart(item, 1);
                            showSnack("Producto agregado al carrito.", "success");
                          }
                        }}
                        disabled={disabled}
                        variant="contained"
                        color="primary"
                        startIcon={<AddShoppingCartIcon />}
                      >
                        {disabled ? "En Carrito" : "Agregar al Carrito"}
                      </Button>
                      <Button
                        onClick={() => handleOpenDialog(item.id)}
                        variant="outlined"
                        color="error"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6">
            <Button variant="contained" color="secondary" onClick={() => router.push("/products")}>
              Seguir Comprando
            </Button>
          </div>
        </>
      )}

      {/* Dialog confirmar eliminar */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Eliminar de Favoritos</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar este producto de tu lista de deseos?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={openSnack}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={closeSnack} severity={snackType} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </div>
  );
}
