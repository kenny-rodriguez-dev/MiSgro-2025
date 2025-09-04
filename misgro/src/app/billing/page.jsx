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
  Button,
  TextField,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

/* Breadcrumb */
import Breadcrumb from "../../components/Breadcrumb";

export default function BillingPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [billingList, setBillingList] = useState([]);
  const [newBilling, setNewBilling] = useState({
    country: "",
    region: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
  });

  // Snackbar
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("success");

  const showSnack = (msg, type = "success") => {
    setSnackMsg(msg);
    setSnackType(type);
    setOpenSnack(true);
  };
  const closeSnack = () => setOpenSnack(false);

  // Diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteBillingId, setDeleteBillingId] = useState(null);

  const handleOpenDialog = (id) => {
    setDeleteBillingId(id);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setDeleteBillingId(null);
    setOpenDialog(false);
  };
  const handleConfirmDelete = async () => {
    if (deleteBillingId !== null) {
      try {
        await API.delete(
          `/myaccount/billingdetails/delete?userId=${user.id}&billingId=${deleteBillingId}`
        );
        showSnack("Detalles de facturación eliminados.", "warning");
        loadBillingList(user.id);
      } catch (error) {
        showSnack("Error al eliminar detalles de facturación.", "error");
      }
    }
    setDeleteBillingId(null);
    setOpenDialog(false);
  };

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push("/login");
      } else {
        loadBillingList(user.id);
      }
    }
  }, [loadingAuth, user, router]);

  const loadBillingList = async (userId) => {
    try {
      const res = await API.get(`/myaccount/billingdetails?userId=${userId}`);
      setBillingList(res.data);
    } catch {
      // omitir
    }
  };

  const handleCreateBilling = async () => {
    if (
      !newBilling.country.trim() ||
      !newBilling.region.trim() ||
      !newBilling.city.trim() ||
      !newBilling.addressLine1.trim()
    ) {
      showSnack("Completa los campos obligatorios.", "error");
      return;
    }
    try {
      const res = await API.post(
        `/myaccount/billingdetails/save?userId=${user.id}`,
        newBilling
      );
      if (typeof res.data === "string" && res.data.includes("Límite")) {
        showSnack("Alcanzaste el número máximo de detalles de facturación (5).", "error");
        return;
      }
      showSnack("Detalles de facturación guardados.", "success");
      setNewBilling({
        country: "",
        region: "",
        city: "",
        addressLine1: "",
        addressLine2: "",
      });
      loadBillingList(user.id);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        typeof error.response.data === "string" &&
        error.response.data.includes("Límite")
      ) {
        showSnack("Alcanzaste el número máximo de detalles de facturación (5).", "error");
      } else {
        showSnack("Error al guardar detalles de facturación.", "error");
      }
    }
  };

  const handleChange = (e) => {
    setNewBilling({ ...newBilling, [e.target.name]: e.target.value });
  };

  const handleBack = () => {
    router.push("/");
  };

  if (loadingAuth) {
    return <p className="mt-4 text-center">Cargando autenticación...</p>;
  }
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto mt-8 px-2">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Detalles de Facturación", href: "/billing" },
        ]}
      />

      <div className="mb-4 flex justify-between items-center">
        <Typography variant="h5" fontWeight="bold" className="flex items-center gap-2">
          <ReceiptLongIcon />
          Detalles de Facturación
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleBack}>
          Volver
        </Button>
      </div>

      <Typography variant="body2" color="text.secondary" mb={4}>
        Aviso: Solo se pueden guardar como máximo 5 detalles de facturación.
      </Typography>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Lista a la izquierda */}
        <div className="flex-1">
          <Card className="shadow-md mb-4">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Facturación Guardada
              </Typography>
              {billingList.length === 0 ? (
                <Typography color="text.secondary">
                  No tienes detalles de facturación guardados.
                </Typography>
              ) : (
                <div className="space-y-2">
                  {billingList.map((b) => (
                    <div
                      key={b.id}
                      className="p-2 border rounded flex justify-between items-start bg-gray-50"
                    >
                      <div className="text-sm">
                        <p><strong>País:</strong> {b.country}</p>
                        <p><strong>Región:</strong> {b.region}</p>
                        <p><strong>Ciudad:</strong> {b.city}</p>
                        <p><strong>Dirección 1:</strong> {b.addressLine1}</p>
                        {b.addressLine2 && (
                          <p><strong>Dirección 2:</strong> {b.addressLine2}</p>
                        )}
                      </div>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleOpenDialog(b.id)}
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

        {/* Formulario a la derecha */}
        <div className="w-full md:w-2/5">
          <Card className="shadow-md">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Agregar Detalles de Facturación
              </Typography>
              <div className="space-y-2">
                <TextField
                  label="País / Región *"
                  name="country"
                  value={newBilling.country}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Región / Provincia *"
                  name="region"
                  value={newBilling.region}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Localidad / Ciudad *"
                  name="city"
                  value={newBilling.city}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Dirección de la calle *"
                  name="addressLine1"
                  value={newBilling.addressLine1}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Dirección de la calle 2 (opcional)"
                  name="addressLine2"
                  value={newBilling.addressLine2}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <Button variant="contained" color="primary" onClick={handleCreateBilling}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo confirm delete */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Eliminar Facturación</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar estos detalles de facturación?</Typography>
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
