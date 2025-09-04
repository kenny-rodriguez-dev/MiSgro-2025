"use client";

import Link from "next/link";
import Image from "next/image";
import { useContext, useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import { useTheme } from "../app/theme-provider";

// --- Íconos de Material UI ---
import AppsIcon from "@mui/icons-material/Apps";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close'; // <-- Icono añadido

/**
 * Hook para cerrar un panel si se hace click fuera.
 */
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
    };
  }, [ref, handler]);
}

// --- Componente para el Ícono de Hamburguesa Animado ---
const AnimatedHamburgerIcon = ({ isOpen, onClick }) => {
  const genericHamburgerLine = `h-[2px] w-6 my-[3px] rounded-full bg-current transition ease transform duration-300`;

  return (
    <button
      onClick={onClick}
      className="md:hidden flex flex-col justify-center items-center p-2 group focus:outline-none"
      aria-label="Abrir/cerrar menú móvil"
    >
      <div className={`${genericHamburgerLine} ${isOpen ? "rotate-45 translate-y-[8px]" : ""}`} />
      <div className={`${genericHamburgerLine} ${isOpen ? "opacity-0" : ""}`} />
      <div className={`${genericHamburgerLine} ${isOpen ? "-rotate-45 -translate-y-[8px]" : ""}`} />
    </button>
  );
};


