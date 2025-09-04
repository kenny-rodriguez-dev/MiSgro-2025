"use client";
import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthContext } from "../../../../context/AuthContext";
import API from "../../../../services/api";

export default function UserFormsDetailPage() {
  const { user } = useContext(AuthContext);
  const isAdminOrSupervisor = user && (user.role === "Admin" || user.role === "Supervisor");
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;
  const [addresses, setAddresses] = useState([]);
  const [billingList, setBillingList] = useState([]);
  const [clientDataList, setClientDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isAdminOrSupervisor) return;
    loadData();
  }, [isAdminOrSupervisor]);
  const loadData = async () => {
    setLoading(true);
    try {
      // Asumiendo endpoints tipo: /myaccount/addresses?userId=XX
      const addrRes = await API.get(`/myaccount/addresses?userId=${userId}`);
      const billRes = await API.get(`/myaccount/billingdetails?userId=${userId}`);
      const clientRes = await API.get(`/myaccount/clientdata?userId=${userId}`);
      setAddresses(addrRes.data);
      setBillingList(billRes.data);
      setClientDataList(clientRes.data);
    } catch (error) {
      console.error("Error al cargar formularios del usuario:", error);
    }
    setLoading(false);
  };
  if (!isAdminOrSupervisor) {
    return <p className="text-center mt-4">No tienes permisos.</p>;
  }
  const handleBack = () => {
    router.push("/admin/forms");
  };
  return (
    <section className="max-w-7xl mx-auto p-4 bg-white rounded shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Formularios del Usuario #{userId}</h2>
      <div className="mb-4 text-right">
        <button onClick={handleBack} className="bg-gray-300 px-3 py-1 rounded">Volver</button>
      </div>
      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">Direcciones de Envío</h3>
          {addresses.length === 0 ? (
            <p className="mb-4">No hay direcciones registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="mb-4 w-full border-collapse min-w-[800px]">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2">ID</th>
                    <th className="border p-2">País</th>
                    <th className="border p-2">Provincia</th>
                    <th className="border p-2">Ciudad</th>
                    <th className="border p-2">C.P.</th>
                    <th className="border p-2">Dirección</th>
                  </tr>
                </thead>
                <tbody>
                  {addresses.map((a) => (
                    <tr key={a.id}>
                      <td className="border p-2">{a.id}</td>
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
          <h3 className="text-lg font-semibold mb-2">Facturación</h3>
          {billingList.length === 0 ? (
            <p className="mb-4">No hay facturación registrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="mb-4 w-full border-collapse min-w-[800px]">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2">ID</th>
                    <th className="border p-2">País</th>
                    <th className="border p-2">Región</th>
                    <th className="border p-2">Ciudad</th>
                    <th className="border p-2">Dirección 1</th>
                    <th className="border p-2">Dirección 2</th>
                  </tr>
                </thead>
                <tbody>
                  {billingList.map((b) => (
                    <tr key={b.id}>
                      <td className="border p-2">{b.id}</td>
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
          <h3 className="text-lg font-semibold mb-2">Datos de Cliente</h3>
          {clientDataList.length === 0 ? (
            <p className="mb-4">No hay datos de cliente registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="mb-4 w-full border-collapse min-w-[1000px]">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2">ID</th>
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
                  {clientDataList.map((cd) => (
                    <tr key={cd.id}>
                      <td className="border p-2">{cd.id}</td>
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
        </>
      )}
    </section>
  );
}
