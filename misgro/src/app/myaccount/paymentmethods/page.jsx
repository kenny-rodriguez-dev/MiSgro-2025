"use client";

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import API from "../../../services/api";

/* MUI */
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";

/* Breadcrumb */
import Breadcrumb from "../../../components/Breadcrumb";

export default function PaymentMethodsPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [paymentMethods, setPaymentMethods] = useState([]);

  // Campos de nuevo método
  const [type, setType] = useState("Tarjeta");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  // Snackbars
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  const openSnack = (msg, type = "success") => {
    setSnackbarMessage(msg);
    setSnackbarType(type);
    setSnackbarOpen(true);
  };
  const closeSnack = () => {
    setSnackbarOpen(false);
  };

  // Dialogo confirm delete
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteMethodId, setDeleteMethodId] = useState(null);

  const handleOpenDialog = (id) => {
    setDeleteMethodId(id);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setDeleteMethodId(null);
    setOpenDialog(false);
  };
  const handleConfirmDelete = async () => {
    if (deleteMethodId !== null) {
      try {
        await API.delete(
          `/myaccount/paymentmethods/delete?userId=${user.id}&methodId=${deleteMethodId}`
        );
        openSnack("Método de pago eliminado.", "warning");
        loadPaymentMethods(user.id);
      } catch (error) {
        openSnack("Error al eliminar método de pago", "error");
      }
    }
    setDeleteMethodId(null);
    setOpenDialog(false);
  };

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push("/login");
      } else {
        loadPaymentMethods(user.id);
      }
    }
  }, [loadingAuth, user, router]);

  const loadPaymentMethods = async (userId) => {
    try {
      const res = await API.get(`/myaccount/paymentmethods?userId=${userId}`);
      setPaymentMethods(res.data);
    } catch (error) {
      // omit
    }
  };

  const handleAddMethod = async () => {
    if (type === "Tarjeta") {
      if (!cardNumber.trim() || !cardHolder.trim() || !month.trim() || !year.trim() || !cvv.trim()) {
        openSnack("Completa todos los campos de la tarjeta", "error");
        return;
      }
      // Realmente se guardaría enmascarado, etc.:
      const maskedData = `**** **** **** ${cardNumber.slice(-4)} (Exp:${month}/${year})`;
      await saveMethod("Tarjeta", maskedData);
    } else {
      if (!paypalEmail.trim()) {
        openSnack("Completa el correo de PayPal", "error");
        return;
      }
      await saveMethod("PayPal", paypalEmail);
    }
  };

  const saveMethod = async (methodType, maskedData) => {
    try {
      const res = await API.post(
        `/myaccount/paymentmethods/save?userId=${user.id}`,
        { type: methodType, maskedData }
      );
      if (typeof res.data === "string" && res.data.includes("Límite")) {
        openSnack("Alcanzaste el número máximo de métodos de pago (5).", "error");
        return;
      }
      openSnack("Método de pago guardado con éxito.", "success");
      // Limpiar
      setCardNumber("");
      setCardHolder("");
      setMonth("");
      setYear("");
      setCvv("");
      setPaypalEmail("");
      setType("Tarjeta");
      loadPaymentMethods(user.id);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        typeof error.response.data === "string" &&
        error.response.data.includes("Límite")
      ) {
        openSnack("Alcanzaste el número máximo de métodos de pago (5).", "error");
      } else {
        openSnack("Error al guardar método de pago", "error");
      }
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  if (loadingAuth) {
    return <p className="text-center mt-8">Cargando autenticación...</p>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 px-2">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mis Métodos de Pago", href: "/myaccount/paymentmethods" },
        ]}
      />

      <div className="mb-4 flex justify-between items-center">
        <Typography variant="h5" fontWeight="bold" className="flex items-center gap-2">
          <PaymentIcon /> Mis Métodos de Pago
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleBack}>
          Volver
        </Button>
      </div>

      <Typography variant="body2" color="text.secondary" mb={4}>
        Aviso: Solo se pueden guardar como máximo 5 métodos de pago.
      </Typography>

      {/* Layout a dos columnas */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lista de métodos guardados */}
        <div className="flex-1">
          <Card className="shadow-md mb-4">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Tus Métodos de Pago
              </Typography>

              {paymentMethods.length === 0 ? (
                <Typography color="text.secondary">No tienes métodos de pago guardados.</Typography>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="p-2 border rounded flex justify-between items-center bg-gray-50"
                    >
                      <div>
                        <Typography variant="body2" fontWeight="bold">
                          {pm.type}
                        </Typography>
                        <Typography variant="caption">{pm.maskedData}</Typography>
                      </div>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleOpenDialog(pm.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulario nuevo método */}
        <div className="w-full md:w-2/5">
          <Card className="shadow-md">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Agregar Nuevo Método
              </Typography>

              <div className="mb-2">
                <label className="block font-medium mb-1">Tipo de Método</label>
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setCardNumber("");
                    setCardHolder("");
                    setMonth("");
                    setYear("");
                    setCvv("");
                    setPaypalEmail("");
                  }}
                  className="border p-2 rounded w-full"
                >
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              {type === "Tarjeta" ? (
                <div className="bg-gray-50 p-3 rounded shadow-inner space-y-2">
                  <TextField
                    label="Número de Tarjeta"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Titular"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <div className="flex gap-2">
                    <TextField
                      label="Mes (MM)"
                      placeholder="01-12"
                      inputProps={{ maxLength: 2 }}
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Año (YY)"
                      placeholder="23, 24..."
                      inputProps={{ maxLength: 2 }}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </div>
                  <TextField
                    label="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded shadow-inner space-y-2">
                  <TextField
                    label="Correo de PayPal"
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </div>
              )}

              <Button variant="contained" color="primary" onClick={handleAddMethod} className="mt-2">
                Guardar Método
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Eliminar Método de Pago</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar este método de pago?</Typography>
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
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={closeSnack} severity={snackbarType} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
