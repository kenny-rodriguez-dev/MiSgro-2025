"use client";

import { useState, useEffect, useContext } from "react";
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
import PersonIcon from "@mui/icons-material/Person";

/* Breadcrumb */
import Breadcrumb from "../../components/Breadcrumb";

export default function ClientDataPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [clientDataList, setClientDataList] = useState([]);
  const [newClientData, setNewClientData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    email: "",
    identification: "",
    orderNotes: "",
  });

  // Snackbars
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("success");

  const showSnack = (msg, type = "success") => {
    setSnackMsg(msg);
    setSnackType(type);
    setOpenSnack(true);
  };
  const closeSnack = () => setOpenSnack(false);

  // Dialog confirm delete
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDataId, setDeleteDataId] = useState(null);

  const handleOpenDialog = (id) => {
    setDeleteDataId(id);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setDeleteDataId(null);
    setOpenDialog(false);
  };
  const handleConfirmDelete = async () => {
    if (deleteDataId !== null) {
      try {
        await API.delete(
          `/myaccount/clientdata/delete?userId=${user.id}&clientDataId=${deleteDataId}`
        );
        showSnack("Datos de cliente eliminados.", "warning");
        loadClientData(user.id);
      } catch (error) {
        showSnack("Error al eliminar.", "error");
      }
    }
    setDeleteDataId(null);
    setOpenDialog(false);
  };

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push("/login");
      } else {
        loadClientData(user.id);
      }
    }
  }, [loadingAuth, user, router]);

  const loadClientData = async (userId) => {
    try {
      const res = await API.get(`/myaccount/clientdata?userId=${userId}`);
      setClientDataList(res.data);
    } catch {
      // Omit
    }
  };

  const handleCreateClientData = async () => {
    if (
      !newClientData.firstName.trim() ||
      !newClientData.lastName.trim() ||
      !newClientData.phone.trim() ||
      !newClientData.email.trim() ||
      !newClientData.identification.trim()
    ) {
      showSnack("Completa los campos obligatorios (Nombre, Apellidos, Teléfono, Email, Identificación).", "error");
      return;
    }
    try {
      const res = await API.post(
        `/myaccount/clientdata/save?userId=${user.id}`,
        newClientData
      );
      if (typeof res.data === "string" && res.data.includes("Límite")) {
        showSnack("Alcanzaste el número máximo de datos de cliente (5).", "error");
        return;
      }
      showSnack("Datos de cliente guardados.", "success");
      setNewClientData({
        firstName: "",
        lastName: "",
        companyName: "",
        phone: "",
        email: "",
        identification: "",
        orderNotes: "",
      });
      loadClientData(user.id);
    } catch (error) {
      if (
        error.response?.status === 400 &&
        typeof error.response.data === "string" &&
        error.response.data.includes("Límite")
      ) {
        showSnack("Alcanzaste el número máximo de datos de cliente (5).", "error");
      } else {
        showSnack("Error al guardar datos de cliente.", "error");
      }
    }
  };

  const handleChange = (e) => {
    setNewClientData({ ...newClientData, [e.target.name]: e.target.value });
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
          { label: "Datos del Cliente", href: "/clientdata" },
        ]}
      />

      <div className="mb-4 flex justify-between items-center">
        <Typography variant="h5" fontWeight="bold" className="flex items-center gap-2">
          <PersonIcon />
          Datos del Cliente
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleBack}>
          Volver
        </Button>
      </div>

      <Typography variant="body2" color="text.secondary" mb={4}>
        Aviso: Solo se pueden guardar como máximo 5 datos de cliente.
      </Typography>

      {/* Layout dos columnas */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lista a la izquierda */}
        <div className="flex-1">
          <Card className="shadow-md mb-4">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Datos Guardados
              </Typography>
              {clientDataList.length === 0 ? (
                <Typography color="text.secondary">
                  No tienes datos de cliente guardados.
                </Typography>
              ) : (
                <div className="space-y-2">
                  {clientDataList.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 border rounded flex justify-between items-start bg-gray-50"
                    >
                      <div className="text-sm">
                        <p><strong>Nombre:</strong> {c.firstName} {c.lastName}</p>
                        {c.companyName && (
                          <p><strong>Empresa:</strong> {c.companyName}</p>
                        )}
                        <p><strong>Teléfono:</strong> {c.phone}</p>
                        <p><strong>Email:</strong> {c.email}</p>
                        <p><strong>Identificación:</strong> {c.identification}</p>
                        {c.orderNotes && (
                          <p><strong>Notas:</strong> {c.orderNotes}</p>
                        )}
                      </div>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleOpenDialog(c.id)}
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
                Agregar Datos de Cliente
              </Typography>
              <div className="space-y-2">
                <TextField
                  label="Nombre *"
                  name="firstName"
                  value={newClientData.firstName}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Apellidos *"
                  name="lastName"
                  value={newClientData.lastName}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Empresa (opcional)"
                  name="companyName"
                  value={newClientData.companyName}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Teléfono *"
                  name="phone"
                  value={newClientData.phone}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Email *"
                  name="email"
                  type="email"
                  value={newClientData.email}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Identificación *"
                  name="identification"
                  value={newClientData.identification}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Notas (opcional)"
                  name="orderNotes"
                  value={newClientData.orderNotes}
                  onChange={handleChange}
                  size="small"
                  fullWidth
                />
                <Button variant="contained" color="primary" onClick={handleCreateClientData}>
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog confirm delete */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Eliminar Datos de Cliente</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar estos datos de cliente?</Typography>
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
