"use client";

import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../services/api";
import { Card, CardContent, Typography, TextField, Button, Snackbar, Alert, Box } from "@mui/material";
import Breadcrumb from "../../../components/Breadcrumb";
import { useRouter } from "next/navigation";

export default function IvaEnvioPage() {
  const { user, loadingAuth } = useContext(AuthContext);
  const router = useRouter();

  const [taxRate, setTaxRate] = useState(15);
  const [shippingCost, setShippingCost] = useState(25);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackType, setSnackType] = useState("success");
  const openSnack = (msg, type = "success") => {
    setSnackMsg(msg);
    setSnackType(type);
    setSnackOpen(true);
  };
  const closeSnack = () => setSnackOpen(false);

  useEffect(() => {
    if (!loadingAuth && user && user.role === "Admin") {
      API.get("/settings")
        .then((res) => {
          setTaxRate(res.data.taxRate ?? 15);
          setShippingCost(res.data.shippingCost ?? 25);
        })
        .catch(() => openSnack("Error al cargar configuración", "error"));
    }
  }, [loadingAuth, user]);

  const handleSave = async () => {
    try {
      // Cargar settings actuales para no perder el globalDiscountPercent
      const oldSet = await API.get("/settings");
      const payload = {
        taxRate: Number(taxRate),
        shippingCost: Number(shippingCost),
        // Mantenemos el discount global que ya existe
        globalDiscountPercent: oldSet.data.globalDiscountPercent,
      };
      await API.put("/settings?role=Admin", payload);
      openSnack("Configuración de IVA y Envío actualizada", "success");
    } catch {
      openSnack("Error al actualizar configuración", "error");
    }
  };

  // Limitar a máximo 2 dígitos para IVA
  const handleTaxRateInput = (e) => {
    let value = e.target.value;
    if (value.length > 2) {
      value = value.slice(0, 2);
    }
    setTaxRate(value);
  };

  // Limitar a máximo 4 dígitos para Costo de Envío
  const handleShippingCostInput = (e) => {
    let value = e.target.value;
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    setShippingCost(value);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-4 mt-4 rounded shadow">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Admin", href: "/admin" },
          { label: "IVA y Envío", href: "/admin/iva-envio" },
        ]}
      />

      <div className="mb-4">
        <Button variant="outlined" color="primary" onClick={() => router.push("/admin")}>
          Volver
        </Button>
      </div>

      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={2} textAlign="center">
            IVA y Envío
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="IVA (%)"
              type="number"
              value={taxRate}
              onChange={handleTaxRateInput}
              inputProps={{ min: 0, max: 99 }}
            />
            <TextField
              label="Costo de envío"
              type="number"
              value={shippingCost}
              onChange={handleShippingCostInput}
              inputProps={{ min: 0, max: 9999 }}
            />
            <Button variant="contained" color="primary" onClick={handleSave}>
              Guardar
            </Button>
          </Box>
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
