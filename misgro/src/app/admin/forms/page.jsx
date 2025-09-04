"use client";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../services/api";
import Link from "next/link";
export default function FormsAdminPage() {
  const { user } = useContext(AuthContext);
  const isAdminOrSupervisor = user && (user.role === "Admin" || user.role === "Supervisor");
  const [addresses, setAddresses] = useState([]);
  const [billingDetails, setBillingDetails] = useState([]);
  const [clientDatas, setClientDatas] = useState([]);
  // Nuevos:
  const [orderShippings, setOrderShippings] = useState([]);
  const [orderBillings, setOrderBillings] = useState([]);
  const [orderClients, setOrderClients] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isAdminOrSupervisor) {
      loadAllData();
    }
  }, [isAdminOrSupervisor]);
  const loadAllData = async () => {
    setLoading(true);
    try {
      // Existing
      const addRes = await API.get("/adminforms/addresses");
      const billRes = await API.get("/adminforms/billing");
      const clientRes = await API.get("/adminforms/clients");
      // Nuevo: /adminforms/orders => shippings, billings, clients
      const orderFormsRes = await API.get("/adminforms/orders");
      setAddresses(addRes.data);
      setBillingDetails(billRes.data);
      setClientDatas(clientRes.data);
      setOrderShippings(orderFormsRes.data.shippings);
      setOrderBillings(orderFormsRes.data.billings);
      setOrderClients(orderFormsRes.data.clients);
    } catch (error) {
      console.error("Error al cargar data de formularios:", error);
    }
    setLoading(false);
  };
  if (!isAdminOrSupervisor) {
    return <p className="text-center mt-4">No tienes permisos.</p>;
  }
  return (
    <section className="max-w-7xl mx-auto p-4 bg-white rounded shadow-sm">
      <div className="mb-4 text-right">
        <Link href="/admin" className="bg-gray-300 px-3 py-1 rounded">
          Volver
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-center">Datos de Formularios</h2>
      {loading && <p>Cargando datos...</p>}
      {/* 1) Direcciones de usuario (tabla ShippingAddresses) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Direcciones de Envío (UserId)</h3>
        {addresses.length === 0 ? (
          <p>No hay direcciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mb-4 min-w-[800px]">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">UserId</th>
                  <th className="border p-2">País</th>
                  <th className="border p-2">Provincia</th>
                  <th className="border p-2">Ciudad</th>
                  <th className="border p-2">PostalCode</th>
                  <th className="border p-2">Dirección</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((a) => (
                  <tr key={a.id}>
                    <td className="border p-2">{a.id}</td>
                    <td className="border p-2">{a.userId}</td>
                    <td className="border p-2">{a.country}</td>
                    <td className="border p-2">{a.province}</td>
                    <td className="border p-2">{a.city}</td>
                    <td className="border p-2">{a.postalCode}</td>
                    <td className="border p-2">{a.addressLine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* 2) Facturación (UserId) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Detalles de Facturación (UserId)</h3>
        {billingDetails.length === 0 ? (
          <p>No hay datos de facturación registrados (user-level).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mb-4 min-w-[800px]">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">UserId</th>
                  <th className="border p-2">País</th>
                  <th className="border p-2">Región</th>
                  <th className="border p-2">Ciudad</th>
                  <th className="border p-2">Address1</th>
                  <th className="border p-2">Address2</th>
                </tr>
              </thead>
              <tbody>
                {billingDetails.map((b) => (
                  <tr key={b.id}>
                    <td className="border p-2">{b.id}</td>
                    <td className="border p-2">{b.userId}</td>
                    <td className="border p-2">{b.country}</td>
                    <td className="border p-2">{b.region}</td>
                    <td className="border p-2">{b.city}</td>
                    <td className="border p-2">{b.addressLine1}</td>
                    <td className="border p-2">{b.addressLine2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* 3) Datos de Cliente (UserId) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Datos del Cliente (UserId)</h3>
        {clientDatas.length === 0 ? (
          <p>No hay datos de cliente registrados (user-level).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1000px]">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">UserId</th>
                  <th className="border p-2">Nombres</th>
                  <th className="border p-2">Apellidos</th>
                  <th className="border p-2">Empresa</th>
                  <th className="border p-2">Teléfono</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Identificación</th>
                  <th className="border p-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {clientDatas.map((cd) => (
                  <tr key={cd.id}>
                    <td className="border p-2">{cd.id}</td>
                    <td className="border p-2">{cd.userId}</td>
                    <td className="border p-2">{cd.firstName}</td>
                    <td className="border p-2">{cd.lastName}</td>
                    <td className="border p-2">{cd.companyName}</td>
                    <td className="border p-2">{cd.phone}</td>
                    <td className="border p-2">{cd.email}</td>
                    <td className="border p-2">{cd.identification}</td>
                    <td className="border p-2">{cd.orderNotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <hr className="my-6" />
      {/* 4) OrderShippings, OrderBillings, OrderClients => datos REALES usados en cada compra */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Datos Reales de cada Orden (OrderShippings)</h3>
        {orderShippings.length === 0 ? (
          <p>No hay direcciones de envío registradas en las órdenes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mb-4 min-w-[900px]">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">OrderId</th>
                  <th className="border p-2">Nombres</th>
                  <th className="border p-2">País</th>
                  <th className="border p-2">Provincia</th>
                  <th className="border p-2">Ciudad</th>
                  <th className="border p-2">PostalCode</th>
                  <th className="border p-2">Dirección</th>
                </tr>
              </thead>
              <tbody>
                {orderShippings.map((os) => (
                  <tr key={os.id}>
                    <td className="border p-2">{os.id}</td>
                    <td className="border p-2">{os.orderId}</td>
                    <td className="border p-2">{os.firstName} {os.lastName}</td>
                    <td className="border p-2">{os.country}</td>
                    <td className="border p-2">{os.province}</td>
                    <td className="border p-2">{os.city}</td>
                    <td className="border p-2">{os.postalCode}</td>
                    <td className="border p-2">{os.addressLine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">OrderBillings (Facturación por orden)</h3>
        {orderBillings.length === 0 ? (
          <p>No hay facturación a nivel de órdenes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mb-4 min-w-[800px]">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">OrderId</th>
                  <th className="border p-2">País</th>
                  <th className="border p-2">Región</th>
                  <th className="border p-2">Ciudad</th>
                  <th className="border p-2">Address1</th>
                  <th className="border p-2">Address2</th>
                </tr>
              </thead>
              <tbody>
                {orderBillings.map((ob) => (
                  <tr key={ob.id}>
                    <td className="border p-2">{ob.id}</td>
                    <td className="border p-2">{ob.orderId}</td>
                    <td className="border p-2">{ob.country}</td>
                    <td className="border p-2">{ob.region}</td>
                    <td className="border p-2">{ob.city}</td>
                    <td className="border p-2">{ob.addressLine1}</td>
                    <td className="border p-2">{ob.addressLine2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">OrderClients (Datos de Cliente por orden)</h3>
        {orderClients.length === 0 ? (
          <p>No hay datos de cliente a nivel de órdenes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[1000px]">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2">ID</th>
                  <th className="border p-2">OrderId</th>
                  <th className="border p-2">Nombres</th>
                  <th className="border p-2">Empresa</th>
                  <th className="border p-2">Teléfono</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Identificación</th>
                  <th className="border p-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {orderClients.map((oc) => (
                  <tr key={oc.id}>
                    <td className="border p-2">{oc.id}</td>
                    <td className="border p-2">{oc.orderId}</td>
                    <td className="border p-2">
                      {oc.firstName} {oc.lastName}
                    </td>
                    <td className="border p-2">{oc.companyName}</td>
                    <td className="border p-2">{oc.phone}</td>
                    <td className="border p-2">{oc.email}</td>
                    <td className="border p-2">{oc.identification}</td>
                    <td className="border p-2">{oc.orderNotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
