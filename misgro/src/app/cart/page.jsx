"use client";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CartContext } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";

/* MUI (usado para componentes base, el estilo principal es con Tailwind) */
import {
    Card,
    CardContent,
    Typography,
    IconButton,
    Button,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from "@mui/material";
import { RemoveCircle, AddCircle, Delete, UnfoldMore } from "@mui/icons-material";

/* Breadcrumb */
import Breadcrumb from "../../components/Breadcrumb";

// Definición de colores para consistencia
const milagroGreen = "#009246";
const milagroRed = "#ED1C24";

function limitTextWordsAndChars(str, maxWords, maxChars) {
    if (str.length > maxChars) str = str.slice(0, maxChars);
    const words = str.trim().split(/\s+/);
    if (words.length > maxWords) str = words.slice(0, maxWords).join(" ");
    return str;
}

const FormInput = ({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required={required}
        />
    </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 relative">
            <select
                value={value}
                onChange={onChange}
                className="appearance-none block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <UnfoldMore fontSize="small" />
            </div>
        </div>
    </div>
);

export default function CartPage() {
    const { cartItems, updateCartQuantity, removeFromCart } = useContext(CartContext);
    const { user, loadingAuth } = useContext(AuthContext);
    const router = useRouter();

    const [taxRate, setTaxRate] = useState(0);
    const [shippingCost, setShippingCost] = useState(0);
    const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
    const [extraTaxes, setExtraTaxes] = useState([]);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState(null);
    const [clientDataList, setClientDataList] = useState([]);
    const [selectedClientDataId, setSelectedClientDataId] = useState("0");
    const [clientData, setClientData] = useState({ firstName: "", lastName: "", companyName: "", phone: "", email: "", identification: "", orderNotes: "" });
    const [shippingList, setShippingList] = useState([]);
    const [selectedShippingId, setSelectedShippingId] = useState("0");
    const [shippingData, setShippingData] = useState({ country: "", province: "", city: "", postalCode: "", addressLine: "" });
    const [billingList, setBillingList] = useState([]);
    const [selectedBillingId, setSelectedBillingId] = useState("0");
    const [billingData, setBillingData] = useState({ country: "", region: "", city: "", addressLine1: "", addressLine2: "" });
    const [useSameAddressForBilling, setUseSameAddressForBilling] = useState(true);

    useEffect(() => {
        if (!loadingAuth) {
            if (!user) { router.push("/login"); }
            else { fetchSettings(); fetchExtraTaxes(); loadClientData(user.id); loadAddresses(user.id); loadBilling(user.id); }
        }
    }, [loadingAuth, user, router]);

    const fetchSettings = async () => { try { const r = await API.get("/settings"); setTaxRate(r.data.taxRate); setShippingCost(r.data.shippingCost); setGlobalDiscountPercent(r.data.globalDiscountPercent || 0); } catch { } };
    const fetchExtraTaxes = async () => { try { const r = await API.get("/extrataxes"); setExtraTaxes(r.data.filter(x => x.isActive)); } catch { } };
    const loadClientData = async (userId) => { try { const r = await API.get(`/myaccount/clientdata?userId=${userId}`); setClientDataList(r.data); } catch { } };
    const loadAddresses = async (userId) => { try { const r = await API.get(`/myaccount/addresses?userId=${userId}`); setShippingList(r.data); } catch { } };
    const loadBilling = async (userId) => { try { const r = await API.get(`/myaccount/billingdetails?userId=${userId}`); setBillingList(r.data); } catch { } };

    const showToast = (msg, type = "success") => { setToastMessage(msg); setToastType(type); setOpenSnackbar(true); };
    const handleCloseSnackbar = () => setOpenSnackbar(false);
    const handleOpenDialog = (itemId) => { setDeleteItemId(itemId); setOpenDialog(true); };
    const handleCloseDialog = () => { setDeleteItemId(null); setOpenDialog(false); };
    const handleConfirmDelete = () => { if (deleteItemId) { removeFromCart(deleteItemId); showToast("Producto eliminado.", "warning"); } handleCloseDialog(); };
    const handleIncrement = (item) => { if (item.stock && item.quantity >= item.stock) { showToast("No hay más stock.", "error"); return; } updateCartQuantity(item.id, item.quantity + 1); };
    const handleDecrement = (item) => { if (item.quantity > 1) { updateCartQuantity(item.id, item.quantity - 1); } };

    const subtotal = cartItems.reduce((acc, item) => {
        let p = item.price;
        if (item.isDiscountActive && item.discountPercent > 0) p -= p * (item.discountPercent / 100);
        if (globalDiscountPercent > 0) p -= p * (globalDiscountPercent / 100);
        return acc + (p < 0 ? 0 : p) * item.quantity;
    }, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const extraTaxesTotal = extraTaxes.reduce((acc, et) => acc + (et.isPercentage ? subtotal * (et.value / 100) : et.value), 0);
    const total = subtotal + taxAmount + extraTaxesTotal + shippingCost;

    const handleSelectClientData = (id) => { setSelectedClientDataId(id); const c = clientDataList.find(x => x.id === parseInt(id)); setClientData(c ? { ...c, companyName: c.companyName || "", orderNotes: c.orderNotes || "" } : { firstName: "", lastName: "", companyName: "", phone: "", email: "", identification: "", orderNotes: "" }); };
    const handleSelectShipping = (id) => {
        setSelectedShippingId(id);
        const s = shippingList.find(x => x.id === parseInt(id));
        setShippingData(s || { country: "", province: "", city: "", postalCode: "", addressLine: "" });
        if (useSameAddressForBilling && s) { setBillingData({ country: s.country, region: s.province, city: s.city, addressLine1: s.addressLine, addressLine2: "" }); }
    };
    const handleSelectBilling = (id) => { setSelectedBillingId(id); const b = billingList.find(x => x.id === parseInt(id)); setBillingData(b ? { ...b, addressLine2: b.addressLine2 || "" } : { country: "", region: "", city: "", addressLine1: "", addressLine2: "" }); };

    const handleClientChange = (e) => { const val = e.target.name === "orderNotes" ? limitTextWordsAndChars(e.target.value, 30, 200) : e.target.value; setClientData({ ...clientData, [e.target.name]: val }); };
    const handleShippingChange = (e) => {
        const { name, value } = e.target;
        setShippingData(prev => ({ ...prev, [name]: value }));
        if (useSameAddressForBilling) { const newBillingData = { ...billingData }; if (name === "country") newBillingData.country = value; if (name === "province") newBillingData.region = value; if (name === "city") newBillingData.city = value; if (name === "addressLine") newBillingData.addressLine1 = value; setBillingData(newBillingData); }
    };
    const handleBillingChange = (e) => { setBillingData({ ...billingData, [e.target.name]: e.target.value }); };

    const handleContinuePayment = () => {
        const fieldsToValidate = [{ data: clientData, fields: ["firstName", "lastName", "phone", "email", "identification"], msg: "Completa los datos de cliente requeridos." }, { data: shippingData, fields: ["country", "province", "city", "postalCode", "addressLine"], msg: "Completa la dirección de envío." }];
        if (!useSameAddressForBilling) { fieldsToValidate.push({ data: billingData, fields: ["country", "region", "city", "addressLine1"], msg: "Completa los datos de facturación." }); }
        for (const v of fieldsToValidate) { if (v.fields.some(field => !v.data[field]?.trim())) { showToast(v.msg, "error"); return; } }
        localStorage.setItem("temp_client", JSON.stringify(clientData));
        localStorage.setItem("temp_shipping", JSON.stringify(shippingData));
        localStorage.setItem("temp_billing", JSON.stringify(useSameAddressForBilling ? { country: shippingData.country, region: shippingData.province, city: shippingData.city, addressLine1: shippingData.addressLine, addressLine2: "" } : billingData));
        router.push("/payment");
    };

    if (loadingAuth) return <div className="flex justify-center items-center h-screen"><Typography>Cargando...</Typography></div>;
    if (!user) return null;

    const OrderSummary = () => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <Typography variant="h6" className="font-medium text-gray-900 mb-4">Resumen del Pedido</Typography>
            <dl className="space-y-4">
                <div className="flex items-center justify-between"><dt className="text-sm text-gray-600">Subtotal (c/desc.)</dt><dd className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</dd></div>
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between"><dt className="text-sm text-gray-600">IVA ({taxRate}%)</dt><dd className="text-sm font-medium text-gray-900">${taxAmount.toFixed(2)}</dd></div>
                {extraTaxes.map(et => (<div key={et.id} className="flex items-center justify-between"><dt className="text-sm text-gray-600">{et.name} {et.isPercentage && `(${et.value}%)`}</dt><dd className="text-sm font-medium text-gray-900">+${(et.isPercentage ? subtotal * (et.value / 100) : et.value).toFixed(2)}</dd></div>))}
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between"><dt className="text-sm text-gray-600">Coste de Envío</dt><dd className="text-sm font-medium text-gray-900">${shippingCost.toFixed(2)}</dd></div>
                <Divider />
                <div className="flex items-center justify-between text-base font-medium text-gray-900"><dt>Total del Pedido</dt><dd>${total.toFixed(2)}</dd></div>
            </dl>
        </div>
    );

    const FinalActionButtons = () => (
        <div className="flex flex-col gap-4">
            <Button fullWidth variant="contained" size="large" onClick={handleContinuePayment} sx={{ backgroundColor: milagroGreen, color: 'white', '&:hover': { backgroundColor: milagroRed } }}>
                Continuar con el Pago
            </Button>
            <Button fullWidth variant="text" onClick={() => router.push('/')} sx={{ color: milagroGreen, '&:hover': { color: milagroRed, backgroundColor: 'transparent' } }}>
                O seguir comprando
            </Button>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Carrito" }]} />

                {cartItems.length === 0 ? (
                    <div className="flex items-center justify-center" style={{minHeight: '70vh'}}>
                        <div className="text-center">
                            <Typography variant="h5" className="font-semibold text-gray-800">Tu carrito está vacío</Typography>
                            <Button variant="contained" className="mt-8" onClick={() => router.push('/')} sx={{ backgroundColor: milagroGreen, color: 'white', '&:hover': { backgroundColor: milagroRed } }}>
                                Ver productos
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 lg:grid lg:grid-cols-12 lg:items-start gap-x-12">
                        <section className="lg:col-span-7">
                            <Card className="shadow-md">
                                <CardContent>
                                    <div className="hidden md:block">
                                        <Table sx={{ tableLayout: 'fixed' }}>
                                            <TableHead><TableRow><TableCell align="center" sx={{width: '40%'}}><strong>Producto</strong></TableCell><TableCell align="center" sx={{width: '15%'}}><strong>Precio</strong></TableCell><TableCell align="center" sx={{width: '20%'}}><strong>Cantidad</strong></TableCell><TableCell align="center" sx={{width: '15%'}}><strong>Subtotal</strong></TableCell><TableCell sx={{width: '10%'}}></TableCell></TableRow></TableHead>
                                            <TableBody>
                                                {cartItems.map((item) => {
                                                    const finalPrice = item.price - (item.price * ((item.discountPercent || 0) / 100)) - (item.price * (globalDiscountPercent / 100));
                                                    return (
                                                        <TableRow key={item.id} hover>
                                                            <TableCell><div className="flex items-center gap-4"><img src={item.imageUrl?.startsWith("http") ? item.imageUrl : `http://localhost:5009${item.imageUrl}`} alt={item.name} className="w-16 h-16 object-cover rounded-md" /><div><Typography className="font-semibold">{item.name}</Typography><Typography variant="body2" color="text.secondary">Stock: {item.stock}</Typography></div></div></TableCell>
                                                            <TableCell align="center"><Typography sx={{ color: milagroGreen }} className="font-semibold">${finalPrice.toFixed(2)}</Typography></TableCell>
                                                            <TableCell align="center"><div className="flex items-center justify-center"><IconButton size="small" sx={{color: milagroGreen, '&:hover': {color: milagroRed}}} onClick={() => handleDecrement(item)}><RemoveCircle /></IconButton><span className="mx-2 font-medium w-8 text-center">{item.quantity}</span><IconButton size="small" sx={{color: milagroGreen, '&:hover': {color: milagroRed}}} onClick={() => handleIncrement(item)}><AddCircle /></IconButton></div></TableCell>
                                                            <TableCell align="center"><Typography className="font-semibold">${(finalPrice * item.quantity).toFixed(2)}</Typography></TableCell>
                                                            <TableCell align="center"><IconButton color="error" onClick={() => handleOpenDialog(item.id)}><Delete /></IconButton></TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="block md:hidden divide-y divide-gray-200">
                                        {cartItems.map((item) => {
                                            const finalPrice = item.price - (item.price * ((item.discountPercent || 0) / 100)) - (item.price * (globalDiscountPercent / 100));
                                            return (
                                                <div key={item.id} className="py-6 px-2 text-center">
                                                    <Typography className="font-semibold text-lg mb-3">{item.name}</Typography>
                                                    <div className="flex justify-center mb-4">
                                                        <img src={item.imageUrl?.startsWith("http") ? item.imageUrl : `http://localhost:5009${item.imageUrl}`} alt={item.name} className="w-32 h-32 object-cover rounded-lg shadow-md" />
                                                    </div>
                                                    <dl className="mt-4 space-y-3 text-sm max-w-sm mx-auto">
                                                        <div className="flex justify-between items-center"><dt className="text-gray-600">Precio:</dt><dd className="font-medium" style={{color: milagroGreen}}>${finalPrice.toFixed(2)}</dd></div>
                                                        <div className="flex justify-between items-center"><dt className="text-gray-600">Stock:</dt><dd className="font-medium text-gray-900">{item.stock}</dd></div>
                                                        <div className="flex justify-between items-center"><dt className="text-gray-600">Cantidad:</dt><dd><div className="flex items-center justify-end"><IconButton sx={{color: milagroGreen, '&:hover': {color: milagroRed}}} size="small" onClick={() => handleDecrement(item)}><RemoveCircle /></IconButton><span className="mx-1 font-medium w-8 text-center">{item.quantity}</span><IconButton sx={{color: milagroGreen, '&:hover': {color: milagroRed}}} size="small" onClick={() => handleIncrement(item)}><AddCircle /></IconButton></div></dd></div>
                                                        <div className="flex justify-between items-center pt-3 border-t border-gray-200"><dt className="font-semibold text-gray-800">Subtotal:</dt><dd className="font-bold text-base text-gray-900">${(finalPrice * item.quantity).toFixed(2)}</dd></div>
                                                    </dl>
                                                    <div className="text-center mt-4">
                                                        <Button variant="text" color="error" size="small" onClick={() => handleOpenDialog(item.id)} startIcon={<Delete fontSize="small"/>}>Eliminar</Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="block lg:hidden mt-6"><OrderSummary /></div>
                            
                            <div className="mt-10 space-y-8">
                                <div className="bg-white p-6 rounded-lg shadow"><Typography variant="h6" className="mb-4">Datos de Cliente</Typography><FormSelect label="Usar datos guardados" value={selectedClientDataId} onChange={e => handleSelectClientData(e.target.value)} options={[{ value: "0", label: '-- Nuevo --' }, ...clientDataList.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))]} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"><FormInput label="Nombre" name="firstName" value={clientData.firstName} onChange={handleClientChange} required /><FormInput label="Apellidos" name="lastName" value={clientData.lastName} onChange={handleClientChange} required /><FormInput label="Teléfono" name="phone" value={clientData.phone} onChange={handleClientChange} required /><FormInput label="Email" name="email" value={clientData.email} onChange={handleClientChange} type="email" required /><FormInput label="Identificación (DNI/Cédula)" name="identification" value={clientData.identification} onChange={handleClientChange} required /><FormInput label="Empresa (Opcional)" name="companyName" value={clientData.companyName} onChange={handleClientChange} /><div className="sm:col-span-2"><label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700">Notas del pedido (Opcional)</label><textarea id="orderNotes" name="orderNotes" rows={3} value={clientData.orderNotes} onChange={handleClientChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea></div></div></div>
                                <div className="bg-white p-6 rounded-lg shadow"><Typography variant="h6" className="mb-4">Dirección de Envío</Typography><FormSelect label="Usar dirección guardada" value={selectedShippingId} onChange={e => handleSelectShipping(e.target.value)} options={[{ value: "0", label: '-- Nueva --' }, ...shippingList.map(s => ({ value: s.id, label: `${s.addressLine}, ${s.city}` }))]} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"><FormInput label="País" name="country" value={shippingData.country} onChange={handleShippingChange} required /><FormInput label="Provincia / Estado" name="province" value={shippingData.province} onChange={handleShippingChange} required /><FormInput label="Ciudad" name="city" value={shippingData.city} onChange={handleShippingChange} required /><FormInput label="Código Postal" name="postalCode" value={shippingData.postalCode} onChange={handleShippingChange} required /><div className="sm:col-span-2"><FormInput label="Línea de Dirección" name="addressLine" value={shippingData.addressLine} onChange={handleShippingChange} placeholder="Calle, número, etc." required /></div></div><div className="mt-4 flex items-center"><input id="same-address" name="same-address" type="checkbox" checked={useSameAddressForBilling} onChange={() => setUseSameAddressForBilling(!useSameAddressForBilling)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label htmlFor="same-address" className="ml-2 block text-sm text-gray-900">Usar esta dirección para la facturación.</label></div></div>
                                {!useSameAddressForBilling && (<div className="bg-white p-6 rounded-lg shadow"><Typography variant="h6" className="mb-4">Dirección de Facturación</Typography><FormSelect label="Usar datos de facturación guardados" value={selectedBillingId} onChange={e => handleSelectBilling(e.target.value)} options={[{ value: "0", label: '-- Nueva --' }, ...billingList.map(b => ({ value: b.id, label: `${b.addressLine1}, ${b.city}` }))]} /><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"><FormInput label="País / Región" name="country" value={billingData.country} onChange={handleBillingChange} required /><FormInput label="Región / Provincia" name="region" value={billingData.region} onChange={handleBillingChange} required /><FormInput label="Ciudad" name="city" value={billingData.city} onChange={handleBillingChange} required /><div className="sm:col-span-2"><FormInput label="Línea de Dirección 1" name="addressLine1" value={billingData.addressLine1} onChange={handleBillingChange} required /></div><div className="sm:col-span-2"><FormInput label="Línea de Dirección 2 (Opcional)" name="addressLine2" value={billingData.addressLine2} onChange={handleBillingChange} /></div></div></div>)}
                            </div>
                        </section>

                        <aside className="hidden lg:block lg:col-span-5 lg:sticky lg:top-24">
                            <OrderSummary />
                            <div className="mt-6"><FinalActionButtons /></div>
                        </aside>
                        
                        <div className="mt-8 lg:hidden"><FinalActionButtons /></div>
                    </div>
                )}
            </div>

            <Dialog open={openDialog} onClose={handleCloseDialog}><DialogTitle>Eliminar producto</DialogTitle><DialogContent><Typography>¿Deseas eliminar este ítem del carrito?</Typography></DialogContent><DialogActions><Button onClick={handleCloseDialog} color="inherit">Cancelar</Button><Button onClick={handleConfirmDelete} color="error" variant="contained">Aceptar</Button></DialogActions></Dialog>
            <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}><Alert onClose={handleCloseSnackbar} severity={toastType} sx={{ width: "100%" }} variant="filled">{toastMessage}</Alert></Snackbar>
        </div>
    );
}
