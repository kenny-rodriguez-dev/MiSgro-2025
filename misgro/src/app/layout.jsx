import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import ThemeProvider from "./theme-provider";
// 1. Importar el nuevo componente wrapper de cliente.
import ClientLayoutWrapper from "../components/ClientLayoutWrapper";

// La metadata se mantiene aquí, ya que este es un Componente de Servidor.
export const metadata = {
  title: "Mi E-commerce",
  description: "Tienda Online con Next.js y .NET",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="text-gray-800 min-h-screen flex flex-col font-sans">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                {/* 2. Usar el wrapper para envolver el contenido. */}
                {/* Los hijos (children) se pasarán al wrapper, que los renderizará */}
                {/* junto con la NavBar y el Footer en el cliente. */}
                <ClientLayoutWrapper>
                  {children}
                </ClientLayoutWrapper>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
