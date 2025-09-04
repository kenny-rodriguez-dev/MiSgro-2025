"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
/* MUI */
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Box,
} from "@mui/material";
import { ArrowLeft, ArrowRight } from "@mui/icons-material";
/* Breadcrumb */
import Breadcrumb from "../../../components/Breadcrumb";

export default function OrdersAdminPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const isSupervisor = user && user.role === "Supervisor";
  const isAdmin = user && user.role === "Admin";
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  /* FILTROS Y ORDEN */
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMethod, setSortMethod] = useState("dateDesc");
  /* PAGINACIÓN */
  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  /* TOAST */
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("info");
  const [snackOpen, setSnackOpen] = useState(false);
  const showToast = (msg, type = "info") => {
    setToastMsg(msg);
    setToastType(type);
    setSnackOpen(true);
  };
  const handleCloseSnack = () => setSnackOpen(false);
  // Modal "Enviar"
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendOrderId, setSendOrderId] = useState(null);
  const [estimatedDate, setEstimatedDate] = useState("");
  const [minDate, setMinDate] = useState("");
  // Modal "Cancelar"
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  useEffect(() => {
    if (isSupervisor || isAdmin) {
      fetchOrders();
    }
    // Fecha mínima = hoy
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    setMinDate(localIso);
  }, [isSupervisor, isAdmin]);
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await API.get("/orders");
      setAllOrders(response.data);
    } catch (error) {
      showToast("Error al cargar pedidos", "error");
    }
    setLoading(false);
  };
  /* TRANSFORMACIÓN: Filtro + Orden */
  const [filteredOrders, setFilteredOrders] = useState([]);
  useEffect(() => {
    let temp = [...allOrders];
    // 1) Filtro por searchTerm => coincide con ID o userId
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      temp = temp.filter((o) => {
        const str = `${o.id} ${o.userId}`.toLowerCase();
        return str.includes(term);
      });
    }
    // 2) Orden
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
        // Mantiene dateDesc por defecto
        break;
    }
    setFilteredOrders(temp);
    setCurrentPage(1); // Volver a página 1 si se cambia búsqueda/orden
  }, [allOrders, searchTerm, sortMethod]);
  /* Paginación */
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredOrders.slice(startIndex, endIndex);
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handleBack = () => {
    // Botón Volver => Inicio
    router.push("/");
  };
  /* Modales "Enviar" y "Cancelar" */
  const handleSendClick = (orderId) => {
    setSendOrderId(orderId);
    setEstimatedDate("");
    setShowSendModal(true);
  };
  const handleSendConfirm = async () => {
    if (!estimatedDate) {
      showToast("Debes seleccionar la fecha estimada de entrega.", "error");
      return;
    }
    const chosen = new Date(estimatedDate);
    const min = new Date(minDate);
    if (chosen.getTime() < min.getTime()) {
      showToast("No se puede seleccionar una fecha anterior a hoy.", "error");
      return;
    }
    try {
      await API.put(`/orders/${sendOrderId}/status`, "Enviado", {
        headers: { "Content-Type": "application/json" },
      });
      await API.post(`/orders/send?orderId=${sendOrderId}`, {
        estimatedTime: estimatedDate,
      });
      showToast(`Pedido #${sendOrderId} enviado. ETA: ${estimatedDate}`, "success");
      setShowSendModal(false);
      fetchOrders();
    } catch (error) {
      showToast("Error al enviar pedido", "error");
    }
  };
  const handleCancelClick = (orderId) => {
    setCancelOrderId(orderId);
    setCancelReason("");
    setShowCancelModal(true);
  };
  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      showToast("Por favor ingresa un motivo de cancelación.", "error");
      return;
    }
    try {
      await API.put(`/orders/${cancelOrderId}/status`, "Cancelado", {
        headers: { "Content-Type": "application/json" },
      });
      await API.post(`/orders/cancel?orderId=${cancelOrderId}`, { cancelReason });
      showToast(`Pedido #${cancelOrderId} cancelado. Motivo: ${cancelReason}`, "success");
      setShowCancelModal(false);
      fetchOrders();
    } catch (error) {
      showToast("Error al cancelar pedido", "error");
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "Enviado":
        return "bg-green-100 text-green-800";
      case "Cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  if (!isSupervisor && !isAdmin) {
    return <p className="text-center mt-4">No tienes permisos.</p>;
  }
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Breadcrumb: “Inicio > Pedidos” (ambos apuntan a "/") */}
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Pedidos", href: "/" },
        ]}
      />
      <Card className="shadow-md">
        <CardContent>
          <div className="mb-4 flex justify-between items-center">
            <Typography variant="h6" fontWeight="bold">
              Gestión de Pedidos
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleBack}>
              Volver
            </Button>
          </div>
          {/* Barra de Búsqueda y Orden */}
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TextField
              label="Buscar pedido (por ID o userId)"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortMethod}
                label="Ordenar por"
                onChange={(e) => setSortMethod(e.target.value)}
              >
                <MenuItem value="dateDesc">Fecha Desc</MenuItem>
                <MenuItem value="dateAsc">Fecha Asc</MenuItem>
                <MenuItem value="totalDesc">Total Desc</MenuItem>
                <MenuItem value="totalAsc">Total Asc</MenuItem>
              </Select>
            </FormControl>
          </div>
          {loading ? (
            <p>Cargando pedidos...</p>
          ) : paginatedData.length === 0 ? (
            <p>No se encontraron pedidos.</p>
          ) : (
            <>
              {/* VISTA DE TABLA PARA ESCRITORIO */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="w-full border-collapse text-sm">
                  <TableHead className="bg-gray-200">
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Fecha (Ecuador)</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>ETA</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Acciones</TableCell>
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
                      const disableButtons =
                        o.status === "Enviado" || o.status === "Cancelado";
                      const etaText = o.shippingEta ? o.shippingEta : "";
                      const reasonText =
                        o.status === "Cancelado" ? o.cancelReason : "";
                      return (
                        <TableRow key={o.id}>
                          <TableCell>{o.id}</TableCell>
                          <TableCell>{o.userId}</TableCell>
                          <TableCell>${o.totalAmount}</TableCell>
                          <TableCell>{localDate}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded ${getStatusColor(
                                o.status
                              )}`}
                            >
                              {o.status}
                            </span>
                          </TableCell>
                          <TableCell>{etaText}</TableCell>
                          <TableCell>{reasonText}</TableCell>
                          <TableCell className="space-x-2">
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className={`px-2 py-1 rounded ${
                                disableButtons
                                  ? "bg-gray-400 text-white"
                                  : "bg-blue-400 text-white"
                              }`}
                            >
                              Detalles
                            </Link>
                            <button
                              className={`px-2 py-1 rounded ${
                                disableButtons
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : "bg-green-500 text-white"
                              }`}
                              onClick={() =>
                                !disableButtons && handleSendClick(o.id)
                              }
                              disabled={disableButtons}
                            >
                              Enviar
                            </button>
                            <button
                              className={`px-2 py-1 rounded ${
                                disableButtons
                                  ? "bg-gray-400 text-white cursor-not-allowed"
                                  : "bg-red-500 text-white"
                              }`}
                              onClick={() =>
                                !disableButtons && handleCancelClick(o.id)
                              }
                              disabled={disableButtons}
                            >
                              Cancelar
                            </button>
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
                  const disableButtons =
                    o.status === "Enviado" || o.status === "Cancelado";
                  const etaText = o.shippingEta || "-";
                  const reasonText = o.status === "Cancelado" ? o.cancelReason : "-";

                  return (
                    <div key={o.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <Typography variant="subtitle1" fontWeight="bold">Pedido #{o.id}</Typography>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-sm space-y-1 text-gray-700">
                        <p><strong>Usuario ID:</strong> {o.userId}</p>
                        <p><strong>Monto:</strong> ${o.totalAmount}</p>
                        <p><strong>Fecha:</strong> {localDate}</p>
                        <p><strong>ETA:</strong> {etaText}</p>
                        <p><strong>Motivo:</strong> {reasonText}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                        <Link href={`/admin/orders/${o.id}`} className={`text-xs px-2 py-1 rounded ${disableButtons ? "bg-gray-400 text-white" : "bg-blue-400 text-white"}`}>
                          Detalles
                        </Link>
                        <button onClick={() => !disableButtons && handleSendClick(o.id)} disabled={disableButtons}
                          className={`text-xs px-2 py-1 rounded ${disableButtons ? "bg-gray-400 text-white cursor-not-allowed" : "bg-green-500 text-white"}`}>
                          Enviar
                        </button>
                        <button onClick={() => !disableButtons && handleCancelClick(o.id)} disabled={disableButtons}
                          className={`text-xs px-2 py-1 rounded ${disableButtons ? "bg-gray-400 text-white cursor-not-allowed" : "bg-red-500 text-white"}`}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
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
      {/* Modal Enviar */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md w-80">
            <Typography variant="h6" className="mb-2 font-bold">
              Enviar Pedido #{sendOrderId}
            </Typography>
            <label className="block mb-2">
              Selecciona la fecha estimada de entrega:
              <input
                type="date"
                className="border p-1 rounded w-full mt-1"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
                min={minDate}
              />
            </label>
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="contained"
                color="success"
                onClick={handleSendConfirm}
              >
                Confirmar
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowSendModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md w-80">
            <Typography variant="h6" className="mb-2 font-bold">
              Cancelar Pedido #{cancelOrderId}
            </Typography>
            <label className="block mb-2">
              Motivo de cancelación:
              <input
                type="text"
                className="border p-1 rounded w-full mt-1"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </label>
            <Typography variant="caption" color="text.secondary" className="block mb-2">
              *En un e-commerce real, se haría reembolso a la pasarela de pago.
            </Typography>
            <div className="flex justify-end gap-2">
              <Button
                variant="contained"
                color="error"
                onClick={handleCancelConfirm}
              >
                Confirmar
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowCancelModal(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnack} severity={toastType} sx={{ width: "100%" }}>
          {toastMsg}
        </Alert>
      </Snackbar>
    </div>
  );
}
