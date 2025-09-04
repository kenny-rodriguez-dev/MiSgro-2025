"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import API from "../../services/api";
/* MUI */
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { ArrowLeft, ArrowRight, ShoppingCart } from "@mui/icons-material";
/* Breadcrumb */
import Breadcrumb from "../../components/Breadcrumb";

export default function MisComprasPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  // Lista con “displayIndex”
  const [augmentedOrders, setAugmentedOrders] = useState([]);
  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  // Orden => dateDesc, dateAsc, totalDesc, totalAsc
  const [sortMethod, setSortMethod] = useState("dateDesc");
  // Paginación
  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  // Snackbar
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("success");
  const openSnack = (msg, type = "success") => {
    setSnackMsg(msg);
    setSnackType(type);
    setSnackOpen(true);
  };
  const closeSnack = () => setSnackOpen(false);
  // Función para colorear estados al estilo admin/orders
  const getStatusBGColor = (status) => {
    switch (status) {
      case "Enviado":
        return "bg-green-100 text-green-800";
      case "Cancelado":
        return "bg-red-100 text-red-800";
      default: // Pendiente u otro
        return "bg-yellow-100 text-yellow-800";
    }
  };
  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push("/login");
      } else {
        loadMyOrders(user.id);
      }
    }
  }, [loadingAuth, user, router]);
  const loadMyOrders = async (userId) => {
    setLoading(true);
    try {
      const res = await API.get(`/orders/myorders?userId=${userId}`);
      const rawOrders = res.data.map((x) => x.order);
      // Ordenar ASC por fecha => para el displayIndex
      rawOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      // Asignar displayIndex = i+1
      const withIndex = rawOrders.map((o, i) => ({
        ...o,
        displayIndex: i + 1,
      }));
      setOrdersList(withIndex);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  // Filtrado + Orden => genera “augmentedOrders”
  useEffect(() => {
    let temp = [...ordersList];
    // Filtrar x searchTerm => displayIndex o ID
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      temp = temp.filter(
        (o) =>
          o.displayIndex.toString().includes(lower) ||
          o.id.toString().includes(lower)
      );
    }
    // Orden => dateDesc, dateAsc, totalDesc, totalAsc
    switch (sortMethod) {
      case "dateAsc":
        temp.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "dateDesc":
        temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "totalAsc":
        temp.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case "totalDesc":
        temp.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      default:
        break;
    }
    setAugmentedOrders(temp);
    setCurrentPage(1);
  }, [ordersList, searchTerm, sortMethod]);
  // Paginación
  const totalPages = Math.ceil(augmentedOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = augmentedOrders.slice(startIndex, endIndex);
  const handleChangeSearch = (e) => setSearchTerm(e.target.value);
  const handleChangeSort = (e) => setSortMethod(e.target.value);
  const handleGoDetail = (id) => {
    router.push(`/miscompras/${id}`);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handleBack = () => {
    router.push("/");
  };
  if (loadingAuth) {
    return <p className="text-center mt-4">Cargando autenticación...</p>;
  }
  if (!user) return null;
  return (
    <div className="max-w-6xl mx-auto p-4">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mis Compras", href: "/miscompras" },
        ]}
      />
      <Card className="shadow-md">
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <Typography variant="h5" fontWeight="bold" className="flex items-center gap-2">
              <ShoppingCart />
              Mis Compras
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleBack}>
              Volver
            </Button>
          </div>
          {/* Barra de búsqueda y orden */}
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TextField
              label="Buscar pedido (por # interno o ID)"
              size="small"
              value={searchTerm}
              onChange={handleChangeSearch}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortMethod}
                label="Ordenar por"
                onChange={handleChangeSort}
              >
                <MenuItem value="dateDesc">Fecha Desc</MenuItem>
                <MenuItem value="dateAsc">Fecha Asc</MenuItem>
                <MenuItem value="totalDesc">Total Desc</MenuItem>
                <MenuItem value="totalAsc">Total Asc</MenuItem>
              </Select>
            </FormControl>
          </div>
          {loading ? (
            <p className="text-center">Cargando compras...</p>
          ) : paginatedData.length === 0 ? (
            <Typography>No se encontraron compras.</Typography>
          ) : (
            <>
              {/* VISTA DE TABLA PARA ESCRITORIO */}
              <div className="hidden md:block overflow-x-auto">
                <Table sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong># Interno</strong></TableCell>
                      <TableCell><strong>ID Real</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.map((o) => {
                      const localDate = new Date(o.createdAt).toLocaleString(
                        "es-EC",
                        {
                          timeZone: "America/Guayaquil",
                        }
                      );
                      return (
                        <TableRow key={o.id} hover>
                          <TableCell>{o.displayIndex}</TableCell>
                          <TableCell>{o.id}</TableCell>
                          <TableCell>{localDate}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded ${getStatusBGColor(o.status)}`}>
                              {o.status}
                            </span>
                          </TableCell>
                          <TableCell>${o.totalAmount}</TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleGoDetail(o.id)}
                            >
                              Ver Detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* VISTA DE TARJETAS PARA MÓVIL */}
              <div className="block md:hidden space-y-4">
                {paginatedData.map((o) => {
                  const localDate = new Date(o.createdAt).toLocaleString("es-EC", {
                    timeZone: "America/Guayaquil",
                  });
                  return (
                    <div key={o.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <Typography variant="subtitle1" fontWeight="bold">Compra #{o.displayIndex}</Typography>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBGColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-sm space-y-1 text-gray-700">
                        <p><strong>ID Real:</strong> {o.id}</p>
                        <p><strong>Fecha:</strong> {localDate}</p>
                        <p><strong>Total:</strong> ${o.totalAmount}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <Button fullWidth variant="contained" size="small" onClick={() => handleGoDetail(o.id)}>
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end items-center gap-2 mt-3">
                <IconButton
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  color="primary"
                >
                  <ArrowLeft />
                </IconButton>
                <Typography variant="body2">
                  Página {currentPage} de {totalPages}
                </Typography>
                <IconButton
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  color="primary"
                >
                  <ArrowRight />
                </IconButton>
              </div>
            </>
          )}
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
