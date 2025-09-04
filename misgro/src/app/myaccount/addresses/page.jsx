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
import LocationOnIcon from "@mui/icons-material/LocationOn";

/* Breadcrumb */
import Breadcrumb from "../../../components/Breadcrumb";

export default function AddressesPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    country: "",
    province: "",
    city: "",
    postalCode: "",
    addressLine: "",
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

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteAddrId, setDeleteAddrId] = useState(null);

  const handleOpenDialog = (id) => {
    setDeleteAddrId(id);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setDeleteAddrId(null);
    setOpenDialog(false);
  };
  const handleConfirmDelete = async () => {
    if (deleteAddrId !== null) {
      try {
        await API.delete(
          `/myaccount/addresses/delete?userId=${user.id}&addressId=${deleteAddrId}`
        );
        showSnack("Dirección eliminada.", "warning");
        loadAddresses(user.id);
      } catch (error) {
        showSnack("Error al eliminar dirección", "error");
      }
    }
    setDeleteAddrId(null);
    setOpenDialog(false);
  };

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push("/login");
      } else {
        loadAddresses(user.id);
      }
    }
  }, [loadingAuth, user, router]);

  const loadAddresses = async (userId) => {
    try {
      const res = await API.get(`/myaccount/addresses?userId=${userId}`);
      setAddresses(res.data);
    } catch {
      // omit
    }
  };

  const handleCreateAddress = async () => {
    if (
      !newAddress.country.trim() ||
      !newAddress.province.trim() ||
      !newAddress.city.trim() ||
      !newAddress.postalCode.trim() ||
      !newAddress.addressLine.trim()
    ) {
      showSnack("Completa todos los campos", "error");
      return;
    }
    try {
      const resp = await API.post(`/myaccount/addresses/save?userId=${user.id}`, newAddress);
      if (typeof resp.data === "string" && resp.data.includes("Límite")) {
        showSnack("Alcanzaste el número máximo de direcciones (5).", "error");
        return;
      }
      showSnack("Dirección guardada con éxito");
      setNewAddress({
        country: "",
        province: "",
        city: "",
        postalCode: "",
        addressLine: "",
      });
      loadAddresses(user.id);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        typeof error.response.data === "string" &&
        error.response.data.includes("Límite")
      ) {
        showSnack("Alcanzaste el número máximo de direcciones (5).", "error");
      } else {
        showSnack("Error al guardar dirección", "error");
      }
    }
  };

  const handleChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
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
          { label: "Direcciones", href: "/myaccount/addresses" },
        ]}
      />

      <div className="mb-4 flex justify-between items-center">
        <Typography variant="h5" fontWeight="bold" className="flex items-center gap-2">
          <LocationOnIcon />
          Mis Direcciones de Envío
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleBack}>
          Volver
        </Button>
      </div>

      <Typography variant="body2" color="text.secondary" mb={4}>
        Aviso: Solo se pueden guardar como máximo 5 direcciones.
      </Typography>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Lista a la izquierda */}
        <div className="flex-1">
          <Card className="mb-4 shadow-md">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Direcciones Guardadas
              </Typography>
              {addresses.length === 0 ? (
                <Typography color="text.secondary">No tienes direcciones guardadas.</Typography>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-2 border rounded flex justify-between items-start bg-gray-50"
                    >
                      <div className="text-sm">
                        <p><strong>País:</strong> {addr.country}</p>
                        <p><strong>Provincia:</strong> {addr.province}</p>
                        <p><strong>Ciudad:</strong> {addr.city}</p>
                        <p><strong>Código Postal:</strong> {addr.postalCode}</p>
                        <p><strong>Dirección:</strong> {addr.addressLine}</p>
                      </div>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleOpenDialog(addr.id)}
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
                Agregar Nueva Dirección
              </Typography>
              <div className="space-y-3">
                <TextField
                  label="País"
                  name="country"
                  value={newAddress.country}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Provincia"
                  name="province"
                  value={newAddress.province}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Ciudad"
                  name="city"
                  value={newAddress.city}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Código Postal"
                  name="postalCode"
                  value={newAddress.postalCode}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Dirección"
                  name="addressLine"
                  value={newAddress.addressLine}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <Button variant="contained" color="primary" onClick={handleCreateAddress}>
                  Guardar Dirección
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog confirm delete */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Eliminar Dirección</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar esta dirección?</Typography>
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
