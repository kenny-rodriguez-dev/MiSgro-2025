"use client";

import Link from "next/link";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Breadcrumb from "../components/Breadcrumb";

const images = ["/banner1.jpg", "/banner2.jpg", "/banner3.jpg"];

export default function HomePage() {
  const { user } = useContext(AuthContext);

  return (
    <section>
      <Breadcrumb items={[{ label: "Inicio", href: "/" }]} />

      {/* Hero principal */}
      <div className="relative w-full h-[450px] bg-gray-200 overflow-hidden rounded-md shadow-lg">
        <img
          src="/banner1.jpg"
          alt="Hero"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center text-center p-4">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
            Bienvenido a Mi E-commerce
          </h1>
          <p className="text-white text-lg mb-6 max-w-xl">
            Descubre nuestros productos con grandes descuentos
          </p>
          <Link
            href="/products"
            className="btn-primary font-bold"
          >
            Explora nuestros productos
          </Link>
        </div>
      </div>

      {/* Sección de banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {images.map((img, index) => (
          <div
            key={index}
            className="bg-white shadow-md rounded-md overflow-hidden transform hover:scale-105 transition"
          >
            <img
              src={img}
              alt={`banner${index}`}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-xl mb-2">Promoción {index + 1}</h3>
              <p className="text-gray-600 text-sm">
                ¡Aprovecha nuestros descuentos especiales!
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 bg-secondary rounded p-6 text-center shadow-md">
        {!user ? (
          <>
            <h2 className="text-2xl font-semibold mb-3">
              ¡Únete a nuestra comunidad!
            </h2>
            <div className="space-x-4">
              <Link href="/login" className="btn-primary">
                Inicia Sesión
              </Link>
              <Link href="/register" className="btn-secondary">
                Regístrate
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-xl font-semibold mb-2">
              Has iniciado sesión como:{" "}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
            </p>
            {user.role === "Admin" ? (
              <Link href="/admin" className="btn-primary">
                Ir al Panel de Administración
              </Link>
            ) : (
              <Link href="/products" className="btn-primary">
                Ir al Catálogo
              </Link>
            )}
          </>
        )}
      </div>

      {/* Redes sociales (placeholder) */}
      <div className="my-10 text-center">
        <h2 className="text-2xl font-bold mb-4">
          ¡Síguenos en redes sociales!
        </h2>
        <div className="flex justify-center gap-6 text-3xl text-gray-600">
          <a href="#" className="hover:text-blue-600">FB</a>
          <a href="#" className="hover:text-pink-600">IG</a>
          <a href="#" className="hover:text-sky-600">TW</a>
        </div>
      </div>
    </section>
  );
}