export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { darkMode, toggleTheme } = useTheme();

  // Contextos
  const { user, logout } = useContext(AuthContext);
  const { cartItems, clearCart } = useContext(CartContext);
  const { wishlistItems, clearWishlist } = useContext(WishlistContext);

  // --- Estado para los menús ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  useClickOutside(mobileMenuRef, () => setMobileMenuOpen(false));

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // El hook useClickOutside ya no se usa para el menú de usuario de escritorio,
  // se maneja con un backdrop y un botón de cierre explícito.

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // --- Lógica de Handlers ---
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/products?term=${encodeURIComponent(searchTerm)}`);
    setSearchTerm("");
    if (mobileMenuOpen) setMobileMenuOpen(false); // Cierra menú móvil al buscar
  };

  const handleLogout = () => {
    clearCart();
    clearWishlist();
    logout();
    if (mobileMenuOpen) setMobileMenuOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
    router.push("/");
  };

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }

  // Cierra el panel de usuario con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  // Roles de usuario
  const isAdmin = user && user.role === "Admin";
  const isSupervisor = user && user.role === "Supervisor";
  const isNormalUser = user && !isAdmin && !isSupervisor;

  // --- Clases de Estilo ---
  const headerBg = darkMode ? "bg-black" : "bg-white";
  const textColor = darkMode ? "text-white" : "text-black";
  const borderColor = darkMode ? "border-gray-700" : "border-gray-200";
  const hoverRed = "hover:text-[#ED1C24]";
  const activeRed = "text-[#ED1C24]";

  const getLinkClassName = (path) => {
    return `px-3 py-1 rounded flex items-center gap-2 transition-colors duration-300 ${hoverRed} ${pathname === path ? activeRed : textColor}`;
  };

  const mobileLinkClass = `w-full text-left p-2 rounded flex items-center gap-2 transition-colors duration-300 active:text-[#ED1C24] ${hoverRed}`;

  // --- Renderizado de Enlaces del Menú de Cuenta ---
  const renderRoleLinks = (isMobile = false) => {
    const linkStyle = isMobile ? mobileLinkClass : `w-full text-left px-4 py-2 text-sm rounded ${darkMode ? 'text-gray-200' : 'text-gray-700'} ${hoverRed} transition-colors duration-300 flex items-center`;

    const createLink = (href, text) => (
      <Link href={href} onClick={closeAllMenus} className={linkStyle}>
        {text}
      </Link>
    );

    return (
      <>
        {isNormalUser && (
          <>
            {createLink("/miscompras", "Mis Compras")}
            {createLink("/myaccount/addresses", "Mis Direcciones")}
            {createLink("/billing", "Facturación")}
            {createLink("/clientdata", "Datos de Cliente")}
            {createLink("/myaccount/paymentmethods", "Métodos de Pago")}
          </>
        )}
        {(isAdmin || isSupervisor || isNormalUser) && createLink("/myaccount/changepassword", "Cambiar Contraseña")}
        {isSupervisor && (
          <>
            {createLink("/admin/orders", "Pedidos")}
            {createLink("/admin/analysis", "Métricas")}
          </>
        )}
        {isAdmin && createLink("/admin", "Admin Prods")}
      </>
    );
  };

  return (
    <header>
      <nav
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 w-full z-30 ${headerBg} ${textColor} shadow-md transition-colors duration-300`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between py-2">
          {/* IZQUIERDA: Logo + Enlaces directos (Desktop) */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Link href="/" onClick={closeAllMenus} className="flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Logo Mi E-commerce"
                width={150}
                height={40}
                priority
                className="object-contain h-10 w-auto"
              />
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <Link href="/products" className={getLinkClassName("/products")}>
                <AppsIcon />
                <span>Productos</span>
              </Link>
              {isAdmin && (
                <Link href="/admin" className={getLinkClassName("/admin")}>
                  <AdminPanelSettingsIcon />
                  <span>Admin Prods</span>
                </Link>
              )}
            </div>
          </div>

          {/* CENTRO: Barra de búsqueda (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 mx-4 flex-grow max-w-sm lg:max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`px-4 py-2 w-full rounded-md border focus:outline-none focus:border-red-500 transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-100 border-gray-300 text-black'
                }`}
              />
              <button type="submit" className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-white' : 'text-gray-600'} ${hoverRed} cursor-pointer`}>
                <SearchIcon />
              </button>
            </div>
          </form>

          {/* DERECHA: Íconos y menús */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {/* Botón de Tema (MODIFICADO) */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors duration-300 cursor-pointer ${hoverRed}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </button>

            {/* --- VISTA DESKTOP (md y superior) --- */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/wishlist" className={getLinkClassName("/wishlist")} title="Favoritos">
                    <FavoriteBorderIcon />
                    <span className="hidden lg:inline">Favoritos ({wishlistItems.length})</span>
                  </Link>
                  <Link href="/cart" className={getLinkClassName("/cart")} title="Carrito">
                    <ShoppingCartIcon />
                    <span className="hidden lg:inline">Carrito ({cartItems.length})</span>
                  </Link>

                  {/* MENÚ DE USUARIO (MODIFICADO) - Ahora solo es el botón que abre el panel lateral */}
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`px-3 py-1 rounded flex items-center gap-2 transition-colors duration-300 cursor-pointer ${hoverRed} ${userMenuOpen ? activeRed : textColor}`}
                  >
                    <MenuIcon />
                    <span className="hidden lg:inline">Hola, {user.firstName}</span>
                    <span className="lg:hidden">Menú</span>
                  </button>
                </>
              ) : (
                <>
                  {pathname !== "/login" && (
                    <Link href="/login" className={getLinkClassName("/login")}>
                      <LoginIcon fontSize="small" />
                      <span>Iniciar Sesión</span>
                    </Link>
                  )}
                  {pathname !== "/register" && (
                    <Link href="/register" className={getLinkClassName("/register")}>
                      <PersonAddAltIcon fontSize="small" />
                      <span>Registrarse</span>
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* --- BOTÓN HAMBURGUESA (Móvil) con animación --- */}
            <AnimatedHamburgerIcon
              isOpen={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>
        </div>

        {/* --- PANEL DE MENÚ MÓVIL (se desliza hacia abajo) --- */}
        <div className={`md:hidden ${headerBg} overflow-y-auto transition-all duration-500 ease-in-out ${mobileMenuOpen ? `max-h-[calc(100vh-60px)] p-4 border-t ${borderColor}` : "max-h-0"}`}>
          <div className="flex flex-col gap-4">
            {/* Barra de Búsqueda Móvil */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
              <div className="relative w-full">
                <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className={`px-4 py-2 w-full rounded-md border focus:outline-none focus:border-red-500 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-black'
                  }`}
                />
                <button type="submit" className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-white' : 'text-gray-600'} ${hoverRed} cursor-pointer`}>
                  <SearchIcon />
                </button>
              </div>
            </form>

            <hr className={borderColor} />

            {user ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-lg px-2">Hola, {user.firstName}</span>
                  <Link href="/products" onClick={closeAllMenus} className={mobileLinkClass}><AppsIcon/>Productos</Link>
                  <Link href="/wishlist" onClick={closeAllMenus} className={mobileLinkClass}><FavoriteBorderIcon/>Favoritos ({wishlistItems.length})</Link>
                  <Link href="/cart" onClick={closeAllMenus} className={mobileLinkClass}><ShoppingCartIcon/>Carrito ({cartItems.length})</Link>
                </div>
                <hr className={borderColor} />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-md px-2 pt-2">Mi Cuenta</span>
                  {renderRoleLinks(true)}
                </div>
                <hr className={borderColor} />
                <button onClick={handleLogout} className={`${mobileLinkClass} text-red-500`}>
                  <LogoutIcon/>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <Link href="/products" onClick={closeAllMenus} className={mobileLinkClass}><AppsIcon/>Productos</Link>
                <hr className={borderColor} />
                <Link href="/login" onClick={closeAllMenus} className={mobileLinkClass}><LoginIcon/>Iniciar Sesión</Link>
                <Link href="/register" onClick={closeAllMenus} className={mobileLinkClass}><PersonAddAltIcon/>Registrarse</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- INICIO: PANEL LATERAL DE USUARIO (Estilo Amazon) --- */}
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          userMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setUserMenuOpen(false)}
          aria-hidden="true"
        />
        {/* Panel */}
        <div
          onClick={(e) => e.stopPropagation()} // Evita que clicks dentro del panel lo cierren
          className={`fixed top-0 right-0 h-full w-80 shadow-xl p-4 transition-transform duration-300 ease-in-out z-50 transform flex flex-col ${headerBg} ${
          userMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {user && (
            <>
              {/* Encabezado del Panel */}
              <div className="flex justify-between items-center pb-2 flex-shrink-0">
                <h2 className={`text-lg font-bold ${textColor}`}>Hola, {user.firstName}</h2>
                <button onClick={() => setUserMenuOpen(false)} className={`p-1 rounded-full ${hoverRed} cursor-pointer`}>
                  <CloseIcon />
                </button>
              </div>
              <div className={`my-2 border-t ${borderColor} flex-shrink-0`}></div>

              {/* Cuerpo del Panel (con scroll) */}
              <div className="flex flex-col gap-1 overflow-y-auto">
                {renderRoleLinks(false)}
                <div className={`my-1 border-t ${borderColor}`}></div>
                <button
                  onClick={handleLogout}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 rounded ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'} cursor-pointer`}
                >
                  <LogoutIcon fontSize="small" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      {/* --- FIN: PANEL LATERAL DE USUARIO --- */}

      {/* Div espaciador para evitar que el contenido de la página quede oculto debajo del navbar fijo */}
      <div className="pt-[60px]"></div>
    </header>
  );
}
