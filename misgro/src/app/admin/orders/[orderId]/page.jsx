"use client";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../context/AuthContext";
import API from "../../../../services/api";
/* MUI */
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import { ShoppingCart } from "@mui/icons-material";
/* Breadcrumb */
import Breadcrumb from "../../../../components/Breadcrumb";

export default function OrderDetailPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const isSupervisor = user && user.role === "Supervisor";
  const params = useParams();
  const orderId = params.orderId;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [billing, setBilling] = useState(null);
  const [client, setClient] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  // Para tabla estilo correo
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [extraTaxes, setExtraTaxes] = useState([]);
  const [extraTaxDetails, setExtraTaxDetails] = useState([]);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    if (isSupervisor) {
      loadOrderDetail(orderId);
      loadOrderItems(orderId);
      loadSettingsAndExtraTaxes();
    } else {
      setLoading(false);
    }
  }, [isSupervisor, orderId]);

  const loadOrderDetail = async (id) => {
    setLoading(true);
    try {
      const res = await API.get(`/orders/${id}`);
      const data = res.data;
      setOrder(data.order);
      setShipping(data.shipping);
      setBilling(data.billing);
      setClient(data.client);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const loadOrderItems = async (id) => {
    setItemsLoading(true);
    try {
      const res = await API.get(`/orders/${id}/items`);
      setItems(res.data);
    } catch {
      // ignore
    }
    setItemsLoading(false);
  };

  const loadSettingsAndExtraTaxes = async () => {
    try {
      const settingsRes = await API.get("/settings");
      setTaxRate(settingsRes.data.taxRate || 0);
      setShippingCost(settingsRes.data.shippingCost || 0);
      const extRes = await API.get("/extrataxes");
      const active = extRes.data.filter((x) => x.isActive);
      setExtraTaxes(active);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    calcTotals();
  }, [items, taxRate, shippingCost, extraTaxes]);

  const calcTotals = () => {
    if (!items || items.length === 0) {
      setSubtotal(0);
      setTaxAmount(0);
      setTotal(0);
      setExtraTaxDetails([]);
      return;
    }
    let sub = 0;
    items.forEach((item) => {
      sub += item.price * item.quantity;
    });
    setSubtotal(sub);
    const tVal = sub * (taxRate / 100);
    setTaxAmount(tVal);
    let exArr = [];
    let exTotal = 0;
    extraTaxes.forEach((et) => {
      if (et.isActive) {
        if (et.isPercentage) {
          const val = sub * (et.value / 100);
          exTotal += val;
          exArr.push({ name: et.name, label: `${et.value}%`, amount: val });
        } else {
          exTotal += et.value;
          exArr.push({ name: et.name, label: "fijo", amount: et.value });
        }
      }
    });
    setExtraTaxDetails(exArr);
    const finalT = sub + tVal + exTotal + shippingCost;
    setTotal(finalT);
  };

  const handleBack = () => {
    router.push("/admin/orders");
  };

  if (!isSupervisor) {
    return <p className="text-center mt-4">No tienes permisos.</p>;
  }
  if (loading) {
    return <p className="mt-4 text-center">Cargando detalles del pedido...</p>;
  }
  if (!order) {
    return <p className="mt-4 text-center">Pedido no encontrado.</p>;
  }
  
  const noteStyle = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Pedidos", href: "/admin/orders" },
          { label: "Detalle" },
        ]}
      />
      <Card className="shadow-md">
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" className="flex items-center gap-2">
              <ShoppingCart />
              Detalles del Pedido
            </Typography>
            <Button variant="outlined" color="secondary" onClick={handleBack}>
              Volver
            </Button>
          </Box>
          <Divider className="mb-4" />
          
          <div className="border p-3 rounded mb-4 text-sm bg-gray-50">
            <p><strong>Pedido ID:</strong> {order.id}</p>
            <p><strong>Estado:</strong>{" "}
              <span className={`px-2 py-1 rounded ${order.status === "Enviado" ? "bg-green-100 text-green-800" : order.status === "Cancelado" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                {order.status}
              </span>
              {order.status === "Cancelado" && order.cancelReason && (
                <span style={{ color: "#666", marginLeft: "8px" }}> (Motivo: {order.cancelReason})</span>
              )}
            </p>
            <p><strong>Fecha (Ecuador):</strong>{" "}{new Date(order.createdAt).toLocaleString("es-EC", { timeZone: "America/Guayaquil", })}</p>
          </div>

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Productos comprados</Typography>
          {itemsLoading ? (
            <p>Cargando items...</p>
          ) : items.length === 0 ? (
            <p>No hay items cargados.</p>
          ) : (
            <>
              {/* VISTA DESKTOP */}
              <div className="hidden md:block">
                <table className="w-full border-collapse mb-3 text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border p-2 text-center">Imagen</th>
                      <th className="border p-2 text-center">Producto</th>
                      <th className="border p-2 text-center">Cantidad</th>
                      <th className="border p-2 text-center">P.U.</th>
                      <th className="border p-2 text-center">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      let finalImg = item.imageUrl || "";
                      if (finalImg && !finalImg.startsWith("http")) { finalImg = "http://localhost:5009" + finalImg; }
                      const lineSubtotal = item.price * item.quantity;
                      return (
                        <tr key={item.id}>
                          <td className="border p-2 text-center">{finalImg ? <img src={finalImg} alt={item.name} className="w-16 h-16 object-cover rounded mx-auto" /> : <div className="w-16 h-16 flex items-center justify-center bg-gray-200 text-gray-500 text-sm rounded mx-auto">Sin imagen</div>}</td>
                          <td className="border p-2 text-center">{item.name}</td>
                          <td className="border p-2 text-center">{item.quantity}</td>
                          <td className="border p-2 text-center">${item.price.toFixed(2)}</td>
                          <td className="border p-2 text-center">${lineSubtotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr><td className="border p-2 text-right font-bold" colSpan={4}>Subtotal:</td><td className="border p-2 text-center">${subtotal.toFixed(2)}</td></tr>
                    <tr><td className="border p-2 text-right font-bold" colSpan={4}>IVA ({taxRate}%):</td><td className="border p-2 text-center">${taxAmount.toFixed(2)}</td></tr>
                    {extraTaxDetails.map((et, idx) => (<tr key={idx}><td className="border p-2 text-right font-bold" colSpan={4}>{et.name} ({et.label}):</td><td className="border p-2 text-center">+${et.amount.toFixed(2)}</td></tr>))}
                    <tr><td className="border p-2 text-right font-bold" colSpan={4}>Envío:</td><td className="border p-2 text-center">+${shippingCost.toFixed(2)}</td></tr>
                    <tr><td className="border p-2 text-right font-bold" colSpan={4}>TOTAL:</td><td className="border p-2 text-center text-green-600 font-bold">${total.toFixed(2)}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* VISTA MÓVIL */}
              <div className="block md:hidden">
                <div className="space-y-4">
                  {items.map((item) => {
                    let finalImg = item.imageUrl || "";
                    if (finalImg && !finalImg.startsWith("http")) { finalImg = "http://localhost:5009" + finalImg; }
                    const lineSubtotal = item.price * item.quantity;
                    return (
                      <div key={item.id} className="flex items-start gap-4 p-2 border rounded bg-gray-50">
                        {finalImg ? <img src={finalImg} alt={item.name} className="w-20 h-20 object-cover rounded" /> : <div className="w-20 h-20 flex items-center justify-center bg-gray-200 text-gray-500 text-xs rounded">Sin imagen</div>}
                        <div className="text-sm flex-grow">
                          <Typography fontWeight="bold">{item.name}</Typography>
                          <p><strong>Cantidad:</strong> {item.quantity}</p>
                          <p><strong>Precio Unitario:</strong> ${item.price.toFixed(2)}</p>
                          <p><strong>Subtotal:</strong> ${lineSubtotal.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal:</span><strong>${subtotal.toFixed(2)}</strong></div>
                  <div className="flex justify-between"><span>IVA ({taxRate}%):</span><strong>+${taxAmount.toFixed(2)}</strong></div>
                  {extraTaxDetails.map((et, idx) => (<div key={idx} className="flex justify-between"><span>{et.name} ({et.label}):</span><strong>+${et.amount.toFixed(2)}</strong></div>))}
                  <div className="flex justify-between"><span>Envío:</span><strong>+${shippingCost.toFixed(2)}</strong></div>
                  <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t"><span>TOTAL:</span><strong className="text-green-600">${total.toFixed(2)}</strong></div>
                </div>
              </div>
            </>
          )}

          {/* Secciones inferiores */}
          <div className="mt-6">
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Datos del Cliente:</Typography>
            {client ? (<div className="border p-2 rounded mb-4 text-sm"><p><strong>Nombre:</strong> {client.firstName} {client.lastName}</p><p><strong>Empresa:</strong> {client.companyName || "(no aplica)"}</p><p><strong>Teléfono:</strong> {client.phone}</p><p><strong>Email:</strong> {client.email}</p><p><strong>Identificación:</strong> {client.identification}</p><p><strong>Notas:</strong> <span style={noteStyle}>{client.orderNotes || "(sin notas)"}</span></p></div>) : (<Typography variant="body2" color="text.secondary" mb={4}>No hay datos de cliente.</Typography>)}
            
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Dirección de Envío:</Typography>
            {shipping ? (<div className="border p-2 rounded mb-4 text-sm"><p><strong>País:</strong> {shipping.country}</p><p><strong>Provincia:</strong> {shipping.province}</p><p><strong>Ciudad:</strong> {shipping.city}</p><p><strong>Código Postal:</strong> {shipping.postalCode}</p><p><strong>Dirección:</strong> {shipping.addressLine}</p></div>) : (<Typography variant="body2" color="text.secondary" mb={4}>No hay datos de envío.</Typography>)}
            
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Facturación:</Typography>
            {billing ? (<div className="border p-2 rounded mb-4 text-sm"><p><strong>País:</strong> {billing.country}</p><p><strong>Región:</strong> {billing.region}</p><p><strong>Ciudad:</strong> {billing.city}</p><p><strong>Dirección 1:</strong> {billing.addressLine1}</p><p><strong>Dirección 2:</strong> {billing.addressLine2 || "(vacío)"}</p></div>) : (<Typography variant="body2" color="text.secondary" mb={4}>No hay datos de facturación.</Typography>)}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
