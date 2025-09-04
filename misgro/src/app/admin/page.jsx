"use client";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  Divider,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Popover,
} from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDropDown,
  Image as ImageIcon,
} from "@mui/icons-material";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import Breadcrumb from "../../components/Breadcrumb";
import { useRouter } from "next/navigation";

/** Límite de palabras y caracteres para strings en ciertos campos */
function limitWordsAndChars(str, maxWords, maxChars) {
  if (str.length > maxChars) {
    str = str.slice(0, maxChars);
  }
  const words = str.split(/\s+/);
  if (words.length > maxWords) {
    str = words.slice(0, maxWords).join(" ");
  }
  return str;
}

export default function AdminPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();
  // Lista de productos
  const [products, setProducts] = useState([]);
  // Form para crear/editar
  const [form, setForm] = useState({
    id: 0,
    name: "",
    shortDescription: "",
    description: "",
    price: 0,
    imageUrl: "",
    stock: 0,
    discountPercent: 0,
    isDiscountActive: false,
  });
  const [file, setFile] = useState(null);
  // Categorías
  const [categories, setCategories] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [productAssignments, setProductAssignments] = useState([]);
  // Buscador / paginación de productos
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  // Buscador / paginación de categorías
  const [catSearchTerm, setCatSearchTerm] = useState("");
  const [catCurrentPage, setCatCurrentPage] = useState(1);
  const catPageSize = 5;
  const [catName, setCatName] = useState("");
  const [editCatId, setEditCatId] = useState(0);
  const [editCatName, setEditCatName] = useState("");
  // Loading, error, global discount
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [globalDiscount, setGlobalDiscount] = useState(0);
  // Popover Categorías
  const [anchorEl, setAnchorEl] = useState(null);
  const openCatPopover = Boolean(anchorEl);
  const handleOpenCatPopover = (e) => setAnchorEl(e.currentTarget);
  const handleCloseCatPopover = () => setAnchorEl(null);
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
  // Diálogo (delete product / image / category)
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogData, setDialogData] = useState(null);
  const handleOpenDialog = (obj) => {
    setDialogData(obj);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setDialogData(null);
    setOpenDialog(false);
  };
  const handleConfirmDelete = async () => {
    if (!dialogData) return;
    const { type, id } = dialogData;
    try {
      if (type === "product") {
        await API.delete(`/products/${id}?role=Admin`);
        openSnack("Producto eliminado", "warning");
        await fetchProducts();
      } else if (type === "image") {
        await API.delete(`/products/${id}/image?role=Admin`);
        openSnack("Imagen borrada", "warning");
        await fetchProducts();
      } else if (type === "category") {
        await API.delete(`/categories/${id}?role=Admin`);
        openSnack("Categoría eliminada", "success");
        await fetchCategoriesList();
        await fetchCategories();
      }
    } catch (err) {
      if (err?.response?.data) {
        openSnack("Error al eliminar: " + err.response.data, "error");
      } else {
        openSnack("Error al eliminar", "error");
      }
    }
    handleCloseDialog();
  };
  // Diálogo Config. Imágenes
  const [imgConfigDialogOpen, setImgConfigDialogOpen] = useState(false);
  const [configProductId, setConfigProductId] = useState("");
  const openImagesDialog = () => {
    setConfigProductId("");
    setImgConfigDialogOpen(true);
  };
  const closeImagesDialog = () => {
    setImgConfigDialogOpen(false);
    setConfigProductId("");
  };
  const handleConfigImages = async () => {
    if (!configProductId.trim()) {
      openSnack("Ingresa un ID de producto.", "error");
      return;
    }
    try {
      await API.get(`/products/${configProductId}`);
      setImgConfigDialogOpen(false);
      router.push(`/products/${configProductId}`);
    } catch (err) {
      openSnack("No se encontró el producto con ese ID", "error");
    }
  };
  useEffect(() => {
    if (!loadingAuth) {
      if (!user || user.role !== "Admin") {
        setLoading(false);
      } else {
        fetchProducts();
        fetchCategories();
        fetchCategoriesList();
        fetchProductAssignments();
        fetchGlobalDiscountValue();
      }
    }
  }, [loadingAuth, user]);
  async function fetchGlobalDiscountValue() {
    try {
      const res = await API.get("/settings");
      setGlobalDiscount(Number(res.data.globalDiscountPercent) || 0);
    } catch {
      // omit
    }
  }
  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await API.get("/products");
      setProducts(res.data);
    } catch {
      openSnack("Error al cargar productos", "error");
    } finally {
      setLoading(false);
    }
  }
  async function fetchCategories() {
    try {
      const res = await API.get("/categories");
      setCategories(res.data);
    } catch {
      openSnack("Error al cargar categorías", "error");
    }
  }
  async function fetchCategoriesList() {
    try {
      const res = await API.get("/categories");
      setCategoriesList(res.data);
    } catch {
      openSnack("Error al cargar lista de categorías", "error");
    }
  }
  async function fetchProductAssignments() {
    try {
      const res = await API.get("/categories/allassignments");
      setProductAssignments(res.data);
    } catch {
      openSnack("Error al cargar asignaciones de categorías", "error");
    }
  }
  // Lógica para filtrar/paginar productos
  const filteredProducts = products.filter((p) => {
    const str = `${p.id} ${p.name}`.toLowerCase();
    return str.includes(searchTerm.toLowerCase());
  });
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };
  // Lógica filtrar/paginar categorías
  const filteredCat = categoriesList.filter((c) => {
    const str = `${c.id} ${c.name}`.toLowerCase();
    return str.includes(catSearchTerm.toLowerCase());
  });
  const catTotalPages = Math.ceil(filteredCat.length / catPageSize);
  const catStartIndex = (catCurrentPage - 1) * catPageSize;
  const catEndIndex = catStartIndex + catPageSize;
  const paginatedCats = filteredCat.slice(catStartIndex, catEndIndex);
  function handleCatPrevPage() {
    if (catCurrentPage > 1) setCatCurrentPage(catCurrentPage - 1);
  }
  function handleCatNextPage() {
    if (catCurrentPage < catTotalPages) setCatCurrentPage(catCurrentPage + 1);
  }
  // Create / Edit logic
  function handleClearFile() {
    setFile(null);
  }
  function handleNameChange(e) {
    let val = e.target.value;
    val = limitWordsAndChars(val, 50, 100);
    setForm((prev) => ({ ...prev, name: val }));
  }
  // Eliminamos "hiliteColor" del array
  function handleShortDescriptionChange(content) {
    const limited = limitWordsAndChars(content, 15, 70);
    setForm((prev) => ({ ...prev, shortDescription: limited }));
  }
  function handleDescriptionChange(content) {
    // 10000 palabras
    const words = content.split(/\s+/);
    if (words.length > 10000) {
      const limited = words.slice(0, 10000).join(" ");
      setForm((prev) => ({ ...prev, description: limited }));
    } else {
      setForm((prev) => ({ ...prev, description: content }));
    }
  }
  function handlePriceChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 9) val = val.slice(0, 9);
    setForm((prev) => ({ ...prev, price: val === "" ? 0 : parseInt(val) }));
  }
  function handleStockChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 9) val = val.slice(0, 9);
    setForm((prev) => ({ ...prev, stock: val === "" ? 0 : parseInt(val) }));
  }
  function handleDiscountChange(e) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 3) val = val.slice(0, 3);
    let num = val === "" ? 0 : parseInt(val);
    if (num > 100) num = 100;
    setForm((prev) => ({ ...prev, discountPercent: num }));
  }
  function handleCheckboxChange(e) {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  }
  async function handleCreateProduct(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!file && !form.imageUrl.trim()) {
      setErrorMsg("Debe proporcionar una URL o un archivo local de imagen.");
      return;
    }
    if (file && form.imageUrl.trim()) {
      setErrorMsg("Elija solo URL o archivo local, no ambas.");
      return;
    }
    try {
      const effDiscountPercent = globalDiscount > 0 ? 0 : form.discountPercent;
      const effDiscountActive = globalDiscount > 0 ? false : form.isDiscountActive;
      let createdProduct;
      if (file) {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("shortDescription", form.shortDescription);
        formData.append("description", form.description);
        formData.append("price", form.price);
        formData.append("stock", form.stock);
        formData.append("discountPercent", effDiscountPercent);
        formData.append("isDiscountActive", effDiscountActive);
        formData.append("imageUrl", "");
        formData.append("file", file);
        const res = await API.post(`/products?role=Admin`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        createdProduct = res.data;
      } else {
        const payload = {
          name: form.name,
          shortDescription: form.shortDescription,
          description: form.description,
          price: form.price,
          stock: form.stock,
          discountPercent: effDiscountPercent,
          isDiscountActive: effDiscountActive,
          imageUrl: form.imageUrl,
        };
        const res = await API.post(`/products?role=Admin`, payload);
        createdProduct = res.data;
      }
      if (selectedCategoryIds.length > 0) {
        await API.post(`/categories/assign?productId=${createdProduct.id}&role=Admin`, {
          categoryIds: selectedCategoryIds,
        });
      }
      openSnack("Producto creado exitosamente.", "success");
      setForm({
        id: 0,
        name: "",
        shortDescription: "",
        description: "",
        price: 0,
        imageUrl: "",
        stock: 0,
        discountPercent: 0,
        isDiscountActive: false,
      });
      handleClearFile();
      setSelectedCategoryIds([]);
      await fetchProducts();
      await fetchProductAssignments();
    } catch (error) {
      openSnack("Error al crear producto", "error");
    }
  }
  async function handleUpdateProduct(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!file && !form.imageUrl.trim()) {
      setErrorMsg("Debe proporcionar URL o archivo local (Update).");
      return;
    }
    if (file && form.imageUrl.trim()) {
      setErrorMsg("Solo URL o archivo local, no ambas (Update).");
      return;
    }
    const effDiscountPercent = globalDiscount > 0 ? 0 : form.discountPercent;
    const effDiscountActive = globalDiscount > 0 ? false : form.isDiscountActive;
    try {
      if (file) {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("shortDescription", form.shortDescription);
        formData.append("description", form.description);
        formData.append("price", form.price);
        formData.append("stock", form.stock);
        formData.append("discountPercent", effDiscountPercent);
        formData.append("isDiscountActive", effDiscountActive);
        formData.append("imageUrl", "");
        formData.append("file", file);
        await API.put(`/products/${form.id}?role=Admin`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.put(`/products/${form.id}?role=Admin`, {
          ...form,
          shortDescription: form.shortDescription,
          discountPercent: effDiscountPercent,
          isDiscountActive: effDiscountActive,
        });
      }
      await API.post(`/categories/assign?productId=${form.id}&role=Admin`, {
        categoryIds: selectedCategoryIds,
      });
      openSnack("Producto actualizado", "success");
      setForm({
        id: 0,
        name: "",
        shortDescription: "",
        description: "",
        price: 0,
        imageUrl: "",
        stock: 0,
        discountPercent: 0,
        isDiscountActive: false,
      });
      handleClearFile();
      setSelectedCategoryIds([]);
      await fetchProducts();
      await fetchProductAssignments();
    } catch {
      openSnack("Error al actualizar producto", "error");
    }
  }
  function handleEditProduct(p) {
    setForm({
      id: p.id,
      name: p.name,
      shortDescription: p.shortDescription || "",
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      stock: p.stock,
      discountPercent: p.discountPercent,
      isDiscountActive: p.isDiscountActive,
    });
    setErrorMsg("");
    handleClearFile();
    loadProductCategories(p.id);
  }
  async function loadProductCategories(productId) {
    try {
      const res = await API.get(`/categories/productcat?productId=${productId}`);
      if (Array.isArray(res.data)) {
        setSelectedCategoryIds(res.data);
      }
    } catch {
      setSelectedCategoryIds([]);
    }
  }
  function handleCancelEdit() {
    setForm({
      id: 0,
      name: "",
      shortDescription: "",
      description: "",
      price: 0,
      imageUrl: "",
      stock: 0,
      discountPercent: 0,
      isDiscountActive: false,
    });
    setErrorMsg("");
    handleClearFile();
    setSelectedCategoryIds([]);
  }
  function handleDeleteProduct(id) {
    handleOpenDialog({ type: "product", id });
  }
  function handleDeleteImage(id) {
    handleOpenDialog({ type: "image", id });
  }
  // Categorías
  function handleCatNameChange(e) {
    let val = e.target.value;
    const newVal = limitWordsAndChars(val, 5, 30);
    setCatName(newVal);
  }
  async function handleCreateCategory() {
    if (!catName.trim()) return;
    try {
      await API.post(`/categories?role=Admin`, { name: catName });
      openSnack("Categoría creada", "success");
      setCatName("");
      await fetchCategoriesList();
      await fetchCategories();
    } catch {
      openSnack("Error al crear categoría", "error");
    }
  }
  function handleEditCat(cat) {
    setEditCatId(cat.id);
    setEditCatName(cat.name);
  }
  async function handleUpdateCat() {
    if (!editCatName.trim()) {
      openSnack("Nombre no válido", "error");
      return;
    }
    try {
      await API.put(`/categories/${editCatId}?role=Admin`, {
        id: editCatId,
        name: editCatName,
      });
      openSnack("Categoría actualizada", "success");
      setEditCatId(0);
      setEditCatName("");
      await fetchCategoriesList();
      await fetchCategories();
    } catch {
      openSnack("Error al actualizar categoría", "error");
    }
  }
  function handleDeleteCat(catId) {
    handleOpenDialog({ type: "category", id: catId });
  }
  function getSelectedCatText() {
    if (selectedCategoryIds.length === 0) return "Seleccionar...";
    const names = selectedCategoryIds.map((id) => {
      const cat = categories.find((c) => c.id === id);
      return cat ? cat.name : id;
    });
    return names.join(", ");
  }
  function getProductCategoryText(productId) {
    const assgn = productAssignments.filter((a) => a.productId === productId);
    if (assgn.length === 0) return "N/A";
    const names = assgn.map((a) => {
      const cat = categoriesList.find((c) => c.id === a.categoryId);
      return cat ? cat.name : a.categoryId;
    });
    return names.join(", ");
  }
  if (loadingAuth) {
    return <p className="mt-4 text-center">Cargando autenticación...</p>;
  }
  if (!user || user.role !== "Admin") {
    return <p className="mt-4 text-center">No tienes permisos de Admin.</p>;
  }
  return (
    <section className="max-w-7xl mx-auto p-4 bg-white rounded shadow-sm">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Admin", href: "/admin" },
        ]}
      />
      <div className="mb-4 text-right">
        <Button variant="outlined" color="error" onClick={() => router.push("/")}>
          Volver
        </Button>
      </div>
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
        Panel de Administración
      </Typography>
      <Box className="mb-4 flex flex-wrap gap-4">
        <Button
          href="/admin/extrataxes"
          variant="contained"
          sx={{ backgroundColor: "#FFD700", color: "#000" }}
        >
          Gestionar Impuestos Extra
        </Button>
        <Button
          href="/admin/globaldiscount"
          variant="contained"
          sx={{ backgroundColor: "#FFA500", color: "#000" }}
        >
          Configurar Descuento Global
        </Button>
        <Button
          href="/admin/iva-envio"
          variant="contained"
          sx={{ backgroundColor: "#4CAF50", color: "#fff" }}
        >
          IVA y Envío
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: "#6A5ACD", color: "#fff" }}
          onClick={openImagesDialog}
        >
          Configuración de Imágenes de Productos
        </Button>
      </Box>
      {/* Diálogo para configurar imágenes */}
      <Dialog open={imgConfigDialogOpen} onClose={closeImagesDialog}>
        <DialogTitle>Configurar Imágenes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Ingresa el ID del producto para configurar imágenes:
          </Typography>
          <TextField
            fullWidth
            type="number"
            value={configProductId}
            onChange={(e) => setConfigProductId(e.target.value)}
            inputProps={{
              min: 0,
              max: 100000000000,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImagesDialog} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfigImages} variant="contained" color="error">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Sección Crear/Editar Producto */}
      <Card className="mb-6 mt-4">
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            {form.id === 0 ? "Crear Producto" : "Editar Producto"}
          </Typography>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}
          <form
            onSubmit={form.id === 0 ? handleCreateProduct : handleUpdateProduct}
            className="flex flex-col gap-3"
          >
            <TextField
              label="Nombre (máx 50 palabras / 100 chars)"
              value={form.name}
              onChange={handleNameChange}
              required
            />
            <Typography variant="body2" fontWeight="bold">
              Descripción Corta (opcional, máx 15 palabras / 70 chars)
            </Typography>
            {/* Eliminamos la opción 'hiliteColor' del buttonList */}
            <SunEditor
              setContents={form.shortDescription}
              onChange={handleShortDescriptionChange}
              setOptions={{
                buttonList: [
                  ["bold", "italic", "underline", "strike"],
                  ["removeFormat", "fontColor"], // quitamos "hiliteColor"
                ],
                height: 100,
              }}
            />
            <Typography variant="body2" fontWeight="bold">
              Descripción (larga, máx 10000 palabras)
            </Typography>
            <SunEditor
              setContents={form.description}
              onChange={handleDescriptionChange}
              setOptions={{
                buttonList: [
                  ["undo", "redo"],
                  ["bold", "italic", "underline", "strike", "fontColor"],
                  ["align", "list", "fontSize", "formatBlock"],
                  ["link", "removeFormat", "fullScreen"],
                ],
                height: 200,
              }}
            />
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Precio (máx 9 dígitos)"
                type="number"
                value={form.price}
                onChange={handlePriceChange}
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
              <TextField
                label="Stock (máx 9 dígitos)"
                type="number"
                value={form.stock}
                onChange={handleStockChange}
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                label="Descuento (%) máx 100"
                type="number"
                value={form.discountPercent}
                onChange={handleDiscountChange}
                sx={{ width: "120px" }}
                inputProps={{ min: 0, max: 100 }}
                disabled={globalDiscount > 0}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="isDiscountActive"
                    checked={form.isDiscountActive}
                    onChange={handleCheckboxChange}
                    disabled={globalDiscount > 0}
                  />
                }
                label="Activar descuento indiv."
              />
            </Box>
            <Box display="flex" flexDirection="column" gap={1}>
              <TextField
                label="URL de imagen (opcional)"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
              />
              <Box display="flex" alignItems="center" gap={1}>
                <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                  Subir archivo
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </Button>
                {file && (
                  <Button variant="contained" color="error" onClick={() => setFile(null)}>
                    Quitar archivo
                  </Button>
                )}
              </Box>
            </Box>
            {/* Categorías disponibles */}
            <Box mt={2}>
              <Typography variant="body2" fontWeight="bold">
                Categorías disponibles:
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleOpenCatPopover}
                sx={{ mt: 1, textAlign: "left" }}
                endIcon={<ArrowDropDown />}
              >
                {selectedCategoryIds.length === 0
                  ? "Seleccionar..."
                  : getSelectedCatText()}
              </Button>
              <Popover
                open={openCatPopover}
                anchorEl={anchorEl}
                onClose={handleCloseCatPopover}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                    minWidth: "200px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedCategoryIds.length === 0}
                        onChange={() => {
                          setSelectedCategoryIds([]);
                          handleCloseCatPopover();
                        }}
                      />
                    }
                    label="Ninguna"
                  />
                  {categories.map((cat) => (
                    <FormControlLabel
                      key={cat.id}
                      label={cat.name}
                      control={
                        <Checkbox
                          checked={selectedCategoryIds.includes(cat.id)}
                          onChange={() => {
                            if (selectedCategoryIds.includes(cat.id)) {
                              setSelectedCategoryIds((prev) =>
                                prev.filter((x) => x !== cat.id)
                              );
                            } else {
                              setSelectedCategoryIds((prev) => [...prev, cat.id]);
                            }
                            handleCloseCatPopover();
                          }}
                        />
                      }
                    />
                  ))}
                </Box>
              </Popover>
            </Box>
            <Box display="flex" gap={2} mt={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ width: "fit-content" }}
              >
                {form.id === 0 ? "Crear" : "Actualizar"}
              </Button>
              {form.id !== 0 && (
                <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
      {/* Tabla de Productos */}
      <Card className="mb-6">
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ borderBottom: "1px solid #ccc", pb: 1, mb: 2 }}
          >
            Lista de Productos
          </Typography>
          <Box mb={3}>
            <TextField
              label="Buscar producto (por nombre o ID)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              fullWidth
            />
          </Box>

          {/* VISTA TABLA PARA DESKTOP */}
          <div className="hidden md:block overflow-x-auto">
            <Table sx={{ tableLayout: "auto" }} className="w-full border-collapse text-sm">
              <TableHead className="bg-gray-200">
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Desc. (%)</TableCell>
                  <TableCell>Imagen</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.map((p) => {
                  const displayDiscount = globalDiscount > 0 ? `${globalDiscount}% (Global)` : p.isDiscountActive ? `${p.discountPercent}%` : "0%";
                  const baseUrl = "http://localhost:5009";
                  const finalImgUrl = p.imageUrl ? p.imageUrl.startsWith("http") ? p.imageUrl : baseUrl + p.imageUrl : "";
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{getProductCategoryText(p.id)}</TableCell>
                      <TableCell>${p.price}</TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>{displayDiscount}</TableCell>
                      <TableCell>
                        {finalImgUrl ? (
                          <img src={finalImgUrl} alt={p.name} className="w-16 h-16 object-cover" />
                        ) : (
                          <span className="text-xs text-gray-500">Sin imagen</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Button onClick={() => handleEditProduct(p)} variant="contained" size="small" sx={{ backgroundColor: "#FCD34D" }}>Editar</Button>
                          <Button onClick={() => handleDeleteProduct(p.id)} variant="contained" size="small" color="error">Borrar</Button>
                          {p.imageUrl && (
                            <Button onClick={() => handleDeleteImage(p.id)} variant="contained" size="small" sx={{ backgroundColor: "#6B7280", color: "#fff" }}>Img-</Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* VISTA DE TARJETAS PARA MÓVIL */}
          <div className="block md:hidden space-y-4">
            {paginatedProducts.map((p) => {
              const displayDiscount = globalDiscount > 0 ? `${globalDiscount}% (Global)` : p.isDiscountActive ? `${p.discountPercent}%` : "0%";
              const baseUrl = "http://localhost:5009";
              const finalImgUrl = p.imageUrl ? p.imageUrl.startsWith("http") ? p.imageUrl : baseUrl + p.imageUrl : "";
              return (
                <div key={p.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                  <div className="flex gap-4">
                    {finalImgUrl && <img src={finalImgUrl} alt={p.name} className="w-20 h-20 object-cover rounded flex-shrink-0" />}
                    <div className="flex-grow">
                      <Typography variant="subtitle1" fontWeight="bold">{p.name}</Typography>
                      <Typography variant="body2" color="text.secondary">ID: {p.id}</Typography>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm space-y-1">
                    <p><strong>Categoría:</strong> {getProductCategoryText(p.id)}</p>
                    <p><strong>Precio:</strong> ${p.price}</p>
                    <p><strong>Stock:</strong> {p.stock}</p>
                    <p><strong>Descuento:</strong> {displayDiscount}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                    <Button onClick={() => handleEditProduct(p)} variant="contained" size="small" sx={{ backgroundColor: "#FCD34D" }}>Editar</Button>
                    <Button onClick={() => handleDeleteProduct(p.id)} variant="contained" size="small" color="error">Borrar</Button>
                    {p.imageUrl && <Button onClick={() => handleDeleteImage(p.id)} variant="contained" size="small" sx={{ backgroundColor: "#6B7280", color: "#fff" }}>Img-</Button>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Paginación de Productos */}
          <div className="flex justify-end items-center gap-2 mt-3">
            <IconButton onClick={handlePrevPage} disabled={page <= 1} color="primary">
              <ArrowLeft />
            </IconButton>
            <Typography variant="body2">
              Página {page} de {totalPages}
            </Typography>
            <IconButton
              onClick={handleNextPage}
              disabled={page >= totalPages}
              color="primary"
            >
              <ArrowRight />
            </IconButton>
          </div>
        </CardContent>
      </Card>
      <Divider className="my-6" />
      {/* Sección de Categorías */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ borderBottom: "1px solid #ccc", pb: 1, mb: 2 }}
          >
            Categorías
          </Typography>
          <Box mb={3}>
            <TextField
              label="Buscar categoría (por nombre o ID)"
              value={catSearchTerm}
              onChange={(e) => {
                setCatSearchTerm(e.target.value);
                setCatCurrentPage(1);
              }}
              fullWidth
            />
          </Box>
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            mb={3}
            sx={{ maxWidth: 'sm', width: '100%' }}
          >
            <TextField
              size="small"
              label="Nombre categoría (máx 5 palabras / 30 chars)"
              value={catName}
              onChange={handleCatNameChange}
            />
            <Button
              onClick={handleCreateCategory}
              variant="contained"
              color="primary"
              size="small"
              sx={{ width: "fit-content" }}
            >
              Crear
            </Button>
          </Box>

          {/* VISTA TABLA CATEGORIAS PARA DESKTOP */}
          <div className="hidden md:block overflow-x-auto">
            <Table sx={{ tableLayout: "auto" }} className="w-full border-collapse text-sm">
              <TableHead className="bg-gray-200">
                <TableRow>
                  <TableCell style={{ width: "10%" }}>ID</TableCell>
                  <TableCell style={{ width: "60%" }}>Nombre</TableCell>
                  <TableCell style={{ width: "30%" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCats.map((c) => {
                  if (editCatId === c.id) {
                    return (
                      <TableRow key={c.id}>
                        <TableCell>{c.id}</TableCell>
                        <TableCell>
                          <TextField size="small" value={editCatName}
                            onChange={(e) => {
                              let val = limitWordsAndChars(e.target.value, 5, 30);
                              setEditCatName(val);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="contained" color="success" sx={{ mr: 1 }} onClick={handleUpdateCat}>Guardar</Button>
                          <Button variant="contained" color="inherit" onClick={() => { setEditCatId(0); setEditCatName(""); }}>Cancelar</Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>
                        <Button variant="contained" sx={{ backgroundColor: "#FCD34D", mr: 1 }} onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }}>Editar</Button>
                        <Button variant="contained" color="error" onClick={() => handleDeleteCat(c.id)}>Borrar</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* VISTA TARJETAS CATEGORIAS PARA MÓVIL */}
          <div className="block md:hidden space-y-3">
            {paginatedCats.map((c) => {
              if (editCatId === c.id) {
                return (
                  <div key={c.id} className="p-4 border rounded-lg bg-yellow-50 shadow-sm">
                    <Typography variant="body2" fontWeight="bold">Editando Categoría #{c.id}</Typography>
                    <TextField fullWidth size="small" value={editCatName}
                      onChange={(e) => {
                        let val = limitWordsAndChars(e.target.value, 5, 30);
                        setEditCatName(val);
                      }}
                      sx={{ my: 1 }}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button variant="contained" size="small" color="success" onClick={handleUpdateCat}>Guardar</Button>
                      <Button variant="contained" size="small" color="inherit" onClick={() => { setEditCatId(0); setEditCatName(""); }}>Cancelar</Button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={c.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                  <div>
                    <Typography variant="subtitle2" fontWeight="bold">{c.name}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {c.id}</Typography>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="contained" size="small" sx={{ backgroundColor: "#FCD34D" }} onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }}>Editar</Button>
                    <Button variant="contained" size="small" color="error" onClick={() => handleDeleteCat(c.id)}>Borrar</Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación Categorías */}
          <div className="flex justify-end items-center gap-2 mt-3">
            <IconButton
              onClick={handleCatPrevPage}
              disabled={catCurrentPage <= 1}
              color="primary"
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="body2">
              Página {catCurrentPage} de {catTotalPages}
            </Typography>
            <IconButton
              onClick={handleCatNextPage}
              disabled={catCurrentPage >= catTotalPages}
              color="primary"
            >
              <ArrowRight />
            </IconButton>
          </div>
        </CardContent>
      </Card>
      {/* Diálogo Borrar */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogData?.type === "product" && "Eliminar Producto"}
          {dialogData?.type === "image" && "Borrar Imagen"}
          {dialogData?.type === "category" && "Eliminar Categoría"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogData?.type === "product" && "¿Deseas eliminar este producto?"}
            {dialogData?.type === "image" && "¿Deseas borrar esta imagen?"}
            {dialogData?.type === "category" && "¿Deseas eliminar esta categoría?"}
          </Typography>
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
        open={snackOpen}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={closeSnack} severity={snackType} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </section>
  );
}
