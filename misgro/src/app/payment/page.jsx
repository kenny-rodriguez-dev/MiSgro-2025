"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";

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
import Breadcrumb from "../../components/Breadcrumb";

export default function PaymentPage() {
  const router = useRouter();
  const { user, loadingAuth } = useContext(AuthContext);
  const { fetchCartFromDB } = useContext(CartContext);

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(0);

  // Campos para ephemeral method
  const [methodType, setMethodType] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  // Snackbars
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
    if (!loadingAuth) {
      if (!user) {
        router.replace("/login");
        return;
      }
      loadPaymentMethods(user.id);
    }
  }, [loadingAuth, user, router]);

  const loadPaymentMethods = async (userId) => {
    try {
      const res = await API.get(`/myaccount/paymentmethods?userId=${userId}`);
      setPaymentMethods(res.data);
    } catch {}
  };

  const handleSelectMethod = (id) => {
    setSelectedMethodId(id);
    // Limpiar ephemeral
    setMethodType("");
    setCardNumber("");
    setCardHolder("");
    setMonth("");
    setYear("");
    setCvv("");
    setPaypalEmail("");
  };

  const handlePay = async () => {
    if (!user) {
      openSnack("Debes iniciar sesión.", "error");
      return;
    }
    // Recuperar shipping, billing, client del localStorage
    const shippingJson = localStorage.getItem("temp_shipping");
    const billingJson = localStorage.getItem("temp_billing");
    const clientJson = localStorage.getItem("temp_client");
    const shipping = shippingJson ? JSON.parse(shippingJson) : null;
    const billing = billingJson ? JSON.parse(billingJson) : null;
    const client = clientJson ? JSON.parse(clientJson) : null;

    if (selectedMethodId) {
      // Pagar con método guardado
      try {
        const res = await API.post("/orders/checkout", {
          paymentMethod: "Guardado",
          userId: user.id,
          shipping,
          billing,
          client,
        });
        await fetchCartFromDB(user.id);
        router.push(`/payment/success?orderId=${res.data.orderId}`);
      } catch (error) {
        openSnack("Error al procesar el pago (guardado).", "error");
      }
      return;
    }

    // Pagar con método efímero
    if (!methodType) {
      openSnack("Selecciona un método o usa uno guardado.", "error");
      return;
    }

    if (methodType === "Tarjeta") {
      // Validar
      if (!cardNumber.trim() || !cardHolder.trim() || !month.trim() || !year.trim() || !cvv.trim()) {
        openSnack("Completa todos los campos de la tarjeta", "error");
        return;
      }
    } else if (methodType === "PayPal") {
      if (!paypalEmail.trim()) {
        openSnack("Completa el correo de PayPal", "error");
        return;
      }
    }

    try {
      const res = await API.post("/orders/checkout", {
        paymentMethod: methodType,
        userId: user.id,
        shipping,
        billing,
        client,
      });
      await fetchCartFromDB(user.id);
      router.push(`/payment/success?orderId=${res.data.orderId}`);
    } catch (error) {
      openSnack("Error al procesar el pago (efímero).", "error");
    }
  };

  const handleGoBack = () => {
    router.push("/cart");
  };

  if (loadingAuth) {
    return <p className="mt-4 text-center">Cargando autenticación...</p>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 px-2">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Carrito", href: "/cart" },
          { label: "Pago", href: "/payment" },
        ]}
      />

      <Typography variant="h5" fontWeight="bold" mb={4} className="flex items-center gap-2">
        <PaymentIcon /> Opciones de Pago
      </Typography>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Métodos guardados */}
        <div className="flex-1">
          <Card className="shadow-md mb-4">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Métodos Guardados
              </Typography>
              {paymentMethods.length === 0 ? (
                <Typography color="text.secondary">No tienes métodos guardados.</Typography>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className="border p-2 rounded flex items-center gap-2 bg-gray-50">
                      <input
                        type="radio"
                        name="savedMethod"
                        checked={selectedMethodId === pm.id}
                        onChange={() => handleSelectMethod(pm.id)}
                      />
                      <div>
                        <Typography variant="body2" fontWeight="bold">
                          {pm.type}
                        </Typography>
                        <Typography variant="caption">{pm.maskedData}</Typography>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Nuevo método efímero */}
        <div className="flex-1">
          <Card className="shadow-md">
            <CardContent>
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Pagar con Nuevo Método
              </Typography>
              <div className="mb-3">
                <label className="block font-medium mb-1">Tipo de Método</label>
                <select
                  value={methodType}
                  onChange={(e) => {
                    setMethodType(e.target.value);
                    setSelectedMethodId(0);
                    setCardNumber("");
                    setCardHolder("");
                    setMonth("");
                    setYear("");
                    setCvv("");
                    setPaypalEmail("");
                  }}
                  className="border p-2 rounded w-full"
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              {methodType === "Tarjeta" && (
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
              )}

              {methodType === "PayPal" && (
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
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button onClick={handleGoBack} variant="outlined" color="secondary">
          Volver
        </Button>
        <Button onClick={handlePay} variant="contained" color="primary">
          Pagar
        </Button>
      </div>

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
    </div>
  );
}
