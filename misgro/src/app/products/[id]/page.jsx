"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "../../../services/api";
import { CartContext } from "../../../context/CartContext";
import { WishlistContext } from "../../../context/WishlistContext";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import Breadcrumb from "../../../components/Breadcrumb";
import { AuthContext } from "../../../context/AuthContext";

/**
 * Retorna la URL final para una imagen,
 * ya sea absoluta o relativa al server local (http://localhost:5009...).
 */
const getImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `http://localhost:5009${img}`;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { cartItems, addToCart } = useContext(CartContext);
  const { wishlistItems, addToWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);

  const isAdmin = user && user.role === "Admin";

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);

  // Para imágenes adicionales
  const [extraImages, setExtraImages] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [urls, setUrls] = useState("");

  // Imagen principal (la que se muestra "grande")
  const [mainImageUrl, setMainImageUrl] = useState("");

  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("info");
  const openSnack = (msg, type = "info") => {
    setSnackMsg(msg);
    setSnackType(type);
    setSnackOpen(true);
  };
  const closeSnack = () => setSnackOpen(false);

  // Al montar:
  useEffect(() => {
    if (!id) return;
    fetchGlobalDiscount();
    fetchProduct(id);
    fetchImages(id);
  }, [id]);

  // Cargar descuento global
  const fetchGlobalDiscount = async () => {
    try {
      const res = await API.get("/settings");
      setGlobalDiscountPercent(res.data.globalDiscountPercent || 0);
    } catch {
      // Si falla, no saturamos la consola
    }
  };

  // Cargar producto
  const fetchProduct = async (prodId) => {
    setLoading(true);
    try {
      const res = await API.get(`/products/${prodId}`);
      setProduct(res.data);
      // Al obtener, definimos la imagen principal
      setMainImageUrl(res.data.imageUrl || "");
    } catch {
      setProduct(null);
    }
    setLoading(false);
  };

  // Cargar imágenes adicionales
  const fetchImages = async (prodId) => {
    try {
      const res = await API.get(`/productimages/${prodId}`);
      setExtraImages(res.data);
    } catch {
      setExtraImages([]);
    }
  };

  // En el carrito...
  const isInCart = product && cartItems.some((item) => item.id === product.id);
  // En wishlist...
  const isInWishlist = product && wishlistItems.some((item) => item.id === product.id);
  const outOfStock = product && product.stock <= 0;

  const handleAddToCart = () => {
    if (!user) {
      openSnack("Debes iniciar sesión para agregar al carrito.", "error");
      return;
    }
    if (product && !isInCart && !outOfStock) {
      addToCart(product, 1);
      openSnack("Producto agregado al carrito.", "success");
    }
  };

  const handleAddToWishlist = () => {
    if (!user) {
      openSnack("Debes iniciar sesión para añadir a Favoritos.", "error");
      return;
    }
    if (product && !isInWishlist) {
      addToWishlist(product);
      openSnack("Producto agregado a Favoritos.", "success");
    }
  };

  // Lógica de precio final
  let finalPrice = 0;
  let hasDiscount = false;
  let discountLabel = "";

  if (product) {
    finalPrice = product.price;
    if (globalDiscountPercent > 0) {
      finalPrice -= finalPrice * (globalDiscountPercent / 100);
      hasDiscount = true;
      discountLabel = `-${globalDiscountPercent}% (Global)`;
    } else if (product.isDiscountActive && product.discountPercent > 0) {
      finalPrice -= finalPrice * (product.discountPercent / 100);
      hasDiscount = true;
      discountLabel = `-${product.discountPercent}%`;
    }
    if (finalPrice < 0) finalPrice = 0;
  }

  // Subir imágenes
  const handleAddImages = async () => {
    if (!isAdmin) {
      openSnack("No tienes permisos de admin.", "error");
      return;
    }
    try {
      const formData = new FormData();
      // Archivos
      if (fileList && fileList.length > 0) {
        for (let i = 0; i < fileList.length; i++) {
          formData.append("file", fileList[i]);
        }
      }
      // URLs (separadas por salto de línea o comas)
      const splitted = urls.split(/\r?\n|,/).map((u) => u.trim()).filter((u) => u);
      splitted.forEach((url) => formData.append("imageUrl", url));

      if ((!fileList || fileList.length === 0) && splitted.length === 0) {
        openSnack("No hay archivos ni URLs que subir.", "warning");
        return;
      }

      await API.post(`/productimages/${id}?role=Admin`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      openSnack("Imágenes subidas con éxito.", "success");
      setFileList([]);
      setUrls("");
      fetchImages(id);
    } catch {
      openSnack("Error al subir imágenes.", "error");
    }
  };

  // Cancelar la subida de imágenes (limpia archivos y URLs)
  const handleCancelImagesUpload = () => {
    setFileList([]);
    setUrls("");
    openSnack("Se canceló la subida de imágenes.", "info");
  };

  // Borrar una imagen
  const handleDeleteImage = async (imgId) => {
    if (!isAdmin) {
      openSnack("No tienes permisos de admin.", "error");
      return;
    }
    try {
      await API.delete(`/productimages/${id}/${imgId}?role=Admin`);
      openSnack("Imagen eliminada.", "warning");
      fetchImages(id);
    } catch {
      openSnack("Error al eliminar la imagen.", "error");
    }
  };

  // Al hacer clic en una imagen extra => se muestra en el main
  const handleClickExtraImage = (imgUrl) => {
    setMainImageUrl(imgUrl);
  };

  if (loading) {
    return <p className="text-center text-gray-500 mt-8">Cargando producto...</p>;
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Productos", href: "/products" },
            { label: "Detalle", href: `/products/${id}` },
          ]}
        />
        <Card className="shadow-md">
          <CardContent>
            <Typography variant="h6" fontWeight="bold" mb={2} color="error">
              Producto no encontrado o inexistente.
            </Typography>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.push("/products")}
            >
              Volver a Productos
            </Button>
          </CardContent>
        </Card>

        <Snackbar
          open={snackOpen}
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/products" },
          { label: "Detalle", href: `/products/${id}` },
        ]}
      />

      <Card className="shadow-md">
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Detalle de Producto
          </Typography>
          <Divider className="mb-4" />

          {/* Diseño: imagen principal + resto en cascada */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Columna Izquierda: imagen principal y extraImages */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              {/* Imagen principal */}
              <img
                src={getImageUrl(mainImageUrl)}
                alt={product.name}
                className="w-full h-auto object-cover rounded shadow"
              />

              {/* Cascada de imágenes extra */}
              {extraImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {extraImages.map((img) => (
                    <div key={img.id} className="relative">
                      <img
                        src={getImageUrl(img.imageUrl)}
                        alt={`Extra-${img.id}`}
                        className="w-20 h-20 object-cover rounded hover:opacity-80 cursor-pointer"
                        onClick={() => handleClickExtraImage(img.imageUrl)}
                      />
                      {isAdmin && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          style={{
                            position: "absolute",
                            top: "0",
                            right: "0",
                            minWidth: "40px",
                            padding: "2px 4px",
                          }}
                          onClick={() => handleDeleteImage(img.id)}
                        >
                          X
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Columna Derecha: información del producto */}
            <div className="flex-1">
              <Typography
                variant="h5"
                fontWeight="bold"
                mb={2}
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {product.name}
              </Typography>

              {/* Descripción opcional (shortDescription) con la misma lógica que la descripción larga */}
              {product.shortDescription && (
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    lineHeight: "1.6",
                    textAlign: "justify",
                  }}
                  className="mb-4"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              )}

              {/* Descripción larga */}
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  lineHeight: "1.6",
                  textAlign: "justify",
                }}
                className="mb-4"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />

              {hasDiscount ? (
                <div className="my-2">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textDecoration: "line-through", mr: 1 }}
                  >
                    ${product.price.toFixed(2)}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="green" component="span">
                    ${finalPrice.toFixed(2)}
                  </Typography>
                  <span className="text-sm text-red-600 ml-2">{discountLabel}</span>
                </div>
              ) : (
                <Typography variant="h6" fontWeight="bold" color="green" mb={2}>
                  ${product.price.toFixed(2)}
                </Typography>
              )}

              <Typography variant="body2" sx={{ mb: 2 }}>
                Stock: {product.stock}
                {outOfStock && " (Sin stock)"}
              </Typography>

              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isInCart || outOfStock}
                  variant="contained"
                  color="primary"
                  sx={{ textTransform: "none", fontWeight: "bold" }}
                >
                  {outOfStock ? "Sin stock" : isInCart ? "En Carrito" : "Agregar al Carrito"}
                </Button>
                <Button
                  onClick={handleAddToWishlist}
                  disabled={isInWishlist}
                  variant="contained"
                  color="success"
                  sx={{ textTransform: "none", fontWeight: "bold" }}
                >
                  {isInWishlist ? "En Favoritos" : "Agregar a Favoritos"}
                </Button>
              </div>
            </div>
          </div>

          <Divider className="my-4" />

          {/* ADMIN: Sección para subir imágenes adicionales */}
          {isAdmin && (
            <div className="mb-4 bg-gray-50 p-3 rounded">
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                Subir Imágenes Adicionales
              </Typography>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex-1">
                  <TextField
                    label="URLs de imagen (una por línea o separadas por coma)"
                    multiline
                    rows={2}
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{ backgroundColor: "#fff", borderRadius: 1 }}
                  />
                </div>
                <div>
                  <Button variant="outlined" component="label" sx={{ mx: 2 }}>
                    Seleccionar Archivos
                    <input
                      hidden
                      multiple
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setFileList(Array.from(e.target.files));
                        }
                      }}
                    />
                  </Button>
                  {fileList.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      ({fileList.length} archivo(s) seleccionados)
                    </Typography>
                  )}
                </div>
              </div>
              <div className="flex mt-2 gap-2">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddImages}
                >
                  Subir
                </Button>
                {(fileList.length > 0 || urls.trim() !== "") && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancelImagesUpload}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Botón Volver a Productos */}
          <div className="text-right">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.push("/products")}
            >
              Volver a Productos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Snackbar
        open={snackOpen}
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
