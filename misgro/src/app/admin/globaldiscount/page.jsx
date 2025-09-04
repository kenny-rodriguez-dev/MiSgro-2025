"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../services/api";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import Breadcrumb from "../../../components/Breadcrumb";
import { useRouter } from "next/navigation";

export default function GlobalDiscountPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  // Global discount se maneja como número
  const [globalDiscount, setGlobalDiscount] = useState(0);
  // Estado para activar o desactivar descuento global
  const [globalActive, setGlobalActive] = useState(false);
  // Estado para determinar si estamos en modo edición (modificar)
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dialog de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  // Cargar la configuración actual
  useEffect(() => {
    if (!loadingAuth && user && user.role === "Admin") {
      loadSetting();
    }
  }, [loadingAuth, user]);

  const loadSetting = async () => {
    try {
      const res = await API.get("/settings");
      const discount = Number(res.data.globalDiscountPercent) || 0;
      setGlobalDiscount(discount);
      setGlobalActive(discount > 0);
      setEditing(false);
    } catch (error) {
      openSnack("Error al cargar configuración", "error");
    }
  };

  const handleCheckboxChange = (e) => {
    setGlobalActive(e.target.checked);
  };

  const handleDiscountChange = (e) => {
    let value = e.target.value;
    // Permitir solo dígitos y máximo 3 para llegar a 100
    value = value.replace(/\D/g, "");
    if (value.length > 3) {
      value = value.slice(0, 3);
    }
    let num = parseInt(value || "0", 10);
    if (num > 100) num = 100;
    setGlobalDiscount(num.toString());
  };

  const handleModify = () => {
    setEditing(true);
  };

  // Al dar clic en Guardar => abrir el diálogo de confirmación
  const handleSave = () => {
    setConfirmOpen(true);
  };

  // Resetea los descuentos individuales de todos los productos
  const resetIndividualDiscounts = async () => {
    try {
      const res = await API.get("/products");
      const allProducts = res.data || [];
      for (const p of allProducts) {
        // Ponemos discountPercent=0, isDiscountActive=false
        await API.put(`/products/${p.id}?role=Admin`, {
          ...p,
          discountPercent: 0,
          isDiscountActive: false,
        });
      }
    } catch (err) {
      console.error("Error reseteando descuentos individuales:", err);
    }
  };

  // Al confirmar
  const handleConfirmUpdate = async () => {
    setConfirmOpen(false);
    setSaving(true);

    try {
      // 1) reset individual
      await resetIndividualDiscounts();

      // 2) actualizar en settings => si globalActive=false => discount=0
      const finalDiscount = globalActive ? parseInt(globalDiscount, 10) : 0;
      const current = await API.get("/settings");
      const finalPayload = {
        taxRate: current.data.taxRate,
        shippingCost: current.data.shippingCost,
        globalDiscountPercent: finalDiscount,
      };
      await API.put("/settings?role=Admin", finalPayload);

      // Mensaje final
      openSnack(
        "Descuento global actualizado y descuento individual reseteado.",
        "success"
      );

      setEditing(false);
    } catch (err) {
      openSnack("Error al actualizar descuento global", "error");
    }
    setSaving(false);
  };

  const handleCancelUpdate = () => {
    setConfirmOpen(false);
  };

  const handleBack = () => {
    // Si se da clic en Volver, no se guardan cambios
    loadSetting();
    router.push("/admin");
  };

  if (loadingAuth) {
    return <p className="mt-4">Cargando autenticación...</p>;
  }
  if (!user || user.role !== "Admin") {
    return <p className="mt-4 text-center">No tienes permisos de Admin</p>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-4 mt-4 rounded shadow">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "Descuento Global", href: "/admin/globaldiscount" },
        ]}
      />
      <div className="mb-4">
        <Button variant="outlined" color="primary" onClick={handleBack}>
          Volver
        </Button>
      </div>
      <Typography variant="h5" fontWeight="bold" mb={4} textAlign="center">
        Descuento Global
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" fontWeight="bold" mb={2}>
            Ajustar Descuento Global (%)
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={globalActive}
                  onChange={handleCheckboxChange}
                  disabled={!editing}
                />
              }
              label="Activar descuento global"
            />
            <TextField
              type="number"
              inputProps={{
                min: 0,
                max: 100,
                style: { textAlign: "center" },
              }}
              label="Descuento (%)"
              value={globalDiscount}
              onChange={handleDiscountChange}
              sx={{ width: "120px" }}
              disabled={!globalActive || !editing}
            />
            <div className="mt-3 flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving || !editing}
                variant="contained"
                color="success"
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                onClick={handleModify}
                variant="contained"
                color="primary"
                disabled={editing}
              >
                Modificar descuento global
              </Button>
            </div>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={confirmOpen} onClose={handleCancelUpdate}>
        <DialogTitle>Confirmar actualización</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de actualizar el descuento global? Al hacerlo, se
            reseteará el descuento individual (se borrará) de cada producto.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUpdate} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmUpdate} color="error" variant="contained">
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
