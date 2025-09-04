"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../services/api";

/* MUI */
import {
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

/* Breadcrumb */
import Breadcrumb from "../../../components/Breadcrumb";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loadingAuth } = useContext(AuthContext);

  const orderId = searchParams.get("orderId") || "";
  const [loading, setLoading] = useState(true);

  const [order, setOrder] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [billing, setBilling] = useState(null);
  const [client, setClient] = useState(null);

  const [displayIndex, setDisplayIndex] = useState(null);

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.replace("/login");
        return;
      }
      if (!orderId) {
        setLoading(false);
        return;
      }
      loadOrder(orderId);
    }
  }, [loadingAuth, user, orderId, router]);

  const loadOrder = async (id) => {
    setLoading(true);
    try {
      const res = await API.get(`/orders/${id}`);
      setOrder(res.data.order);
      setShipping(res.data.shipping);
      setBilling(res.data.billing);
      setClient(res.data.client);
    } catch {
      // Ignoramos el error y lo reflejamos en pantalla
    }
    setLoading(false);
  };

  useEffect(() => {
    if (order && user) {
      loadMyOrdersAndIndex(user.id, order.id);
    }
  }, [order, user]);

  const loadMyOrdersAndIndex = async (userId, currentOrderId) => {
    try {
      const myRes = await API.get(`/orders/myorders?userId=${userId}`);
      const rawOrders = myRes.data.map((x) => x.order);

      // Ordenar por fecha asc => la primera compra es #1
      rawOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const idx = rawOrders.findIndex((o) => o.id === +currentOrderId);
      if (idx >= 0) {
        setDisplayIndex(idx + 1);
      }
    } catch {
      // Ignoramos errores
    }
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (loadingAuth) {
    return <p className="mt-4 text-center">Cargando autenticación...</p>;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* Breadcrumb con “Inicio”, “Mis Compras” y “Pago” (sin enlace en Pago) */}
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Mis Compras", href: "/miscompras" },
          { label: "Pago" }, // sin href => texto plano
        ]}
      />

      {!orderId ? (
        <Card className="shadow-md mt-4">
          <CardContent className="text-center">
            <Typography variant="h6">
              No se proporcionó ID de Orden.
            </Typography>
            <Button
              onClick={handleGoHome}
              variant="contained"
              color="primary"
              className="mt-4"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center mt-4">
          <CircularProgress />
        </div>
      ) : !order ? (
        <Card className="shadow-md mt-4">
          <CardContent className="text-center">
            <Typography variant="h6">
              No se encontró la orden #{orderId}, pero el pago fue exitoso.
            </Typography>
            <Button
              onClick={handleGoHome}
              variant="contained"
              color="primary"
              className="mt-4"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md mt-4">
          <CardContent>
            <div className="text-center mb-4">
              <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48 }} />
              <Typography variant="h5" fontWeight="bold">
                ¡Pago realizado con éxito!
              </Typography>
            </div>
            <Typography className="mb-2 text-center">
              Tu pedido{" "}
              <strong>#{displayIndex ? displayIndex : order.id}</strong> se ha
              procesado correctamente.
            </Typography>
            <Typography className="mb-4 text-center">
              Monto total: <strong>${order.totalAmount}</strong>
            </Typography>

            <Divider className="mb-4" />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Dirección de Envío:
            </Typography>
            {shipping ? (
              <Typography variant="body2" mb={2}>
                {shipping.addressLine}, {shipping.city}, {shipping.province},
                CP {shipping.postalCode}, {shipping.country}.
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" mb={2}>
                (No hay datos de envío)
              </Typography>
            )}

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Facturación:
            </Typography>
            {billing ? (
              <Typography variant="body2" mb={2}>
                {billing.country}, {billing.region}, {billing.city}.{" "}
                {billing.addressLine1} {billing.addressLine2 || ""}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" mb={2}>
                (No hay datos de facturación)
              </Typography>
            )}

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Datos del Cliente:
            </Typography>
            {client ? (
              <Typography variant="body2" mb={2}>
                Nombre: {client.firstName} {client.lastName}
                <br />
                Empresa: {client.companyName || "(No aplica)"}
                <br />
                Tel: {client.phone}
                <br />
                Email: {client.email}
                <br />
                Identificación: {client.identification}
                <br />
                Notas: {client.orderNotes || "(sin notas)"}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" mb={2}>
                (No hay datos de cliente)
              </Typography>
            )}

            <Divider className="my-4" />

            <div className="text-center">
              <Button onClick={handleGoHome} variant="contained" color="primary">
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
