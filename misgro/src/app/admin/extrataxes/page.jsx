"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import API from "../../../services/api";

/* MUI */
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

/* Breadcrumb */
import Breadcrumb from "../../../components/Breadcrumb";

export default function ExtraTaxesPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [extraTaxes, setExtraTaxes] = useState([]);
  const [newTax, setNewTax] = useState({
    name: "",
    isPercentage: true,
    value: 0,
    isActive: false,
  });

  const [editId, setEditId] = useState(0);
  const [editTax, setEditTax] = useState({
    name: "",
    isPercentage: true,
    value: 0,
    isActive: false,
  });

  // Snackbar de mensajes
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("info");
  const openSnack = (msg, type = "info") => {
    setSnackMsg(msg);
    setSnackType(type);
    setSnackOpen(true);
  };
  const closeSnack = () => setSnackOpen(false);

  // Dialog para confirmación de eliminación
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogData, setDialogData] = useState(null);
  const handleOpenDialog = (obj) => {
    setDialogData(obj);
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogData(null);
  };
  const handleConfirmDelete = async () => {
    if (!dialogData) return;
    try {
      await API.delete(`/extrataxes/${dialogData.id}?role=Admin`);
      openSnack("Impuesto extra eliminado", "warning");
      loadExtraTaxes();
    } catch {
      openSnack("Error al eliminar", "error");
    }
    handleCloseDialog();
  };

  useEffect(() => {
    if (!loadingAuth) {
      if (!user || user.role !== "Admin") {
        router.push("/");
      } else {
        loadExtraTaxes();
      }
    }
  }, [loadingAuth, user, router]);

  const loadExtraTaxes = async () => {
    try {
      const res = await API.get("/extrataxes");
      setExtraTaxes(res.data);
    } catch {
      openSnack("Error al cargar impuestos extra", "error");
    }
  };

  // Helpers para validaciones
  const limitName = (raw) => {
    // Máx 5 palabras, 22 chars
    let val = raw;
    if (val.length > 22) {
      val = val.slice(0, 22);
    }
    const words = val.split(/\s+/);
    if (words.length > 5) {
      val = words.slice(0, 5).join(" ");
    }
    return val;
  };

  const limitValue = (raw, isPct) => {
    // isPct => 0..100 (3 dígitos)
    // else => 0..1000 (4 dígitos)
    let val = raw.replace(/\D/g, ""); // solo dígitos
    if (isPct) {
      if (val.length > 3) {
        val = val.slice(0, 3);
      }
      let num = parseInt(val || "0", 10);
      if (num > 100) num = 100;
      return num;
    } else {
      if (val.length > 4) {
        val = val.slice(0, 4);
      }
      let num = parseInt(val || "0", 10);
      if (num > 1000) num = 1000;
      return num;
    }
  };

  // Crear
  const handleCreate = async () => {
    // Límite 8
    if (extraTaxes.length >= 8) {
      openSnack("Se alcanzó el límite máximo (8) de impuestos extra", "error");
      return;
    }

    if (!newTax.name.trim()) {
      openSnack("Nombre requerido", "error");
      return;
    }

    try {
      await API.post(`/extrataxes?role=Admin`, newTax);
      openSnack("Impuesto extra creado", "success");
      setNewTax({ name: "", isPercentage: true, value: 0, isActive: false });
      loadExtraTaxes();
    } catch {
      openSnack("Error al crear impuesto extra", "error");
    }
  };

  // Editar
  const handleEditClick = (t) => {
    setEditId(t.id);
    setEditTax({
      name: t.name,
      isPercentage: t.isPercentage,
      value: t.value,
      isActive: t.isActive,
    });
  };

  // Actualizar
  const handleUpdate = async () => {
    if (!editTax.name.trim()) {
      openSnack("Nombre requerido", "error");
      return;
    }
    try {
      await API.put(`/extrataxes/${editId}?role=Admin`, editTax);
      openSnack("Impuesto extra actualizado", "success");
      setEditId(0);
      setEditTax({ name: "", isPercentage: true, value: 0, isActive: false });
      loadExtraTaxes();
    } catch {
      openSnack("Error al actualizar", "error");
    }
  };

  const handleDelete = (id) => {
    handleOpenDialog({ type: "extratax", id });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow-sm">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "ExtraTaxes", href: "/admin/extrataxes" },
        ]}
      />

      {/* Botón Volver a la derecha */}
      <div className="mb-4 flex justify-end">
        <Button variant="outlined" color="secondary" onClick={() => router.push("/admin")}>
          Volver
        </Button>
      </div>

      <Typography variant="h5" fontWeight="bold" mb={4}>
        Impuestos Extra
      </Typography>

      <Card className="mb-4">
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Crear nuevo impuesto
          </Typography>
          <div className="flex flex-col gap-2">
            <TextField
              label="Nombre"
              value={newTax.name}
              onChange={(e) => setNewTax({ ...newTax, name: limitName(e.target.value) })}
            />
            <div className="flex gap-4 items-center">
              <FormControlLabel
                label="%"
                control={
                  <Checkbox
                    checked={newTax.isPercentage}
                    onChange={(e) =>
                      setNewTax({ ...newTax, isPercentage: e.target.checked })
                    }
                  />
                }
              />
              <TextField
                type="number"
                label="Valor"
                value={newTax.value}
                onChange={(e) =>
                  setNewTax({
                    ...newTax,
                    value: limitValue(e.target.value, newTax.isPercentage),
                  })
                }
                sx={{ width: "100px" }}
                inputProps={{ min: 0 }} // Evita que con flecha abajo se vaya a negativo
              />
              <FormControlLabel
                label="Activo"
                control={
                  <Checkbox
                    checked={newTax.isActive}
                    onChange={(e) =>
                      setNewTax({ ...newTax, isActive: e.target.checked })
                    }
                  />
                }
              />
            </div>
            <Button variant="contained" color="primary" onClick={handleCreate} sx={{ width: "fit-content" }}>
              Crear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Tabla de impuestos extra
      </Typography>
      <Table className="w-full border-collapse text-sm">
        <TableHead className="bg-gray-200">
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Valor</TableCell>
            <TableCell>Activo</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {extraTaxes.map((et) => {
            if (editId === et.id) {
              return (
                <TableRow key={et.id}>
                  <TableCell>{et.id}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={editTax.name}
                      onChange={(e) =>
                        setEditTax({
                          ...editTax,
                          name: limitName(e.target.value),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      label="%"
                      control={
                        <Checkbox
                          checked={editTax.isPercentage}
                          onChange={(e) =>
                            setEditTax({
                              ...editTax,
                              isPercentage: e.target.checked,
                            })
                          }
                        />
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={editTax.value}
                      onChange={(e) =>
                        setEditTax({
                          ...editTax,
                          value: limitValue(e.target.value, editTax.isPercentage),
                        })
                      }
                      sx={{ width: "80px" }}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={editTax.isActive}
                      onChange={(e) =>
                        setEditTax({ ...editTax, isActive: e.target.checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleUpdate}
                      sx={{ mr: 1 }}
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="contained"
                      color="inherit"
                      onClick={() => {
                        setEditId(0);
                        setEditTax({ name: "", isPercentage: true, value: 0, isActive: false });
                      }}
                    >
                      Cancelar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }
            return (
              <TableRow key={et.id}>
                <TableCell>{et.id}</TableCell>
                <TableCell>{et.name}</TableCell>
                <TableCell>{et.isPercentage ? "Porcentaje" : "Fijo"}</TableCell>
                <TableCell>{et.value}</TableCell>
                <TableCell>{et.isActive ? "Sí" : "No"}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: "#FCD34D", mr: 1 }}
                    onClick={() => handleEditClick(et)}
                  >
                    Editar
                  </Button>
                  <Button variant="contained" color="error" onClick={() => handleDelete(et.id)}>
                    Borrar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Eliminar Impuesto Extra</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar este impuesto extra?</Typography>
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
